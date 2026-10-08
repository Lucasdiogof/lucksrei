// Renders aprovaura-promo-v8.html frame by frame (deterministic render(t)) and encodes the MP4.
// usage: node render.mjs [out.mp4] [--from s --to s] [--sheet]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const here = path.dirname(url.fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const out = args.find(a => a.endsWith('.mp4')) || path.join(here, 'out', 'aprovaura-v8.mp4');
const FPS = 30, SCALE = 2, WORKERS = 4;
const from = args.includes('--from') ? +args[args.indexOf('--from') + 1] : 0;
const to = args.includes('--to') ? +args[args.indexOf('--to') + 1] : +(process.env.DUR || 50);
const frames = path.join(here, 'frames'); fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames, { recursive: true });
fs.mkdirSync(path.dirname(out), { recursive: true });
const N = Math.round((to - from) * FPS);
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
const pageUrl = url.pathToFileURL(path.join(here, process.env.FILE || 'aprovaura-promo-v8.html')).href;
const DUR = +(process.env.DUR || 50);
const t0 = Date.now();
await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const page = await browser.newPage({ viewport: { width: 720, height: 720 }, deviceScaleFactor: SCALE });
  await page.goto(pageUrl); await page.evaluate(() => window.ready);
  for (let i = w; i < N; i += WORKERS) {
    // wait for two animation frames so every layer (e.g. the AURA HUD) is painted before the capture;
    // capturing straight after render(t) randomly dropped composited layers (the HUD "flicker" in V5)
    await page.evaluate(t => { window.render(t); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, from + i / FPS);
    await page.screenshot({ path: path.join(frames, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 95 });
  }
}));
await browser.close();
console.log(`captured ${N} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(frames, '%05d.jpg'),
  '-vf', 'scale=720:720:flags=lanczos', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-preset', 'slow', '-crf', '20', '-tune', 'animation', '-movflags', '+faststart', '-an', out], { stdio: 'inherit' });
if (r.status) process.exit(r.status);
console.log('wrote', out);
