# Context Keeper — Setup Guide

## Files

```
context_keeper/
├── index.html      ← open this in your browser
├── server.js       ← proxy server (keeps your API key safe)
├── package.json
├── .env.example    ← copy this to .env and add your key
└── README.md
```

---

## Setup (5 minutes)

### 1. Install Node.js

If you don't have it: https://nodejs.org — download the LTS version.

Verify it works:
```bash
node --version   # should print v18 or higher
```

---

### 2. Add your API key

Copy the example env file and fill it in:

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

Get your key at: https://console.anthropic.com/settings/keys

---

### 3. Install dependencies

```bash
npm install
```

---

### 4. Start the server

```bash
npm start
```

You should see:
```
✓ Context Keeper proxy running at http://localhost:3000
```

---

### 5. Open the frontend

Open `index.html` directly in your browser — just double-click it, or:

```bash
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

Paste a conversation, click **Generate Context**, done.

---

## How it works

```
Browser (index.html)
    │
    │  POST /summarize  { conversation: "..." }
    ▼
Server (server.js)  ←── ANTHROPIC_API_KEY lives here only
    │
    │  POST https://api.anthropic.com/v1/messages
    ▼
Anthropic API
    │
    │  { result: "[Purpose]..." }
    ▼
Browser renders output
```

Your API key never touches the browser. The frontend only knows about `localhost:3000`.

---

## Dev mode (auto-restarts on save)

```bash
npm run dev
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module` | Run `npm install` |
| `401 Unauthorized` | Check your API key in `.env` |
| `Failed to fetch` | Make sure the server is running (`npm start`) |
| `CORS error` | Server must be running before opening the HTML |
| Port 3000 in use | Set `PORT=3001` in `.env`, update `PROXY_URL` in `index.html` |

---

## Next steps for production

- Replace `cors({ origin: '*' })` with your actual domain
- Add rate limiting (e.g. `express-rate-limit`)
- Deploy the server to Railway, Render, or Fly.io
- Serve `index.html` from the same Express server to avoid CORS entirely
