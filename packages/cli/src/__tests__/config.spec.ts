import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/* eslint-disable @typescript-eslint/no-require-imports */
describe('loadConfig', () => {
  let tmpDir: string;
  let originalCwd: string;
  let originalEnv: string | undefined;

  beforeEach(() => {
    tmpDir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'vela-config-')),
    );
    originalCwd = process.cwd();
    originalEnv = process.env.VELA_CLIENT_SECRET;
    process.chdir(tmpDir);
    delete process.env.VELA_CLIENT_SECRET;
    // Clear module cache so each test gets fresh loadConfig
    jest.resetModules();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (originalEnv !== undefined) {
      process.env.VELA_CLIENT_SECRET = originalEnv;
    } else {
      delete process.env.VELA_CLIENT_SECRET;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeConfig(obj: Record<string, unknown>) {
    fs.writeFileSync(
      path.join(tmpDir, 'vela.config.json'),
      JSON.stringify(obj),
    );
  }

  it('loads config from file', () => {
    writeConfig({ clientSecret: 'vela_cs_test', app: 'my-app' });
    const { loadConfig } = require('../config');
    const config = loadConfig();
    expect(config.clientSecret).toBe('vela_cs_test');
    expect(config.app).toBe('my-app');
    expect(config.schemasDir).toBe(path.resolve(tmpDir, './vela/schemas'));
  });

  it('env var overrides file clientSecret', () => {
    writeConfig({ clientSecret: 'vela_cs_file', app: 'my-app' });
    process.env.VELA_CLIENT_SECRET = 'vela_cs_env';
    const { loadConfig } = require('../config');
    const config = loadConfig();
    expect(config.clientSecret).toBe('vela_cs_env');
  });

  it('applies --app override', () => {
    writeConfig({ clientSecret: 'vela_cs_test', app: 'default-app' });
    const { loadConfig } = require('../config');
    const config = loadConfig({ app: 'override-app' });
    expect(config.app).toBe('override-app');
  });

  it('applies --dir override', () => {
    writeConfig({ clientSecret: 'vela_cs_test', app: 'my-app' });
    const { loadConfig } = require('../config');
    const config = loadConfig({ dir: './custom/schemas' });
    expect(config.schemasDir).toBe(path.resolve(tmpDir, './custom/schemas'));
  });

  it('exits if no client secret', () => {
    writeConfig({ app: 'my-app' });
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const { loadConfig } = require('../config');
    expect(() => loadConfig()).toThrow('exit');
    mockExit.mockRestore();
  });

  it('exits if no app', () => {
    writeConfig({ clientSecret: 'vela_cs_test' });
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const { loadConfig } = require('../config');
    expect(() => loadConfig()).toThrow('exit');
    mockExit.mockRestore();
  });
});
