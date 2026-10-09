import { Component } from 'react'
import { useLocation } from 'react-router-dom'

import { useGoAccess } from '../go-product/useGoAccess.js'
import { useGoIdentity } from '../go-product/useGoIdentity.js'
import { PulsePet } from './PulsePet.jsx'
import { petActions, petRouteMode } from './petModel.js'
import { usePetVisibility } from './usePetVisibility.js'

class PetBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

function AccountPet() {
  const identity = useGoIdentity()
  const access = useGoAccess()
  const { pathname } = useLocation()
  const [visible] = usePetVisibility()
  const mode = petRouteMode(pathname, identity.kind)
  if (identity.loading || !mode || !visible) return null
  return <PulsePet key={identity.kind} actions={petActions(identity.kind, access.capabilities)} mode={mode} pathname={pathname} />
}

export function PulsePetLayer() {
  // A failed optional mascot must never replace or interrupt a product page.
  return <PetBoundary><AccountPet /></PetBoundary>
}
