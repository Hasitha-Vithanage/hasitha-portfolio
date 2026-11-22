/**
 * Converts the screenshot masters in design/screenshots (PNG) to WebP for the
 * site, in public/screenshots. Run after adding or replacing a screenshot:
 *
 *   npm run images
 *
 * The masters stay out of /public so they are kept for future edits but never
 * published. Prints each image's size, for the width/height in src/data/projects.ts.
 */
import { mkdir, readdir, stat } from 'node:fs/promises'
import { join, parse } from 'node:path'
import sharp from 'sharp'

const SOURCE = 'design/screenshots'
const OUTPUT = 'public/screenshots'
/** Visually identical to the PNG for interface screenshots, at a fraction of the size. */
const QUALITY = 82

await mkdir(OUTPUT, { recursive: true })
const files = (await readdir(SOURCE)).filter((file) => /\.(png|jpe?g)$/i.test(file))

let before = 0
let after = 0
for (const file of files) {
  const input = join(SOURCE, file)
  const output = join(OUTPUT, `${parse(file).name}.webp`)
  const { width, height } = await sharp(input).webp({ quality: QUALITY, effort: 6 }).toFile(output)
  const [source, result] = await Promise.all([stat(input), stat(output)])
  before += source.size
  after += result.size
  const kb = (bytes) => `${Math.round(bytes / 1024)} KB`
  console.log(`${parse(file).name}.webp  ${width}x${height}  ${kb(source.size)} → ${kb(result.size)}`)
}
console.log(`\n${files.length} images: ${Math.round(before / 1024)} KB → ${Math.round(after / 1024)} KB`)
