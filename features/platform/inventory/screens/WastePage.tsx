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
import { Trash2, Plus, DollarSign, AlertTriangle, RefreshCw, TrendingDown } from 'lucide-react'
import { gql, request } from 'graphql-request'

interface WasteLog {
  id: string
  ingredient: { id: string; name: string; unit: string } | null
  quantity: string
  reason: string
  cost: number | null
  notes: string | null
  createdAt: string
  loggedBy: { name: string } | null
}

interface Ingredient {
  id: string
  name: string
  unit: string
  costPerUnit: string | null
}

const WASTE_REASONS = [
  { value: 'spoilage', label: 'Spoilage', color: 'bg-red-500' },
  { value: 'preparation_error', label: 'Prep Error', color: 'bg-orange-500' },
  { value: 'overproduction', label: 'Overproduction', color: 'bg-yellow-500' },
  { value: 'plate_waste', label: 'Plate Waste', color: 'bg-blue-500' },
  { value: 'expired', label: 'Expired', color: 'bg-purple-500' },
  { value: 'damaged', label: 'Damaged', color: 'bg-gray-500' },
  { value: 'other', label: 'Other', color: 'bg-slate-500' },
]

const GET_WASTE_DATA = gql`
  query GetWasteData {
    wasteLogs(orderBy: { createdAt: desc }, take: 100) {
      id
      ingredient { id name unit }
      quantity
      reason
      cost
      notes
      createdAt
      loggedBy { name }
    }
    ingredients(orderBy: { name: asc }) {
      id
      name
      unit
      costPerUnit
    }
  }
`

const CREATE_WASTE_LOG = gql`
  mutation CreateWasteLog($data: WasteLogCreateInput!) {
    createWasteLog(data: $data) { id }
  }
`

const DELETE_WASTE_LOG = gql`
  mutation DeleteWasteLog($id: ID!) {
    deleteWasteLog(where: { id: $id }) { id }
  }
`

export function WastePage() {
  const [logs, setLogs] = useState<WasteLog[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [form, setForm] = useState({
    ingredientId: '',
    quantity: '',
    reason: 'spoilage',
    notes: '',
  })

  const fetchData = useCallback(async () => {
    try {
      const data = await request('/api/graphql', GET_WASTE_DATA)
      setLogs((data as any).wasteLogs || [])
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

  const handleCreate = async () => {
    if (!form.ingredientId || !form.quantity) return
    try {
      await request('/api/graphql', CREATE_WASTE_LOG, {
        data: {
          ingredient: { connect: { id: form.ingredientId } },
          quantity: form.quantity,
          reason: form.reason,
          notes: form.notes || null,
        },
      })
      setDialogOpen(false)
      setForm({ ingredientId: '', quantity: '', reason: 'spoilage', notes: '' })
      fetchData()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this waste log?')) return
    try {
      await request('/api/graphql', DELETE_WASTE_LOG, { id })
      fetchData()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const getReasonConfig = (reason: string) => WASTE_REASONS.find(r => r.value === reason) || WASTE_REASONS[0]

  const totalWasteCost = logs.reduce((s, l) => s + (l.cost || 0), 0)
  const last7DaysCost = logs
    .filter(l => new Date(l.createdAt) > new Date(Date.now() - 7 * 86400000))
    .reduce((s, l) => s + (l.cost || 0), 0)

  const reasonBreakdown = WASTE_REASONS.map(r => ({
    ...r,
    count: logs.filter(l => l.reason === r.value).length,
    cost: logs.filter(l => l.reason === r.value).reduce((s, l) => s + (l.cost || 0), 0),
  })).filter(r => r.count > 0)

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
          <h1 className="text-2xl font-bold">Waste Tracking</h1>
          <p className="text-muted-foreground">Track food waste and reduce costs</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Waste
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-full">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Waste Cost</p>
              <p className="text-2xl font-bold text-red-600">${totalWasteCost.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-full">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last 7 Days</p>
              <p className="text-2xl font-bold">${last7DaysCost.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Incidents</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Trash2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top Reason</p>
              <p className="text-lg font-bold">
                {reasonBreakdown[0]?.label || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">Waste Log</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100vh-400px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Logged By</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No waste logged yet
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const reasonConfig = getReasonConfig(log.reason)
                    return (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{log.ingredient?.name || 'Unknown'}</TableCell>
                        <TableCell>{log.quantity} {log.ingredient?.unit}</TableCell>
                        <TableCell>
                          <Badge className={reasonConfig.color}>{reasonConfig.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          ${(log.cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{log.loggedBy?.name || '-'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(log.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reasonBreakdown.map((r) => (
                <div key={r.value} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${r.color}`} />
                    <span className="text-sm">{r.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">${r.cost.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{r.count} logs</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Waste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ingredient</Label>
              <Select value={form.ingredientId} onValueChange={(v) => setForm({ ...form, ingredientId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((ing) => (
                    <SelectItem key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="Amount wasted"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WASTE_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional details..."
              />
            </div>
            <Button onClick={handleCreate} className="w-full">Log Waste</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WastePage
