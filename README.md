# kuch-bhi 🍱

> **Order food from Swiggy & Zomato using AI — without opening the app.**

[![npm](https://img.shields.io/npm/v/order-kuch-bhi)](https://www.npmjs.com/package/order-kuch-bhi)
[![license](https://img.shields.io/github/license/koushiknarendar/kuch-bhi)](LICENSE)
[![node](https://img.shields.io/node/v/kuch-bhi)](https://nodejs.org)

`kuch-bhi` is a CLI agent that connects to the official Swiggy and Zomato APIs, studies your order history, hunts for nearby discounts, and places a Cash on Delivery order — after you confirm.

Works with **Claude**, **OpenAI**, or **Ollama** (free, runs locally).

---

## Demo

```
$ npx order-kuch-bhi

Researching Swiggy and Zomato...

┌─────────────────────────────────────────────────────┐
│              Here's what I found for you             │
└─────────────────────────────────────────────────────┘

  1. [ZOMATO] RollsKing
     Chicken Hot-shot Protein Roll — ₹215 🏷 70% OFF up to ₹140
     4.2★  ·  30–35 min
     Your most-ordered item on Zomato — ordered almost daily!

  2. [ZOMATO] Shalimar
     Chicken Tikka Biryani — ₹440 🏷 60% OFF up to ₹120
     4.1★  ·  25–30 min
     Past favourite, 1.9 km away with a big discount.

  3. [SWIGGY] Charcoal Eats - Biryani & Beyond
     Chicken Biryani — ₹219
     4.3★  ·  35 min
     Your #1 repeat restaurant on Swiggy — ordered 3 times!

Pick a number (1–3): 1

Confirm order? [y/N]: y

✅ Order placed! Chicken Hot-shot Protein Roll from RollsKing
   ₹215 → ₹75 after 70% off  ·  COD  ·  Arrives in ~32 min
```

---

## How it works

1. Connects to Swiggy and Zomato via their official MCP APIs
2. Reads your past order history to understand your preferences
3. Searches nearby restaurants for active discounts
4. Ranks options by: discount size + match with your history + rating
5. You pick — it adds to cart, applies a coupon, and places the order

---

## Requirements

- Node.js 18+
- A Swiggy and/or Zomato account (Indian accounts)
- One of: Claude API key · OpenAI API key · [Ollama](https://ollama.com) (free, local)

---

## Setup

### 1. Connect your accounts (one-time)

```bash
npx order-kuch-bhi connect swiggy
npx order-kuch-bhi connect zomato
```

Opens your browser to log in. Credentials saved locally at `~/.config/kuch-bhi/config.json` — never sent anywhere else.

### 2. Pick your AI (choose one)

**Ollama — free, no API key, fully local:**
```bash
# Install from https://ollama.com, then:
ollama pull llama3.1:8b

export LLM_PROVIDER=ollama
export OLLAMA_MODEL=llama3.1:8b
```

**Claude:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

**OpenAI:**
```bash
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-...
```

### 3. Order

```bash
npx order-kuch-bhi
```

---

## Claude Code slash command

If you use [Claude Code](https://claude.ai/code), you can type `/kuch-bhi` directly in your editor.

Create `.claude/commands/kuch-bhi.md` in your project:

```markdown
Run the kuch-bhi food ordering agent:
1. Run `npx order-kuch-bhi suggest 2>&1` and parse the KUCH_BHI_SUGGESTIONS JSON line.
2. Show the suggestions to the user via AskUserQuestion and let them pick one.
3. Run `npx order-kuch-bhi place '<selected-json>'` to place the order.
```

---

## Notes

- **Payment:** Always Cash on Delivery. No card or UPI details needed.
- **Privacy:** Your Swiggy/Zomato tokens are stored only on your machine.
- **Platforms:** Currently works with Indian Swiggy and Zomato accounts.

---

## License

MIT
