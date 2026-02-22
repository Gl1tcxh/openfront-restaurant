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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Plus, DollarSign, AlertTriangle, RefreshCw, TrendingDown, TrendingUp, Calendar } from 'lucide-react'
import { gql, request } from 'graphql-request'
import { cn } from '@/lib/utils'

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
  { value: 'spoilage', label: 'Spoilage', color: 'bg-rose-500 dark:bg-rose-400' },
  { value: 'preparation_error', label: 'Prep Error', color: 'bg-orange-500 dark:bg-orange-400' },
  { value: 'overproduction', label: 'Overproduction', color: 'bg-amber-500 dark:bg-amber-400' },
  { value: 'plate_waste', label: 'Plate Waste', color: 'bg-blue-500 dark:bg-blue-400' },
  { value: 'expired', label: 'Expired', color: 'bg-purple-500 dark:bg-purple-400' },
  { value: 'damaged', label: 'Damaged', color: 'bg-zinc-500 dark:bg-zinc-400' },
  { value: 'other', label: 'Other', color: 'bg-slate-500 dark:bg-slate-400' },
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
  const last30DaysCost = logs
    .filter(l => new Date(l.createdAt) > new Date(Date.now() - 30 * 86400000))
    .reduce((s, l) => s + (l.cost || 0), 0)

  const reasonBreakdown = WASTE_REASONS.map(r => ({
    ...r,
    count: logs.filter(l => l.reason === r.value).length,
    cost: logs.filter(l => l.reason === r.value).reduce((s, l) => s + (l.cost || 0), 0),
  })).filter(r => r.count > 0).sort((a, b) => b.cost - a.cost)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const avgDailyCost = last30DaysCost / 30

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-6 border-b bg-gradient-to-br from-rose-500/5 via-background to-orange-500/5">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
              <span className="text-rose-600 dark:text-rose-400">↓</span>
              Waste Tracking
            </h1>
            <p className="text-muted-foreground">Monitor, analyze, and reduce food waste costs</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="lg" className="gap-2 bg-rose-600 hover:bg-rose-700">
            <Plus className="h-4 w-4" />
            Log Waste
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2 border-rose-200 dark:border-rose-900 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-background">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-rose-500/10 dark:bg-rose-500/20">
                  <DollarSign className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Cost</span>
              </div>
              <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">${totalWasteCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-orange-500/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/10 dark:bg-orange-500/20">
                  <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last 7 Days</span>
              </div>
              <p className="text-3xl font-bold">${last7DaysCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">{logs.filter(l => new Date(l.createdAt) > new Date(Date.now() - 7 * 86400000)).length} incidents</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-amber-500/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/20">
                  <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg/Day</span>
              </div>
              <p className="text-3xl font-bold">${avgDailyCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">30-day average</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                  <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Issue</span>
              </div>
              <p className="text-2xl font-bold">{reasonBreakdown[0]?.label || 'None'}</p>
              <p className="text-xs text-muted-foreground mt-1">${reasonBreakdown[0]?.cost.toFixed(2) || '0.00'}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Waste Log */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Waste Log</span>
                <Badge variant="secondary">{logs.length} entries</Badge>
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="px-6 pb-6 space-y-2">
                {logs.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-4 rounded-full bg-muted mb-4">
                        <Trash2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">No waste logged</h3>
                      <p className="text-muted-foreground mb-4">Start tracking waste to identify patterns</p>
                      <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Log First Waste Entry
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  logs.map((log) => {
                    const reasonConfig = getReasonConfig(log.reason)
                    return (
                      <Card key={log.id} className="hover:border-primary/50 transition-colors group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={reasonConfig.color}>
                                  {reasonConfig.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(log.createdAt).toLocaleDateString()} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Ingredient:</span>
                                  <p className="font-medium">{log.ingredient?.name || 'Unknown'}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Quantity:</span>
                                  <p className="font-medium">{log.quantity} {log.ingredient?.unit}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Logged by:</span>
                                  <p className="font-medium">{log.loggedBy?.name || '—'}</p>
                                </div>
                              </div>
                              {log.notes && (
                                <p className="text-sm text-muted-foreground mt-2 italic">{log.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                  ${(log.cost || 0).toFixed(2)}
                                </p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(log.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Breakdown Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">By Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reasonBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
              ) : (
                reasonBreakdown.map((r) => {
                  const percentage = totalWasteCost > 0 ? (r.cost / totalWasteCost) * 100 : 0
                  return (
                    <div key={r.value} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2.5 h-2.5 rounded-full', r.color)} />
                          <span className="font-medium">{r.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-bold">${r.cost.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">{r.count} {r.count === 1 ? 'log' : 'logs'}</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn('h-full rounded-full', r.color)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">Log Waste Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ingredient *</Label>
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
              <Label>Quantity *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="Amount wasted"
              />
            </div>
            <div>
              <Label>Reason *</Label>
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
                placeholder="Additional context, preventative measures..."
                rows={3}
              />
            </div>
            <Button onClick={handleCreate} className="w-full" size="lg">
              Log Waste Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WastePage
