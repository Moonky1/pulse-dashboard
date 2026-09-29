import { mkdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { deflateSync } from 'node:zlib'

const target = process.argv[2]
if (!target) throw new Error('Specify a temporary fixture directory.')

function crc32(buffer) {
  let crc = -1
  for (const byte of buffer) {
    crc ^= byte
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ -1) >>> 0
}

function pngChunk(type, data) {
  const name = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([length, name, data, checksum])
}

function syntheticCover(variant) {
  const size = 64
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 6
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4)
    for (let x = 0; x < size; x++) {
      const offset = 1 + x * 4
      row[offset] = variant === 'v2' ? 115 + x : 20 + x * 2
      row[offset + 1] = variant === 'v2' ? 35 + y * 2 : 65 + y * 2
      row[offset + 2] = variant === 'v2' ? 110 + Math.floor((x + y) / 3) : 150 + Math.floor((x + y) / 4)
      row[offset + 3] = 255
    }
    rows.push(row)
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(Buffer.concat(rows))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

const directory = resolve(target)
const variant = process.argv[4] === 'v2' ? 'v2' : 'v1'
await mkdir(directory, { recursive: true })
await writeFile(resolve(directory, 'go-2-qa-cover.png'), syntheticCover(variant))
const encode = promisify(execFile)
const ffmpeg = process.argv[3] || 'ffmpeg'
await encode(ffmpeg, [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'lavfi', '-i', `sine=frequency=${variant === 'v2' ? 660 : 440}:sample_rate=44100:duration=${variant === 'v2' ? 4 : 1}`,
  '-filter:a', 'volume=0.04', '-codec:a', 'libmp3lame', '-b:a', '64k',
  resolve(directory, 'go-2-qa-lobby.mp3'),
])
console.log(`Synthetic media fixtures ready in ${directory}`)
