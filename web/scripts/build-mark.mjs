/**
 * Build a square brand mark from the supplied artwork.
 *
 *   node scripts/build-mark.mjs
 *
 * The source is a wide image containing a rounded tile, and inside that tile the
 * emblem sits above a "DAILY PRIORITY" wordmark. Two problems for an app icon:
 *
 *  - The wordmark has to go. At 48dp it is an illegible smudge, and both Android
 *    and iOS already render the app name directly under the icon, so it is
 *    duplicated *and* it steals the area the emblem needs.
 *  - No square crop of the tile can both centre the emblem and exclude the
 *    wordmark — the emblem is deliberately placed high to leave room for text
 *    below it. Measured: emblem centre is at y=677, the wordmark begins at
 *    y≈1000, and the tile top is y=154. The largest centred square that clears
 *    the text is 646px, which is narrower than the emblem itself (705px) and
 *    would slice its points off.
 *
 * So the background is rebuilt rather than cropped. The tile's backdrop is a
 * vertical gradient, sampled here at two anchor rows; the synthetic gradient is
 * fitted through those anchors so the composited crop meets it at exactly its own
 * colour. That is what keeps the join invisible — matching the gradient at the
 * seam rather than guessing a flat green.
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const SRC = 'public/brand/source-original.png'
const OUT = 'public/brand/mark.png'
const OUT_MASKABLE = 'public/brand/mark-maskable.png'
await mkdir('public/brand', { recursive: true })

// Measured from the source; see the note above for how.
const TILE = { x0: 808, x1: 2009 }
// Inset past the tile's rounded corners. Cropping the full width dragged the
// white outside the corner radius into the icon as wedges at the left and right
// edges.
const INSET = 70
const CROP = { top: 260, bottom: 1000 } // below the tile's soft top edge, above the wordmark
const EMBLEM_CENTRE_Y = 677

const cropW = TILE.x1 - TILE.x0 - INSET * 2 // spans the canvas, so the only seams are horizontal
const cropH = CROP.bottom - CROP.top // 740
const SIDE = cropW // square canvas at the tile's own width

/**
 * Backdrop colour at a row, sampled from a narrow strip of plain background.
 *
 * Averaging the whole row was wrong: the tile carries a radial glow behind the
 * emblem, so a full-width mean comes out far lighter than the actual backdrop
 * (rgb(35,130,91) against a true rgb(21,94,74)) and the fitted gradient met the
 * crop as a visible line. This samples a column band left of the emblem, which
 * is flat backdrop.
 */
const SAMPLE_X = TILE.x0 + INSET + 40
async function bgColour(y) {
  const { data, info } = await sharp(SRC)
    .extract({ left: SAMPLE_X, top: y, width: 60, height: 6 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let r = 0, g = 0, b = 0, n = 0
  for (let i = 0; i < data.length; i += info.channels) {
    const [pr, pg, pb] = [data[i], data[i + 1], data[i + 2]]
    if (Math.max(pr, pg, pb) > 235 && Math.max(pr, pg, pb) - Math.min(pr, pg, pb) < 14) continue
    r += pr; g += pg; b += pb; n++
  }
  return n ? [r / n, g / n, b / n] : [0, 0, 0]
}

const topAnchor = await bgColour(CROP.top + 2)
const bottomAnchor = await bgColour(CROP.bottom - 8)

// Place the crop so the emblem lands on the canvas centre.
const emblemInCrop = EMBLEM_CENTRE_Y - CROP.top
const offsetY = Math.round(SIDE / 2 - emblemInCrop)

// Fit the gradient through the two seam rows, then extrapolate to the edges so
// the transition continues rather than stopping at the crop.
const slope = [0, 1, 2].map(i => (bottomAnchor[i] - topAnchor[i]) / cropH)
const at = y => [0, 1, 2].map(i =>
  Math.max(0, Math.min(255, Math.round(topAnchor[i] + slope[i] * (y - offsetY))))
)
const top = at(0)
const bottom = at(SIDE)

console.log(`crop        ${cropW}x${cropH} from y ${CROP.top}-${CROP.bottom}`)
console.log(`seam colours top rgb(${topAnchor.map(Math.round)}) bottom rgb(${bottomAnchor.map(Math.round)})`)
console.log(`canvas      ${SIDE}x${SIDE}, crop at y=${offsetY}`)
console.log(`gradient    rgb(${top}) -> rgb(${bottom})`)

const gradient = Buffer.from(
  `<svg width="${SIDE}" height="${SIDE}">
     <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="rgb(${top})"/>
       <stop offset="1" stop-color="rgb(${bottom})"/>
     </linearGradient></defs>
     <rect width="${SIDE}" height="${SIDE}" fill="url(#g)"/>
   </svg>`
)

const crop = await sharp(SRC)
  .extract({ left: TILE.x0 + INSET, top: CROP.top, width: cropW, height: cropH })
  .toBuffer()

await sharp(gradient)
  .composite([{ input: crop, top: offsetY, left: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(OUT)
console.log(`wrote ${OUT}`)

/**
 * Maskable variant: the same build on a roomier canvas.
 *
 * Android re-crops a maskable icon to whatever shape the launcher uses, and only
 * the central 66% is guaranteed to survive. In the tight mark the star's points
 * reach roughly 86% of the width, so a circular mask would clip them. Rather
 * than shrink the finished mark inside a flat field — which shows as a square
 * edge against the gradient — the crop goes on a larger canvas and the same
 * fitted gradient fills the extra room, so it stays seamless.
 */
// Only as much padding as the safe zone needs. The emblem is 705px wide, so a
// canvas of 705/0.66 ≈ 1068 already satisfies it; 1.10 lands at ~1167 (emblem at
// 60%) with a comfortable margin. Wider padding meant more synthetic fill beside
// the crop, and the source's faint background pattern makes that join visible.
const PAD = 1.10
const mSide = Math.round(SIDE * PAD)
const mLeft = Math.round((mSide - cropW) / 2)
const mOffsetY = Math.round(mSide / 2 - emblemInCrop)
const mAt = y =>
  [0, 1, 2].map(i =>
    Math.max(0, Math.min(255, Math.round(topAnchor[i] + slope[i] * (y - mOffsetY))))
  )

// The crop no longer spans the canvas, so left and right need filling too. The
// backdrop is a vertical gradient, so the same gradient painted full-width meets
// the crop's own edges at every row.
const mGradient = Buffer.from(
  `<svg width="${mSide}" height="${mSide}">
     <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="rgb(${mAt(0)})"/>
       <stop offset="1" stop-color="rgb(${mAt(mSide)})"/>
     </linearGradient></defs>
     <rect width="${mSide}" height="${mSide}" fill="url(#g)"/>
   </svg>`
)

await sharp(mGradient)
  .composite([{ input: crop, top: mOffsetY, left: mLeft }])
  .png({ compressionLevel: 9 })
  .toFile(OUT_MASKABLE)

console.log(
  `wrote ${OUT_MASKABLE}  ${mSide}x${mSide} ` +
    `(emblem ~${((705 / mSide) * 100).toFixed(0)}% of width — inside the 66% safe zone)`
)
