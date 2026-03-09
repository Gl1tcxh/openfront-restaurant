'use client'

import { useEffect, useMemo, useState } from 'react'
import { gql, request } from 'graphql-request'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  RefreshCw,
  Users,
  Clock3,
  UtensilsCrossed,
  Plus,
  Send,
  CreditCard,
  ChefHat,
  GripVertical,
  Split,
  Layers,
  Flame,
  PauseCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/features/storefront/lib/currency'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

interface Table {
  id: string
  tableNumber: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
}

interface ActiveOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  guestCount: number
  createdAt: string
  tables: { id: string; tableNumber: string }[]
  courses: {
    id: string
    courseType: string
    courseNumber: number
    status: 'pending' | 'fired' | 'ready' | 'served'
    onHold: boolean
  }[]
  orderItems: {
    id: string
    quantity: number
    price: number
    seatNumber?: number | null
    menuItem: { id: string; name: string } | null
  }[]
}

interface MenuItem {
  id: string
  name: string
  price: number
  available: boolean
}

const GET_SERVICE_FLOOR = gql`
  query GetServiceFloor {
    tables(orderBy: { tableNumber: asc }) {
      id
      tableNumber
      capacity
      status
    }

    restaurantOrders(
      where: {
        orderType: { equals: "dine_in" }
        status: { in: ["open", "sent_to_kitchen", "in_progress", "ready", "served"] }
      }
      orderBy: { createdAt: desc }
    ) {
      id
      orderNumber
      status
      total
      guestCount
      createdAt
      tables {
        id
        tableNumber
      }
      courses(orderBy: { courseNumber: asc }) {
        id
        courseType
        courseNumber
        status
        onHold
      }
      orderItems {
        id
        quantity
        price
        seatNumber
        menuItem {
          id
          name
        }
      }
    }

    menuItems(where: { available: { equals: true } }, orderBy: { name: asc }) {
      id
      name
      price
      available
    }

    storeSettings {
      currencyCode
      locale
    }
  }
`

const UPDATE_TABLE_STATUS = gql`
  mutation UpdateTableStatus($id: ID!, $status: String!) {
    updateTable(where: { id: $id }, data: { status: $status }) {
      id
      status
    }
  }
`

const CREATE_ORDER = gql`
  mutation CreateOrder($data: RestaurantOrderCreateInput!) {
    createRestaurantOrder(data: $data) {
      id
      orderNumber
      status
    }
  }
`

const CREATE_ORDER_ITEM = gql`
  mutation CreateOrderItem($data: OrderItemCreateInput!) {
    createOrderItem(data: $data) {
      id
    }
  }
`

const GET_ORDER_ITEMS = gql`
  query GetOrderItems($id: ID!) {
    restaurantOrder(where: { id: $id }) {
      id
      orderItems {
        id
        quantity
        price
      }
    }
  }
`

const UPDATE_ORDER_TOTALS = gql`
  mutation UpdateOrderTotals($id: ID!, $data: RestaurantOrderUpdateInput!) {
    updateRestaurantOrder(where: { id: $id }, data: $data) {
      id
      total
      status
    }
  }
`

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $data: RestaurantOrderUpdateInput!) {
    updateRestaurantOrder(where: { id: $id }, data: $data) {
      id
      status
    }
  }
`

const SPLIT_CHECK_BY_GUEST = gql`
  mutation SplitCheckByGuest($orderId: String!, $guestCount: Int!) {
    splitCheckByGuest(orderId: $orderId, guestCount: $guestCount) {
      success
      newOrderIds
      error
    }
  }
`

const SPLIT_CHECK_BY_ITEM = gql`
  mutation SplitCheckByItem($orderId: String!, $itemIds: [String!]!) {
    splitCheckByItem(orderId: $orderId, itemIds: $itemIds) {
      success
      newOrderIds
      error
    }
  }
`

const COMBINE_TABLES = gql`
  mutation CombineTables($orderId: String!, $tableIds: [String!]!) {
    combineTables(orderId: $orderId, tableIds: $tableIds) {
      success
      error
    }
  }
`

const FIRE_COURSE = gql`
  mutation FireCourse($courseId: String!) {
    fireCourse(courseId: $courseId) {
      success
      error
    }
  }
`

const RECALL_COURSE = gql`
  mutation RecallCourse($courseId: String!) {
    recallCourse(courseId: $courseId) {
      success
      error
    }
  }
`

const statusOrder: Array<Table['status']> = ['available', 'occupied', 'reserved', 'cleaning']

const statusLabel: Record<Table['status'], string> = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  cleaning: 'Cleaning',
}

const statusTone: Record<Table['status'], string> = {
  available: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30',
  occupied: 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30',
  reserved: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
  cleaning: 'border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/30',
}

function generateOrderNumber() {
  const now = Date.now().toString(36).toUpperCase()
  return `DIN-${now}`
}

function formatCourseLabel(courseType: string, courseNumber: number) {
  return `${courseType.charAt(0).toUpperCase() + courseType.slice(1)} • C${courseNumber}`
}

function formatStatusLabel(value: string) {
  return value.replace(/_/g, ' ')
}

export function ServiceFloorClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState<Table[]>([])
  const [orders, setOrders] = useState<ActiveOrder[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [currencyConfig, setCurrencyConfig] = useState({ currencyCode: 'USD', locale: 'en-US' })

  const [dragTableId, setDragTableId] = useState<string | null>(null)
  const [updatingTable, setUpdatingTable] = useState<string | null>(null)

  const [openSheet, setOpenSheet] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [addingItem, setAddingItem] = useState(false)
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [sheetSuccess, setSheetSuccess] = useState<string | null>(null)

  const [splitGuests, setSplitGuests] = useState<number>(2)
  const [selectedSplitItemIds, setSelectedSplitItemIds] = useState<string[]>([])
  const [selectedMergeTableIds, setSelectedMergeTableIds] = useState<string[]>([])
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res: any = await request('/api/graphql', GET_SERVICE_FLOOR)
      setTables(res.tables || [])
      setOrders(res.restaurantOrders || [])
      setMenuItems(res.menuItems || [])
      if (res.storeSettings) {
        setCurrencyConfig({
          currencyCode: res.storeSettings.currencyCode || 'USD',
          locale: res.storeSettings.locale || 'en-US'
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const i = setInterval(fetchData, 10000)
    return () => clearInterval(i)
  }, [])

  const orderByTable = useMemo(() => {
    const map: Record<string, ActiveOrder> = {}
    orders.forEach((o) => {
      o.tables?.forEach((t) => {
        map[t.id] = o
      })
    })
    return map
  }, [orders])

  const counts = useMemo(() => {
    return {
      total: tables.length,
      available: tables.filter((t) => t.status === 'available').length,
      occupied: tables.filter((t) => t.status === 'occupied').length,
      activeChecks: orders.length,
    }
  }, [tables, orders])

  const selectedOrder = selectedTable ? orderByTable[selectedTable.id] : null

  useEffect(() => {
    setSelectedSplitItemIds([])
    setSelectedMergeTableIds([])
    setSheetSuccess(null)
    setSheetError(null)
  }, [selectedOrder?.id])

  const mergeCandidates = useMemo(() => {
    if (!selectedOrder) return []
    const selectedTableIds = new Set((selectedOrder.tables || []).map((t) => t.id))
    return tables.filter((t) => !selectedTableIds.has(t.id) && ['occupied', 'reserved'].includes(t.status))
  }, [tables, selectedOrder])

  const pendingCourses = useMemo(
    () => (selectedOrder?.courses || []).filter((c) => c.status === 'pending').sort((a, b) => a.courseNumber - b.courseNumber),
    [selectedOrder]
  )

  const firedCourses = useMemo(
    () => (selectedOrder?.courses || []).filter((c) => c.status === 'fired').sort((a, b) => a.courseNumber - b.courseNumber),
    [selectedOrder]
  )

  const menuItemMap = useMemo(() => {
    const map: Record<string, MenuItem> = {}
    menuItems.forEach((m) => {
      map[m.id] = m
    })
    return map
  }, [menuItems])

  const withAction = async (key: string, fn: () => Promise<void>) => {
    try {
      setProcessingAction(key)
      setSheetError(null)
      setSheetSuccess(null)
      await fn()
    } catch (err: any) {
      setSheetError(err?.message || 'Action failed')
    } finally {
      setProcessingAction(null)
    }
  }

  const updateTableStatus = async (tableId: string, nextStatus: Table['status']) => {
    await withAction(`table:${tableId}`, async () => {
      setUpdatingTable(tableId)
      await request('/api/graphql', UPDATE_TABLE_STATUS, { id: tableId, status: nextStatus })
      await fetchData()
    })
    setUpdatingTable(null)
  }

  const onDropToStatus = async (nextStatus: Table['status']) => {
    if (!dragTableId) return
    const table = tables.find((t) => t.id === dragTableId)
    if (!table || table.status === nextStatus) return
    await updateTableStatus(dragTableId, nextStatus)
    setDragTableId(null)
  }

  const recalcAndPersistOrderTotals = async (orderId: string) => {
    const res: any = await request('/api/graphql', GET_ORDER_ITEMS, { id: orderId })
    const items = res?.restaurantOrder?.orderItems || []
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity || 0) * (item.price || 0), 0)
    const tax = Math.round(subtotal * 0.08)
    const total = subtotal + tax

    await request('/api/graphql', UPDATE_ORDER_TOTALS, {
      id: orderId,
      data: { subtotal, tax, total },
    })
  }

  const addItemToTable = async () => {
    if (!selectedTable || !selectedMenuItemId || quantity < 1) return

    await withAction('add-item', async () => {
      setAddingItem(true)
      const menuItem = menuItemMap[selectedMenuItemId]
      if (!menuItem) throw new Error('Select a valid menu item')

      let orderId = selectedOrder?.id

      if (!orderId) {
        const orderData = {
          orderNumber: generateOrderNumber(),
          orderType: 'dine_in',
          orderSource: 'pos',
          status: 'open',
          guestCount: 1,
          subtotal: 0,
          tax: 0,
          total: 0,
          tables: { connect: [{ id: selectedTable.id }] },
        }

        const orderRes: any = await request('/api/graphql', CREATE_ORDER, { data: orderData })
        orderId = orderRes?.createRestaurantOrder?.id
      }

      if (!orderId) throw new Error('Unable to create or find active order for this table')

      await request('/api/graphql', CREATE_ORDER_ITEM, {
        data: {
          order: { connect: { id: orderId } },
          menuItem: { connect: { id: selectedMenuItemId } },
          quantity,
          price: menuItem.price,
          specialInstructions: '',
        },
      })

      await recalcAndPersistOrderTotals(orderId)
      await fetchData()
      setQuantity(1)
      setSelectedMenuItemId('')
      setSheetSuccess('Item added to check')
    })

    setAddingItem(false)
  }

  const sendOrderToKitchen = async (orderId: string) => {
    await withAction('send-kitchen', async () => {
      await request('/api/graphql', UPDATE_ORDER_STATUS, {
        id: orderId,
        data: { status: 'sent_to_kitchen' },
      })
      await fetchData()
      setSheetSuccess('Order sent to kitchen')
    })
  }

  const splitByGuests = async () => {
    if (!selectedOrder) return
    await withAction('split-guests', async () => {
      const res: any = await request('/api/graphql', SPLIT_CHECK_BY_GUEST, {
        orderId: selectedOrder.id,
        guestCount: Math.max(2, splitGuests),
      })
      const result = res?.splitCheckByGuest
      if (!result?.success) throw new Error(result?.error || 'Failed to split check by guests')
      await fetchData()
      setSheetSuccess(`Check split into ${Math.max(2, splitGuests)} guests`)
    })
  }

  const splitByItems = async () => {
    if (!selectedOrder || selectedSplitItemIds.length === 0) return
    await withAction('split-items', async () => {
      const res: any = await request('/api/graphql', SPLIT_CHECK_BY_ITEM, {
        orderId: selectedOrder.id,
        itemIds: selectedSplitItemIds,
      })
      const result = res?.splitCheckByItem
      if (!result?.success) throw new Error(result?.error || 'Failed to split selected items')
      await fetchData()
      setSelectedSplitItemIds([])
      setSheetSuccess('Selected items moved to a new check')
    })
  }

  const mergeTablesIntoCheck = async () => {
    if (!selectedOrder || selectedMergeTableIds.length === 0) return
    await withAction('merge-tables', async () => {
      const res: any = await request('/api/graphql', COMBINE_TABLES, {
        orderId: selectedOrder.id,
        tableIds: selectedMergeTableIds,
      })
      const result = res?.combineTables
      if (!result?.success) throw new Error(result?.error || 'Failed to combine tables')
      await fetchData()
      setSelectedMergeTableIds([])
      setSheetSuccess('Tables merged into current check')
    })
  }

  const toggleCourseFireHold = async (courseId: string, status: string) => {
    await withAction(`course:${courseId}`, async () => {
      if (status === 'pending') {
        const res: any = await request('/api/graphql', FIRE_COURSE, { courseId })
        if (!res?.fireCourse?.success) throw new Error(res?.fireCourse?.error || 'Failed to fire course')
        setSheetSuccess('Course fired to kitchen')
      } else {
        const res: any = await request('/api/graphql', RECALL_COURSE, { courseId })
        if (!res?.recallCourse?.success) throw new Error(res?.recallCourse?.error || 'Failed to hold/recall course')
        setSheetSuccess('Course moved to hold')
      }
      await fetchData()
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="rounded-xl border"><CardContent className="p-4"><p className="text-[11px] text-muted-foreground uppercase tracking-wider">Tables</p><p className="text-2xl font-semibold mt-1">{counts.total}</p></CardContent></Card>
          <Card className="rounded-xl border-emerald-200 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20"><CardContent className="p-4"><p className="text-[11px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Available</p><p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400 mt-1">{counts.available}</p></CardContent></Card>
          <Card className="rounded-xl border-rose-200 bg-rose-50/40 dark:border-rose-800 dark:bg-rose-950/20"><CardContent className="p-4"><p className="text-[11px] text-rose-700 dark:text-rose-400 uppercase tracking-wider">Occupied</p><p className="text-2xl font-semibold text-rose-700 dark:text-rose-400 mt-1">{counts.occupied}</p></CardContent></Card>
          <Card className="rounded-xl border"><CardContent className="p-4"><p className="text-[11px] text-muted-foreground uppercase tracking-wider">Active Checks</p><p className="text-2xl font-semibold mt-1">{counts.activeChecks}</p></CardContent></Card>
        </div>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Service Floor</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/platform/pos/tables">Advanced floor map</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {statusOrder.map((laneStatus) => {
                const laneTables = tables.filter((t) => t.status === laneStatus)
                return (
                  <div
                    key={laneStatus}
                    className="rounded-xl border bg-card"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDropToStatus(laneStatus)}
                  >
                    <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wider font-semibold">{statusLabel[laneStatus]}</div>
                      <div className="inline-flex items-center justify-center rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{laneTables.length}</div>
                    </div>

                    <div className="p-2 space-y-2 min-h-[180px]">
                      {laneTables.map((table) => {
                        const activeOrder = orderByTable[table.id]
                        const ageMins = activeOrder
                          ? Math.max(0, Math.floor((Date.now() - new Date(activeOrder.createdAt).getTime()) / 60000))
                          : 0

                        return (
                          <div
                            key={table.id}
                            draggable
                            onDragStart={() => setDragTableId(table.id)}
                            className={`rounded-lg border p-2.5 cursor-pointer transition-all hover:shadow-sm ${statusTone[table.status]}`}
                            onClick={() => {
                              setSelectedTable(table)
                              setOpenSheet(true)
                            }}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <div className="text-sm font-semibold">Table {table.tableNumber}</div>
                                <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><Users className="h-3 w-3" />{table.capacity} seats</div>
                              </div>
                              <div className="text-muted-foreground"><GripVertical className="h-3.5 w-3.5" /></div>
                            </div>

                            {activeOrder ? (
                              <div className="rounded-md border bg-background/85 dark:bg-background/50 p-2 space-y-1.5">
                                <div className="text-xs font-medium">#{activeOrder.orderNumber}</div>
                                <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{ageMins}m</span>
                                  <span className="uppercase">{formatStatusLabel(activeOrder.status)}</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                                  <span>{activeOrder.guestCount || 1} guests</span>
                                  <span className="font-medium text-foreground">{formatCurrency(activeOrder.total || 0, currencyConfig)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-muted-foreground">No active check</div>
                            )}

                            {updatingTable === table.id && (
                              <div className="text-[11px] mt-1 text-muted-foreground">Updating…</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedTable ? `Table ${selectedTable.tableNumber}` : 'Table'}</SheetTitle>
            <SheetDescription>
              Waiter control panel: quick add, split checks, merge tables, and course fire/hold.
            </SheetDescription>
          </SheetHeader>

          {selectedTable && (
            <div className="mt-6 space-y-5 pb-8">
              {selectedOrder ? (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Active Check #{selectedOrder.orderNumber}</div>
                      <div className="text-xs text-muted-foreground mt-1 uppercase">{formatStatusLabel(selectedOrder.status)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground uppercase">Total</div>
                      <div className="text-sm font-semibold">{formatCurrency(selectedOrder.total || 0, currencyConfig)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {(selectedOrder.orderItems || []).slice(0, 3).map((i) => `${i.quantity}x ${i.menuItem?.name || 'Item'}`).join(', ')}
                    {(selectedOrder.orderItems || []).length > 3 ? ' …' : ''}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border p-3 bg-muted/20 text-sm text-muted-foreground">No active check. Adding an item creates a new dine-in order.</div>
              )}

              {sheetError && <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-2 text-xs text-red-700 dark:text-red-400">{sheetError}</div>}
              {sheetSuccess && <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-2 text-xs text-emerald-700 dark:text-emerald-400">{sheetSuccess}</div>}

              <div className="space-y-3 rounded-lg border p-3 bg-card">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Quick add item</div>
                <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select menu item" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} • {formatCurrency(item.price, currencyConfig)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))}
                    className="w-24"
                  />
                  <Button onClick={addItemToTable} disabled={!selectedMenuItemId || addingItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    {addingItem ? 'Adding…' : 'Add'}
                  </Button>
                </div>
              </div>

              {selectedOrder && (
                <div className="space-y-3 rounded-lg border p-3 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5" /> Course control
                    </div>
                    <div className="text-xs text-muted-foreground">{selectedOrder.courses?.length || 0} courses</div>
                  </div>

                  {(selectedOrder.courses || []).length === 0 ? (
                    <div className="text-xs text-muted-foreground">No courses configured on this check yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {selectedOrder.courses.map((course) => {
                        const canFire = course.status === 'pending'
                        const btnLabel = canFire ? 'Fire' : 'Hold'
                        const btnIcon = canFire ? <Flame className="h-3.5 w-3.5 mr-1" /> : <PauseCircle className="h-3.5 w-3.5 mr-1" />
                        return (
                          <div key={course.id} className="rounded-md border p-2 flex items-center justify-between bg-background">
                            <div>
                              <div className="text-sm font-medium">{formatCourseLabel(course.courseType, course.courseNumber)}</div>
                              <div className="text-[11px] uppercase text-muted-foreground">{course.status}</div>
                            </div>
                            <Button
                              size="sm"
                              variant={canFire ? 'default' : 'outline'}
                              onClick={() => toggleCourseFireHold(course.id, course.status)}
                              disabled={processingAction === `course:${course.id}` || !['pending', 'fired'].includes(course.status)}
                            >
                              {btnIcon}{btnLabel}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pendingCourses.length || processingAction === 'course:bulk-fire'}
                      onClick={() => pendingCourses[0] && toggleCourseFireHold(pendingCourses[0].id, 'pending')}
                    >
                      <Flame className="h-3.5 w-3.5 mr-1" /> Fire Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!firedCourses.length || processingAction === 'course:bulk-hold'}
                      onClick={() => firedCourses[0] && toggleCourseFireHold(firedCourses[0].id, 'fired')}
                    >
                      <PauseCircle className="h-3.5 w-3.5 mr-1" /> Hold Last Fired
                    </Button>
                  </div>
                </div>
              )}

              {selectedOrder && (
                <div className="space-y-3 rounded-lg border p-3 bg-card">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" /> Merge tables into this check
                  </div>
                  {mergeCandidates.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No merge candidates right now.</div>
                  ) : (
                    <div className="space-y-2">
                      {mergeCandidates.map((table) => (
                        <label key={table.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={selectedMergeTableIds.includes(table.id)}
                            onCheckedChange={(checked) => {
                              setSelectedMergeTableIds((prev) =>
                                checked ? [...prev, table.id] : prev.filter((id) => id !== table.id)
                              )
                            }}
                          />
                          Table {table.tableNumber}
                        </label>
                      ))}
                    </div>
                  )}
                  <Button size="sm" onClick={mergeTablesIntoCheck} disabled={selectedMergeTableIds.length === 0 || processingAction === 'merge-tables'}>
                    <Layers className="h-3.5 w-3.5 mr-1" /> Merge Selected Tables
                  </Button>
                </div>
              )}

              {selectedOrder && (
                <div className="space-y-3 rounded-lg border p-3 bg-card">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                    <Split className="h-3.5 w-3.5" /> Split check
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                    <Input
                      type="number"
                      min={2}
                      value={splitGuests}
                      onChange={(e) => setSplitGuests(Math.max(2, parseInt(e.target.value || '2', 10)))}
                    />
                    <Button size="sm" variant="outline" onClick={splitByGuests} disabled={processingAction === 'split-guests'}>
                      Split by Guests
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border p-2 bg-background">
                    {(selectedOrder.orderItems || []).map((item) => (
                      <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={selectedSplitItemIds.includes(item.id)}
                          onCheckedChange={(checked) => {
                            setSelectedSplitItemIds((prev) =>
                              checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                            )
                          }}
                        />
                        <span>{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                      </label>
                    ))}
                  </div>

                  <Button size="sm" onClick={splitByItems} disabled={selectedSplitItemIds.length === 0 || processingAction === 'split-items'}>
                    Split Selected Items
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                {selectedOrder ? (
                  <Button className="h-10" onClick={() => sendOrderToKitchen(selectedOrder.id)} disabled={!['open', 'sent_to_kitchen'].includes(selectedOrder.status) || processingAction === 'send-kitchen'}>
                    <Send className="h-4 w-4 mr-1" />
                    {selectedOrder.status === 'open' ? 'Send to Kitchen' : 'Re-send'}
                  </Button>
                ) : (
                  <Button className="h-10" disabled>
                    <Send className="h-4 w-4 mr-1" /> Send to Kitchen
                  </Button>
                )}

                {selectedOrder ? (
                  <Button className="h-10" variant="secondary" onClick={() => router.push(`/dashboard/platform/pos/${selectedOrder.id}/payment`)}>
                    <CreditCard className="h-4 w-4 mr-1" /> Request Bill
                  </Button>
                ) : (
                  <Button className="h-10" variant="secondary" disabled>
                    <CreditCard className="h-4 w-4 mr-1" /> Request Bill
                  </Button>
                )}

                <Button className="h-10" variant="outline" onClick={() => router.push(`/dashboard/platform/pos?tableId=${selectedTable.id}`)}>
                  <UtensilsCrossed className="h-4 w-4 mr-1" /> Open POS
                </Button>

                {selectedOrder ? (
                  <Button className="h-10" variant="outline" onClick={() => router.push(`/dashboard/platform/orders/${selectedOrder.id}`)}>
                    <ChefHat className="h-4 w-4 mr-1" /> Open Order
                  </Button>
                ) : (
                  <Button className="h-10" variant="outline" disabled>
                    <ChefHat className="h-4 w-4 mr-1" /> Open Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
