import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

interface ServerConfig {
  clientInfo?: Record<string, unknown>;
  tokens?: Record<string, unknown>;
  codeVerifier?: string;
  discoveryState?: Record<string, unknown>;
  oauthState?: string;
}

interface KuchBhiConfig {
  servers?: Record<string, ServerConfig>;
}

const CONFIG_DIR = path.join(os.homedir(), '.config', 'kuch-bhi');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export function readConfig(): KuchBhiConfig {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as KuchBhiConfig;
  } catch {
    return {};
  }
}

export function writeConfig(cfg: KuchBhiConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}
