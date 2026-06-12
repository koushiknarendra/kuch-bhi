<div align="center">

# kuch-bhi 🍱

### AI-powered food ordering from your terminal

**Looks at your Swiggy & Zomato order history → finds the best nearby deals → orders for you**

[![npm](https://img.shields.io/npm/v/order-kuch-bhi?color=red&label=npm)](https://www.npmjs.com/package/order-kuch-bhi)
[![license](https://img.shields.io/github/license/koushiknarendar/kuch-bhi?color=blue)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)
[![made for india](https://img.shields.io/badge/made%20for-India%20🇮🇳-orange)](https://github.com/koushiknarendar/kuch-bhi)

</div>

---

## What it does

`kuch-bhi` is a CLI agent that connects to the **official Swiggy and Zomato APIs**, reads your order history to understand your taste, finds nearby restaurants with active discounts, and places a **Cash on Delivery** order — after you confirm.

No app switching. No scrolling. Just run one command.

Works with **Claude**, **OpenAI**, or **Ollama** (free, runs fully local — no API key needed).

---

## Demo

```
$ npx order-kuch-bhi

┌─────────────────────────────────────────────────────┐
│              Here's what I found for you             │
└─────────────────────────────────────────────────────┘

  1. [ZOMATO] RollsKing
     Chicken Hot-shot Protein Roll — ₹215  🏷 70% OFF up to ₹140
     4.2★  ·  30 min  ·  1.2 km away
     Your most-ordered item on Zomato — ordered almost daily!

  2. [ZOMATO] Shalimar
     Chicken Tikka Biryani — ₹440  🏷 60% OFF up to ₹120
     4.1★  ·  25 min  ·  1.9 km away
     Past favourite with a big discount today.

  3. [SWIGGY] Charcoal Eats
     Chicken Biryani — ₹219
     4.3★  ·  35 min  ·  2.1 km away
     Your #1 repeat restaurant on Swiggy — ordered 3 times!

Pick a number (1–3): 1

Confirm order? [y/N]: y

✅ Order placed! Chicken Hot-shot Protein Roll from RollsKing
   ₹215 → ₹75 after 70% off  ·  Cash on Delivery  ·  Arrives in ~30 min
```

---

## How it works

```
Your order history  →  AI understands your taste
        ↓
Both Swiggy + Zomato  →  Nearby restaurants + active discounts
        ↓
Ranked suggestions  →  You pick one
        ↓
Cart + best coupon applied  →  You confirm  →  Order placed (COD)
```

---

## Requirements

| | |
|---|---|
| **Node.js** | v18 or higher |
| **Account** | Swiggy and/or Zomato (India) |
| **AI** | Ollama (free) · Claude · OpenAI |

---

## Quick Start

### Step 1 — Connect your accounts (one-time only)

```bash
npx order-kuch-bhi connect swiggy
npx order-kuch-bhi connect zomato
```

Opens your browser for a standard OAuth login. Your credentials are saved locally at `~/.config/kuch-bhi/config.json` and never leave your machine.

---

### Step 2 — Set up AI (pick one)

#### 🆓 Ollama — free, no account, runs on your machine

```bash
# 1. Install Ollama from https://ollama.com
# 2. Pull a model:
ollama pull llama3.1:8b

# 3. Set as provider:
export LLM_PROVIDER=ollama
export OLLAMA_MODEL=llama3.1:8b
```

#### Claude (Anthropic)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```
Get a key at [console.anthropic.com](https://console.anthropic.com)

#### OpenAI

```bash
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-...
```

---

### Step 3 — Order food

```bash
npx order-kuch-bhi
```

That's it.

---

## Using with Claude Code

If you use [Claude Code](https://claude.ai/code), type `/kuch-bhi` directly in your editor instead of switching to a terminal.

Create a file `.claude/commands/kuch-bhi.md` in your project:

```markdown
Run the kuch-bhi food ordering agent:
1. Run `npx order-kuch-bhi suggest 2>&1` and parse the KUCH_BHI_SUGGESTIONS JSON line.
2. Show the suggestions to the user via AskUserQuestion and let them pick one.
3. Run `npx order-kuch-bhi place '<selected-json>'` to place the order.
```

---

## FAQ

**Is it safe? Does it store my passwords?**  
kuch-bhi uses standard OAuth — it never sees your Swiggy/Zomato password. Tokens are stored only on your machine at `~/.config/kuch-bhi/config.json`.

**What payment method does it use?**  
Always Cash on Delivery. No card or UPI details are ever needed or stored.

**Does it work outside India?**  
No — Swiggy and Zomato are India-only platforms.

**Can I use a free AI?**  
Yes. [Ollama](https://ollama.com) runs locally with no API key and no cost.

---

## License

MIT © [koushiknarendar](https://github.com/koushiknarendar)
