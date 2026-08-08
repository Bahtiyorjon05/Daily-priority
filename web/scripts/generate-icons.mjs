/**
 * Generate every icon the app and the Play Store need, from one source image.
 *
 *   node scripts/generate-icons.mjs public/brand/source.png
 *
 * Why the source gets cropped rather than just resized:
 *
 *  - App icons must be square. A wide source (logo + wordmark side by side)
 *    would letterbox, leaving the mark tiny inside empty bars.
 *  - Baked-in text is dead weight. At 48dp on a home screen "DAILY PRIORITY"
 *    is an illegible smudge, and both Android and iOS already render the app
 *    name directly beneath the icon — so it is duplicated *and* it steals the
 *    area the mark needs. We keep the mark only.
 *  - Maskable icons are re-cropped by Android to whatever shape the launcher
 *    uses (circle, squircle, rounded square). A source that already has its own
 *    rounded corners gets rounded twice, which reads as a mistake. Maskable
 *    output is therefore full-bleed colour with the mark inset to the safe zone.
 */
import sharp from 'sharp'
import { mkdir, access } from 'node:fs/promises'
import path from 'node:path'

const source = process.argv[2]
if (!source) {
  console.error('Usage: node scripts/generate-icons.mjs <source-image>')
  process.exit(1)
}

try {
  await access(source)
} catch {
  console.error(`Source not found: ${source}`)
  process.exit(1)
}

const OUT = 'public'
const BRAND = 'public/brand'
await mkdir(BRAND, { recursive: true })

/** Trim the flat surround, then pad back to a square on the mark's own centre. */
async function squareMark() {
  const trimmed = await sharp(source)
    // Drops the uniform border (the white card the mark sits on).
    .trim({ threshold: 12 })
    .toBuffer()

  const { width = 0, height = 0 } = await sharp(trimmed).metadata()
  const side = Math.max(width, height)

  return sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: trimmed, gravity: 'center' }])
    .png()
    .toBuffer()
}

const mark = await squareMark()
await sharp(mark).png().toFile(path.join(BRAND, 'mark.png'))

const meta = await sharp(mark).metadata()
console.log(`mark: ${meta.width}x${meta.height} (square)`)

/** Plain icons: the mark, edge to edge. */
for (const size of [1024, 512, 192, 180, 32, 16]) {
  const name =
    size === 180 ? 'apple-touch-icon.png' : size <= 32 ? `favicon-${size}.png` : `icon-${size}.png`
  await sharp(mark).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, name))
  console.log(`  ${name.padEnd(24)} ${size}x${size}`)
}

/**
 * Maskable: full-bleed background with the mark at 66% of the canvas.
 *
 * 66% is the Android "safe zone" — the region guaranteed to survive every
 * launcher mask. Anything outside it can be clipped, which is how corners of a
 * geometric mark get sliced off.
 */
const BG = { r: 6, g: 78, b: 59, alpha: 1 } // emerald-900, matches the source tile
for (const size of [512, 192]) {
  const inner = Math.round(size * 0.66)
  const resized = await sharp(mark).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: resized, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, `icon-maskable-${size}.png`))
  console.log(`  icon-maskable-${size}.png`.padEnd(26) + `${size}x${size} (mark at ${inner}px)`)
}

/** Play Store feature graphic: 1024x500, mark centred on the brand colour. */
const feature = await sharp(mark).resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
await sharp({ create: { width: 1024, height: 500, channels: 4, background: BG } })
  .composite([{ input: feature, gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(BRAND, 'feature-graphic-1024x500.png'))
console.log('  brand/feature-graphic-1024x500.png')

console.log('\nDone. Play Store needs: icon-512.png and brand/feature-graphic-1024x500.png')
