import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, LLMMessage, LLMTool, LLMResponse } from './types.js';

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model = 'claude-sonnet-4-6') {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
    this.model = model;
  }

  async chat(
    systemPrompt: string,
    messages: LLMMessage[],
    tools: LLMTool[],
    maxTokens = 4096,
  ): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages as Anthropic.MessageParam[],
      tools: tools as Anthropic.Tool[],
    });

    return {
      stop_reason: response.stop_reason ?? 'end_turn',
      content: response.content as LLMResponse['content'],
    };
  }
}
