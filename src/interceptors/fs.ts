import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { getSession } from '../session.js';

function digest(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export function readFile(file: string): string {
  const session = getSession();
  if (!session) return fs.readFileSync(file, 'utf8');

  if (session.mode === 'record') {
    const content = fs.readFileSync(file, 'utf8');
    session.writer?.append('fs.read', { path: file, bytes: Buffer.byteLength(content), sha256: digest(content), content });
    return content;
  }

  const event = session.reader?.next('fs.read', { path: file }) as { content: string };
  return event.content;
}

export function writeFile(file: string, content: string): void {
  const session = getSession();
  if (!session) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    return;
  }

  if (session.mode === 'record') {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    session.writer?.append('fs.write', { path: file, bytes: Buffer.byteLength(content), sha256: digest(content), content });
    return;
  }

  session.reader?.next('fs.write', { path: file });
  const target = path.join(session.scratch, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
