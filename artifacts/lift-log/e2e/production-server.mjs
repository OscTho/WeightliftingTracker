import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { request as proxyRequest } from 'node:http';

const dist = path.resolve(fileURLToPath(new URL('../dist/public/', import.meta.url)));
const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error('PORT must be a positive integer');
}
const apiProxyPort = process.env.API_PROXY_PORT ? Number(process.env.API_PROXY_PORT) : undefined;
if (apiProxyPort !== undefined && (!Number.isInteger(apiProxyPort) || apiProxyPort <= 0)) {
  throw new Error('API_PROXY_PORT must be a positive integer');
}

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// The production output and test API share an origin, just as they do behind
// the deployment router. No live API, database, or session is needed.
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (apiProxyPort && (pathname === '/api' || pathname.startsWith('/api/'))) {
    const upstream = proxyRequest({
      hostname: '127.0.0.1',
      port: apiProxyPort,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${apiProxyPort}` },
    }, (apiResponse) => {
      res.writeHead(apiResponse.statusCode ?? 502, apiResponse.headers);
      apiResponse.pipe(res);
    });
    upstream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'API unavailable' }));
    });
    req.pipe(upstream);
    return;
  }
  if (pathname === '/api/auth/me') {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Authentication required' }));
    return;
  }
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  try {
    const file = path.resolve(dist, `.${pathname}`);
    if (file !== dist && !file.startsWith(`${dist}${path.sep}`)) {
      res.writeHead(403).end();
      return;
    }
    const asset = await stat(file).then((info) => info.isFile()).catch(() => false);
    if (!asset && path.extname(pathname)) {
      res.writeHead(404).end();
      return;
    }
    const target = asset ? file : path.join(dist, 'index.html');
    const body = await readFile(target);
    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(target)] ?? 'application/octet-stream',
    });
    res.end(body);
  } catch (error) {
    console.error(error);
    res.writeHead(500).end();
  }
});

server.listen(port, '127.0.0.1');