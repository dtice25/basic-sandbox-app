import { NextResponse } from 'next/server';
import { createCompute } from 'computesdk';
import { e2b } from '@computesdk/e2b';

export async function POST() {
  const compute = createCompute({
    provider: e2b({
      apiKey: process.env.E2B_API_KEY!,
      timeout: 300000, //5 minutes for testing
    }),
    apiKey: process.env.COMPUTESDK_API_KEY,
  });

  const sandbox = await compute.sandbox.create();

  // Create basic Vite React app
  await sandbox.runCommand('npm', ['create', 'vite@5', 'app', '--', '--template', 'react']);

  // Custom vite.config.js to allow access to sandbox at port 5173
  const viteConfig = `import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'

  export default defineConfig({
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      hmr: false,
      allowedHosts: ['.e2b.app', '.e2b.dev', 'localhost', '127.0.0.1', '.computesdk.com'],
    },
  })
  `;
  await sandbox.filesystem.writeFile('app/vite.config.js', viteConfig);
  
  // Install dependencies
  await sandbox.runCommand('cd app && npm install')
  
  // Start dev server
  sandbox.runCommand('cd app && npm run dev', [], {
    background: true,
  });

  // Get preview URL
  const url = await sandbox.getUrl({ port: 5173 });
  console.log('previewUrl:', url)

  return NextResponse.json({ 
    sandboxId: sandbox.sandboxId,
    url,
  });
}