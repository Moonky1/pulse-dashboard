import { ProductHeader } from '../../components/ProductHeader.jsx'
import { DashboardView } from '../../dashboard/DashboardView.jsx'
import { supabase } from '../../utils/supabase.js'

export function ProductDashboardPage() {
  return <div className="pulse-product-surface"><ProductHeader /><DashboardView client={supabase} /></div>
}
