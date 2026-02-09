'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { DollarSign, Clock, Users, TrendingDown, TrendingUp, RefreshCw, Calendar } from 'lucide-react'
import { gql, request } from 'graphql-request'

interface TimeEntry {
  id: string
  staff: { id: string; name: string } | null
  clockIn: string
  clockOut: string | null
  role: string
  hourlyRate: string | null
  hoursWorked: number | null
  laborCost: number | null
  tips: string | null
}

interface DailySales {
  date: string
  total: number
}

const GET_LABOR_DATA = gql`
  query GetLaborData($startDate: DateTime!, $endDate: DateTime!) {
    timeEntries(
      where: { clockIn: { gte: $startDate, lte: $endDate } }
      orderBy: { clockIn: desc }
    ) {
      id
      staff { id name }
      clockIn
      clockOut
      role
      hourlyRate
      hoursWorked
      laborCost
      tips
    }
    restaurantOrders(
      where: { 
        status: { equals: "completed" }
        createdAt: { gte: $startDate, lte: $endDate }
      }
    ) {
      id
      total
      createdAt
    }
  }
`

const ROLES = [
  { value: 'all', label: 'All Roles' },
  { value: 'server', label: 'Server' },
  { value: 'bartender', label: 'Bartender' },
  { value: 'host', label: 'Host' },
  { value: 'busser', label: 'Busser' },
  { value: 'cook', label: 'Cook' },
  { value: 'dishwasher', label: 'Dishwasher' },
  { value: 'manager', label: 'Manager' },
]

export function LaborReportPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [totalSales, setTotalSales] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  })
  const [roleFilter, setRoleFilter] = useState('all')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const startDate = new Date(dateRange.start)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)

      const data = await request('/api/graphql', GET_LABOR_DATA, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      setEntries((data as any).timeEntries || [])
      const orders = (data as any).restaurantOrders || []
      const sales = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0)
      setTotalSales(sales)
    } catch (err) {
      console.error('Error fetching labor data:', err)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredEntries = roleFilter === 'all' 
    ? entries 
    : entries.filter(e => e.role === roleFilter)

  const totalHours = filteredEntries.reduce((s, e) => s + (e.hoursWorked || 0), 0)
  const totalLaborCost = filteredEntries.reduce((s, e) => s + (e.laborCost || 0), 0)
  const totalTips = filteredEntries.reduce((s, e) => s + parseFloat(e.tips || '0'), 0)
  const laborPercentage = totalSales > 0 ? (totalLaborCost / totalSales) * 100 : 0
  const salesPerLaborHour = totalHours > 0 ? totalSales / totalHours : 0

  const roleBreakdown = ROLES.filter(r => r.value !== 'all').map(role => {
    const roleEntries = entries.filter(e => e.role === role.value)
    return {
      role: role.label,
      hours: roleEntries.reduce((s, e) => s + (e.hoursWorked || 0), 0),
      cost: roleEntries.reduce((s, e) => s + (e.laborCost || 0), 0),
      staff: new Set(roleEntries.map(e => e.staff?.id)).size,
    }
  }).filter(r => r.hours > 0)

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
          <h1 className="text-2xl font-bold">Labor Cost Report</h1>
          <p className="text-muted-foreground">Track labor costs and productivity</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-36"
            />
            <span>to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-36"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Total Hours</span>
            </div>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Labor Cost</span>
            </div>
            <p className="text-2xl font-bold">${totalLaborCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {laborPercentage <= 30 ? <TrendingDown className="h-4 w-4 text-green-600" /> : <TrendingUp className="h-4 w-4 text-red-600" />}
              <span className="text-sm">Labor %</span>
            </div>
            <p className={`text-2xl font-bold ${laborPercentage <= 30 ? 'text-green-600' : laborPercentage <= 35 ? 'text-yellow-600' : 'text-red-600'}`}>
              {laborPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Target: 25-30%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Sales/Labor Hour</span>
            </div>
            <p className="text-2xl font-bold">${salesPerLaborHour.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Tips Earned</span>
            </div>
            <p className="text-2xl font-bold">${totalTips.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Time Entries</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100vh-450px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Tips</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No time entries for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.staff?.name || 'Unknown'}</TableCell>
                      <TableCell><Badge variant="outline">{entry.role}</Badge></TableCell>
                      <TableCell>{new Date(entry.clockIn).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{entry.hoursWorked?.toFixed(1) || '-'}</TableCell>
                      <TableCell className="text-right">${entry.hourlyRate || '-'}</TableCell>
                      <TableCell className="text-right font-medium">${entry.laborCost?.toFixed(2) || '-'}</TableCell>
                      <TableCell className="text-right">${parseFloat(entry.tips || '0').toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roleBreakdown.map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{r.role}</p>
                    <p className="text-xs text-muted-foreground">{r.staff} staff, {r.hours.toFixed(1)} hrs</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${r.cost.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {totalLaborCost > 0 ? ((r.cost / totalLaborCost) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </div>
              ))}
              {roleBreakdown.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LaborReportPage
