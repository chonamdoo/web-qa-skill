import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

if (process.argv.length !== 2 && (process.argv.length !== 4 || process.argv[2] !== '--port')) throw new Error('Use --port INTEGER');
const port = process.argv[2] === '--port' ? Number(process.argv[3]) : 0;
if (!Number.isInteger(port) || port < 0 || port > 65535 || process.argv.length > (process.argv[2] ? 4 : 2)) throw new Error('Use --port INTEGER');
const files = new Map(['/shop-a.html', '/shop-b.html'].map(x => [x, new URL('../fixtures' + x, import.meta.url)]));
const server = createServer(async (request, response) => {
  const file = files.get(new URL(request.url, 'http://127.0.0.1').pathname);
  if (!file || !['GET', 'HEAD'].includes(request.method)) { response.writeHead(404); response.end(); return; }
  try { const data = await readFile(file); response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(request.method === 'HEAD' ? undefined : data); }
  catch { response.writeHead(500); response.end(); }
});
server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({ host: '127.0.0.1', port: (/** @type {import('node:net').AddressInfo} */ (server.address())).port, pages: [...files.keys()] })));
