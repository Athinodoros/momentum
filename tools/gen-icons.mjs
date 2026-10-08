// Generate PNG app icons from the same geometry as icon.svg, with zero
// dependencies (raw bitmap + Node's zlib for PNG encoding). Run: npm run icons
// Produces maskable-safe PNGs for Android and an opaque apple-touch-icon for iOS.
import zlib from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
mkdirSync(OUT, { recursive: true });

const PURPLE = [91, 91, 214];
const WHITE = [255, 255, 255];

// Geometry in a 512x512 design space (matches icon.svg). The logo sits inside
// the maskable "safe zone" (center 80%) so Android's circle mask never clips it.
const tri = [
  [256, 120],
  [392, 360],
  [120, 360],
];
const circle = { x: 256, y: 300, r: 34 };

function edge(px, py, a, b) {
  return (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (py - b[1]);
}
function inTriangle(px, py) {
  const d1 = edge(px, py, tri[0], tri[1]);
  const d2 = edge(px, py, tri[1], tri[2]);
  const d3 = edge(px, py, tri[2], tri[0]);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}
function sample(x, y) {
  let color = PURPLE;
  if (inTriangle(x, y)) color = WHITE;
  if ((x - circle.x) ** 2 + (y - circle.y) ** 2 <= circle.r ** 2) color = PURPLE;
  return color;
}

function render(size) {
  const n = 3; // 3x3 supersampling for smooth edges
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < n; sy += 1) {
        for (let sx = 0; sx < n; sx += 1) {
          const fx = ((px + (sx + 0.5) / n) * 512) / size;
          const fy = ((py + (sy + 0.5) / n) * 512) / size;
          const [cr, cg, cb] = sample(fx, fy);
          r += cr;
          g += cg;
          b += cb;
        }
      }
      const m = n * n;
      const i = (py * size + px) * 4;
      buf[i] = Math.round(r / m);
      buf[i + 1] = Math.round(g / m);
      buf[i + 2] = Math.round(b / m);
      buf[i + 3] = 255; // fully opaque: safe for maskable and apple-touch alike
    }
  }
  return buf;
}

// --- minimal PNG encoder ---------------------------------------------------

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  writeFileSync(join(OUT, name), encodePNG(size, render(size)));
  console.log(`wrote icons/${name} (${size}x${size})`);
}
