import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const requireFromDb = createRequire(new URL('../../../lib/db/package.json', import.meta.url));
const { Client } = requireFromDb('pg');
const webPort = Number(process.env.PORT ?? 21585);
const apiPort = Number(process.env.PASSWORD_CHANGE_API_PORT ?? 21586);

let dataDirectory;
const children = [];
let stopping = false;

async function findAvailablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not allocate a temporary database port.');
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

function startChild(command, args, env, cwd = root, stdio = 'ignore') {
  const child = spawn(command, args, { cwd, env, stdio });
  children.push(child);
  return child;
}

function runQuietly(command, args, env, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env, stdio: 'ignore' });
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Isolated database schema setup timed out.'));
    }, timeoutMs);
    child.once('error', () => {
      clearTimeout(timeout);
      reject(new Error('Could not start isolated database schema setup.'));
    });
    child.once('exit', (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error('Could not prepare the isolated password-change test schema.'));
    });
  });
}

async function waitFor(url, isReady) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (children.some((child) => child.exitCode !== null)) {
      throw new Error('The production test stack stopped before it was ready.');
    }
    try {
      const response = await fetch(url);
      if (await isReady(response)) return;
    } catch {
      // The child process may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('The production test stack did not become ready.');
}

async function waitForDatabase(connectionString, databaseProcess) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (databaseProcess.exitCode !== null) {
      throw new Error('The temporary PostgreSQL test database stopped before it was ready.');
    }
    const client = new Client({ connectionString, connectionTimeoutMillis: 500 });
    try {
      await client.connect();
      await client.query('SELECT 1');
      return;
    } catch {
      // PostgreSQL may still be starting.
    } finally {
      await client.end().catch(() => {});
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('The temporary PostgreSQL test database did not become ready.');
}

async function stopChildren() {
  for (const child of [...children].reverse()) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  }
  await Promise.all([...children].reverse().map((child) => new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    child.once('exit', resolve);
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }, 2_000).unref();
  })));
}

async function cleanup() {
  if (stopping) return;
  stopping = true;
  await stopChildren();
  if (dataDirectory) await rm(dataDirectory, { recursive: true, force: true }).catch(() => {});
}

process.once('SIGTERM', () => { void cleanup().finally(() => process.exit(0)); });
process.once('SIGINT', () => { void cleanup().finally(() => process.exit(130)); });
process.once('exit', () => {
  if (dataDirectory) {
    try {
      rmSync(dataDirectory, { recursive: true, force: true });
    } catch {
      // The temporary cluster is best-effort cleaned again during normal shutdown.
    }
  }
});

try {
  dataDirectory = await mkdtemp(path.join(tmpdir(), 'lofte-password-change-db-'));
  await runQuietly('initdb', [
    '-D', dataDirectory,
    '--no-locale',
    '--encoding=UTF8',
    '--auth=trust',
    '-U', 'lofte_test',
  ], process.env);

  const databasePort = await findAvailablePort();
  const databaseUrl = `postgresql://lofte_test@127.0.0.1:${databasePort}/postgres`;
  const database = startChild('postgres', [
    '-D', dataDirectory,
    '-h', '127.0.0.1',
    '-p', String(databasePort),
    '-k', dataDirectory,
    '-F',
  ], process.env);
  await waitForDatabase(databaseUrl, database);

  await runQuietly('pnpm', ['--filter', '@workspace/db', 'run', 'push'], {
    ...process.env,
    DATABASE_URL: databaseUrl,
  });

  const api = startChild(process.execPath, ['--enable-source-maps', 'artifacts/api-server/dist/index.mjs'], {
    ...process.env,
    PORT: String(apiPort),
    DATABASE_URL: databaseUrl,
    NODE_ENV: 'production',
  });
  if (api.exitCode !== null) throw new Error('The production API test server failed to start.');

  await waitFor(`http://127.0.0.1:${apiPort}/api/auth/me`, async (response) => response.status === 401);

  const web = startChild(process.execPath, ['artifacts/lift-log/e2e/production-server.mjs'], {
    ...process.env,
    PORT: String(webPort),
    API_PROXY_PORT: String(apiPort),
    NODE_ENV: 'production',
  });
  if (web.exitCode !== null) throw new Error('The production web test server failed to start.');

  await waitFor(`http://127.0.0.1:${webPort}/`, async (response) => response.ok);

  const testRun = startChild(
    'pnpm',
    ['exec', 'playwright', 'test', '--config', 'playwright.password-change.config.ts'],
    process.env,
    path.join(root, 'artifacts/lift-log'),
    'inherit',
  );
  const testExitCode = await new Promise((resolve) => {
    testRun.once('error', () => resolve(1));
    testRun.once('exit', (code) => resolve(code ?? 1));
  });
  await cleanup();
  process.exitCode = testExitCode;
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown test-stack startup error.';
  console.error(message);
  await cleanup();
  process.exitCode = 1;
}