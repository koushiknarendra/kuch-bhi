import type { LLMProvider, LLMMessage, LLMContentBlock } from '../llm/types.js';
import type { ConnectedMcpClient } from '../mcp/client.js';
import { buildToolList, executeTool, interactiveSuggestionsHandler, suggestOnlyHandler, type SuggestionsHandler } from './tools.js';
import { SYSTEM_PROMPT } from './prompt.js';

const MAX_ITERATIONS = 30;

export type AgentMode = 'interactive' | 'suggest';

export async function runAgent(
  provider: LLMProvider,
  mcpClients: ConnectedMcpClient[],
  mode: AgentMode = 'interactive',
): Promise<void> {
  const onSuggestions: SuggestionsHandler =
    mode === 'suggest' ? suggestOnlyHandler : interactiveSuggestionsHandler;

  const tools = buildToolList(mcpClients);
  const messages: LLMMessage[] = [
    { role: 'user', content: 'Look at my past orders on both Swiggy and Zomato, find me the best options nearby that are on discount, and show me suggestions before ordering anything.' },
  ];

  if (mode === 'interactive') {
    const serverList = mcpClients.map(c => `${c.serverName} (${c.tools.length} tools)`).join(', ');
    console.log(`\nAgent started. Connected: ${serverList}`);
    console.log(`Total tools available: ${tools.length}\n`);
  }

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await provider.chat(SYSTEM_PROMPT, messages, tools);

    messages.push({ role: 'assistant', content: response.content });

    if (mode === 'interactive') {
      for (const block of response.content) {
        if (block.type === 'text' && block.text.trim()) {
          console.log(`[Agent] ${block.text}`);
        }
      }
    }

    if (response.stop_reason === 'end_turn') {
      if (mode === 'interactive') console.log('\nDone.');
      return;
    }

    if (response.stop_reason !== 'tool_use') {
      if (mode === 'interactive') console.warn(`Unexpected stop reason: ${response.stop_reason}`);
      return;
    }

    const toolUseBlocks = response.content.filter(
      (b): b is Extract<LLMContentBlock, { type: 'tool_use' }> => b.type === 'tool_use',
    );

    const toolResults: LLMContentBlock[] = await Promise.all(
      toolUseBlocks.map(async (block) => {
        if (mode === 'interactive') {
          console.log(`  -> ${block.name}(${JSON.stringify(block.input).slice(0, 120)})`);
        }
        try {
          const result = await executeTool(mcpClients, block.name, block.input, onSuggestions);
          if (mode === 'interactive') console.log(`     ${result.slice(0, 200)}`);
          return { type: 'tool_result' as const, tool_use_id: block.id, content: result };
        } catch (err) {
          const errMsg = `Error: ${String(err)}`;
          if (mode === 'interactive') console.error(`     ${errMsg}`);
          return { type: 'tool_result' as const, tool_use_id: block.id, content: errMsg, is_error: true };
        }
      }),
    );

    messages.push({ role: 'user', content: toolResults });
  }

  if (mode === 'interactive') console.warn('Reached maximum iterations without completing.');
}
