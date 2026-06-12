import type { LLMProvider, LLMMessage, LLMTool, LLMResponse, LLMContentBlock } from './types.js';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

export class OpenAIProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'gpt-4o',
    private readonly baseUrl = 'https://api.openai.com/v1',
  ) {}

  async chat(
    systemPrompt: string,
    messages: LLMMessage[],
    tools: LLMTool[],
    maxTokens = 4096,
  ): Promise<LLMResponse> {
    const oaiMessages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.flatMap((m): OpenAIMessage[] => this.toOpenAIMessage(m)),
    ];

    const oaiTools = tools.map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      },
    }));

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        messages: oaiMessages,
        tools: oaiTools.length > 0 ? oaiTools : undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      choices: Array<{
        finish_reason: string;
        message: {
          content: string | null;
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        };
      }>;
    };

    const choice = data.choices[0];
    const content: LLMContentBlock[] = [];

    if (choice.message.content) {
      content.push({ type: 'text', text: choice.message.content });
    }

    for (const tc of choice.message.tool_calls ?? []) {
      content.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments) as Record<string, unknown>,
      });
    }

    const stopReason = choice.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn';

    return { stop_reason: stopReason, content };
  }

  private toOpenAIMessage(m: LLMMessage): OpenAIMessage[] {
    if (typeof m.content === 'string') {
      return [{ role: m.role, content: m.content }];
    }

    if (m.role === 'assistant') {
      const textParts = m.content
        .filter((b): b is Extract<LLMContentBlock, { type: 'text' }> => b.type === 'text')
        .map(b => b.text)
        .join('');

      const toolCalls = m.content
        .filter((b): b is Extract<LLMContentBlock, { type: 'tool_use' }> => b.type === 'tool_use')
        .map(b => ({
          id: b.id,
          type: 'function' as const,
          function: { name: b.name, arguments: JSON.stringify(b.input) },
        }));

      return [{
        role: 'assistant',
        content: textParts || null,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      }];
    }

    // user role — may contain tool_result blocks
    const toolResults = m.content.filter(
      (b): b is Extract<LLMContentBlock, { type: 'tool_result' }> => b.type === 'tool_result',
    );
    const textBlocks = m.content.filter(
      (b): b is Extract<LLMContentBlock, { type: 'text' }> => b.type === 'text',
    );

    const msgs: OpenAIMessage[] = [];

    for (const tr of toolResults) {
      msgs.push({ role: 'tool', content: tr.content, tool_call_id: tr.tool_use_id });
    }
    if (textBlocks.length > 0) {
      msgs.push({ role: 'user', content: textBlocks.map(b => b.text).join('\n') });
    }

    return msgs.length > 0 ? msgs : [{ role: 'user', content: '' }];
  }
}
