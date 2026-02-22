/**
 * Payment Page - Server Component
 * Payment processing interface for POS orders
 */

import React from 'react'
import { PageContainer } from '@/features/dashboard/components/PageContainer'
import { PaymentClient } from './PaymentClient'

interface PaymentPageProps {
  params: Promise<{ orderId: string }>
}

export async function PaymentPage({ params }: PaymentPageProps) {
  const { orderId } = await params

  const header = (
    <div className="flex flex-col">
      <h1 className="text-lg font-semibold md:text-2xl">Payment</h1>
      <p className="text-muted-foreground">Process payment for order</p>
    </div>
  )

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: '/dashboard' },
    { type: 'link' as const, label: 'POS', href: '/dashboard/platform/pos' },
    { type: 'page' as const, label: 'Payment' }
  ]

  return (
    <PageContainer title="Payment" header={header} breadcrumbs={breadcrumbs}>
      <PaymentClient orderId={orderId} />
    </PageContainer>
  )
}

export default PaymentPage
