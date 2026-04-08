# Contributing to Vela

Thank you for your interest in contributing to Vela! This guide will help you get started.

## Prerequisites

- **Node.js** 18+ (recommended: 20)
- **pnpm** (package manager)
- **Docker** (for PostgreSQL and RabbitMQ)

## Local Development Setup

1. **Clone the repo**

```bash
git clone https://github.com/vela-event/vela.git
cd vela
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Start infrastructure**

```bash
docker compose -f docker-compose.infra.yml up -d
```

4. **Configure environment**

```bash
cp .env.sample .env
# Edit .env and fill in JWT_SECRET and CREDENTIALS_ENCRYPTION_KEY
```

5. **Run migrations**

```bash
pnpm migration:run
```

6. **Start the dev server**

```bash
pnpm start:dev
```

The API will be available at `http://localhost:3000` with Swagger docs at `http://localhost:3000/docs`.

## Code Style

- **Prettier** and **ESLint** are configured. Run `pnpm format` and `pnpm lint` before committing.
- Follow existing patterns: services, controllers, entities, DTOs.
- Use the NestJS `Logger` instead of `console.log`.

## Git Hooks

This project uses **Husky** to enforce code quality:

- **commit-msg** — validates commit message format via commitlint
- **pre-commit** — runs Prettier and ESLint on staged `.ts` files via lint-staged
- **pre-push** — runs `pnpm build` and `pnpm test`

Hooks are installed automatically via `pnpm install` (the `prepare` script). If hooks aren't running, try `npx husky`.

## Running Tests

```bash
pnpm test          # unit tests
pnpm test:e2e      # end-to-end tests
pnpm test:cov      # coverage report
```

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) enforced by **commitlint**.

Format: `type(scope): description`

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependencies |
| `ci` | CI configuration |
| `chore` | Maintenance tasks |
| `revert` | Reverting a previous commit |

Examples:
```
feat(events): add batch ingest endpoint
fix(notifications): handle null destination gracefully
docs: update quickstart guide
refactor(messaging): extract topic constants
```

## Branch Naming

- `feat/short-description` for new features
- `fix/short-description` for bug fixes
- `docs/short-description` for documentation
- `refactor/short-description` for refactoring

## Pull Requests

1. Fork the repo and create your branch from `main`
2. Make your changes with clear, focused commits
3. Ensure `pnpm lint` and `pnpm test` pass
4. Open a pull request with a clear description of **what** and **why**

## Reporting Bugs

Open a [GitHub Issue](https://github.com/vela-event/vela/issues/new?template=bug_report.md) with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version)

## Requesting Features

Open a [GitHub Issue](https://github.com/vela-event/vela/issues/new?template=feature_request.md) describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0 License](LICENSE).
