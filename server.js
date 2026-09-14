/** Dev server tĩnh — không phụ thuộc gói ngoài. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.PORT) || 8123;
const ROOT = process.cwd();
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

createServer(async (req, res) => {
  const raw = decodeURIComponent(req.url.split('?')[0]);
  // Chặn path traversal — chỉ phục vụ file nằm trong thư mục dự án.
  const target = normalize(join(ROOT, raw === '/' ? 'index.html' : raw));
  if (!target.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': TYPES[extname(target)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => {
  console.log(`Match 2 đang chạy: http://localhost:${PORT}`);
});
