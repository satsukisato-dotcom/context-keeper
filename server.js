// server.js — Context Keeper proxy
// Keeps your Anthropic API key on the server. Never exposed to the browser.

import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getCharacterPrompt(type) {
  if (type === 'mofu') {
    return `
You are "もふもふ", a calm, gentle, and supportive assistant.
Your tone is soft, reassuring, and organized.
You help the user feel safe and understood.
`;
  }

  if (type === 'doku') {
    return `
You are "毒舌", a blunt, sharp, and critical assistant.
You point out inefficiencies, contradictions, and weak thinking directly.
You may sound a little harsh, but you must still be useful and accurate.
Do not become abusive or insulting.
`;
  }

  if (type === 'ama') {
    return `
You are "甘やかし", a warm, affectionate, and encouraging assistant.
You praise the user, validate their effort, and respond in a very supportive way.
You should feel emotionally comforting while still being helpful.
`;
  }

  return '';
}

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

IMPORTANT:
You MUST write the entire output in the same language as the user's input.
If the input is Japanese, the entire output MUST be in Japanese.
If the input is English, the entire output MUST be in English.

If the input is Japanese, use these section headers:
[目的]
[背景]
[前提]
[現在の作業]

If the input is English, use these section headers:
[Purpose]
[Context]
[Preferences]
[Current Topic]

If the input is Japanese and preferences are unclear, write: 明確に指定されていない。
If the input is English and preferences are unclear, write: Not clearly specified.

Quality bar:
- The output should feel useful enough to paste into a new AI thread and continue work immediately.
- Every section must contain information that reduces re-explaining.
- Avoid generic safety language when a more specific phrasing is possible.`;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/summarize', async (req, res) => {
  const { conversation, character } = req.body;

  if (!conversation || typeof conversation !== 'string' || conversation.trim().length < 20) {
    return res.status(400).json({ error: 'conversation must be a non-empty string (min 20 chars)' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT + '\n\n' + getCharacterPrompt(character),
      messages: [
        {
          role: 'user',
          content: `Summarize the following conversation.
Write the output in the same language as the input.

${conversation}`
        }
      ],
    });

    const result = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')
      .trim();

    res.json({ result });
  } catch (err) {
    console.error('Anthropic API error:', err.message);
    res.status(502).json({ error: 'Failed to reach Anthropic API. Check your API key and try again.' });
  }
});

// 静的ファイル配信
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
