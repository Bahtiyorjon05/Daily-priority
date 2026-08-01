import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/admin-auth'
import { ADMIN_MODELS } from '@/lib/admin-models'
import AdminDashboard from './AdminDashboard'

// Always render fresh — this is live database data.
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const admin = await verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)
  if (!admin) {
    redirect('/admin/login')
  }

  return <AdminDashboard username={admin} models={ADMIN_MODELS} />
}
