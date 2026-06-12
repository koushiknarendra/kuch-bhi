export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string | LLMContentBlock[];
}

export type LLMContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };

export interface LLMTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface LLMResponse {
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | string;
  content: LLMContentBlock[];
}

export interface LLMProvider {
  chat(
    systemPrompt: string,
    messages: LLMMessage[],
    tools: LLMTool[],
    maxTokens?: number,
  ): Promise<LLMResponse>;
}
