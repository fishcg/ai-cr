#!/usr/bin/env node

import express from 'express';
import open from 'open';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { AI_API_URL, AI_API_KEY, AI_MODEL, SYSTEM_PROMPT, TIP_PROMPT, DEFAULT_AI_MODEL } from '../constants.ts';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PROJECT_ROOT = process.cwd(); // The directory where the user runs the command

app.use(express.json());

// 0. Environment Config API (Injects API Key to Frontend)
app.get('/env.js', (req, res) => {
  const apiKey = process.env.API_KEY || '';
  const script = `window.process = { env: { API_KEY: "${apiKey}" } };`;
  res.setHeader('Content-Type', 'application/javascript');
  res.send(script);
});

// 1. Git Diff API
app.get('/api/diff', async (req, res) => {
  try {
    // Try getting staged + unstaged changes
    let diffOutput = '';
    try {
      // Try getting cached (staged) changes first, as that's what we usually commit
      const { stdout } = await execAsync('git diff --cached', { cwd: PROJECT_ROOT });
      diffOutput = stdout;

      // If empty, try getting unstaged changes
      if (!diffOutput.trim()) {
        const { stdout: stdoutUnstaged } = await execAsync('git diff', { cwd: PROJECT_ROOT });
        diffOutput = stdoutUnstaged;
      }
    } catch (e) {
      // Fallback
      const { stdout } = await execAsync('git diff HEAD', { cwd: PROJECT_ROOT });
      diffOutput = stdout;
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(diffOutput);
  } catch (error) {
    console.error('Git diff error:', error.message);
    res.status(500).send('Error fetching git diff: ' + error.message);
  }
});

// 2. Project Info API
app.get('/api/project-info', async (req, res) => {
  try {
    const folderName = path.basename(PROJECT_ROOT);
    let branch = 'unknown';
    try {
      const { stdout } = await execAsync('git branch --show-current', { cwd: PROJECT_ROOT });
      branch = stdout.trim();
    } catch (e) { /* ignore */ }

    res.json({ name: folderName, branch });
  } catch (error) {
    res.json({ name: 'local-project', branch: '-', error: String(error) });
  }
});

// 4. Serve Static Files (The built React app)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA Fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // In development or if build is missing, we still want the server to start for API testing
  // providing a helpful message
  app.get('/', (req, res) => {
    res.send(`
            <h1>CR Tool Server Running</h1>
            <p>Could not find frontend build at: ${distPath}</p>
            <p>If you are developing, use <code>npm run dev</code>.</p>
            <p>If you are trying to use the tool, run <code>npm run build</code> first.</p>
        `);
  });
}

// Start Server
const server = app.listen(0, async () => {
  const port = server.address().port;
  const url = `http://localhost:${port}`;
  console.log(`\n🚀 CR Code Review Tool is running at ${url}`);
  console.log(`📂 Analyzing project: ${PROJECT_ROOT}\n`);

  if (!AI_API_URL || !AI_API_KEY || !AI_MODEL || !SYSTEM_PROMPT || !TIP_PROMPT || !DEFAULT_AI_MODEL) {
    console.error("⚠️  ERROR: config not set in constants.ts");
    console.error("   The AI analysis will not work.\n");
  }

  await open(url);
});