# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Vela, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please use [GitHub Security Advisories](https://github.com/vela-Events/vela/security/advisories/new) to report vulnerabilities privately.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix release**: Depending on severity, typically within 2 weeks for critical issues

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Security Best Practices

When deploying Vela:

- Always set strong, unique values for `JWT_SECRET` and `CREDENTIALS_ENCRYPTION_KEY`
- Never use `DATABASE_SYNCHRONIZE=true` in production
- Use TLS/SSL for database connections in production (`DB_SSL=true`)
- Rotate API keys and client secrets regularly
- Restrict `CORS_ORIGINS` to your actual frontend domain
