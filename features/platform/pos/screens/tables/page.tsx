import React from 'react'
import { PageContainer } from '@/features/dashboard/components/PageContainer'
import { FloorPlanClient } from './FloorPlanClient'

export async function FloorPlanPage() {
  const header = (
    <div className="flex flex-col">
      <h1 className="text-lg font-semibold md:text-2xl">Floor Plan</h1>
      <p className="text-muted-foreground">Manage table status and seating</p>
    </div>
  )

  const breadcrumbs = [
    { type: 'page' as const, label: 'Dashboard', href: '/dashboard' },
    { type: 'page' as const, label: 'POS', href: '/dashboard/pos' },
    { type: 'page' as const, label: 'Tables' }
  ]

  return (
    <PageContainer title="Floor Plan" header={header} breadcrumbs={breadcrumbs}>
      <FloorPlanClient />
    </PageContainer>
  )
}

export default FloorPlanPage
