import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from '../events/entities/event.entity';
import { NotificationDeliveryAttemptEntity } from '../notifications/entities/notification-delivery-attempt.entity';
import type { AnalyticsRange } from './dto/analytics-query.dto';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';
import { DeliveryMetricsResponseDto } from './dto/delivery-metrics-response.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
    @InjectRepository(NotificationDeliveryAttemptEntity)
    private readonly deliveryAttemptsRepository: Repository<NotificationDeliveryAttemptEntity>,
  ) {}

  /**
   * Dashboard stat cards — see `DashboardStatsResponseDto` / README for field semantics.
   */
  async getDashboardStats(appId: string): Promise<DashboardStatsResponseDto> {
    const startOfUtcDay = new Date();
    startOfUtcDay.setUTCHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalEvents, eventsToday, errorCount, sourcesRow] =
      await Promise.all([
        this.eventsRepository.count({ where: { appId } }),
        this.eventsRepository
          .createQueryBuilder('e')
          .where('e.appId = :appId', { appId })
          .andWhere('e.occurredAt >= :from', { from: startOfUtcDay })
          .getCount(),
        this.eventsRepository
          .createQueryBuilder('e')
          .where('e.appId = :appId', { appId })
          .andWhere('e.level = :level', { level: 'error' })
          .getCount(),
        this.eventsRepository
          .createQueryBuilder('e')
          .select("COUNT(DISTINCT (e.metadata->>'source'))", 'cnt')
          .where('e.appId = :appId', { appId })
          .andWhere('e.occurredAt >= :from', { from: sevenDaysAgo })
          .andWhere("e.metadata->>'source' IS NOT NULL")
          .andWhere("TRIM(e.metadata->>'source') <> ''")
          .getRawOne<{ cnt: string }>(),
      ]);

    return {
      totalEvents,
      eventsToday,
      errorCount,
      activeSources: Number(sourcesRow?.cnt ?? 0),
    };
  }

  /**
   * Dashboard charts + totals for `range`. See `AnalyticsResponseDto` field docs.
   * Buckets: **hourly** (24 points) for `24h`; **UTC calendar day** for `7d` / `30d` / `90d`.
   */
  async getAppAnalytics(
    appId: string,
    rangeKey: string,
  ): Promise<AnalyticsResponseDto> {
    const range = (
      ['24h', '7d', '30d', '90d'].includes(rangeKey) ? rangeKey : '24h'
    ) as AnalyticsRange;

    const now = new Date();
    const windowTo = now;

    const { bucketStarts, trunc, windowFrom } = this.buildAnalyticsBuckets(
      range,
      now,
    );

    const seriesRows = await this.eventsRepository
      .createQueryBuilder('e')
      .select(`date_trunc('${trunc}', e.occurredAt)`, 'bucket')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN e.level = :err THEN 1 ELSE 0 END)`, 'errors')
      .setParameter('err', 'error')
      .where('e.appId = :appId', { appId })
      .andWhere('e.occurredAt >= :from', { from: windowFrom })
      .andWhere('e.occurredAt <= :to', { to: windowTo })
      .groupBy(`date_trunc('${trunc}', e.occurredAt)`)
      .orderBy(`date_trunc('${trunc}', e.occurredAt)`, 'ASC')
      .getRawMany<{
        bucket: Date | string;
        total: string;
        errors: string;
      }>();

    const seriesMap = new Map<string, { total: number; errors: number }>();
    for (const row of seriesRows) {
      const b = new Date(row.bucket as Date);
      const key = this.normalizeBucketKey(b, trunc);
      seriesMap.set(key, {
        total: Number(row.total),
        errors: Number(row.errors),
      });
    }

    const eventTrends: AnalyticsResponseDto['eventTrends'] = [];
    const errorRate: AnalyticsResponseDto['errorRate'] = [];

    for (const b of bucketStarts) {
      const key = this.normalizeBucketKey(b, trunc);
      const { total, errors } = seriesMap.get(key) ?? {
        total: 0,
        errors: 0,
      };
      eventTrends.push({
        date: b.toISOString(),
        value: total,
      });
      errorRate.push({
        date: b.toISOString(),
        value: total > 0 ? Number(((errors / total) * 100).toFixed(2)) : 0,
      });
    }

    const distRows = await this.eventsRepository
      .createQueryBuilder('e')
      .select('e.eventName', 'event')
      .addSelect('COUNT(*)', 'cnt')
      .where('e.appId = :appId', { appId })
      .andWhere('e.occurredAt >= :from', { from: windowFrom })
      .andWhere('e.occurredAt <= :to', { to: windowTo })
      .groupBy('e.eventName')
      .orderBy('cnt', 'DESC')
      .getRawMany<{ event: string; cnt: string }>();

    const totalEvents = distRows.reduce((s, r) => s + Number(r.cnt), 0);

    const eventDistribution: AnalyticsResponseDto['eventDistribution'] =
      distRows.map((r) => {
        const count = Number(r.cnt);
        return {
          event: r.event,
          count,
          percentage:
            totalEvents > 0
              ? Number(((count / totalEvents) * 100).toFixed(2))
              : 0,
        };
      });

    const windowMs = windowTo.getTime() - windowFrom.getTime();
    const prevFrom = new Date(windowFrom.getTime() - windowMs);

    const [currentErrByEvent, prevErrByEvent] = await Promise.all([
      this.errorCountsByEventForWindow(appId, windowFrom, windowTo),
      this.errorCountsByEventForWindow(appId, prevFrom, windowFrom, true),
    ]);

    const errorBreakdown: AnalyticsResponseDto['errorBreakdown'] = [];
    for (const [event, count] of currentErrByEvent) {
      errorBreakdown.push({
        event,
        count,
        change: count - (prevErrByEvent.get(event) ?? 0),
      });
    }
    errorBreakdown.sort((a, b) => b.count - a.count);

    const [errorCount, eventsToday, activeSources] = await Promise.all([
      this.eventsRepository
        .createQueryBuilder('e')
        .where('e.appId = :appId', { appId })
        .andWhere('e.occurredAt >= :from', { from: windowFrom })
        .andWhere('e.occurredAt <= :to', { to: windowTo })
        .andWhere('e.level = :level', { level: 'error' })
        .getCount(),
      (() => {
        const startOfUtcDay = new Date();
        startOfUtcDay.setUTCHours(0, 0, 0, 0);
        return this.eventsRepository
          .createQueryBuilder('e')
          .where('e.appId = :appId', { appId })
          .andWhere('e.occurredAt >= :from', { from: startOfUtcDay })
          .andWhere('e.occurredAt <= :to', { to: windowTo })
          .getCount();
      })(),
      this.countDistinctSources(appId, windowFrom, windowTo),
    ]);

    return {
      eventTrends,
      errorRate,
      eventDistribution,
      errorBreakdown,
      totalEvents,
      eventsToday,
      errorCount,
      activeSources,
    };
  }

  private buildAnalyticsBuckets(
    range: AnalyticsRange,
    now: Date,
  ): {
    bucketStarts: Date[];
    trunc: 'hour' | 'day';
    windowFrom: Date;
  } {
    if (range === '24h') {
      const endHour = new Date(now);
      endHour.setUTCMinutes(0, 0, 0);
      endHour.setUTCSeconds(0, 0);
      endHour.setUTCMilliseconds(0);
      const bucketStarts: Date[] = [];
      for (let i = 23; i >= 0; i--) {
        bucketStarts.push(new Date(endHour.getTime() - i * 3600000));
      }
      return {
        bucketStarts,
        trunc: 'hour',
        windowFrom: bucketStarts[0],
      };
    }

    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const endDay = new Date(now);
    endDay.setUTCHours(0, 0, 0, 0);
    const bucketStarts: Date[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(
        Date.UTC(
          endDay.getUTCFullYear(),
          endDay.getUTCMonth(),
          endDay.getUTCDate() - i,
        ),
      );
      bucketStarts.push(d);
    }

    return {
      bucketStarts,
      trunc: 'day',
      windowFrom: bucketStarts[0],
    };
  }

  private normalizeBucketKey(d: Date, trunc: 'hour' | 'day'): string {
    const x = new Date(d);
    if (trunc === 'hour') {
      x.setUTCMinutes(0, 0, 0);
      x.setUTCSeconds(0, 0);
      x.setUTCMilliseconds(0);
    } else {
      x.setUTCHours(0, 0, 0, 0);
    }
    return x.toISOString();
  }

  /** Previous window uses `occurredAt < end` when `exclusiveEnd` is true. */
  private async errorCountsByEventForWindow(
    appId: string,
    from: Date,
    end: Date,
    exclusiveEnd = false,
  ): Promise<Map<string, number>> {
    const qb = this.eventsRepository
      .createQueryBuilder('e')
      .select('e.eventName', 'event')
      .addSelect('COUNT(*)', 'cnt')
      .where('e.appId = :appId', { appId })
      .andWhere('e.occurredAt >= :from', { from })
      .andWhere('e.level = :level', { level: 'error' });

    if (exclusiveEnd) {
      qb.andWhere('e.occurredAt < :end', { end });
    } else {
      qb.andWhere('e.occurredAt <= :end', { end });
    }

    const rows = await qb
      .groupBy('e.eventName')
      .getRawMany<{ event: string; cnt: string }>();

    const m = new Map<string, number>();
    for (const r of rows) {
      m.set(r.event, Number(r.cnt));
    }
    return m;
  }

  private async countDistinctSources(
    appId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const row = await this.eventsRepository
      .createQueryBuilder('e')
      .select("COUNT(DISTINCT (e.metadata->>'source'))", 'cnt')
      .where('e.appId = :appId', { appId })
      .andWhere('e.occurredAt >= :from', { from })
      .andWhere('e.occurredAt <= :to', { to })
      .andWhere("e.metadata->>'source' IS NOT NULL")
      .andWhere("TRIM(e.metadata->>'source') <> ''")
      .getRawOne<{ cnt: string }>();

    return Number(row?.cnt ?? 0);
  }

  async getDeliveryMetrics(
    appId: string,
    range: string,
  ): Promise<DeliveryMetricsResponseDto> {
    const hours = this.resolveRange(range);
    const from = new Date(Date.now() - hours * 60 * 60 * 1000);

    const attempts = await this.deliveryAttemptsRepository.find({
      where: { appId },
      order: { createdAt: 'DESC' },
      take: 5000,
    });

    const rangedAttempts = attempts.filter(
      (attempt) => attempt.createdAt >= from,
    );
    const deliveredAttempts = rangedAttempts.filter(
      (attempt) => attempt.status === 'delivered',
    ).length;
    const failedAttempts = rangedAttempts.filter(
      (attempt) => attempt.status === 'failed',
    ).length;
    const pendingAttempts = rangedAttempts.filter(
      (attempt) => attempt.status === 'pending',
    ).length;
    const retryAttempts = rangedAttempts.filter(
      (attempt) => attempt.attemptNumber > 1,
    ).length;
    const resolvedAttempts = deliveredAttempts + failedAttempts;
    const successRate =
      resolvedAttempts === 0
        ? 0
        : Number((deliveredAttempts / resolvedAttempts).toFixed(4));
    const retryVolume =
      rangedAttempts.length === 0
        ? 0
        : Number((retryAttempts / rangedAttempts.length).toFixed(4));

    const trends = new Map<
      string,
      { delivered: number; failed: number; pending: number; retries: number }
    >();

    for (const attempt of rangedAttempts) {
      const bucket =
        attempt.createdAt.toISOString().slice(0, 13) + ':00:00.000Z';
      const current = trends.get(bucket) ?? {
        delivered: 0,
        failed: 0,
        pending: 0,
        retries: 0,
      };

      if (attempt.status === 'delivered') current.delivered += 1;
      if (attempt.status === 'failed') current.failed += 1;
      if (attempt.status === 'pending') current.pending += 1;
      if (attempt.attemptNumber > 1) current.retries += 1;

      trends.set(bucket, current);
    }

    return {
      totalAttempts: rangedAttempts.length,
      deliveredAttempts,
      failedAttempts,
      pendingAttempts,
      retryAttempts,
      successRate,
      retryVolume,
      deliveryTrends: [...trends.entries()].map(([bucket, values]) => ({
        bucket,
        delivered: values.delivered,
        failed: values.failed,
        pending: values.pending,
        retries: values.retries,
      })),
    };
  }

  private resolveRange(range: string): number {
    switch (range) {
      case '24h':
        return 24;
      case '7d':
        return 24 * 7;
      case '30d':
        return 24 * 30;
      case '90d':
        return 24 * 90;
      default:
        return 24;
    }
  }
}
