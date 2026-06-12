# kuch-bhi

Order food from Swiggy and Zomato using AI — without opening the app.

It looks at your order history on both platforms, finds nearby restaurants with active discounts, and shows you the best options. You pick one, it places the order via Cash on Delivery.

## Requirements

- Node.js 18+
- A Swiggy and/or Zomato account
- One of: Claude API key, OpenAI API key, or [Ollama](https://ollama.com) running locally (free)

## Setup

### 1. Connect your accounts (one-time per platform)

```bash
npx kuch-bhi connect swiggy
npx kuch-bhi connect zomato
```

Each command opens your browser to log in. Your credentials are saved locally at `~/.config/kuch-bhi/config.json` and never sent anywhere else.

### 2. Set your AI provider (pick one)

**Ollama — free, no API key, runs on your machine:**
```bash
# Install Ollama from https://ollama.com, then pull a model:
ollama pull llama3.1:8b

export LLM_PROVIDER=ollama
export OLLAMA_MODEL=llama3.1:8b
```

**Claude (Anthropic):**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

**OpenAI:**
```bash
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-...
```

## Run

```bash
npx kuch-bhi
```

The agent will research both Swiggy and Zomato, then show you a ranked list like:

```
  1. [ZOMATO] RollsKing — Chicken Hot-shot Protein Roll ₹215 🏷 70% off · 4.2★ · 30 min
  2. [SWIGGY] Charcoal Eats — Chicken Biryani ₹219 · 4.3★ · 35 min
  ...

Pick a number (1–6):
```

After you pick, it asks for one final confirmation before placing the order.

## Claude Code slash command

If you use [Claude Code](https://claude.ai/code), you can type `/kuch-bhi` directly in your editor instead of switching to a terminal.

Create `.claude/commands/kuch-bhi.md` in your project with:

```markdown
Run the kuch-bhi food ordering agent:
1. Run `npx kuch-bhi suggest 2>&1` and parse the KUCH_BHI_SUGGESTIONS JSON line from the output.
2. Show the suggestions to the user via AskUserQuestion and let them pick one.
3. Run `npx kuch-bhi place '<selected-json>'` to place the order.
```

## Payment

Always Cash on Delivery. No card or UPI details needed.

## License

MIT
