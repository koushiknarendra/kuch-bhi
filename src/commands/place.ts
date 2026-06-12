import { createMcpClient, type ServerName } from '../mcp/client.js';
import { buildProvider } from '../llm/index.js';
import type { LLMProvider, LLMMessage, LLMContentBlock } from '../llm/types.js';
import type { ConnectedMcpClient } from '../mcp/client.js';
import { buildToolList, executeTool, interactiveSuggestionsHandler } from '../agent/tools.js';
import type { Suggestion } from '../agent/tools.js';

const PLACE_PROMPT = (s: Suggestion) =>
  `You are placing a specific food order. No research needed — the user has already chosen.

Item to order:
- Platform: ${s.platform}
- Restaurant: ${s.restaurant}
- Item: ${s.item}
- Expected price: ${s.price}

Steps:
1. Get the user's default delivery address.
2. Find the restaurant and the specific item on its menu.
3. Add the item to cart.
4. Fetch and apply the best available coupon.
5. Place the order using paymentMethod "Cash" (Cash on Delivery).

Report: restaurant, item, final amount after discount, and estimated delivery time.`;

export async function placeCommand(suggestionJson: string): Promise<void> {
  let suggestion: Suggestion;
  try {
    suggestion = JSON.parse(suggestionJson) as Suggestion;
  } catch {
    console.error('Invalid suggestion JSON. Pass the JSON string from the suggest command.');
    process.exit(1);
  }

  const provider = buildProvider();
  const serverName = suggestion.platform as ServerName;

  let mcpClient: ConnectedMcpClient;
  try {
    mcpClient = await createMcpClient(serverName);
  } catch (err) {
    console.error(`Failed to connect to ${serverName}: ${String(err)}`);
    process.exit(1);
  }

  const clients = [mcpClient];
  const tools = buildToolList(clients);
  const messages: LLMMessage[] = [
    { role: 'user', content: 'Place the order as specified.' },
  ];

  console.log(`\nPlacing order: ${suggestion.item} from ${suggestion.restaurant} via ${suggestion.platform}...\n`);

  const MAX_ITERATIONS = 20;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await provider.chat(PLACE_PROMPT(suggestion), messages, tools);
    messages.push({ role: 'assistant', content: response.content });

    for (const block of response.content) {
      if (block.type === 'text' && block.text.trim()) console.log(`[Agent] ${block.text}`);
    }

    if (response.stop_reason === 'end_turn') {
      console.log('\nDone.');
      return;
    }

    if (response.stop_reason !== 'tool_use') return;

    const toolUseBlocks = response.content.filter(
      (b): b is Extract<LLMContentBlock, { type: 'tool_use' }> => b.type === 'tool_use',
    );

    const toolResults: LLMContentBlock[] = await Promise.all(
      toolUseBlocks.map(async (block) => {
        console.log(`  -> ${block.name}(${JSON.stringify(block.input).slice(0, 120)})`);
        try {
          const result = await executeTool(clients, block.name, block.input, interactiveSuggestionsHandler);
          console.log(`     ${result.slice(0, 200)}`);
          return { type: 'tool_result' as const, tool_use_id: block.id, content: result };
        } catch (err) {
          const errMsg = `Error: ${String(err)}`;
          console.error(`     ${errMsg}`);
          return { type: 'tool_result' as const, tool_use_id: block.id, content: errMsg, is_error: true };
        }
      }),
    );

    messages.push({ role: 'user', content: toolResults });
  }
}
