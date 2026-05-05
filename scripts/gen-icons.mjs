// Generates public/icon-192.png and public/icon-512.png using pure Node.js
// Design: dark navy background (#1a1a2e) with a white timer ring
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'

const crc32Table = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = crc32Table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function makePNG(size, drawFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB color type

  const rowLen = 1 + size * 3
  const raw = Buffer.alloc(size * rowLen)

  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0  // filter: None
    for (let x = 0; x < size; x++) {
      const [r, g, b] = drawFn(x, y, size)
      const off = y * rowLen + 1 + x * 3
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b
    }
  }

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflateSync(raw)),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

function iconPixel(x, y, size) {
  const cx = size / 2, cy = size / 2
  const outerR = size * 0.38
  const innerR = size * 0.28
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)

  // White ring (timer circle)
  if (dist >= innerR && dist <= outerR) {
    // Soft anti-alias at edges
    const edgeDist = Math.min(Math.abs(dist - innerR), Math.abs(dist - outerR))
    const aa = Math.min(1, edgeDist / 1.5)
    const v = Math.round(200 + aa * 55)
    return [v, v, v]
  }

  // Small accent dot at center
  if (dist < size * 0.055) {
    return [160, 130, 255]  // soft purple
  }

  // Dark navy background
  return [26, 26, 46]
}

mkdirSync('public', { recursive: true })
writeFileSync('public/icon-192.png', makePNG(192, iconPixel))
writeFileSync('public/icon-512.png', makePNG(512, iconPixel))
console.log('Icons generated: public/icon-192.png, public/icon-512.png')
