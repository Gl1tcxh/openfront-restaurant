'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Plus, Minus, X, Send, ShoppingCart, Table as TableIcon, AlertCircle, RefreshCw, Check } from 'lucide-react'
import { gql, request } from 'graphql-request'
import { cn } from '@/lib/utils'

// Types
interface Table {
  id: string
  tableNumber: string
  capacity: number
  status: string
}

interface MenuCategory {
  id: string
  name: string
}

interface MenuItem {
  id: string
  name: string
  price: string
  available: boolean
  category: { id: string; name: string } | null
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
  specialInstructions: string
  courseNumber: number
}

// GraphQL queries
const GET_DATA = gql`
  query GetData {
    tables(where: { status: { in: ["available", "occupied"] } }, orderBy: { tableNumber: asc }) {
      id tableNumber capacity status
    }
    menuCategories(orderBy: { sortOrder: asc }) { id name }
    menuItems(orderBy: { name: asc }) {
      id name price available
      category { id name }
    }
  }
`

const CREATE_ORDER = gql`
  mutation CreateOrder($data: RestaurantOrderCreateInput!) {
    createRestaurantOrder(data: $data) { id orderNumber }
  }
`

const CREATE_ORDER_COURSE = gql`
  mutation CreateOrderCourse($data: OrderCourseCreateInput!) {
    createOrderCourse(data: $data) { id }
  }
`

const CREATE_ORDER_ITEM = gql`
  mutation CreateOrderItem($data: OrderItemCreateInput!) {
    createOrderItem(data: $data) { id }
  }
`

function generateOrderNumber(): string {
  const now = new Date()
  return `${now.toISOString().slice(2, 10).replace(/-/g, '')}-${now.getTime().toString().slice(-4)}`
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100)
}

const orderTypeConfig = {
  dine_in: {
    label: 'Dine-in',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400 outline-3 -outline-offset-1 outline-emerald-100 dark:outline-emerald-900/50',
  },
  takeout: {
    label: 'Takeout',
    dotClass: 'bg-blue-500 dark:bg-blue-400 outline-3 -outline-offset-1 outline-blue-100 dark:outline-blue-900/50',
  },
}

const courseConfig = {
  1: { label: 'C1', dotClass: 'bg-amber-500 dark:bg-amber-400' },
  2: { label: 'C2', dotClass: 'bg-orange-500 dark:bg-orange-400' },
  3: { label: 'C3', dotClass: 'bg-rose-500 dark:bg-rose-400' },
}

export function POSClient() {
  const [data, setData] = useState({ tables: [], categories: [], items: [] })
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [orderType, setOrderType] = useState<'dine_in' | 'takeout'>('dine_in')
  const [guestCount, setGuestCount] = useState<number>(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tablePopoverOpen, setTablePopoverOpen] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [specialInstructions, setSpecialInstructions] = useState('')

  const fetchData = async () => {
    try {
      const res: any = await request('/api/graphql', GET_DATA)
      setData({ tables: res.tables || [], categories: res.menuCategories || [], items: res.menuItems || [] })
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i) }, [])

  const addToCart = (menuItem: MenuItem) => {
    if (!menuItem.available) return
    const existing = cart.findIndex(i => i.menuItem.id === menuItem.id && i.courseNumber === 1)
    if (existing >= 0) {
      const newCart = [...cart]
      newCart[existing].quantity += 1
      setCart(newCart)
    } else {
      setCart([...cart, { menuItem, quantity: 1, specialInstructions: '', courseNumber: 1 }])
    }
  }

  const submitOrder = async () => {
    if (cart.length === 0 || submitting || (orderType === 'dine_in' && selectedTables.length === 0)) return
    try {
      setSubmitting(true)
      const subtotal = cart.reduce((s, i) => s + parseInt(i.menuItem.price) * i.quantity, 0)
      const tax = Math.round(subtotal * 0.08)
      const total = subtotal + tax
      const orderData: any = {
        orderNumber: generateOrderNumber(), orderType, orderSource: 'pos', status: 'open', guestCount,
        subtotal, tax, total,
        isUrgent, specialInstructions: specialInstructions || null
      }
      if (orderType === 'dine_in') orderData.tables = { connect: selectedTables.map(id => ({ id })) }
      const res: any = await request('/api/graphql', CREATE_ORDER, { data: orderData })
      const orderId = res.createRestaurantOrder.id
      const courses = Array.from(new Set(cart.map(i => i.courseNumber)))
      for (const num of courses) {
        const cRes: any = await request('/api/graphql', CREATE_ORDER_COURSE, { data: { order: { connect: { id: orderId } }, courseNumber: num, courseType: num === 1 ? 'appetizers' : num === 2 ? 'mains' : 'desserts', status: 'pending' } })
        const courseItems = cart.filter(i => i.courseNumber === num)
        for (const i of courseItems) {
          await request('/api/graphql', CREATE_ORDER_ITEM, { data: { order: { connect: { id: orderId } }, course: { connect: { id: cRes.createOrderCourse.id } }, menuItem: { connect: { id: i.menuItem.id } }, quantity: i.quantity, price: parseInt(i.menuItem.price), courseNumber: i.courseNumber } })
        }
      }
      setCart([]); setSelectedTables([]); setIsUrgent(false); setSpecialInstructions('')
      alert('Order sent to kitchen!')
    } catch (err) { alert('Error: ' + err) } finally { setSubmitting(false) }
  }

  const cartSubtotal = cart.reduce((s, i) => s + parseInt(i.menuItem.price) * i.quantity, 0)
  const cartTax = Math.round(cartSubtotal * 0.08)
  const cartTotal = cartSubtotal + cartTax

  const selectedTableObjects: Table[] = selectedTables
    .map(id => data.tables.find((t: any) => t.id === id))
    .filter((t): t is any => Boolean(t))

  if (loading) return <div className="flex justify-center p-8"><RefreshCw className="animate-spin" /></div>

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6 px-4 md:px-6">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="rounded-full"
          >
            All Items
          </Button>
          {data.categories.map((c: any) => (
            <Button
              key={c.id}
              variant={selectedCategory === c.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(c.id)}
              className="rounded-full"
            >
              {c.name}
            </Button>
          ))}
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-4">
            {data.items.filter((i: any) => selectedCategory === 'all' || i.category?.id === selectedCategory).map((item: any) => (
              <Card
                key={item.id}
                className={`cursor-pointer hover:bg-accent hover:border-primary/50 transition-all ${!item.available ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm leading-tight">{item.name}</div>
                    {!item.available && <Badge variant="destructive" className="text-[9px] h-4 px-1.5">86</Badge>}
                  </div>
                  <div className="text-sm font-semibold text-muted-foreground">{formatMoney(parseInt(item.price))}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="w-96 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-5 w-5" />
                Order Cart
              </CardTitle>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setOrderType('dine_in')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    orderType === 'dine_in'
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  <span className={cn(
                    'inline-block size-1.5 rounded-full outline',
                    orderType === 'dine_in' ? orderTypeConfig.dine_in.dotClass : 'bg-muted-foreground/50'
                  )} />
                  {orderTypeConfig.dine_in.label}
                </button>

                <button
                  onClick={() => setOrderType('takeout')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    orderType === 'takeout'
                      ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  <span className={cn(
                    'inline-block size-1.5 rounded-full outline',
                    orderType === 'takeout' ? orderTypeConfig.takeout.dotClass : 'bg-muted-foreground/50'
                  )} />
                  {orderTypeConfig.takeout.label}
                </button>
              </div>
            </div>

            {orderType === 'dine_in' && (
              <div className="mt-3">
                <Popover open={tablePopoverOpen} onOpenChange={setTablePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-9 justify-start text-sm">
                      {selectedTables.length > 0 ? (
                        <span className="flex items-center gap-1.5">
                          <TableIcon className="h-4 w-4" />
                          {selectedTableObjects.map(t => `T${t.tableNumber}`).join(', ')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <TableIcon className="h-4 w-4" />
                          Select Table
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Choose Table(s)</div>
                        {selectedTables.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTables([])}
                            className="h-7 text-xs"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {data.tables.map((t: any) => {
                          const isSelected = selectedTables.includes(t.id)
                          return (
                            <button
                              key={t.id}
                              className={cn(
                                'relative p-3 border-2 rounded-lg text-center transition-all',
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border hover:border-primary/50 hover:bg-accent'
                              )}
                              onClick={() => setSelectedTables(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                            >
                              {isSelected && <Check className="absolute top-1 right-1 h-3.5 w-3.5" />}
                              <div className="text-sm font-bold">T{t.tableNumber}</div>
                              <div className="text-[10px] opacity-80">Cap {t.capacity}</div>
                            </button>
                          )
                        })}
                      </div>
                      <Button
                        onClick={() => setTablePopoverOpen(false)}
                        className="w-full"
                        size="sm"
                      >
                        Done
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <ScrollArea className="flex-1 -mr-4 pr-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Cart is empty</p>
                  <p className="text-xs mt-1">Tap menu items to add</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((i, idx) => (
                    <div key={idx} className="rounded-lg border bg-accent/30 p-3 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{i.menuItem.name}</div>
                          <div className="text-xs text-muted-foreground">{formatMoney(parseInt(i.menuItem.price))} each</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mt-1 -mr-1"
                          onClick={() => {
                            const n = [...cart]
                            n.splice(idx, 1)
                            setCart(n)
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const n = [...cart]
                              n[idx].quantity = Math.max(1, n[idx].quantity - 1)
                              setCart(n)
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center font-medium">{i.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const n = [...cart]
                              n[idx].quantity += 1
                              setCart(n)
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3].map(courseNum => (
                            <button
                              key={courseNum}
                              onClick={() => {
                                const n = [...cart]
                                n[idx].courseNumber = courseNum
                                setCart(n)
                              }}
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all',
                                i.courseNumber === courseNum
                                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800'
                                  : 'text-muted-foreground hover:bg-accent'
                              )}
                            >
                              <span className={cn(
                                'inline-block size-1 rounded-full',
                                i.courseNumber === courseNum ? courseConfig[courseNum as keyof typeof courseConfig].dotClass : 'bg-muted-foreground/50'
                              )} />
                              {courseConfig[courseNum as keyof typeof courseConfig].label}
                            </button>
                          ))}
                        </div>

                        <div className="text-sm font-semibold">{formatMoney(parseInt(i.menuItem.price) * i.quantity)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="space-y-3">
              <Separator />

              <div className="flex items-center gap-2">
                <Checkbox
                  id="urgent"
                  checked={isUrgent}
                  onCheckedChange={(v: any) => setIsUrgent(v)}
                />
                <Label htmlFor="urgent" className="text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-600">Mark as URGENT</span>
                </Label>
              </div>

              <Textarea
                placeholder="Special instructions (allergies, modifications, etc.)"
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                className="h-20 text-sm resize-none"
              />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatMoney(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>{formatMoney(cartTax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatMoney(cartTotal)}</span>
                </div>
              </div>

              <Button
                className="w-full h-11"
                size="lg"
                onClick={submitOrder}
                disabled={cart.length === 0 || submitting || (orderType === 'dine_in' && selectedTables.length === 0)}
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Sending...' : 'Send to Kitchen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
