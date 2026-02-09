'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
} from '@/components/ui/dialog'
import { Users, Clock, RefreshCw, MoveHorizontal, Merge } from 'lucide-react'
import { gql, request } from 'graphql-request'
import { useRouter } from 'next/navigation'

interface Table {
  id: string
  tableNumber: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  shape: 'round' | 'square' | 'rectangle'
  positionX: number
  positionY: number
  floor: {
    id: string
    name: string
  } | null
  section: {
    id: string
    name: string
  } | null
}

interface Floor {
  id: string
  name: string
  level: number
  isActive: boolean
}

interface TableOrder {
  id: string
  orderNumber: string
  status: string
  total: string
  createdAt: string
  guestCount: number
}

const GET_FLOORS = gql`
  query GetFloors {
    floors(where: { isActive: { equals: true } }, orderBy: { level: asc }) {
      id
      name
      level
      isActive
    }
  }
`

const GET_TABLES = gql`
  query GetTables($floorId: ID) {
    tables(
      where: { floor: { id: { equals: $floorId } } }
      orderBy: { tableNumber: asc }
    ) {
      id
      tableNumber
      capacity
      status
      shape
      positionX
      positionY
      floor {
        id
        name
      }
      section {
        id
        name
      }
    }
  }
`

const GET_ALL_TABLES = gql`
  query GetAllTables {
    tables(orderBy: { tableNumber: asc }) {
      id
      tableNumber
      capacity
      status
      shape
      positionX
      positionY
      floor {
        id
        name
      }
      section {
        id
        name
      }
    }
  }
`

const GET_TABLE_ORDER = gql`
  query GetTableOrder($tableId: ID!) {
    restaurantOrders(
      where: {
        tables: { some: { id: { equals: $tableId } } }
        status: { in: ["open", "sent_to_kitchen", "in_progress", "ready", "served"] }
      }
      orderBy: { createdAt: desc }
      take: 1
    ) {
      id
      orderNumber
      status
      total
      createdAt
      guestCount
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

const TRANSFER_TABLE = gql`
  mutation TransferTable($orderId: String!, $fromTableId: String!, $toTableId: String!) {
    transferTable(orderId: $orderId, fromTableId: $fromTableId, toTableId: $toTableId) {
      success
      error
    }
  }
`

const COMBINE_TABLES = gql`
  mutation CombineTables($orderId: String!, $tableIds: [String!]!) {
    combineTables(orderId: $orderId, tableIds: $tableIds) {
      success
      error
    }
  }
`

const STATUS_COLORS: Record<string, { fill: string; stroke: string; text: string; label: string }> = {
  available: { fill: '#22c55e', stroke: '#16a34a', text: '#ffffff', label: 'Available' },
  occupied: { fill: '#ef4444', stroke: '#dc2626', text: '#ffffff', label: 'Occupied' },
  reserved: { fill: '#f59e0b', stroke: '#d97706', text: '#ffffff', label: 'Reserved' },
  cleaning: { fill: '#6b7280', stroke: '#4b5563', text: '#ffffff', label: 'Cleaning' },
}

const FLOOR_PLAN_WIDTH = 800
const FLOOR_PLAN_HEIGHT = 600
const TABLE_SIZE = 60

export function FloorPlanClient() {
  const router = useRouter()
  const [floors, setFloors] = useState<Floor[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [selectedFloor, setSelectedFloor] = useState<string>('all')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [tableOrder, setTableOrder] = useState<TableOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [combineDialogOpen, setCombineDialogOpen] = useState(false)
  const [targetTableId, setTargetTableId] = useState<string>('')
  const [tablesToCombine, setTablesToCombine] = useState<string[]>([])

  const fetchTables = useCallback(async () => {
    try {
      let data
      if (selectedFloor === 'all') {
        data = await request('/api/graphql', GET_ALL_TABLES)
      } else {
        data = await request('/api/graphql', GET_TABLES, { floorId: selectedFloor })
      }
      setTables((data as any).tables || [])
    } catch (err) {
      console.error('Error fetching tables:', err)
    }
  }, [selectedFloor])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [floorsData, tablesData] = await Promise.all([
          request('/api/graphql', GET_FLOORS),
          request('/api/graphql', GET_ALL_TABLES),
        ])
        setFloors((floorsData as any).floors || [])
        setTables((tablesData as any).tables || [])
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchTables()
    }
  }, [selectedFloor, loading, fetchTables])

  const handleTableClick = async (table: Table) => {
    setSelectedTable(table)
    setDialogOpen(true)
    
    if (table.status === 'occupied') {
      try {
        const data = await request('/api/graphql', GET_TABLE_ORDER, { tableId: table.id })
        const orders = (data as any).restaurantOrders || []
        setTableOrder(orders[0] || null)
      } catch (err) {
        console.error('Error fetching table order:', err)
        setTableOrder(null)
      }
    } else {
      setTableOrder(null)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!selectedTable) return

    try {
      await request('/api/graphql', UPDATE_TABLE_STATUS, {
        id: selectedTable.id,
        status,
      })
      await fetchTables()
      setDialogOpen(false)
    } catch (err) {
      console.error('Error updating table status:', err)
    }
  }

  const handleTransfer = async () => {
    if (!tableOrder || !selectedTable || !targetTableId) return

    try {
      const result: any = await request('/api/graphql', TRANSFER_TABLE, {
        orderId: tableOrder.id,
        fromTableId: selectedTable.id,
        toTableId: targetTableId
      })

      if (result.transferTable.success) {
        await fetchTables()
        setTransferDialogOpen(false)
        setDialogOpen(false)
        setTargetTableId('')
      } else {
        alert(result.transferTable.error)
      }
    } catch (err) {
      console.error('Error transferring table:', err)
    }
  }

  const handleCombine = async () => {
    if (!tableOrder || tablesToCombine.length === 0) return

    try {
      const result: any = await request('/api/graphql', COMBINE_TABLES, {
        orderId: tableOrder.id,
        tableIds: tablesToCombine
      })

      if (result.combineTables.success) {
        await fetchTables()
        setCombineDialogOpen(false)
        setDialogOpen(false)
        setTablesToCombine([])
      } else {
        alert(result.combineTables.error)
      }
    } catch (err) {
      console.error('Error combining tables:', err)
    }
  }

  const handleStartOrder = () => {
    if (selectedTable) {
      router.push(`/dashboard/pos?tableId=${selectedTable.id}`)
    }
  }

  const handleViewOrder = () => {
    if (tableOrder) {
      router.push(`/dashboard/pos/${tableOrder.id}/payment`)
    }
  }

  const renderTableShape = (table: Table, x: number, y: number) => {
    const colors = STATUS_COLORS[table.status] || STATUS_COLORS.available
    const size = TABLE_SIZE
    const halfSize = size / 2

    switch (table.shape) {
      case 'round':
        return (
          <circle
            cx={x + halfSize}
            cy={y + halfSize}
            r={halfSize - 2}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth={2}
          />
        )
      case 'square':
        return (
          <rect
            x={x + 2}
            y={y + 2}
            width={size - 4}
            height={size - 4}
            rx={4}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth={2}
          />
        )
      case 'rectangle':
      default:
        return (
          <rect
            x={x + 2}
            y={y + 2}
            width={size * 1.5 - 4}
            height={size - 4}
            rx={4}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth={2}
          />
        )
    }
  }

  const getTableWidth = (shape: string) => {
    return shape === 'rectangle' ? TABLE_SIZE * 1.5 : TABLE_SIZE
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const statusCounts = tables.reduce((acc, table) => {
    acc[table.status] = (acc[table.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floors.map((floor) => (
                <SelectItem key={floor.id} value={floor.id}>
                  {floor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchTables}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Status Legend */}
        <div className="flex items-center gap-4">
          {Object.entries(STATUS_COLORS).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colors.fill }}
              />
              <span className="text-sm">
                {colors.label} ({statusCounts[status] || 0})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floor Plan */}
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <CardTitle>Floor Plan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="p-4 flex justify-center">
              <svg
                width={FLOOR_PLAN_WIDTH}
                height={FLOOR_PLAN_HEIGHT}
                className="border rounded-lg bg-muted/30"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="50"
                    height="50"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 50 0 L 0 0 0 50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      opacity="0.1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {tables.map((table) => {
                  const x = table.positionX * 80 + 50
                  const y = table.positionY * 80 + 50
                  const colors = STATUS_COLORS[table.status] || STATUS_COLORS.available
                  const tableWidth = getTableWidth(table.shape)

                  return (
                    <g
                      key={table.id}
                      className="cursor-pointer transition-transform hover:scale-105"
                      onClick={() => handleTableClick(table)}
                    >
                      {renderTableShape(table, x, y)}
                      
                      <text
                        x={x + tableWidth / 2}
                        y={y + TABLE_SIZE / 2 - 6}
                        textAnchor="middle"
                        fill={colors.text}
                        fontSize="14"
                        fontWeight="bold"
                      >
                        {table.tableNumber}
                      </text>
                      
                      <text
                        x={x + tableWidth / 2}
                        y={y + TABLE_SIZE / 2 + 10}
                        textAnchor="middle"
                        fill={colors.text}
                        fontSize="10"
                        opacity="0.9"
                      >
                        <tspan>{table.capacity}</tspan>
                        <tspan dx="2">👤</tspan>
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Table Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Table {selectedTable?.tableNumber}
              {selectedTable && (
                <Badge
                  style={{
                    backgroundColor: STATUS_COLORS[selectedTable.status]?.fill,
                    color: STATUS_COLORS[selectedTable.status]?.text,
                  }}
                >
                  {STATUS_COLORS[selectedTable.status]?.label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedTable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Capacity: {selectedTable.capacity}</span>
                </div>
              </div>

              {tableOrder && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Active Order</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium">#{tableOrder.orderNumber}</div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(tableOrder.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${parseFloat(tableOrder.total).toFixed(2)}</div>
                        <Badge variant="outline">{tableOrder.status}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" onClick={() => setTransferDialogOpen(true)}>
                        <MoveHorizontal className="h-4 w-4 mr-2" />
                        Transfer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setCombineDialogOpen(true)}>
                        <Merge className="h-4 w-4 mr-2" />
                        Combine
                      </Button>
                    </div>
                    <Button className="w-full" size="sm" onClick={handleViewOrder}>
                      View Order
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">Change Status</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                    <Button
                      key={status}
                      variant={selectedTable.status === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(status)}
                      disabled={selectedTable.status === status}
                      style={selectedTable.status === status ? { backgroundColor: colors.fill, color: colors.text } : {}}
                    >
                      {colors.label}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedTable.status === 'available' && (
                <Button className="w-full" onClick={handleStartOrder}>
                  Start New Order
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Table {selectedTable?.tableNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Target Table</Label>
              <Select value={targetTableId} onValueChange={setTargetTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Target table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.filter(t => t.status === 'available' && t.id !== selectedTable?.id).map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      Table {t.tableNumber} (Cap: {t.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleTransfer} disabled={!targetTableId}>
              Transfer Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Combine Dialog */}
      <Dialog open={combineDialogOpen} onOpenChange={setCombineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Combine Tables with {selectedTable?.tableNumber}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-2 gap-4">
              {tables.filter(t => t.status === 'available' && t.id !== selectedTable?.id).map(t => (
                <div key={t.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted cursor-pointer" onClick={() => {
                  setTablesToCombine(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])
                }}>
                  <Checkbox checked={tablesToCombine.includes(t.id)} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Table {t.tableNumber}</span>
                    <span className="text-xs text-muted-foreground">Cap: {t.capacity}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Button className="w-full mt-4" onClick={handleCombine} disabled={tablesToCombine.length === 0}>
            Combine {tablesToCombine.length} Table(s)
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{children}</label>
}
