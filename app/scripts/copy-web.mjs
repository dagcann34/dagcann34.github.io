// Copies the game (../blokko) into www/ for Capacitor, skipping web-only/source files.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
const skip = ['resources', 'sw.js'];
rmSync('www', { recursive: true, force: true });
mkdirSync('www');
cpSync('../blokko', 'www', { recursive: true, filter: src => !skip.some(s => src.endsWith('/' + s) || src.includes('/' + s + '/')) });
console.log('Copied ../blokko -> www');
