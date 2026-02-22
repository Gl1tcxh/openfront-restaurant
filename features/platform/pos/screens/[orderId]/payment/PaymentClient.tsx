'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Banknote,
  CreditCard,
  Gift,
  SplitSquareVertical,
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { gql, request } from 'graphql-request'

interface OrderItem {
  id: string
  quantity: number
  price: string
  menuItem: {
    id: string
    name: string
  } | null
}

interface Payment {
  id: string
  amount: string
  status: string
  paymentMethod: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  subtotal: string
  tax: string
  tip: string
  discount: string
  total: string
  orderItems: OrderItem[]
  payments: Payment[]
  table: {
    id: string
    name: string
  } | null
}

interface SplitPayment {
  id: string
  amount: number
  method: 'cash' | 'card' | 'gift_card'
  status: 'pending' | 'processing' | 'completed'
  giftCardCode?: string
}

const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    restaurantOrder(where: { id: $id }) {
      id
      orderNumber
      status
      subtotal
      tax
      tip
      discount
      total
      orderItems {
        id
        quantity
        price
        menuItem {
          id
          name
        }
      }
      payments {
        id
        amount
        status
        paymentMethod
      }
      table {
        id
        name
      }
    }
  }
`

const PROCESS_PAYMENT = gql`
  mutation ProcessPayment($orderId: String!, $amount: Int!, $paymentMethod: String!, $tipAmount: Int) {
    processPayment(orderId: $orderId, amount: $amount, paymentMethod: $paymentMethod, tipAmount: $tipAmount) {
      success
      paymentId
      clientSecret
      error
    }
  }
`

const CAPTURE_PAYMENT = gql`
  mutation CapturePayment($paymentIntentId: String!) {
    capturePayment(paymentIntentId: $paymentIntentId) {
      success
      status
      error
    }
  }
`

const GET_GIFT_CARD = gql`
  query GetGiftCard($code: String!) {
    giftCards(where: { code: { equals: $code }, isDisabled: { equals: false } }) {
      id
      code
      balance
    }
  }
`

const UPDATE_GIFT_CARD = gql`
  mutation UpdateGiftCard($id: ID!, $balance: Int!) {
    updateGiftCard(where: { id: $id }, data: { balance: $balance }) {
      id
      balance
    }
  }
`

const CREATE_GIFT_CARD_TRANSACTION = gql`
  mutation CreateGiftCardTransaction($data: GiftCardTransactionCreateInput!) {
    createGiftCardTransaction(data: $data) {
      id
    }
  }
`

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: String!) {
    updateRestaurantOrder(where: { id: $id }, data: { status: $status }) {
      id
      status
    }
  }
`

interface PaymentClientProps {
  orderId: string
}

export function PaymentClient({ orderId }: PaymentClientProps) {
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('cash')

  // Cash payment state
  const [cashReceived, setCashReceived] = useState<string>('')

  // Tip state
  const [tipAmount, setTipAmount] = useState<string>('0.00')

  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState<string>('')
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null)
  const [giftCardId, setGiftCardId] = useState<string | null>(null)
  const [giftCardError, setGiftCardError] = useState<string | null>(null)
  const [checkingGiftCard, setCheckingGiftCard] = useState(false)

  // Split payment state
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([])
  const [splitDialogOpen, setSplitDialogOpen] = useState(false)
  const [newSplitAmount, setNewSplitAmount] = useState<string>('')
  const [newSplitMethod, setNewSplitMethod] = useState<'cash' | 'card' | 'gift_card'>('cash')

  // Success dialog
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [changeAmount, setChangeAmount] = useState<number>(0)

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const data = await request('/api/graphql', GET_ORDER, { id: orderId })
      setOrder((data as any).restaurantOrder)
    } catch (err) {
      console.error('Error fetching order:', err)
    } finally {
      setLoading(false)
    }
  }

  const getOrderTotal = (): number => {
    if (!order) return 0
    return parseFloat(order.total) + parseFloat(tipAmount || '0')
  }

  const getAmountPaid = (): number => {
    if (!order) return 0
    return order.payments
      .filter((p) => p.status === 'succeeded')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
  }

  const getRemainingBalance = (): number => {
    return getOrderTotal() - getAmountPaid()
  }

  const getSplitTotal = (): number => {
    return splitPayments.reduce((sum, p) => sum + p.amount, 0)
  }

  const getSplitRemaining = (): number => {
    return getRemainingBalance() - getSplitTotal()
  }

  // Cash payment
  const processCashPayment = async () => {
    if (!order) return

    const total = getRemainingBalance()
    const received = parseFloat(cashReceived || '0')
    
    if (received < total) {
      alert('Cash received is less than the total amount')
      return
    }

    setProcessing(true)
    try {
      const amountInCents = Math.round(total * 100)
      const tipInCents = Math.round(parseFloat(tipAmount || '0') * 100)

      const result = await request('/api/graphql', PROCESS_PAYMENT, {
        orderId: order.id,
        amount: amountInCents,
        paymentMethod: 'cash',
        tipAmount: tipInCents,
      })

      const { success, error } = (result as any).processPayment

      if (success) {
        // Update order status
        await request('/api/graphql', UPDATE_ORDER_STATUS, {
          id: order.id,
          status: 'completed',
        })

        setChangeAmount(received - total)
        setSuccessDialogOpen(true)
      } else {
        alert(`Payment failed: ${error}`)
      }
    } catch (err) {
      console.error('Error processing cash payment:', err)
      alert('Failed to process payment')
    } finally {
      setProcessing(false)
    }
  }

  // Card payment
  const processCardPayment = async () => {
    if (!order) return

    const total = getRemainingBalance()
    setProcessing(true)

    try {
      const amountInCents = Math.round(total * 100)
      const tipInCents = Math.round(parseFloat(tipAmount || '0') * 100)

      const result = await request('/api/graphql', PROCESS_PAYMENT, {
        orderId: order.id,
        amount: amountInCents,
        paymentMethod: 'credit_card',
        tipAmount: tipInCents,
      })

      const { success, paymentId, clientSecret, error } = (result as any).processPayment

      if (success && clientSecret) {
        // In a real implementation, you would use Stripe Elements here
        // For now, we'll simulate a successful card payment by capturing it
        const captureResult = await request('/api/graphql', CAPTURE_PAYMENT, {
          paymentIntentId: clientSecret.split('_secret_')[0],
        })

        const captureData = (captureResult as any).capturePayment
        if (captureData.success) {
          await request('/api/graphql', UPDATE_ORDER_STATUS, {
            id: order.id,
            status: 'completed',
          })
          setChangeAmount(0)
          setSuccessDialogOpen(true)
        } else {
          alert(`Card capture failed: ${captureData.error}`)
        }
      } else if (success) {
        // Payment succeeded without needing capture (e.g., manual provider)
        await request('/api/graphql', UPDATE_ORDER_STATUS, {
          id: order.id,
          status: 'completed',
        })
        setChangeAmount(0)
        setSuccessDialogOpen(true)
      } else {
        alert(`Payment failed: ${error}`)
      }
    } catch (err) {
      console.error('Error processing card payment:', err)
      alert('Failed to process card payment')
    } finally {
      setProcessing(false)
    }
  }

  // Gift card lookup
  const lookupGiftCard = async () => {
    if (!giftCardCode.trim()) return

    setCheckingGiftCard(true)
    setGiftCardError(null)
    setGiftCardBalance(null)
    setGiftCardId(null)

    try {
      const data = await request('/api/graphql', GET_GIFT_CARD, {
        code: giftCardCode.trim(),
      })

      const cards = (data as any).giftCards
      if (cards && cards.length > 0) {
        const card = cards[0]
        setGiftCardBalance(card.balance / 100) // Convert cents to dollars
        setGiftCardId(card.id)
      } else {
        setGiftCardError('Gift card not found or is disabled')
      }
    } catch (err) {
      console.error('Error looking up gift card:', err)
      setGiftCardError('Failed to lookup gift card')
    } finally {
      setCheckingGiftCard(false)
    }
  }

  // Gift card payment
  const processGiftCardPayment = async () => {
    if (!order || !giftCardId || giftCardBalance === null) return

    const total = getRemainingBalance()
    const amountToCharge = Math.min(giftCardBalance, total)

    setProcessing(true)
    try {
      const amountInCents = Math.round(amountToCharge * 100)
      const tipInCents = Math.round(parseFloat(tipAmount || '0') * 100)

      // Process the payment
      const result = await request('/api/graphql', PROCESS_PAYMENT, {
        orderId: order.id,
        amount: amountInCents,
        paymentMethod: 'gift_card',
        tipAmount: tipInCents,
      })

      const { success, error } = (result as any).processPayment

      if (success) {
        // Update gift card balance
        const newBalance = Math.round((giftCardBalance - amountToCharge) * 100)
        await request('/api/graphql', UPDATE_GIFT_CARD, {
          id: giftCardId,
          balance: newBalance,
        })

        // Create gift card transaction
        await request('/api/graphql', CREATE_GIFT_CARD_TRANSACTION, {
          data: {
            amount: -amountInCents,
            giftCard: { connect: { id: giftCardId } },
            order: { connect: { id: order.id } },
          },
        })

        // If fully paid, complete the order
        if (amountToCharge >= total) {
          await request('/api/graphql', UPDATE_ORDER_STATUS, {
            id: order.id,
            status: 'completed',
          })
          setChangeAmount(0)
          setSuccessDialogOpen(true)
        } else {
          // Partial payment - refresh order to show updated balance
          await fetchOrder()
          setGiftCardCode('')
          setGiftCardBalance(null)
          setGiftCardId(null)
          alert(`$${amountToCharge.toFixed(2)} charged to gift card. Remaining balance: $${(total - amountToCharge).toFixed(2)}`)
        }
      } else {
        alert(`Payment failed: ${error}`)
      }
    } catch (err) {
      console.error('Error processing gift card payment:', err)
      alert('Failed to process gift card payment')
    } finally {
      setProcessing(false)
    }
  }

  // Split payment functions
  const addSplitPayment = () => {
    const amount = parseFloat(newSplitAmount || '0')
    if (amount <= 0) return
    if (amount > getSplitRemaining()) {
      alert('Amount exceeds remaining balance')
      return
    }

    setSplitPayments([
      ...splitPayments,
      {
        id: Date.now().toString(),
        amount,
        method: newSplitMethod,
        status: 'pending',
      },
    ])
    setNewSplitAmount('')
    setSplitDialogOpen(false)
  }

  const removeSplitPayment = (id: string) => {
    setSplitPayments(splitPayments.filter((p) => p.id !== id))
  }

  const processSplitPayments = async () => {
    if (!order || splitPayments.length === 0) return

    setProcessing(true)
    try {
      for (let i = 0; i < splitPayments.length; i++) {
        const split = splitPayments[i]
        const amountInCents = Math.round(split.amount * 100)
        
        // Update status to processing
        setSplitPayments((prev) =>
          prev.map((p) => (p.id === split.id ? { ...p, status: 'processing' } : p))
        )

        const result = await request('/api/graphql', PROCESS_PAYMENT, {
          orderId: order.id,
          amount: amountInCents,
          paymentMethod: split.method === 'card' ? 'credit_card' : split.method,
          tipAmount: i === 0 ? Math.round(parseFloat(tipAmount || '0') * 100) : 0,
        })

        const { success, clientSecret, error } = (result as any).processPayment

        if (success) {
          if (split.method === 'card' && clientSecret) {
            // Capture card payment
            await request('/api/graphql', CAPTURE_PAYMENT, {
              paymentIntentId: clientSecret.split('_secret_')[0],
            })
          }

          setSplitPayments((prev) =>
            prev.map((p) => (p.id === split.id ? { ...p, status: 'completed' } : p))
          )
        } else {
          alert(`Payment ${i + 1} failed: ${error}`)
          setProcessing(false)
          return
        }
      }

      // All payments successful
      await request('/api/graphql', UPDATE_ORDER_STATUS, {
        id: order.id,
        status: 'completed',
      })
      setChangeAmount(0)
      setSuccessDialogOpen(true)
    } catch (err) {
      console.error('Error processing split payments:', err)
      alert('Failed to process split payments')
    } finally {
      setProcessing(false)
    }
  }

  const handleSuccessClose = () => {
    setSuccessDialogOpen(false)
    router.push('/dashboard/platform/pos')
  }

  const quickCashAmounts = [20, 50, 100]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Order not found</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/platform/pos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to POS
        </Button>
      </div>
    )
  }

  const remaining = getRemainingBalance()

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4 p-4">
      {/* Order Summary */}
      <Card className="w-96 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order #{order.orderNumber}</CardTitle>
            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
              {order.status}
            </Badge>
          </div>
          {order.table && (
            <p className="text-sm text-muted-foreground">Table: {order.table.name}</p>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="space-y-2">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.menuItem?.name || 'Unknown Item'}
                </span>
                <span>${parseFloat(item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>${parseFloat(order.tax).toFixed(2)}</span>
            </div>
            {parseFloat(order.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${parseFloat(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>Tip</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-24 h-8 text-right"
              />
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${getOrderTotal().toFixed(2)}</span>
            </div>
            {getAmountPaid() > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Paid</span>
                  <span>-${getAmountPaid().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-primary">
                  <span>Remaining</span>
                  <span>${remaining.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cash" className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Cash
              </TabsTrigger>
              <TabsTrigger value="card" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Card
              </TabsTrigger>
              <TabsTrigger value="gift_card" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Gift Card
              </TabsTrigger>
              <TabsTrigger value="split" className="flex items-center gap-2">
                <SplitSquareVertical className="h-4 w-4" />
                Split
              </TabsTrigger>
            </TabsList>

            {/* Cash Payment */}
            <TabsContent value="cash" className="flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <div>
                  <Label>Amount Due</Label>
                  <div className="text-3xl font-bold">${remaining.toFixed(2)}</div>
                </div>

                <div>
                  <Label>Cash Received</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="text-2xl h-14"
                  />
                </div>

                <div className="flex gap-2">
                  {quickCashAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      className="flex-1"
                      onClick={() => setCashReceived(amount.toString())}
                    >
                      ${amount}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCashReceived(Math.ceil(remaining).toString())}
                  >
                    Exact
                  </Button>
                </div>

                {parseFloat(cashReceived || '0') >= remaining && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-muted-foreground">Change Due</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${(parseFloat(cashReceived || '0') - remaining).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="w-full mt-4"
                onClick={processCashPayment}
                disabled={processing || parseFloat(cashReceived || '0') < remaining}
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Complete Cash Payment
              </Button>
            </TabsContent>

            {/* Card Payment */}
            <TabsContent value="card" className="flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <div>
                  <Label>Amount to Charge</Label>
                  <div className="text-3xl font-bold">${remaining.toFixed(2)}</div>
                </div>

                <div className="p-8 border-2 border-dashed rounded-lg text-center">
                  <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Ready for Card</p>
                  <p className="text-sm text-muted-foreground">
                    Insert, tap, or swipe card to process payment
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full mt-4"
                onClick={processCardPayment}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Process Card Payment
              </Button>
            </TabsContent>

            {/* Gift Card Payment */}
            <TabsContent value="gift_card" className="flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <div>
                  <Label>Amount Due</Label>
                  <div className="text-3xl font-bold">${remaining.toFixed(2)}</div>
                </div>

                <div className="space-y-2">
                  <Label>Gift Card Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter gift card code"
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                    />
                    <Button
                      variant="outline"
                      onClick={lookupGiftCard}
                      disabled={checkingGiftCard || !giftCardCode.trim()}
                    >
                      {checkingGiftCard ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lookup'}
                    </Button>
                  </div>
                </div>

                {giftCardError && (
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-red-600">{giftCardError}</p>
                  </div>
                )}

                {giftCardBalance !== null && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-muted-foreground">Gift Card Balance</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${giftCardBalance.toFixed(2)}
                    </p>
                    {giftCardBalance < remaining && (
                      <p className="text-sm text-yellow-600 mt-2">
                        Partial payment: ${giftCardBalance.toFixed(2)} will be charged, 
                        ${(remaining - giftCardBalance).toFixed(2)} remaining
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="w-full mt-4"
                onClick={processGiftCardPayment}
                disabled={processing || !giftCardId}
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Gift className="mr-2 h-4 w-4" />
                )}
                Apply Gift Card
              </Button>
            </TabsContent>

            {/* Split Payment */}
            <TabsContent value="split" className="flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <div className="flex justify-between">
                  <div>
                    <Label>Total to Split</Label>
                    <div className="text-2xl font-bold">${remaining.toFixed(2)}</div>
                  </div>
                  <div>
                    <Label>Remaining</Label>
                    <div className="text-2xl font-bold text-primary">
                      ${getSplitRemaining().toFixed(2)}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {splitPayments.map((payment, index) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="capitalize">{payment.method.replace('_', ' ')}</span>
                        <span className="font-medium">${payment.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {payment.status === 'completed' && (
                          <Badge variant="default" className="bg-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        )}
                        {payment.status === 'processing' && (
                          <Badge variant="secondary">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Processing
                          </Badge>
                        )}
                        {payment.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSplitPayment(payment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {getSplitRemaining() > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSplitDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Split Payment
                    </Button>
                  )}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full mt-4"
                onClick={processSplitPayments}
                disabled={processing || splitPayments.length === 0 || getSplitRemaining() > 0.01}
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Process All Payments ({splitPayments.length})
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Split Payment Dialog */}
      <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Split Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={getSplitRemaining()}
                placeholder={`Max: $${getSplitRemaining().toFixed(2)}`}
                value={newSplitAmount}
                onChange={(e) => setNewSplitAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant={newSplitMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setNewSplitMethod('cash')}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Cash
                </Button>
                <Button
                  variant={newSplitMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setNewSplitMethod('card')}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Card
                </Button>
                <Button
                  variant={newSplitMethod === 'gift_card' ? 'default' : 'outline'}
                  onClick={() => setNewSplitMethod('gift_card')}
                >
                  <Gift className="mr-2 h-4 w-4" />
                  Gift Card
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSplitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addSplitPayment} disabled={!newSplitAmount || parseFloat(newSplitAmount) <= 0}>
              Add Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-6 w-6" />
              Payment Successful!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Order #{order.orderNumber} has been paid and completed.
              {changeAmount > 0 && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Change Due</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${changeAmount.toFixed(2)}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccessClose}>
              Return to POS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
