import { OpenAIProvider } from './openai.js';
import type { LLMProvider, LLMMessage, LLMTool, LLMResponse } from './types.js';

export class OllamaProvider implements LLMProvider {
  private inner: OpenAIProvider;

  constructor(
    model = 'qwen2.5:7b',
    baseUrl = 'http://localhost:11434',
  ) {
    this.inner = new OpenAIProvider('ollama', model, `${baseUrl}/v1`);
  }

  chat(
    systemPrompt: string,
    messages: LLMMessage[],
    tools: LLMTool[],
    maxTokens?: number,
  ): Promise<LLMResponse> {
    return this.inner.chat(systemPrompt, messages, tools, maxTokens);
  }
}
