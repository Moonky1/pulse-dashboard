import { writeFileSync } from 'node:fs'
import { encodePcmWav, CLIP_SAMPLE_RATE } from '../../src/training/audioClip.js'

const output = process.argv[2]
if (!output) throw new Error('Provide an output path for the synthetic test audio.')
const samples = new Float32Array(CLIP_SAMPLE_RATE * 8)
for (let index = 0; index < samples.length; index += 1) {
  const t = index / CLIP_SAMPLE_RATE
  const frequency = t < 4 ? 440 : 660
  samples[index] = Math.sin(t * frequency * Math.PI * 2) * 0.12
}
writeFileSync(output, Buffer.from(encodePcmWav(samples)))
