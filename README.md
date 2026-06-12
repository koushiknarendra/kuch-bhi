# kuch-bhi

Autonomous food ordering CLI agent for Swiggy and Zomato. Connects to the official MCP servers for both platforms, reads your order history, finds the best nearby deals, and orders for you — with your confirmation.

## How it works

1. Fetches your past orders from both Swiggy and Zomato
2. Finds nearby restaurants with active discounts matching your taste
3. Presents you a ranked list of suggestions
4. You pick one — it adds to cart, applies a coupon, and places the order via Cash on Delivery

## Requirements

- Node.js 18+
- A Swiggy account and/or a Zomato account
- An LLM API key (Claude by default, OpenAI and Ollama also supported)

## Setup

### 1. Connect your accounts (one-time)

```bash
# Connect Swiggy
npx kuch-bhi connect swiggy

# Connect Zomato
npx kuch-bhi connect zomato
```

Each command opens your browser for OAuth login. Credentials are saved to `~/.config/kuch-bhi/config.json` and never leave your machine.

### 2. Set your API key

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Or create a `.env` file in your working directory:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

```bash
npx kuch-bhi
```

That's it. The agent researches both platforms and presents suggestions. You pick, it orders.

## LLM providers

Claude (Anthropic) is used by default. You can switch via environment variables — no code changes needed.

| Provider | Env vars |
|---|---|
| Claude (default) | `ANTHROPIC_API_KEY` |
| OpenAI | `LLM_PROVIDER=openai OPENAI_API_KEY=sk-...` |
| Ollama (local, no key) | `LLM_PROVIDER=ollama OLLAMA_MODEL=llama3.1:8b` |

## Claude Code slash command

If you use [Claude Code](https://claude.ai/code), add the slash command by creating `.claude/commands/kuch-bhi.md` in your project:

```markdown
Run the kuch-bhi food ordering agent end-to-end:

1. Run: `npx kuch-bhi suggest 2>&1`
2. Parse the line starting with `KUCH_BHI_SUGGESTIONS:` as JSON.
3. Present options to the user via AskUserQuestion.
4. Run: `npx kuch-bhi place '<selected-json>'`
```

Then type `/kuch-bhi` in Claude Code to order without leaving your editor.

## Payment

Always uses **Cash on Delivery**. No card or UPI details needed.

## License

MIT
