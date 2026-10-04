import { ProductHeader } from '../components/ProductHeader.jsx'
import { AgentGoHeader } from '../go-product/AgentGoHeader.jsx'
import { useGoIdentity } from '../go-product/useGoIdentity.js'
import '../go-product/goProduct.css'

export function AcademyHeader() {
  const identity = useGoIdentity()
  return identity.kind === 'agent' ? <AgentGoHeader /> : <ProductHeader />
}
