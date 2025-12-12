import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Custom plugin to serve local git information and environment config
const gitServerPlugin = () => ({
  name: 'git-server-middleware',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url) return next();

      // Handle Environment Config (Polyfill process.env.API_KEY)
      if (req.url === '/env.js') {
        const apiKey = process.env.API_KEY || '';
        const script = `window.process = { env: { API_KEY: "${apiKey}" } };`;
        res.setHeader('Content-Type', 'application/javascript');
        res.end(script);
        return;
      }

      // Handle Project Info
      if (req.url === '/api/project-info') {
        try {
          const cwd = (process as any).cwd();
          const folderName = path.basename(cwd);

          let branch = 'unknown';
          try {
            const { stdout } = await execAsync('git branch --show-current');
            branch = stdout.trim();
          } catch (e) { /* ignore */ }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ name: folderName, branch }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ name: 'local-project', branch: '-', error: String(error) }));
        }
        return;
      }

      // Handle Git Diff
      if (req.url === '/api/diff') {
        try {
          let diffOutput = '';
          try {
            const { stdout } = await execAsync('git diff --cached');
            diffOutput = stdout;
            if (!diffOutput.trim()) {
              const { stdout: stdoutUnstaged } = await execAsync('git diff');
              diffOutput = stdoutUnstaged;
            }
          } catch (e) {
            const { stdout } = await execAsync('git diff');
            diffOutput = stdout;
          }

          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(diffOutput);
        } catch (error) {
          console.error('Error fetching diff:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Error fetching git diff');
        }
        return;
      }

      next();
    });
  },
});

export default defineConfig({
  plugins: [
    react(),
    gitServerPlugin()
  ],
  server: {
    port: 3000,
  }
});