import React from 'react'
import { PageContainer } from '@/features/dashboard/components/PageContainer'
import { ServiceFloorClient } from './ServiceFloorClient'

export async function ServiceFloorPage() {
  const header = (
    <div className="flex flex-col">
      <h1 className="text-lg font-semibold md:text-2xl">Dine-In Service Floor</h1>
      <p className="text-muted-foreground">Table-first waiter workflow for in-house service</p>
    </div>
  )

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: '/dashboard' },
    { type: 'page' as const, label: 'Platform' },
    { type: 'page' as const, label: 'Service Floor' },
  ]

  return (
    <PageContainer title="Dine-In Service Floor" header={header} breadcrumbs={breadcrumbs}>
      <ServiceFloorClient />
    </PageContainer>
  )
}

export default ServiceFloorPage
