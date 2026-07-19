import { buildHealthStatus, parseDatabaseUrl } from '../lib/health';

describe('health utilities', () => {
  it('returns ok when all checks pass', () => {
    const result = buildHealthStatus('nexus-core', { api: true, db: true });
    expect(result.status).toBe('ok');
    expect(result.service).toBe('nexus-core');
  });

  it('returns degraded when some checks fail', () => {
    const result = buildHealthStatus('crew-api', { api: true, redis: false });
    expect(result.status).toBe('degraded');
  });

  it('returns error when all checks fail', () => {
    const result = buildHealthStatus('admin-dashboard', { api: false });
    expect(result.status).toBe('error');
  });
});

describe('database url parsing', () => {
  it('parses postgres connection strings', () => {
    const result = parseDatabaseUrl(
      'postgresql+asyncpg://user:pass@localhost:5432/nexus',
    );
    expect(result.valid).toBe(true);
    expect(result.host).toBe('localhost');
  });

  it('rejects invalid urls', () => {
    expect(parseDatabaseUrl('not-a-url').valid).toBe(false);
  });
});

describe('repository smoke', () => {
  it('expects core service directories to exist', () => {
    const fs = require('fs');
    const path = require('path');
    const root = path.join(__dirname, '../..');
    expect(fs.existsSync(path.join(root, 'services/nexus-core'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'services/crew-api'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'services/admin-dashboard'))).toBe(true);
  });
});
