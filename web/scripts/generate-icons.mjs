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

/**
 * The source is expected to be an already-square mark, as produced by
 * build-mark.mjs. It is not trimmed: the mark's backdrop is a gradient that runs
 * to the edge, and trimming would shave that edge off and leave the icon a
 * slightly different size each run.
 */
async function squareMark() {
  const { width = 0, height = 0 } = await sharp(source).metadata()
  if (Math.abs(width - height) > 2) {
    console.error(`Source is ${width}x${height}; expected a square. Run build-mark.mjs first.`)
    process.exit(1)
  }
  return sharp(source).png().toBuffer()
}

const mark = await squareMark()
await sharp(mark).png().toFile(path.join(BRAND, 'mark.png'))

const meta = await sharp(mark).metadata()
console.log(`mark: ${meta.width}x${meta.height} (square)`)

/** Plain icons: the mark, edge to edge. */
for (const size of [1024, 512, 192, 180]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`
  await sharp(mark)
    .resize(size, size)
    .png({ compressionLevel: 9, quality: 90, effort: 10 })
    .toFile(path.join(OUT, name))
  console.log(`  ${name.padEnd(24)} ${size}x${size}`)
}

/**
 * Favicons get a tighter crop.
 *
 * The emblem carries a lot of fine detail — a geometric lattice, a checklist —
 * and at 32px the whole thing resolves to a green smudge. Zooming to the centre
 * gives up the star's outer points in exchange for a crescent and arrow that are
 * actually identifiable in a browser tab, which is the only job at this size.
 */
const zoom = 0.62
const inset = Math.round((meta.width * (1 - zoom)) / 2)
const zoomed = await sharp(mark)
  .extract({
    left: inset,
    top: inset,
    width: meta.width - inset * 2,
    height: meta.height - inset * 2,
  })
  .toBuffer()

for (const size of [32, 16]) {
  await sharp(zoomed)
    .resize(size, size)
    .png({ compressionLevel: 9, quality: 90, effort: 10 })
    .toFile(path.join(OUT, `favicon-${size}.png`))
  console.log(`  favicon-${size}.png`.padEnd(26) + `${size}x${size} (centre crop at ${Math.round(zoom * 100)}%)`)
}

/**
 * Maskable: full-bleed background with the mark at 66% of the canvas.
 *
 * 66% is the Android "safe zone" — the region guaranteed to survive every
 * launcher mask. Anything outside it can be clipped, which is how corners of a
 * geometric mark get sliced off.
 */
const maskableSource = 'public/brand/mark-maskable.png'
try {
  await access(maskableSource)
} catch {
  console.error(`Missing ${maskableSource} — run build-mark.mjs first.`)
  process.exit(1)
}
for (const size of [512, 192]) {
  await sharp(maskableSource)
    .resize(size, size)
    .png({ compressionLevel: 9, quality: 90, effort: 10 })
    .toFile(path.join(OUT, `icon-maskable-${size}.png`))
  console.log(`  icon-maskable-${size}.png`.padEnd(26) + `${size}x${size}`)
}

/** Play Store feature graphic: 1024x500, mark centred on the brand colour. */
const feature = await sharp(mark).resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
await sharp({ create: { width: 1024, height: 500, channels: 4, background: { r: 6, g: 41, b: 43, alpha: 1 } } })
  .composite([{ input: feature, gravity: 'center' }])
  .png({ compressionLevel: 9, quality: 90, effort: 10 })
  .toFile(path.join(BRAND, 'feature-graphic-1024x500.png'))
console.log('  brand/feature-graphic-1024x500.png')

console.log('\nDone. Play Store needs: icon-512.png and brand/feature-graphic-1024x500.png')
