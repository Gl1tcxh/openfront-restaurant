'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { gql, request } from 'graphql-request'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

const STATIONS = [
  { id: 'all', label: 'All Orders' },
  { id: 'appetizers', label: 'Appetizers' },
  { id: 'mains', label: 'Grill/Mains' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'drinks', label: 'Bar' },
]

type StatusFilter = 'all' | 'in-progress' | 'ready' | 'urgent' | 'on-hold'
type DiningFilter = 'all' | 'dine_in' | 'takeout' | 'delivery'

type KdsOrderItem = {
  id: string
  name: string
  notes?: string | null
}

type KdsOrder = {
  id: string
  table: string
  guests: number
  type: 'dine-in' | 'takeout' | 'delivery'
  status: 'open' | 'sent_to_kitchen' | 'in_progress' | 'ready' | 'served' | 'completed' | 'cancelled'
  timeSent: number
  isUrgent: boolean
  isOnHold: boolean
  items: KdsOrderItem[]
}

const GET_KITCHEN_ORDERS = gql`
  query GetKitchenOrders {
    restaurantOrders(
      where: { status: { in: ["open", "in_progress", "sent_to_kitchen", "ready"] } }
      orderBy: { createdAt: asc }
    ) {
      id
      orderNumber
      orderType
      status
      guestCount
      createdAt
      onHold
      isUrgent
      specialInstructions
      tables { id tableNumber }
      courses(orderBy: { courseNumber: asc }) {
        id
        courseType
        status
        onHold
        orderItems {
          id
          quantity
          specialInstructions
          sentToKitchen
          menuItem { id name kitchenStation prepTime available }
        }
      }
    }
  }
`

const FIRE_COURSE = gql`
  mutation FireCourse($courseId: String!) {
    fireCourse(courseId: $courseId) { success error }
  }
`

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $data: RestaurantOrderUpdateInput!) {
    updateRestaurantOrder(where: { id: $id }, data: $data) { id status }
  }
`

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return ''
  const diffMins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
  return diffMins === 0 ? 'Just now' : `${diffMins}m`
}

function KDSHeader({
  orders,
  time,
  activeStatus,
  onStatusChange,
  totalCounts,
}: {
  orders: any[]
  time: string
  activeStatus: StatusFilter
  onStatusChange: (status: StatusFilter) => void
  totalCounts: {
    active: number
    inProgress: number
    ready: number
    urgent: number
    onHold: number
  }
}) {
  const {
    active: activeCount,
    inProgress: inProgressCount,
    ready: readyCount,
    urgent: urgentCount,
    onHold: onHoldCount,
  } = totalCounts

  const badges = [
    { id: 'all' as const, label: 'Active Orders', count: activeCount },
    { id: 'in-progress' as const, label: 'In Progress', count: inProgressCount },
    { id: 'ready' as const, label: 'Ready', count: readyCount, color: 'text-emerald-600' },
  ]

  return (
    <header className="bg-secondary border-b-2 border-border">
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">
              Kitchen Display System
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-2">Expediter Station</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-3xl md:text-5xl font-bold text-foreground tracking-tighter">
              {time}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-2 tracking-widest uppercase">
              System Time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <button
              key={badge.id}
              onClick={() => onStatusChange(badge.id)}
              className={`
                rounded border p-4 transition-all duration-200
                ${
                  activeStatus === badge.id
                    ? 'border-blue-500 border-2 bg-card'
                    : 'border-border bg-card hover:border-border-hover'
                }
              `}
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                {badge.label}
              </p>
              <p className={`text-3xl font-bold ${badge.color || 'text-foreground'}`}>
                {badge.count}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onStatusChange('urgent')}
            className={`flex items-center gap-2 rounded-md border border-dashed px-3 py-1 text-[10px] md:text-xs uppercase tracking-widest transition-colors ${
              activeStatus === 'urgent'
                ? 'border-orange-500 bg-orange-500/10 text-orange-700'
                : 'border-border text-muted-foreground hover:text-orange-600'
            }`}
          >
            Urgent
            <Badge variant="secondary" className="text-[10px]">{urgentCount}</Badge>
          </button>
          <button
            onClick={() => onStatusChange('on-hold')}
            className={`flex items-center gap-2 rounded-md border border-dashed px-3 py-1 text-[10px] md:text-xs uppercase tracking-widest transition-colors ${
              activeStatus === 'on-hold'
                ? 'border-rose-500 bg-rose-500/10 text-rose-700'
                : 'border-border text-muted-foreground hover:text-rose-600'
            }`}
          >
            On Hold
            <Badge variant="secondary" className="text-[10px]">{onHoldCount}</Badge>
          </button>
        </div>
      </div>
    </header>
  )
}

function StationTabs({
  activeStation,
  onStationChange,
}: {
  activeStation: string
  onStationChange: (stationId: string) => void
}) {
  return (
    <div className="border-b border-border bg-secondary">
      <div className="px-8 flex items-center gap-1 overflow-x-auto">
        {STATIONS.map((station) => (
          <button
            key={station.id}
            onClick={() => onStationChange(station.id)}
            className={`
              px-6 py-4 text-sm font-medium whitespace-nowrap tracking-wide
              border-b-2 transition-all
              ${
                activeStation === station.id
                  ? 'border-b-foreground text-foreground'
                  : 'border-b-transparent text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {station.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function OrderCard({ order }: { order: KdsOrder }) {
  const elapsed = Math.floor((Date.now() - order.timeSent) / 60000)
  const elapsedText = elapsed === 0 ? 'Just now' : `${elapsed}m`

  return (
    <div
      className={`
        rounded-lg border p-4 transition-all duration-200
        ${order.isUrgent
          ? 'border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/20'
          : order.isOnHold
            ? 'border-yellow-500/40 bg-yellow-500/5'
            : 'border-border bg-secondary'
        }
      `}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-lg font-light tracking-wide text-foreground">
              Table {order.table}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {order.guests} guest{order.guests !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-light text-muted-foreground tracking-wide">
              {elapsedText}
            </div>
            {order.isUrgent && (
              <div className="text-xs font-medium text-orange-600 mt-1">URGENT</div>
            )}
            {order.isOnHold && (
              <div className="text-xs font-medium text-yellow-700 mt-1">HOLD</div>
            )}
          </div>
        </div>

        <div className="inline-block text-xs tracking-widest uppercase font-light text-muted-foreground">
          {order.type.replace('-', ' ')}
        </div>

        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="text-sm">
              <div className="font-light text-foreground">{item.name}</div>
              {item.notes && (
                <div className="text-xs text-muted-foreground italic mt-1">
                  {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StationView({ name, orders }: { name: string; orders: KdsOrder[] }) {
  const urgentCount = orders.filter((o) => o.isUrgent).length

  return (
    <section className="flex flex-col h-full">
      <div className="border-b border-border pb-4 mb-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-light tracking-wide">{name}</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
            {urgentCount > 0 && (
              <span className="text-sm font-medium text-orange-600">
                {urgentCount} urgent
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No active orders</p>
          </div>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </section>
  )
}

export function KDSClient() {
  const [data, setData] = useState({ orders: [] })
  const [loading, setLoading] = useState(true)
  const [activeStation, setActiveStation] = useState('all')
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all')
  const [activeDining, setActiveDining] = useState<DiningFilter>('all')

  const fetchKDS = async () => {
    try {
      const res: any = await request('/api/graphql', GET_KITCHEN_ORDERS)
      setData({ orders: res.restaurantOrders || [] })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKDS()
    const i = setInterval(fetchKDS, 10000)
    return () => clearInterval(i)
  }, [])

  const fireCourse = async (courseId: string) => {
    try {
      await request('/api/graphql', FIRE_COURSE, { courseId })
      fetchKDS()
    } catch (err) {
      console.error(err)
    }
  }

  const advanceStatus = async (orderId: string, status: string) => {
    try {
      await request('/api/graphql', UPDATE_ORDER_STATUS, { id: orderId, data: { status } })
      fetchKDS()
    } catch (err) {
      console.error(err)
    }
  }

  const filteredOrders = useMemo(() => {
    let orders = data.orders
    if (activeStatus === 'urgent') orders = orders.filter((o: any) => o.isUrgent)
    if (activeStatus === 'on-hold') orders = orders.filter((o: any) => o.onHold)
    if (activeStatus === 'ready') orders = orders.filter((o: any) => o.status === 'ready')
    if (activeStatus === 'in-progress') orders = orders.filter((o: any) => ['sent_to_kitchen', 'in_progress'].includes(o.status))
    if (activeDining !== 'all') orders = orders.filter((o: any) => o.orderType === activeDining)
    return orders
  }, [data.orders, activeStatus, activeDining])

  const totalCounts = useMemo(() => {
    const counts = {
      active: data.orders.length,
      inProgress: 0,
      ready: 0,
      urgent: 0,
      onHold: 0,
    }
    data.orders.forEach((order: any) => {
      if (order.isUrgent) counts.urgent += 1
      if (order.onHold) counts.onHold += 1
      if (order.status === 'ready') counts.ready += 1
      if (['sent_to_kitchen', 'in_progress'].includes(order.status)) counts.inProgress += 1
    })
    return counts
  }, [data.orders])

  const mappedOrders = useMemo(() => {
    return filteredOrders.map((order: any) => {
      const table = order.tables?.length ? order.tables.map((t: any) => t.tableNumber).join(', ') : '—'

      const items = order.courses.flatMap((course: any) =>
        course.orderItems.map((item: any) => ({
          id: item.id,
          name: `${item.quantity}x ${item.menuItem?.name || 'Item'}`,
          notes: item.specialInstructions || null,
          course: course.courseType,
        }))
      )

      return {
        id: order.id,
        table,
        guests: order.guestCount,
        type: order.orderType.replace('_', '-') as KdsOrder['type'],
        status: order.status,
        timeSent: new Date(order.createdAt).getTime(),
        isUrgent: order.isUrgent,
        isOnHold: order.onHold,
        items,
      }
    })
  }, [filteredOrders])

  const stationFilteredOrders = useMemo(() => {
    if (activeStation === 'all') return mappedOrders
    return mappedOrders.map((order) => ({
      ...order,
      items: order.items.filter((item: any) => item.course === activeStation),
    })).filter((order) => order.items.length > 0)
  }, [mappedOrders, activeStation])

  const nowTime = useMemo(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), [])

  if (loading && data.orders.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <RefreshCw className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <KDSHeader
        orders={filteredOrders}
        time={nowTime}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        totalCounts={totalCounts}
      />

      <StationTabs activeStation={activeStation} onStationChange={setActiveStation} />

      <div className="px-8 py-4 flex flex-wrap gap-2">
        {([
          { id: 'all', label: 'All Dining' },
          { id: 'dine_in', label: 'Dine-In' },
          { id: 'takeout', label: 'Takeout' },
          { id: 'delivery', label: 'Delivery' },
        ] as { id: DiningFilter; label: string }[]).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setActiveDining(opt.id)}
            className={`rounded-md border px-3 py-1 text-[10px] md:text-xs uppercase tracking-widest transition-colors ${
              activeDining === opt.id
                ? 'border-foreground bg-secondary text-foreground'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <StationView name="Kitchen Line" orders={stationFilteredOrders} />
          <StationView name="Prep" orders={stationFilteredOrders} />
          <StationView name="Expo" orders={stationFilteredOrders} />
        </div>
      </div>
    </div>
  )
}
