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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Clock, Phone, Plus, Bell, Check, X, UserX } from 'lucide-react'
import { gql, request } from 'graphql-request'

interface WaitlistEntry {
  id: string
  customerName: string
  phoneNumber: string
  partySize: number
  quotedWaitTime: number
  status: 'waiting' | 'notified' | 'seated' | 'cancelled' | 'no_show'
  addedAt: string
  notifiedAt: string | null
  seatedAt: string | null
  notes: string | null
  table: { id: string; tableNumber: string } | null
}

interface Table {
  id: string
  tableNumber: string
  capacity: number
  status: string
}

const GET_WAITLIST = gql`
  query GetWaitlist {
    waitlistEntries(
      where: { status: { in: ["waiting", "notified"] } }
      orderBy: { addedAt: asc }
    ) {
      id
      customerName
      phoneNumber
      partySize
      quotedWaitTime
      status
      addedAt
      notifiedAt
      seatedAt
      notes
      table {
        id
        tableNumber
      }
    }
  }
`

const GET_AVAILABLE_TABLES = gql`
  query GetAvailableTables($minCapacity: Int) {
    tables(
      where: { 
        status: { equals: "available" }
        capacity: { gte: $minCapacity }
      }
      orderBy: { capacity: asc }
    ) {
      id
      tableNumber
      capacity
      status
    }
  }
`

const CREATE_WAITLIST_ENTRY = gql`
  mutation CreateWaitlistEntry($data: WaitlistEntryCreateInput!) {
    createWaitlistEntry(data: $data) {
      id
      customerName
    }
  }
`

const UPDATE_WAITLIST_ENTRY = gql`
  mutation UpdateWaitlistEntry($id: ID!, $data: WaitlistEntryUpdateInput!) {
    updateWaitlistEntry(where: { id: $id }, data: $data) {
      id
      status
    }
  }
`

const UPDATE_TABLE_STATUS = gql`
  mutation UpdateTableStatus($id: ID!, $status: String!) {
    updateTable(where: { id: $id }, data: { status: $status }) {
      id
      status
    }
  }
`

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  waiting: { color: 'bg-yellow-500', label: 'Waiting', icon: <Clock className="h-4 w-4" /> },
  notified: { color: 'bg-blue-500', label: 'Notified', icon: <Bell className="h-4 w-4" /> },
  seated: { color: 'bg-green-500', label: 'Seated', icon: <Check className="h-4 w-4" /> },
  cancelled: { color: 'bg-gray-500', label: 'Cancelled', icon: <X className="h-4 w-4" /> },
  no_show: { color: 'bg-red-500', label: 'No Show', icon: <UserX className="h-4 w-4" /> },
}

export function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [seatDialogOpen, setSeatDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null)
  const [selectedTableId, setSelectedTableId] = useState<string>('')

  const [newEntry, setNewEntry] = useState({
    customerName: '',
    phoneNumber: '',
    partySize: 2,
    quotedWaitTime: 15,
    notes: '',
  })

  const fetchWaitlist = useCallback(async () => {
    try {
      const data = await request('/api/graphql', GET_WAITLIST)
      setEntries((data as any).waitlistEntries || [])
    } catch (err) {
      console.error('Error fetching waitlist:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAvailableTables = useCallback(async (minCapacity: number) => {
    try {
      const data = await request('/api/graphql', GET_AVAILABLE_TABLES, { minCapacity })
      setAvailableTables((data as any).tables || [])
    } catch (err) {
      console.error('Error fetching tables:', err)
    }
  }, [])

  useEffect(() => {
    fetchWaitlist()
    const interval = setInterval(fetchWaitlist, 30000)
    return () => clearInterval(interval)
  }, [fetchWaitlist])

  const handleAddEntry = async () => {
    try {
      await request('/api/graphql', CREATE_WAITLIST_ENTRY, {
        data: {
          customerName: newEntry.customerName,
          phoneNumber: newEntry.phoneNumber,
          partySize: newEntry.partySize,
          quotedWaitTime: newEntry.quotedWaitTime,
          notes: newEntry.notes || null,
          status: 'waiting',
        },
      })
      setAddDialogOpen(false)
      setNewEntry({ customerName: '', phoneNumber: '', partySize: 2, quotedWaitTime: 15, notes: '' })
      fetchWaitlist()
    } catch (err) {
      console.error('Error adding entry:', err)
    }
  }

  const handleNotify = async (entry: WaitlistEntry) => {
    try {
      await request('/api/graphql', UPDATE_WAITLIST_ENTRY, {
        id: entry.id,
        data: { 
          status: 'notified',
          notifiedAt: new Date().toISOString(),
        },
      })
      fetchWaitlist()
    } catch (err) {
      console.error('Error notifying:', err)
    }
  }

  const handleSeatClick = async (entry: WaitlistEntry) => {
    setSelectedEntry(entry)
    await fetchAvailableTables(entry.partySize)
    setSeatDialogOpen(true)
  }

  const handleSeat = async () => {
    if (!selectedEntry || !selectedTableId) return

    try {
      await Promise.all([
        request('/api/graphql', UPDATE_WAITLIST_ENTRY, {
          id: selectedEntry.id,
          data: {
            status: 'seated',
            seatedAt: new Date().toISOString(),
            table: { connect: { id: selectedTableId } },
          },
        }),
        request('/api/graphql', UPDATE_TABLE_STATUS, {
          id: selectedTableId,
          status: 'occupied',
        }),
      ])
      setSeatDialogOpen(false)
      setSelectedEntry(null)
      setSelectedTableId('')
      fetchWaitlist()
    } catch (err) {
      console.error('Error seating:', err)
    }
  }

  const handleCancel = async (entry: WaitlistEntry) => {
    try {
      await request('/api/graphql', UPDATE_WAITLIST_ENTRY, {
        id: entry.id,
        data: { status: 'cancelled' },
      })
      fetchWaitlist()
    } catch (err) {
      console.error('Error cancelling:', err)
    }
  }

  const handleNoShow = async (entry: WaitlistEntry) => {
    try {
      await request('/api/graphql', UPDATE_WAITLIST_ENTRY, {
        id: entry.id,
        data: { status: 'no_show' },
      })
      fetchWaitlist()
    } catch (err) {
      console.error('Error marking no show:', err)
    }
  }

  const getWaitTime = (addedAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(addedAt).getTime()) / 60000)
    return minutes
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const waitingCount = entries.filter(e => e.status === 'waiting').length
  const notifiedCount = entries.filter(e => e.status === 'notified').length

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Waitlist</h1>
          <p className="text-muted-foreground">
            {waitingCount} waiting, {notifiedCount} notified
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add to Waitlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Waitlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={newEntry.customerName}
                  onChange={(e) => setNewEntry({ ...newEntry, customerName: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={newEntry.phoneNumber}
                  onChange={(e) => setNewEntry({ ...newEntry, phoneNumber: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Party Size</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newEntry.partySize}
                    onChange={(e) => setNewEntry({ ...newEntry, partySize: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>Quoted Wait (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newEntry.quotedWaitTime}
                    onChange={(e) => setNewEntry({ ...newEntry, quotedWaitTime: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  placeholder="Special requests, high chair needed, etc."
                />
              </div>
              <Button onClick={handleAddEntry} className="w-full">
                Add to Waitlist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {entries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No one on the waitlist
              </CardContent>
            </Card>
          ) : (
            entries.map((entry, index) => {
              const waitTime = getWaitTime(entry.addedAt)
              const isOverQuoted = waitTime > entry.quotedWaitTime
              const config = STATUS_CONFIG[entry.status]

              return (
                <Card key={entry.id} className={isOverQuoted && entry.status === 'waiting' ? 'border-red-500' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{entry.customerName}</span>
                            <Badge className={config.color}>
                              {config.icon}
                              <span className="ml-1">{config.label}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {entry.partySize}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {entry.phoneNumber}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {waitTime} min
                              {isOverQuoted && entry.status === 'waiting' && (
                                <span className="text-red-500 ml-1">
                                  (+{waitTime - entry.quotedWaitTime} over)
                                </span>
                              )}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.status === 'waiting' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleNotify(entry)}>
                              <Bell className="h-4 w-4 mr-1" />
                              Notify
                            </Button>
                            <Button size="sm" onClick={() => handleSeatClick(entry)}>
                              <Check className="h-4 w-4 mr-1" />
                              Seat
                            </Button>
                          </>
                        )}
                        {entry.status === 'notified' && (
                          <>
                            <Button size="sm" onClick={() => handleSeatClick(entry)}>
                              <Check className="h-4 w-4 mr-1" />
                              Seat
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleNoShow(entry)}>
                              <UserX className="h-4 w-4 mr-1" />
                              No Show
                            </Button>
                          </>
                        )}
                        {(entry.status === 'waiting' || entry.status === 'notified') && (
                          <Button size="sm" variant="ghost" onClick={() => handleCancel(entry)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>

      <Dialog open={seatDialogOpen} onOpenChange={setSeatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seat {selectedEntry?.customerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Party of {selectedEntry?.partySize}
            </p>
            <div>
              <Label>Select Table</Label>
              <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available tables
                    </SelectItem>
                  ) : (
                    availableTables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        Table {table.tableNumber} (seats {table.capacity})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSeat}
              className="w-full"
              disabled={!selectedTableId}
            >
              Seat at Table
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WaitlistPage
