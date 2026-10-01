import certification from '../../public/emojis/certification.webp'
import classic from '../../public/emojis/classic.webp'
import easy from '../../public/emojis/easy.webp'
import medium from '../../public/emojis/medium.webp'
import advanced from '../../public/emojis/advanced.webp'
import goal from '../../public/emojis/goal.webp'
import goal1 from '../../public/emojis/goal1.webp'
import goal2 from '../../public/emojis/goal2.webp'
import medal1 from '../../public/emojis/medal1.webp'
import medal2 from '../../public/emojis/medal2.webp'
import medal3 from '../../public/emojis/medal3.webp'
import points from '../../public/emojis/points.webp'
import valid from '../../public/emojis/valid.webp'
import zero2 from '../../public/emojis/zero2.webp'

export const GO_ART = Object.freeze({
  certification,
  classic,
  easy,
  medium,
  advanced,
  goal,
  goal1,
  goal2,
  medal1,
  medal2,
  medal3,
  points,
  valid,
  zero2,
})

export function resolveGoArt(path) {
  const filename = String(path || '').split('/').pop()?.replace(/\.webp$/, '')
  return GO_ART[filename] || path
}
