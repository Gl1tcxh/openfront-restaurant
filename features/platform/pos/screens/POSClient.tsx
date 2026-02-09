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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Minus, Trash2, Send, ShoppingCart, Table as TableIcon, Flame, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react'
import { gql, request } from 'graphql-request'

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
    kitchenMessages(orderBy: { createdAt: desc }, take: 3) {
      id content fromStation createdAt
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

const CREATE_MESSAGE = gql`
  mutation CreateMessage($data: KitchenMessageCreateInput!) {
    createKitchenMessage(data: $data) { id }
  }
`

function generateOrderNumber(): string {
  const now = new Date()
  return `${now.toISOString().slice(2, 10).replace(/-/g, '')}-${now.getTime().toString().slice(-4)}`
}

export function POSClient() {
  const [data, setData] = useState({ tables: [], categories: [], items: [], messages: [] })
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [orderType, setOrderType] = useState<string>('dine_in')
  const [guestCount, setGuestCount] = useState<number>(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [msg, setMsg] = useState('')

  const fetchData = async () => {
    try {
      const res: any = await request('/api/graphql', GET_DATA)
      setData({ tables: res.tables || [], categories: res.menuCategories || [], items: res.menuItems || [], messages: res.kitchenMessages || [] })
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
      const subtotal = cart.reduce((s, i) => s + parseFloat(i.menuItem.price) * i.quantity, 0)
      const orderData: any = {
        orderNumber: generateOrderNumber(), orderType, status: 'open', guestCount,
        subtotal: subtotal.toFixed(2), tax: (subtotal * 0.08).toFixed(2), total: (subtotal * 1.08).toFixed(2),
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
          await request('/api/graphql', CREATE_ORDER_ITEM, { data: { order: { connect: { id: orderId } }, course: { connect: { id: cRes.createOrderCourse.id } }, menuItem: { connect: { id: i.menuItem.id } }, quantity: i.quantity, price: i.menuItem.price, courseNumber: i.courseNumber } })
        }
      }
      setCart([]); setSelectedTables([]); setIsUrgent(false); setSpecialInstructions(''); alert('Order Sent!')
    } catch (err) { alert('Error: ' + err) } finally { setSubmitting(false) }
  }

  const sendMessage = async () => {
    if (!msg) return
    try {
      await request('/api/graphql', CREATE_MESSAGE, { data: { content: msg, fromStation: 'foh', type: 'general' } })
      setMsg(''); fetchData()
    } catch (err) { console.error(err) }
  }

  if (loading) return <div className="flex justify-center p-8"><RefreshCw className="animate-spin" /></div>

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4 p-4">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-2">
          <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory('all')}>All</Button>
          {data.categories.map((c: any) => <Button key={c.id} variant={selectedCategory === c.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(c.id)}>{c.name}</Button>)}
        </div>
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {data.items.filter((i: any) => selectedCategory === 'all' || i.category?.id === selectedCategory).map((item: any) => (
              <Card key={item.id} className={`cursor-pointer hover:bg-muted ${!item.available ? 'opacity-50 grayscale' : ''}`} onClick={() => addToCart(item)}>
                <CardContent className="p-3">
                  <div className="font-medium text-sm truncate">{item.name} {!item.available && <Badge variant="destructive" className="ml-1 text-[8px]">86</Badge>}</div>
                  <div className="text-sm text-muted-foreground">${parseFloat(item.price).toFixed(2)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
        <Card className="h-40 flex flex-col">
          <CardHeader className="py-2"><CardTitle className="text-xs flex items-center gap-2"><MessageSquare className="h-3 w-3" />Kitchen Chat</CardTitle></CardHeader>
          <CardContent className="flex-1 flex flex-col gap-2">
            <ScrollArea className="flex-1 text-[10px] space-y-1">{data.messages.map((m: any) => <div key={m.id} className={`p-1 rounded ${m.fromStation === 'kitchen' ? 'bg-orange-500/10' : 'bg-muted'}`}><b>{m.fromStation}:</b> {m.content}</div>)}</ScrollArea>
            <div className="flex gap-2"><Input size={1} className="h-7 text-xs" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type..." /><Button size="sm" className="h-7" onClick={sendMessage}>Send</Button></div>
          </CardContent>
        </Card>
      </div>
      <div className="w-96 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 font-bold"><ShoppingCart className="h-5 w-5" />Cart</CardTitle></CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={orderType} onValueChange={setOrderType}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dine_in">Dine-in</SelectItem><SelectItem value="takeout">Takeout</SelectItem></SelectContent></Select>
              {orderType === 'dine_in' && (
                <Button variant="outline" size="sm" onClick={() => setTableDialogOpen(true)} className="h-8 text-xs">{selectedTables.length > 0 ? `${selectedTables.length} Tables` : 'Select Table'}</Button>
              )}
            </div>
            <ScrollArea className="flex-1">
              {cart.map((i, idx) => (
                <div key={idx} className="p-2 mb-2 bg-muted rounded flex justify-between items-center">
                  <div className="flex flex-col"><span className="text-xs font-bold">{i.menuItem.name}</span><span className="text-[10px]">${(parseFloat(i.menuItem.price) * i.quantity).toFixed(2)}</span></div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => { const n = [...cart]; n[idx].quantity = Math.max(0, n[idx].quantity - 1); if (n[idx].quantity === 0) n.splice(idx, 1); setCart(n) }}><Minus className="h-3 w-3" /></Button>
                    <span className="text-xs w-4 text-center">{i.quantity}</span>
                    <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => { const n = [...cart]; n[idx].quantity += 1; setCart(n) }}><Plus className="h-3 w-3" /></Button>
                    <Select value={i.courseNumber.toString()} onValueChange={v => { const n = [...cart]; n[idx].courseNumber = parseInt(v); setCart(n) }}><SelectTrigger className="h-5 w-16 text-[8px] px-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">C1</SelectItem><SelectItem value="2">C2</SelectItem><SelectItem value="3">C3</SelectItem></SelectContent></Select>
                  </div>
                </div>
              ))}
            </ScrollArea>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><Checkbox id="urgent" checked={isUrgent} onCheckedChange={(v: any) => setIsUrgent(v)} /><Label htmlFor="urgent" className="text-xs font-bold text-orange-600">URGENT ORDER</Label></div>
              <Textarea placeholder="Special instructions (allergies, etc.)" value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} className="h-16 text-xs" />
            </div>
            <Separator />
            <div className="flex justify-between font-bold"><span>Total</span><span>${(cart.reduce((s, i) => s + parseFloat(i.menuItem.price) * i.quantity, 0) * 1.08).toFixed(2)}</span></div>
            <Button className="w-full" size="lg" onClick={submitOrder} disabled={cart.length === 0 || submitting}><Send className="mr-2 h-4 w-4" /> SEND TO KITCHEN</Button>
          </CardContent>
        </Card>
      </div>
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}><DialogContent><DialogHeader><DialogTitle>Select Tables</DialogTitle></DialogHeader><div className="grid grid-cols-3 gap-2">{data.tables.map((t: any) => <div key={t.id} className={`p-2 border rounded cursor-pointer text-center ${selectedTables.includes(t.id) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} onClick={() => setSelectedTables(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}><div className="text-sm font-bold">{t.tableNumber}</div><div className="text-[10px]">Cap: {t.capacity}</div></div>)}</div><Button onClick={() => setTableDialogOpen(false)}>Done</Button></DialogContent></Dialog>
    </div>
  )
}
