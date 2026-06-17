// Vercel Serverless Function — ANTHROPIC_API_KEY lives here only, never in client code.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { systemPrompt, messages, maxTokens = 600 } = req.body ?? {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'AI service error' });
    }

    const data: any = await response.json();
    return res.status(200).json({ text: data.content[0].text });
  } catch {
    return res.status(500).json({ error: 'Failed to process request' });
  }
}