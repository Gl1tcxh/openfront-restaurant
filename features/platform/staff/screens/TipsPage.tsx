'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { DollarSign, Plus, Users, RefreshCw, Calculator } from 'lucide-react'
import { gql, request } from 'graphql-request'

interface TipPool {
  id: string
  date: string
  tipPoolType: string
  totalTips: string
  cashTips: string
  creditTips: string
  distributions: Distribution[] | null
  status: string
}

interface Distribution {
  staffId: string
  staffName: string
  role: string
  hoursWorked: number
  amount: number
}

interface TimeEntry {
  id: string
  staff: { id: string; name: string } | null
  role: string
  hoursWorked: number
}

const GET_TIP_POOLS = gql`
  query GetTipPools {
    tipPools(orderBy: { date: desc }, take: 30) {
      id
      date
      tipPoolType
      totalTips
      cashTips
      creditTips
      distributions
      status
    }
  }
`

const GET_TIME_ENTRIES_FOR_DATE = gql`
  query GetTimeEntriesForDate($startDate: DateTime!, $endDate: DateTime!) {
    timeEntries(where: { clockIn: { gte: $startDate, lte: $endDate } }) {
      id
      staff { id name }
      role
      hoursWorked
    }
  }
`

const CREATE_TIP_POOL = gql`
  mutation CreateTipPool($data: TipPoolCreateInput!) {
    createTipPool(data: $data) { id }
  }
`

const UPDATE_TIP_POOL = gql`
  mutation UpdateTipPool($id: ID!, $data: TipPoolUpdateInput!) {
    updateTipPool(where: { id: $id }, data: $data) { id }
  }
`

const TIP_POOL_TYPES = [
  { value: 'individual', label: 'Individual (Tips stay with server)' },
  { value: 'pool_by_role', label: 'Pool by Role (Shared by role %)' },
  { value: 'house_pool', label: 'House Pool (Equal share by hours)' },
]

const ROLE_PERCENTAGES: Record<string, number> = {
  server: 60,
  bartender: 20,
  busser: 10,
  host: 10,
}

export function TipsPage() {
  const [tipPools, setTipPools] = useState<TipPool[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [calculatedDistributions, setCalculatedDistributions] = useState<Distribution[]>([])

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    tipPoolType: 'pool_by_role',
    cashTips: '0',
    creditTips: '0',
  })

  const fetchTipPools = useCallback(async () => {
    try {
      const data = await request('/api/graphql', GET_TIP_POOLS)
      setTipPools((data as any).tipPools || [])
    } catch (err) {
      console.error('Error fetching tip pools:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTipPools()
  }, [fetchTipPools])

  const calculateDistributions = async () => {
    const totalTips = parseFloat(form.cashTips || '0') + parseFloat(form.creditTips || '0')
    if (totalTips <= 0) {
      setCalculatedDistributions([])
      return
    }

    try {
      const startDate = new Date(form.date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(form.date)
      endDate.setHours(23, 59, 59, 999)

      const data = await request('/api/graphql', GET_TIME_ENTRIES_FOR_DATE, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const entries = (data as any).timeEntries || []
      const distributions: Distribution[] = []

      if (form.tipPoolType === 'house_pool') {
        const totalHours = entries.reduce((s: number, e: TimeEntry) => s + (e.hoursWorked || 0), 0)
        for (const entry of entries) {
          if (!entry.staff || !entry.hoursWorked) continue
          const share = totalHours > 0 ? (entry.hoursWorked / totalHours) * totalTips : 0
          distributions.push({
            staffId: entry.staff.id,
            staffName: entry.staff.name,
            role: entry.role,
            hoursWorked: entry.hoursWorked,
            amount: Math.round(share * 100) / 100,
          })
        }
      } else if (form.tipPoolType === 'pool_by_role') {
        const roleGroups: Record<string, TimeEntry[]> = {}
        for (const entry of entries) {
          if (!roleGroups[entry.role]) roleGroups[entry.role] = []
          roleGroups[entry.role].push(entry)
        }

        for (const [role, roleEntries] of Object.entries(roleGroups)) {
          const rolePercent = ROLE_PERCENTAGES[role] || 10
          const roleTips = (rolePercent / 100) * totalTips
          const totalRoleHours = roleEntries.reduce((s, e) => s + (e.hoursWorked || 0), 0)

          for (const entry of roleEntries) {
            if (!entry.staff || !entry.hoursWorked) continue
            const share = totalRoleHours > 0 ? (entry.hoursWorked / totalRoleHours) * roleTips : 0
            distributions.push({
              staffId: entry.staff.id,
              staffName: entry.staff.name,
              role: entry.role,
              hoursWorked: entry.hoursWorked,
              amount: Math.round(share * 100) / 100,
            })
          }
        }
      }

      setCalculatedDistributions(distributions)
    } catch (err) {
      console.error('Error calculating distributions:', err)
    }
  }

  useEffect(() => {
    if (dialogOpen) {
      calculateDistributions()
    }
  }, [form.cashTips, form.creditTips, form.tipPoolType, form.date, dialogOpen])

  const handleCreate = async () => {
    try {
      const totalTips = parseFloat(form.cashTips || '0') + parseFloat(form.creditTips || '0')
      await request('/api/graphql', CREATE_TIP_POOL, {
        data: {
          date: new Date(form.date).toISOString(),
          tipPoolType: form.tipPoolType,
          totalTips: totalTips.toFixed(2),
          cashTips: parseFloat(form.cashTips || '0').toFixed(2),
          creditTips: parseFloat(form.creditTips || '0').toFixed(2),
          distributions: calculatedDistributions,
          status: 'calculated',
        },
      })
      setDialogOpen(false)
      fetchTipPools()
    } catch (err) {
      console.error('Error creating tip pool:', err)
    }
  }

  const markDistributed = async (id: string) => {
    try {
      await request('/api/graphql', UPDATE_TIP_POOL, {
        id,
        data: { status: 'distributed' },
      })
      fetchTipPools()
    } catch (err) {
      console.error('Error updating:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const totalDistributed = tipPools.filter(t => t.status === 'distributed').reduce((s, t) => s + parseFloat(t.totalTips || '0'), 0)

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tip Pooling & Distribution</h1>
          <p className="text-muted-foreground">Manage daily tip pools and distributions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Tip Pool
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Distributed (30 days)</p>
              <p className="text-2xl font-bold">${totalDistributed.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tip Pools Created</p>
              <p className="text-2xl font-bold">{tipPools.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <Calculator className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Distribution</p>
              <p className="text-2xl font-bold">{tipPools.filter(t => t.status === 'calculated').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1">
        <ScrollArea className="h-[calc(100vh-350px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Cash</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipPools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No tip pools yet
                  </TableCell>
                </TableRow>
              ) : (
                tipPools.map((pool) => (
                  <TableRow key={pool.id}>
                    <TableCell>{new Date(pool.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIP_POOL_TYPES.find(t => t.value === pool.tipPoolType)?.label.split(' ')[0]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${parseFloat(pool.cashTips || '0').toFixed(2)}</TableCell>
                    <TableCell className="text-right">${parseFloat(pool.creditTips || '0').toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold">${parseFloat(pool.totalTips).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={pool.status === 'distributed' ? 'default' : 'secondary'}>
                        {pool.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{pool.distributions?.length || 0} staff</TableCell>
                    <TableCell>
                      {pool.status === 'calculated' && (
                        <Button size="sm" onClick={() => markDistributed(pool.id)}>
                          Mark Distributed
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Tip Pool</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Pool Type</Label>
                <Select value={form.tipPoolType} onValueChange={(v) => setForm({ ...form, tipPoolType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIP_POOL_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cash Tips ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.cashTips}
                  onChange={(e) => setForm({ ...form, cashTips: e.target.value })}
                />
              </div>
              <div>
                <Label>Credit Card Tips ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.creditTips}
                  onChange={(e) => setForm({ ...form, creditTips: e.target.value })}
                />
              </div>
            </div>

            <div className="p-4 bg-muted rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">Total Tips</span>
                <span className="text-2xl font-bold">
                  ${(parseFloat(form.cashTips || '0') + parseFloat(form.creditTips || '0')).toFixed(2)}
                </span>
              </div>
            </div>

            {calculatedDistributions.length > 0 && (
              <div>
                <Label className="mb-2 block">Calculated Distributions</Label>
                <div className="border rounded max-h-48 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculatedDistributions.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell>{d.staffName}</TableCell>
                          <TableCell><Badge variant="outline">{d.role}</Badge></TableCell>
                          <TableCell className="text-right">{d.hoursWorked?.toFixed(1) || '-'}</TableCell>
                          <TableCell className="text-right font-bold">${d.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Button onClick={handleCreate} className="w-full">
              Create Tip Pool
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TipsPage
