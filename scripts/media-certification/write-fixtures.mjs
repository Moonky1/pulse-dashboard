import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
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

function syntheticCover() {
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
      row[offset] = 20 + x * 2
      row[offset + 1] = 65 + y * 2
      row[offset + 2] = 150 + Math.floor((x + y) / 4)
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

function silentMp3() {
  // Synthetic MPEG-1 Layer III silent frames; no sampled or third-party music.
  const frame = Buffer.alloc(417)
  frame.set([0xff, 0xfb, 0x90, 0x64])
  return Buffer.concat(Array.from({ length: 40 }, () => frame))
}

const directory = resolve(target)
await mkdir(directory, { recursive: true })
await writeFile(resolve(directory, 'go-2-qa-cover.png'), syntheticCover())
await writeFile(resolve(directory, 'go-2-qa-lobby.mp3'), silentMp3())
console.log(`Synthetic media fixtures ready in ${directory}`)
