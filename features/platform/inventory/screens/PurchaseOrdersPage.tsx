'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, Package, Truck, RefreshCw, FileText, Send, CheckCircle2, XCircle } from 'lucide-react'
import { gql, request } from 'graphql-request'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/features/storefront/lib/currency'

interface PurchaseOrder {
  id: string
  poNumber: string
  vendor: { id: string; name: string } | null
  orderDate: string
  expectedDelivery: string | null
  receivedDate: string | null
  status: string
  lineItems: LineItem[] | null
  totalCost: number | null
  notes: string | null
}

interface LineItem {
  ingredientId: string
  ingredientName: string
  quantity: number
  unit: string
  unitCost: number
  totalCost: number
}

interface Vendor {
  id: string
  name: string
}

interface Ingredient {
  id: string
  name: string
  unit: string
  costPerUnit: string | null
}

const STATUS_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; label: string; color: string }> = {
  draft: { variant: 'secondary', icon: FileText, label: 'Draft', color: 'text-zinc-600 dark:text-zinc-400' },
  sent: { variant: 'default', icon: Send, label: 'Sent', color: 'text-blue-600 dark:text-blue-400' },
  confirmed: { variant: 'default', icon: CheckCircle2, label: 'Confirmed', color: 'text-indigo-600 dark:text-indigo-400' },
  shipped: { variant: 'default', icon: Truck, label: 'Shipped', color: 'text-purple-600 dark:text-purple-400' },
  received: { variant: 'default', icon: Package, label: 'Received', color: 'text-emerald-600 dark:text-emerald-400' },
  cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelled', color: 'text-rose-600 dark:text-rose-400' },
}

const GET_PO_DATA = gql`
  query GetPOData {
    purchaseOrders(orderBy: { orderDate: desc }, take: 50) {
      id
      poNumber
      vendor { id name }
      orderDate
      expectedDelivery
      receivedDate
      status
      lineItems
      totalCost
      notes
    }
    vendors(orderBy: { name: asc }) {
      id
      name
    }
    ingredients(orderBy: { name: asc }) {
      id
      name
      unit
      costPerUnit
    }
    storeSettings {
      currencyCode
      locale
    }
  }
`

const CREATE_PO = gql`
  mutation CreatePO($data: PurchaseOrderCreateInput!) {
    createPurchaseOrder(data: $data) { id }
  }
`

const UPDATE_PO = gql`
  mutation UpdatePO($id: ID!, $data: PurchaseOrderUpdateInput!) {
    updatePurchaseOrder(where: { id: $id }, data: $data) { id }
  }
`

const DELETE_PO = gql`
  mutation DeletePO($id: ID!) {
    deletePurchaseOrder(where: { id: $id }) { id }
  }
`

function generatePONumber(): string {
  return `PO-${Date.now().toString().slice(-8)}`
}

export function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [currencyConfig, setCurrencyConfig] = useState({ currencyCode: 'USD', locale: 'en-US' })

  const [form, setForm] = useState({
    vendorId: '',
    expectedDelivery: '',
    notes: '',
    lineItems: [] as LineItem[],
  })

  const fetchData = useCallback(async () => {
    try {
      const data = await request('/api/graphql', GET_PO_DATA)
      setOrders((data as any).purchaseOrders || [])
      setVendors((data as any).vendors || [])
      setIngredients((data as any).ingredients || [])
      if ((data as any).storeSettings) {
        setCurrencyConfig({
          currencyCode: (data as any).storeSettings.currencyCode || 'USD',
          locale: (data as any).storeSettings.locale || 'en-US'
        })
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const resetForm = () => {
    setForm({ vendorId: '', expectedDelivery: '', notes: '', lineItems: [] })
    setEditingPO(null)
  }

  const openDialog = (po?: PurchaseOrder) => {
    if (po) {
      setEditingPO(po)
      setForm({
        vendorId: po.vendor?.id || '',
        expectedDelivery: po.expectedDelivery?.slice(0, 10) || '',
        notes: po.notes || '',
        lineItems: po.lineItems || [],
      })
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const addLineItem = () => {
    setForm({
      ...form,
      lineItems: [...form.lineItems, { ingredientId: '', ingredientName: '', quantity: 1, unit: '', unitCost: 0, totalCost: 0 }],
    })
  }

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...form.lineItems]
    updated[index] = { ...updated[index], [field]: value }

    if (field === 'ingredientId') {
      const ing = ingredients.find(i => i.id === value)
      if (ing) {
        updated[index].ingredientName = ing.name
        updated[index].unit = ing.unit
        updated[index].unitCost = parseFloat(ing.costPerUnit || '0')
      }
    }

    if (field === 'quantity' || field === 'unitCost' || field === 'ingredientId') {
      updated[index].totalCost = updated[index].quantity * updated[index].unitCost
    }

    setForm({ ...form, lineItems: updated })
  }

  const removeLineItem = (index: number) => {
    const updated = [...form.lineItems]
    updated.splice(index, 1)
    setForm({ ...form, lineItems: updated })
  }

  const handleSave = async () => {
    try {
      const data: any = {
        lineItems: form.lineItems,
        notes: form.notes || null,
      }

      if (form.vendorId) {
        data.vendor = { connect: { id: form.vendorId } }
      }
      if (form.expectedDelivery) {
        data.expectedDelivery = new Date(form.expectedDelivery).toISOString()
      }

      if (editingPO) {
        await request('/api/graphql', UPDATE_PO, { id: editingPO.id, data })
      } else {
        data.poNumber = generatePONumber()
        data.status = 'draft'
        await request('/api/graphql', CREATE_PO, { data })
      }

      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const data: any = { status }
      if (status === 'received') {
        data.receivedDate = new Date().toISOString()
      }
      await request('/api/graphql', UPDATE_PO, { id, data })
      fetchData()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this purchase order?')) return
    try {
      await request('/api/graphql', DELETE_PO, { id })
      fetchData()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const formTotal = form.lineItems.reduce((s, li) => s + li.totalCost, 0)
  const pendingValue = orders.filter(o => !['received', 'cancelled'].includes(o.status)).reduce((s, o) => s + (o.totalCost || 0), 0)
  
  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === activeFilter)

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-6 border-b bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Purchase Orders</h1>
            <p className="text-muted-foreground">Vendor order management and receiving workflow</p>
          </div>
          <Button onClick={() => openDialog()} size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            New Purchase Order
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Orders</p>
                <p className="text-3xl font-bold mt-1">{orders.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-amber-500/50 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/20">
                <Truck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Pending Value</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(pendingValue, currencyConfig, { inputIsCents: false })}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-emerald-500/50 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
                <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">This Month</p>
                <p className="text-3xl font-bold mt-1">
                  {orders.filter(o => o.status === 'received' && new Date(o.receivedDate || '').getMonth() === new Date().getMonth()).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-3 border-b bg-muted/30 flex items-center gap-2 overflow-x-auto">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveFilter('all')}
          className="shrink-0"
        >
          All Orders ({orders.length})
        </Button>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = statusCounts[status] || 0
          if (count === 0 && status !== 'draft') return null
          const Icon = config.icon
          return (
            <Button
              key={status}
              variant={activeFilter === status ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter(status)}
              className="shrink-0 gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {config.label} ({count})
            </Button>
          )
        })}
      </div>

      {/* Orders List */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-3">
          {filteredOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No purchase orders</h3>
                <p className="text-muted-foreground mb-4">
                  {activeFilter === 'all' ? 'Get started by creating your first PO' : `No orders with status "${STATUS_CONFIG[activeFilter]?.label}"`}
                </p>
                {activeFilter === 'all' && (
                  <Button onClick={() => openDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Purchase Order
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((po) => {
              const statusConfig = STATUS_CONFIG[po.status] || STATUS_CONFIG.draft
              const StatusIcon = statusConfig.icon
              return (
                <Card
                  key={po.id}
                  className="hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => openDialog(po)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono font-bold text-lg">{po.poNumber}</span>
                          <Badge variant={statusConfig.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Vendor:</span>
                            <p className="font-medium">{po.vendor?.name || '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Order Date:</span>
                            <p className="font-medium">{new Date(po.orderDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expected:</span>
                            <p className="font-medium">{po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Items:</span>
                            <p className="font-medium">{po.lineItems?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold">{formatCurrency(po.totalCost || 0, currencyConfig, { inputIsCents: false })}</p>
                        <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                          {po.status === 'draft' && (
                            <>
                              <Button size="sm" variant="default" onClick={() => updateStatus(po.id, 'sent')}>
                                Send
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(po.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {po.status === 'shipped' && (
                            <Button size="sm" onClick={() => updateStatus(po.id, 'received')}>
                              Mark Received
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingPO ? `Edit ${editingPO.poNumber}` : 'New Purchase Order'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendor *</Label>
                  <Select value={form.vendorId} onValueChange={(v) => setForm({ ...form, vendorId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expected Delivery</Label>
                  <Input
                    type="date"
                    value={form.expectedDelivery}
                    onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base">Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Item
                  </Button>
                </div>
                {form.lineItems.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No items added yet
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {form.lineItems.map((li, idx) => (
                      <Card key={idx} className="border-2">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <Select value={li.ingredientId} onValueChange={(v) => updateLineItem(idx, 'ingredientId', v)}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Ingredient" />
                              </SelectTrigger>
                              <SelectContent>
                                {ingredients.map((ing) => (
                                  <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              className="w-24"
                              value={li.quantity}
                              onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              placeholder="Qty"
                            />
                            <span className="text-sm font-medium w-16 text-center">{li.unit || '—'}</span>
                            <Input
                              type="number"
                              step="0.01"
                              className="w-28"
                              value={li.unitCost}
                              onChange={(e) => updateLineItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                              placeholder="/unit"
                            />
                            <span className="text-base font-bold w-24 text-right">{formatCurrency(li.totalCost, currencyConfig, { inputIsCents: false })}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeLineItem(idx)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Card className="bg-muted border-2">
                <CardContent className="p-4 flex justify-between items-center">
                  <span className="text-lg font-bold">Order Total</span>
                  <span className="text-3xl font-bold">{formatCurrency(formTotal, currencyConfig, { inputIsCents: false })}</span>
                </CardContent>
              </Card>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes, special instructions..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} className="w-full" size="lg">
                {editingPO ? 'Update' : 'Create'} Purchase Order
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PurchaseOrdersPage
