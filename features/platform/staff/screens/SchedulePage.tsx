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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar, Plus, Clock, User, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { gql, request } from 'graphql-request'

interface Shift {
  id: string
  staff: { id: string; name: string } | null
  startTime: string
  endTime: string
  role: string
  status: string
  hourlyRate: string | null
  clockIn: string | null
  clockOut: string | null
  hoursWorked: number | null
}

interface StaffMember {
  id: string
  name: string
  email: string
}

const ROLES = [
  { value: 'server', label: 'Server', color: 'bg-blue-500' },
  { value: 'bartender', label: 'Bartender', color: 'bg-purple-500' },
  { value: 'host', label: 'Host', color: 'bg-green-500' },
  { value: 'busser', label: 'Busser', color: 'bg-yellow-500' },
  { value: 'cook', label: 'Cook', color: 'bg-red-500' },
  { value: 'dishwasher', label: 'Dishwasher', color: 'bg-gray-500' },
  { value: 'manager', label: 'Manager', color: 'bg-indigo-500' },
]

const GET_SHIFTS = gql`
  query GetShifts($startDate: DateTime!, $endDate: DateTime!) {
    shifts(
      where: { startTime: { gte: $startDate, lte: $endDate } }
      orderBy: { startTime: asc }
    ) {
      id
      staff { id name }
      startTime
      endTime
      role
      status
      hourlyRate
      clockIn
      clockOut
      hoursWorked
    }
    users(where: { role: { isNot: null } }, orderBy: { name: asc }) {
      id
      name
      email
    }
  }
`

const CREATE_SHIFT = gql`
  mutation CreateShift($data: ShiftCreateInput!) {
    createShift(data: $data) { id }
  }
`

const UPDATE_SHIFT = gql`
  mutation UpdateShift($id: ID!, $data: ShiftUpdateInput!) {
    updateShift(where: { id: $id }, data: $data) { id }
  }
`

const DELETE_SHIFT = gql`
  mutation DeleteShift($id: ID!) {
    deleteShift(where: { id: $id }) { id }
  }
`

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = []
  const start = new Date(baseDate)
  start.setDate(start.getDate() - start.getDay())
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d)
  }
  return dates
}

export function SchedulePage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)

  const [form, setForm] = useState({
    staffId: '',
    role: 'server',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    hourlyRate: '15.00',
  })

  const weekDates = getWeekDates(weekStart)

  const fetchShifts = useCallback(async () => {
    try {
      const startDate = weekDates[0].toISOString()
      const endDate = new Date(weekDates[6].getTime() + 86400000).toISOString()
      const data = await request('/api/graphql', GET_SHIFTS, { startDate, endDate })
      setShifts((data as any).shifts || [])
      setStaff((data as any).users || [])
    } catch (err) {
      console.error('Error fetching shifts:', err)
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  const navigateWeek = (direction: number) => {
    const newStart = new Date(weekStart)
    newStart.setDate(newStart.getDate() + direction * 7)
    setWeekStart(newStart)
  }

  const openAddDialog = (date?: Date) => {
    setEditingShift(null)
    setForm({
      staffId: '',
      role: 'server',
      date: date ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      startTime: '09:00',
      endTime: '17:00',
      hourlyRate: '15.00',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (shift: Shift) => {
    setEditingShift(shift)
    const startDate = new Date(shift.startTime)
    const endDate = new Date(shift.endTime)
    setForm({
      staffId: shift.staff?.id || '',
      role: shift.role,
      date: startDate.toISOString().slice(0, 10),
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5),
      hourlyRate: shift.hourlyRate || '15.00',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const startDateTime = new Date(`${form.date}T${form.startTime}:00`)
      const endDateTime = new Date(`${form.date}T${form.endTime}:00`)

      const data: any = {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        role: form.role,
        hourlyRate: form.hourlyRate,
        status: 'scheduled',
      }

      if (form.staffId) {
        data.staff = { connect: { id: form.staffId } }
      }

      if (editingShift) {
        await request('/api/graphql', UPDATE_SHIFT, { id: editingShift.id, data })
      } else {
        await request('/api/graphql', CREATE_SHIFT, { data })
      }

      setDialogOpen(false)
      fetchShifts()
    } catch (err) {
      console.error('Error saving shift:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shift?')) return
    try {
      await request('/api/graphql', DELETE_SHIFT, { id })
      fetchShifts()
    } catch (err) {
      console.error('Error deleting shift:', err)
    }
  }

  const getShiftsForDate = (date: Date): Shift[] => {
    return shifts.filter(s => {
      const shiftDate = new Date(s.startTime).toDateString()
      return shiftDate === date.toDateString()
    })
  }

  const getRoleConfig = (role: string) => ROLES.find(r => r.value === role) || ROLES[0]

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
          <h1 className="text-2xl font-bold">Staff Schedule</h1>
          <p className="text-muted-foreground">
            {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setWeekStart(new Date(new Date().setDate(new Date().getDate() - new Date().getDay())))}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => openAddDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 flex-1">
        {weekDates.map((date, i) => {
          const dayShifts = getShiftsForDate(date)
          const isToday = date.toDateString() === new Date().toDateString()
          return (
            <Card key={i} className={`flex flex-col ${isToday ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className={`text-lg ${isToday ? 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center' : ''}`}>
                    {date.getDate()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-2">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-1">
                    {dayShifts.map((shift) => {
                      const roleConfig = getRoleConfig(shift.role)
                      return (
                        <div
                          key={shift.id}
                          className={`p-2 rounded text-xs cursor-pointer hover:opacity-80 ${roleConfig.color} text-white`}
                          onClick={() => openEditDialog(shift)}
                        >
                          <div className="font-bold truncate">{shift.staff?.name || 'Unassigned'}</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                          </div>
                          <Badge variant="secondary" className="mt-1 text-[8px]">
                            {roleConfig.label}
                          </Badge>
                        </div>
                      )
                    })}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-6 mt-1"
                      onClick={() => openAddDialog(date)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShift ? 'Edit Shift' : 'Add Shift'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Staff Member</Label>
              <Select value={form.staffId} onValueChange={(v) => setForm({ ...form, staffId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Hourly Rate ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                {editingShift ? 'Update' : 'Create'} Shift
              </Button>
              {editingShift && (
                <Button variant="destructive" onClick={() => { handleDelete(editingShift.id); setDialogOpen(false); }}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SchedulePage
