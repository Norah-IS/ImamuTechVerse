import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function localApiProxy() {
  return {
    name: 'local-api-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/chat', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) {
          res.writeHead(500, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in .env.local' }));
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            const upstream = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: body.maxTokens || 600,
                system: body.systemPrompt,
                messages: body.messages,
              }),
            });
            const data: any = await upstream.json();
            res.writeHead(upstream.ok ? 200 : upstream.status, { 'content-type': 'application/json' });
            res.end(JSON.stringify(upstream.ok ? { text: data.content[0].text } : { error: 'AI service error' }));
          } catch {
            res.writeHead(500, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    localApiProxy(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
