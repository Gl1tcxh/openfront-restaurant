'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, DollarSign, Package, Truck, RefreshCw, FileText } from 'lucide-react'
import { gql, request } from 'graphql-request'

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

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  draft: { color: 'bg-gray-500', label: 'Draft' },
  sent: { color: 'bg-blue-500', label: 'Sent' },
  confirmed: { color: 'bg-indigo-500', label: 'Confirmed' },
  shipped: { color: 'bg-purple-500', label: 'Shipped' },
  received: { color: 'bg-green-500', label: 'Received' },
  cancelled: { color: 'bg-red-500', label: 'Cancelled' },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage vendor orders and receiving</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New PO
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total POs</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <Truck className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Value</p>
              <p className="text-2xl font-bold">${pendingValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Received This Month</p>
              <p className="text-2xl font-bold">
                {orders.filter(o => o.status === 'received' && new Date(o.receivedDate || '').getMonth() === new Date().getMonth()).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1">
        <ScrollArea className="h-[calc(100vh-350px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No purchase orders yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((po) => {
                  const statusConfig = STATUS_CONFIG[po.status] || STATUS_CONFIG.draft
                  return (
                    <TableRow key={po.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDialog(po)}>
                      <TableCell className="font-mono font-bold">{po.poNumber}</TableCell>
                      <TableCell>{po.vendor?.name || '-'}</TableCell>
                      <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>{po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">${(po.totalCost || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          {po.status === 'draft' && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(po.id, 'sent')}>Send</Button>
                          )}
                          {po.status === 'shipped' && (
                            <Button size="sm" onClick={() => updateStatus(po.id, 'received')}>Receive</Button>
                          )}
                          {po.status === 'draft' && (
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(po.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPO ? `Edit PO ${editingPO.poNumber}` : 'New Purchase Order'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vendor</Label>
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
              <div className="flex items-center justify-between mb-2">
                <Label>Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Item
                </Button>
              </div>
              {form.lineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border rounded">No items added</p>
              ) : (
                <div className="space-y-2">
                  {form.lineItems.map((li, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select value={li.ingredientId} onValueChange={(v) => updateLineItem(idx, 'ingredientId', v)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-20"
                        value={li.quantity}
                        onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Qty"
                      />
                      <span className="text-sm w-12">{li.unit}</span>
                      <Input
                        type="number"
                        step="0.01"
                        className="w-24"
                        value={li.unitCost}
                        onChange={(e) => updateLineItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                        placeholder="$/unit"
                      />
                      <span className="text-sm font-bold w-20 text-right">${li.totalCost.toFixed(2)}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLineItem(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-muted rounded flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-bold">${formTotal.toFixed(2)}</span>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>

            <Button onClick={handleSave} className="w-full">
              {editingPO ? 'Update' : 'Create'} Purchase Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PurchaseOrdersPage
