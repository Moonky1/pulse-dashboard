// First-party scalar irradiance lookup. No image/video input or random seed.
// Offline periodic ray splatting through an anisotropic wave lens. RGB color
// remains entirely in the runtime shader, not in this monochrome data asset.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const WIDTH = 256
export const HEIGHT = 128
const TAU = Math.PI * 2
const wrap = (value, size) => ((value % size) + size) % size

export function rayLanding(u, v) {
  const a = TAU * (3 * v + .12 * Math.sin(TAU * u) + .065 * Math.cos(2 * TAU * u))
  const b = TAU * (7 * v + .20 * Math.sin(TAU * u + .7) + .05 * Math.sin(3 * TAU * u))
  const c = TAU * (v + 2 * u)
  const dy = .051 * Math.cos(a) + .016 * Math.cos(b) + .006 * Math.cos(c)
  const dx = .009 * Math.cos(a) * Math.cos(TAU * u) + .005 * Math.sin(b) + .003 * Math.cos(c)
  return [u + dx, v + dy]
}

export function createOpticalPixels() {
  const energy = new Float64Array(WIDTH * HEIGHT)
  const samples = 4
  for (let y = 0; y < HEIGHT * samples; y++) {
    for (let x = 0; x < WIDTH * samples; x++) {
      const [u, v] = rayLanding((x + .5) / (WIDTH * samples), (y + .5) / (HEIGHT * samples))
      const px = u * WIDTH - .5, py = v * HEIGHT - .5
      const ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy
      for (let oy = 0; oy < 2; oy++) for (let ox = 0; ox < 2; ox++) {
        energy[wrap(iy + oy, HEIGHT) * WIDTH + wrap(ix + ox, WIDTH)] +=
          (ox ? fx : 1 - fx) * (oy ? fy : 1 - fy) / (samples * samples)
      }
    }
  }
  // Linear scalar encoding: ordinary illumination remains low, focused energy
  // approaches one. This is an irradiance proxy, not a physically exact solver.
  return Uint8Array.from(energy, e => Math.round(255 * Math.min(1, Math.max(0, (e - .32) / 4.4))))
}

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const name = Buffer.from(type), size = Buffer.alloc(4), crc = Buffer.alloc(4)
  size.writeUInt32BE(data.length)
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([size, name, data, crc])
}

export function encodeOpticalPng(pixels = createOpticalPixels()) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(WIDTH, 0); header.writeUInt32BE(HEIGHT, 4)
  header[8] = 8 // grayscale, no color profile/gamma transform
  const scanlines = Buffer.alloc((WIDTH + 1) * HEIGHT)
  for (let y = 0; y < HEIGHT; y++) {
    scanlines[y * (WIDTH + 1)] = 1 // lossless horizontal Sub predictor
    for (let x = 0; x < WIDTH; x++) scanlines[y * (WIDTH + 1) + x + 1] =
      (pixels[y * WIDTH + x] - (x ? pixels[y * WIDTH + x - 1] : 0) + 256) % 256
  }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(scanlines,{level:9})),chunk('IEND',Buffer.alloc(0))])
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const png = encodeOpticalPng()
  writeFileSync(new URL('../../src/fx/fidelity/optical-energy.png', import.meta.url), png)
  console.log(`${WIDTH}x${HEIGHT} grayscale: ${png.length} PNG bytes / ${WIDTH * HEIGHT} scalar bytes`)
}
