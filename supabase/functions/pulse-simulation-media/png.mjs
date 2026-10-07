// Static, bounded PNG only. The browser re-encodes raster uploads to remove
// metadata; this independent validator still treats every upload as untrusted.
export const MAX_BYTES = 4_194_304
const signature = [137, 80, 78, 71, 13, 10, 26, 10]
function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
export async function inspectPng(buffer) {
  const bytes = new Uint8Array(buffer), view = new DataView(buffer)
  if (bytes.length < 57 || bytes.length > MAX_BYTES || signature.some((n, i) => bytes[i] !== n)) throw new Error('invalid_png')
  let width, height, channels, ended = false, offset = 8, compressed = [], idatEnded = false
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset), end = offset + 12 + length
    if (end > bytes.length || length > MAX_BYTES) throw new Error('invalid_chunk')
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8))
    if (crc32(bytes.slice(offset + 4, end - 4)) !== view.getUint32(end - 4)) throw new Error('invalid_crc')
    if (offset === 8 && type !== 'IHDR') throw new Error('missing_header')
    if (type === 'IHDR') {
      if (width || length !== 13) throw new Error('invalid_header')
      width = view.getUint32(offset + 8); height = view.getUint32(offset + 12)
      const color = bytes[offset + 17]
      if (!width || !height || width > 4096 || height > 4096 || width * height > 4_194_304 ||
          bytes[offset + 16] !== 8 || ![2, 6].includes(color) || bytes[offset + 18] || bytes[offset + 19] || bytes[offset + 20]) throw new Error('unsupported_png')
      channels = color === 6 ? 4 : 3
    } else if (type === 'IDAT') {
      if (!width || idatEnded || !length) throw new Error('invalid_data')
      compressed.push(bytes.slice(offset + 8, end - 4))
    } else if (type === 'IEND') {
      if (length || !compressed.length || end !== bytes.length) throw new Error('invalid_end')
      ended = true; break
    } else {
      if (compressed.length) idatEnded = true
      if (!['sRGB', 'gAMA', 'cHRM', 'pHYs'].includes(type)) throw new Error('unsupported_chunk')
    }
    offset = end
  }
  if (!ended) throw new Error('missing_end')
  const reader = new Blob(compressed).stream().pipeThrough(new DecompressionStream('deflate')).getReader()
  const stride = width * channels + 1, expected = stride * height
  let count = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (count + value.length > expected) throw new Error('oversized_pixels')
      for (let i = (stride - count % stride) % stride; i < value.length; i += stride) if (value[i] > 4) throw new Error('invalid_filter')
      count += value.length
    }
  } finally { await reader.cancel() }
  if (count !== expected) throw new Error('truncated_pixels')
  return { width, height }
}
