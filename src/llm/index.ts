import * as fs from 'node:fs';
import * as path from 'node:path';
import { ClaudeProvider } from './claude.js';
import { OpenAIProvider } from './openai.js';
import { OllamaProvider } from './ollama.js';
import type { LLMProvider } from './types.js';

function loadEnvFallback() {
  if (process.env.ANTHROPIC_API_KEY) return;

  // Look for .env / .env.local in the current working directory
  const candidates = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
  ];

  for (const envFile of candidates) {
    if (!fs.existsSync(envFile)) continue;
    for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
      const match = line.match(/^([A-Z0-9_]+)=(.+)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
    break;
  }
}

export function buildProvider(): LLMProvider {
  loadEnvFallback();
  const provider = (process.env.LLM_PROVIDER ?? 'claude').toLowerCase();

  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY env var required for OpenAI provider');
    return new OpenAIProvider(key, process.env.OPENAI_MODEL ?? 'gpt-4o');
  }

  if (provider === 'ollama') {
    return new OllamaProvider(
      process.env.OLLAMA_MODEL ?? 'qwen2.5:7b',
      process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    );
  }

  // Default: Claude
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error(
    'No API key found.\n\n' +
    'Set ANTHROPIC_API_KEY to use Claude (default):\n' +
    '  export ANTHROPIC_API_KEY=sk-ant-...\n\n' +
    'Or use a local model (no key needed):\n' +
    '  LLM_PROVIDER=ollama npx kuch-bhi\n\n' +
    'Or use OpenAI:\n' +
    '  LLM_PROVIDER=openai OPENAI_API_KEY=sk-... npx kuch-bhi'
  );
  return new ClaudeProvider(key, process.env.CLAUDE_MODEL);
}
