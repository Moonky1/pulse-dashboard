import { usePetVisibility } from './usePetVisibility.js'

export function PetVisibilityButton() {
  const [visible, setVisible] = usePetVisibility()
  return <button className="pulse-product-account__pet-toggle" type="button" aria-pressed={visible}
    onClick={() => setVisible(!visible)}>{visible ? 'Hide Pet' : 'Show Pet'}<span aria-hidden="true">{visible ? '◉' : '○'}</span></button>
}
