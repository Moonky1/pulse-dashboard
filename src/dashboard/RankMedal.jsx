import gold from '../../public/emojis/medal1.webp'
import silver from '../../public/emojis/medal2.webp'
import bronze from '../../public/emojis/medal3.webp'

const medals = [gold, silver, bronze]
export function RankMedal({ rank }) {
  return rank >= 1 && rank <= 3
    ? <img className="dash-pixel-medal" src={medals[rank - 1]} width="36" height="36" alt={`Position ${rank}`} />
    : <span>{rank ? `#${rank}` : '—'}</span>
}
