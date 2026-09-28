/**
 * ACADEMIQ OS: PRODUCTION LOCAL SERVER & API GATEWAY
 * Pure Node.js HTTP server (zero external dependency required).
 * Serves static assets, 3D WebGL runtime, and mock/live AI endpoints.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Automatically load .env or .env.local if present (zero external dependencies)
['.env', '.env.local'].forEach(file => {
  const envPath = path.join(__dirname, file);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
});

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // --- API ROUTES ---
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    if (pathname === '/api/status' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'online',
        system: 'Academiq OS Core 2.5',
        timestamp: new Date().toISOString(),
        aiEngine: process.env.GEMINI_API_KEY ? 'gemini-2.5-pro' : 'simulation-mode'
      }));
      return;
    }

    if (pathname === '/api/rebalance' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            mode: data.triageMode || 'SURGICAL_COMPRESSION',
            rationale: "Automated schedule redistribution calculated with zero milestone breach."
          }));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return;
    }

    if (pathname === '/api/ai') {
      const aiHandler = require('./api/ai.js');
      return aiHandler(req, res);
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
    return;
  }

  // --- STATIC FILE SERVING ---
  if (pathname === '/') pathname = '/index.html';
  const safeSuffix = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safeSuffix);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  ACADEMIQ OS: 3D AI ACADEMIC EXECUTION PLATFORM`);
  console.log(`  Running live at: http://localhost:${PORT}`);
  console.log(`  AI Engine: ${process.env.GEMINI_API_KEY ? 'gemini-2.5-pro (Key Loaded from .env.local)' : 'simulation-mode'}`);
  console.log(`  3D Engine: Three.js Hologram + Procedural Web Audio`);
  console.log(`======================================================\n`);
});

module.exports = server;
