// server.js — Context Keeper proxy
// Keeps your Anthropic API key on the server. Never exposed to the browser.

import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const app  = express();
const PORT = process.env.PORT || 3000;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // loaded from .env
});

const SYSTEM_PROMPT = `You are extracting continuation-ready context from a real working conversation.

Your goal is not to produce a vague summary.
Your goal is to preserve the specific details that would help an AI continue the work in a new session with minimal loss of context.

Rules:
- Be concrete and specific.
- Prefer useful specifics over generic wording.
- Name actual tools, frameworks, files, APIs...
- Do not repeat...
- Do not write filler...
- If the conversation is short...
- You may infer weakly implied working preferences...
- When the conversation suggests a practical or iterative working style, reflect that in Preferences instead of leaving it empty.
- Keep each section concise...

Write in the same language as the user's input.

Output exactly this format and nothing else:

[Purpose]
One sentence. State the concrete outcome the user is trying to achieve.

[Context]
2–4 sentences. Include the relevant working background, current setup, tools, environment, constraints, decisions already made, or errors already encountered.

[Preferences]
1–3 sentences. Include explicit preferences and strongly implied working style. If truly unavailable, write: Not clearly specified.

[Current Topic]
1–2 sentences. State what the user was actively working on at the end, and the most immediate next step.

Quality bar:
- The output should feel useful enough to paste into a new AI thread and continue work immediately.
- Every section must contain information that reduces re-explaining.
- Avoid generic safety language when a more specific phrasing is possible.`;

app.use(cors({ origin: '*' })); // tighten this in production
app.use(express.json());

app.post('/summarize', async (req, res) => {
  const { conversation } = req.body;

  if (!conversation || typeof conversation !== 'string' || conversation.trim().length < 20) {
    return res.status(400).json({ error: 'conversation must be a non-empty string (min 20 chars)' });
  }

  try {
    const message = await client.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: `Here is the conversation to summarize:\n\n${conversation}` }],
    });

    const result = message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    res.json({ result });

  } catch (err) {
    console.error('Anthropic API error:', err.message);
    res.status(502).json({ error: 'Failed to reach Anthropic API. Check your API key and try again.' });
  }
});

// 静的ファイル配信（←これ追加）
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✓ Context Keeper proxy running at http://localhost:${PORT}`);
});
