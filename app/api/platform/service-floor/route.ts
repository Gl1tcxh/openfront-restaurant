import { NextResponse } from 'next/server'
import { keystoneContext } from '@/features/keystone/context'

export async function GET() {
  try {
    const [tables, activeOrders] = await Promise.all([
      keystoneContext.sudo().query.Table.findMany({
        orderBy: { tableNumber: 'asc' },
        query: 'id tableNumber capacity status',
      }),
      keystoneContext.sudo().query.RestaurantOrder.findMany({
        where: {
          orderType: { equals: 'dine_in' },
          status: { in: ['open', 'sent_to_kitchen', 'in_progress', 'ready', 'served'] },
        },
        orderBy: { createdAt: 'desc' },
        query: 'id orderNumber status total guestCount createdAt tables { id tableNumber }',
      }),
    ])

    const summary = {
      tables: tables.length,
      available: tables.filter((t: any) => t.status === 'available').length,
      occupied: tables.filter((t: any) => t.status === 'occupied').length,
      activeChecks: activeOrders.length,
    }

    return NextResponse.json({ summary, tables, activeOrders })
  } catch (error) {
    console.error('Service floor API error:', error)
    return NextResponse.json({ error: 'Failed to load service floor data' }, { status: 500 })
  }
}
