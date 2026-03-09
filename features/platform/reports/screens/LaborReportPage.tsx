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
import { DollarSign, Clock, Users, TrendingDown, TrendingUp, RefreshCw, Calendar, ArrowRight, Wallet, Activity, Briefcase } from 'lucide-react'
import { gql, request } from 'graphql-request'
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs"
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber } from "../lib/reportHelpers";

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

interface StoreSettingsData {
  currencyCode: string
  locale: string
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
    storeSettings {
      currencyCode
      locale
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
  const [currencyConfig, setCurrencyConfig] = useState({ currencyCode: 'USD', locale: 'en-US' })
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
      
      if ((data as any).storeSettings) {
        setCurrencyConfig({
          currencyCode: (data as any).storeSettings.currencyCode || 'USD',
          locale: (data as any).storeSettings.locale || 'en-US'
        })
      }
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
  }).filter(r => r.hours > 0).sort((a, b) => b.cost - a.cost)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: '/dashboard' },
    { type: 'link' as const, label: 'Reports', href: '/dashboard/platform/reports' },
    { type: 'page' as const, label: 'Labor' }
  ]

  return (
    <div className="flex flex-col h-full">
      <PageBreadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="px-6 py-6 border-b bg-gradient-to-br from-amber-500/5 via-background to-amber-500/5">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">Labor Performance</h1>
            <p className="text-muted-foreground">Optimize your staffing efficiency and payroll overhead</p>
          </div>
          
          <div className="flex items-center gap-3 bg-card p-1.5 border-2 rounded-2xl shadow-sm">
            <div className="flex items-center px-3 border-r">
               <Calendar className="size-4 text-muted-foreground mr-2" />
               <input 
                type="date" 
                value={dateRange.start} 
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-transparent border-none text-xs font-bold focus:ring-0 w-28" 
               />
               <ArrowRight className="size-3 text-muted-foreground mx-1" />
               <input 
                type="date" 
                value={dateRange.end} 
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-transparent border-none text-xs font-bold focus:ring-0 w-28" 
               />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32 border-none shadow-none focus:ring-0 font-bold text-xs uppercase tracking-widest h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-xs font-bold">{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-2 rounded-2xl bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Hours</span>
              </div>
              <p className="text-3xl font-black">{totalHours.toFixed(1)}</p>
            </CardContent>
          </Card>

          <Card className="border-2 rounded-2xl bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payroll Cost</span>
              </div>
              <p className="text-3xl font-black">{formatCurrency(totalLaborCost, currencyConfig)}</p>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-2 rounded-2xl shadow-sm",
            laborPercentage <= 30 ? "border-emerald-200 bg-emerald-50/20 dark:bg-emerald-950/10" : "border-amber-200 bg-amber-50/20 dark:bg-amber-950/10"
          )}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("p-2 rounded-lg", laborPercentage <= 30 ? "bg-emerald-500/10" : "bg-amber-500/10")}>
                  <Activity className={cn("h-5 w-5", laborPercentage <= 30 ? "text-emerald-600" : "text-amber-600")} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Labor %</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className={cn("text-3xl font-black", laborPercentage <= 30 ? "text-emerald-600" : "text-amber-600")}>
                  {laborPercentage.toFixed(1)}%
                </p>
                <span className="text-[10px] font-bold text-muted-foreground">Tgt: 28%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 rounded-2xl bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">S / Labor Hr</span>
              </div>
              <p className="text-3xl font-black">{formatCurrency(salesPerLaborHour, currencyConfig)}</p>
            </CardContent>
          </Card>

          <Card className="border-2 rounded-2xl bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tips Pool</span>
              </div>
              <p className="text-3xl font-black">{formatCurrency(totalTips, currencyConfig)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
        {/* Entries Table */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col border-2 rounded-[2rem] overflow-hidden bg-card shadow-sm">
            <CardHeader className="p-6 border-b bg-muted/20">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                <Briefcase className="size-5 text-primary" />
                Time Entry Audit
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Staff Member</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Role</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-right">Hours</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-right">Labor Cost</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-right">Tips</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-24 text-muted-foreground">
                        <Users className="size-12 mx-auto mb-4 opacity-10" />
                        <p className="font-bold uppercase tracking-widest text-xs">No records for this period</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-bold text-sm py-4">{entry.staff?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg text-[10px] font-bold uppercase tracking-widest bg-background">
                            {entry.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">
                          {new Date(entry.clockIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-sm">
                           {entry.hoursWorked?.toFixed(1) || '0.0'}
                        </TableCell>
                        <TableCell className="text-right font-black text-sm">
                           {formatCurrency(entry.laborCost || 0, currencyConfig)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                           {formatCurrency(parseFloat(entry.tips || '0'), currencyConfig)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </div>

        {/* Breakdown Sidebar */}
        <div className="space-y-6">
          <Card className="border-2 rounded-[2rem] overflow-hidden bg-card shadow-sm">
            <CardHeader className="p-6 border-b bg-muted/20">
              <CardTitle className="text-xs font-black uppercase tracking-widest">Efficiency by Role</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {roleBreakdown.length === 0 ? (
                <p className="text-xs font-bold text-center text-muted-foreground py-8">NO DATA AVAILABLE</p>
              ) : (
                roleBreakdown.map((r, i) => {
                  const percentage = totalLaborCost > 0 ? (r.cost / totalLaborCost) * 100 : 0
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black uppercase tracking-wider">{r.role}</span>
                        <span className="font-bold text-muted-foreground">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                         <span className="text-lg font-black">{formatCurrency(r.cost, currencyConfig)}</span>
                         <span className="text-[10px] font-bold text-muted-foreground italic">{r.hours.toFixed(1)} hrs</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-700" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        {r.staff} Active Personnel
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-2 rounded-[2rem] bg-zinc-900 text-white p-6 relative overflow-hidden">
             <div className="relative z-10 space-y-4">
                <h3 className="text-xl font-black tracking-tight">Optimization Tip</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Your <span className="text-amber-400 font-bold">Labor Cost %</span> is currently {laborPercentage > 30 ? 'above' : 'within'} the recommended threshold. 
                  Consider shifting prep work to off-peak hours to level kitchen load.
                </p>
                <Button variant="outline" className="w-full rounded-xl border-zinc-700 text-white hover:bg-zinc-800 font-bold text-xs uppercase tracking-widest">
                   Review Schedule
                </Button>
             </div>
             <TrendingDown className="absolute -right-6 -bottom-6 size-32 text-white/5 -rotate-12" />
          </Card>
        </div>
      </div>
    </div>
  )
}

export default LaborReportPage
