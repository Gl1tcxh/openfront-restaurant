'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { gql, request } from 'graphql-request'
import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe2, Save, Store, CalendarClock } from 'lucide-react'
import {
  WeeklyHoursEditor,
  type DayKey,
  type HoursState,
} from '@/features/platform/store-settings/components/WeeklyHoursEditor'

interface StoreSettingsData {
  id?: string
  name: string
  tagline?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  currencyCode?: string | null
  locale?: string | null
  timezone?: string | null
  countryCode?: string | null
  deliveryFee?: string | null
  deliveryMinimum?: string | null
  pickupDiscount?: number | null
  estimatedDelivery?: string | null
  estimatedPickup?: string | null
  promoBanner?: string | null
  hours?: any
}

const UPDATE_STORE_SETTINGS = gql`
  mutation UpdateStoreSettings($id: ID!, $data: StoreSettingsUpdateInput!) {
    updateStoreSettings(where: { id: $id }, data: $data) {
      id
      name
      currencyCode
      locale
      timezone
      hours
    }
  }
`

const CREATE_STORE_SETTINGS = gql`
  mutation CreateStoreSettings($data: StoreSettingsCreateInput!) {
    createStoreSettings(data: $data) {
      id
      name
    }
  }
`

const days: Array<{ key: DayKey; label: string; short: string }> = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
]

const defaultHours: HoursState = {
  monday: { enabled: true, ranges: [{ open: '11:00', close: '22:00' }] },
  tuesday: { enabled: true, ranges: [{ open: '11:00', close: '22:00' }] },
  wednesday: { enabled: true, ranges: [{ open: '11:00', close: '22:00' }] },
  thursday: { enabled: true, ranges: [{ open: '11:00', close: '22:00' }] },
  friday: { enabled: true, ranges: [{ open: '11:00', close: '23:00' }] },
  saturday: { enabled: true, ranges: [{ open: '10:00', close: '23:00' }] },
  sunday: { enabled: true, ranges: [{ open: '10:00', close: '21:00' }] },
}

function to12Hour(time24: string, locale = 'en-US', timezone = 'UTC') {
  const [hour, minute] = time24.split(':').map((v) => Number.parseInt(v, 10))
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(d)
}

function toTimeInput(raw: string): string {
  if (!raw) return '11:00'
  const normalized = raw.trim().toLowerCase()
  if (/^\d{2}:\d{2}$/.test(normalized)) return normalized
  const m = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/)
  if (!m) return '11:00'

  let h = Number.parseInt(m[1], 10)
  const mins = Number.parseInt(m[2] || '0', 10)
  if (m[3] === 'pm' && h < 12) h += 12
  if (m[3] === 'am' && h === 12) h = 0

  return `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function parseHours(raw: any): HoursState {
  if (!raw || typeof raw !== 'object') return defaultHours
  const out: any = { ...defaultHours }

  for (const day of days) {
    const value = raw[day.key]
    if (!value) continue

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (!normalized || normalized === 'closed') {
        out[day.key] = { enabled: false, ranges: [] }
        continue
      }

      const [open, close] = value.split('-').map((s: string) => s.trim())
      if (open && close) {
        out[day.key] = { enabled: true, ranges: [{ open: toTimeInput(open), close: toTimeInput(close) }] }
      }
      continue
    }

    if (typeof value === 'object') {
      const enabled = value.enabled !== false
      if (Array.isArray(value.ranges) && value.ranges.length) {
        out[day.key] = {
          enabled,
          ranges: value.ranges.map((r: any) => ({
            open: toTimeInput(r.open || '11:00'),
            close: toTimeInput(r.close || '22:00'),
          })),
        }
      } else if (value.open && value.close) {
        out[day.key] = { enabled, ranges: [{ open: toTimeInput(value.open), close: toTimeInput(value.close) }] }
      } else {
        out[day.key] = { enabled, ranges: enabled ? [{ open: '11:00', close: '22:00' }] : [] }
      }
    }
  }

  return out
}

function serializeHours(hours: HoursState) {
  const payload: Record<string, any> = {}
  for (const day of days) {
    const item = hours[day.key]
    payload[day.key] = { enabled: item.enabled, ranges: item.enabled ? item.ranges : [] }
  }
  return payload
}

const timezoneOptions = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Karachi',
  'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
]
const localeOptions = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'ar-AE', 'hi-IN', 'ja-JP']
const currencyOptions = ['USD', 'EUR', 'GBP', 'AED', 'PKR', 'INR', 'JPY', 'AUD', 'CAD', 'SAR']

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
      <div className="px-5 py-3 flex items-center gap-2 bg-muted/20">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[11px] uppercase tracking-wider font-semibold text-foreground">{title}</span>
      </div>
      {children}
    </div>
  )
}

const fieldInput = "h-auto px-0 py-0 border-0 shadow-none bg-transparent text-sm font-semibold mt-1.5 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40 placeholder:font-normal w-full"
const fieldSelect = "h-auto px-0 py-0 border-0 shadow-none bg-transparent text-sm font-semibold mt-1.5 focus:ring-0 focus:ring-offset-0 [&>svg]:size-3.5 [&>svg]:opacity-40 [&>svg]:ml-1 gap-0 w-full [&>span]:text-left [&>span]:truncate [&>span]:block"

export function StoreSettingsPage({ initialSettings }: { initialSettings: StoreSettingsData | null }) {
  const [isSaving, setIsSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: initialSettings?.name || 'Openfront Restaurant',
    tagline: initialSettings?.tagline || '',
    address: initialSettings?.address || '',
    phone: initialSettings?.phone || '',
    email: initialSettings?.email || '',
    currencyCode: initialSettings?.currencyCode || 'USD',
    locale: initialSettings?.locale || 'en-US',
    timezone: initialSettings?.timezone || 'America/New_York',
    countryCode: initialSettings?.countryCode || 'US',
    deliveryFee: initialSettings?.deliveryFee || '4.99',
    deliveryMinimum: initialSettings?.deliveryMinimum || '15.00',
    pickupDiscount: initialSettings?.pickupDiscount ?? 10,
    estimatedDelivery: initialSettings?.estimatedDelivery || '30-45 min',
    estimatedPickup: initialSettings?.estimatedPickup || '15-20 min',
    promoBanner: initialSettings?.promoBanner || '',
  })

  const [hours, setHours] = useState<HoursState>(parseHours(initialSettings?.hours))

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: '' },
    { type: 'page' as const, label: 'Platform' },
    { type: 'page' as const, label: 'Store Settings' },
  ]

  const todaySummary = useMemo(() => {
    const day = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
    const today = hours[day.key]
    if (!today.enabled || today.ranges.length === 0) return `${day.label}: Closed`
    const first = today.ranges[0]
    return `${day.label}: ${to12Hour(first.open, form.locale, form.timezone)} to ${to12Hour(first.close, form.locale, form.timezone)}`
  }, [hours, form.locale, form.timezone])

  const openDaysCount = useMemo(() => days.filter((d) => hours[d.key].enabled).length, [hours])

  const setDayEnabled = (day: DayKey, enabled: boolean) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled,
        ranges: enabled && prev[day].ranges.length === 0 ? [{ open: '11:00', close: '22:00' }] : prev[day].ranges,
      },
    }))
  }

  const setRangeValue = (day: DayKey, idx: number, key: 'open' | 'close', value: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        ranges: prev[day].ranges.map((r, i) => (i === idx ? { ...r, [key]: value } : r)),
      },
    }))
  }

  const addRange = (day: DayKey) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], ranges: [...prev[day].ranges, { open: '11:00', close: '15:00' }] },
    }))
  }

  const removeRange = (day: DayKey, idx: number) => {
    setHours((prev) => {
      const nextRanges = prev[day].ranges.filter((_, i) => i !== idx)
      return {
        ...prev,
        [day]: { ...prev[day], ranges: nextRanges.length ? nextRanges : [{ open: '11:00', close: '22:00' }] },
      }
    })
  }

  const copyDayToAll = (sourceDay: DayKey) => {
    const source = hours[sourceDay]
    const copy: any = {}
    for (const day of days) {
      copy[day.key] = { enabled: source.enabled, ranges: source.ranges.map((r) => ({ ...r })) }
    }
    setHours(copy)
  }

  const onSave = async () => {
    setError(null)
    setIsSaving(true)
    try {
      const data: any = {
        name: form.name,
        tagline: form.tagline,
        address: form.address,
        phone: form.phone,
        email: form.email,
        currencyCode: form.currencyCode,
        locale: form.locale,
        timezone: form.timezone,
        countryCode: form.countryCode,
        deliveryFee: String(form.deliveryFee || '0'),
        deliveryMinimum: String(form.deliveryMinimum || '0'),
        pickupDiscount: Number(form.pickupDiscount || 0),
        estimatedDelivery: form.estimatedDelivery,
        estimatedPickup: form.estimatedPickup,
        promoBanner: form.promoBanner,
        hours: serializeHours(hours),
      }

      if (initialSettings?.id) {
        await request('/api/graphql', UPDATE_STORE_SETTINGS, { id: initialSettings.id, data })
      } else {
        await request('/api/graphql', CREATE_STORE_SETTINGS, { data })
      }

      setSavedAt(new Date().toLocaleTimeString())
    } catch (e: any) {
      setError(e?.message || 'Failed to save store settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <PageBreadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-border flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Store Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Centralized controls for how your restaurant appears and operates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedAt ? (
            <span className="text-xs text-muted-foreground">Saved {savedAt}</span>
          ) : null}
          <Button onClick={onSave} disabled={isSaving} className="h-8 text-xs px-4">
            <Save className="mr-2 h-3.5 w-3.5" />
            {isSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x border-b border-border">
        <div className="px-5 py-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Open Days</p>
          <p className="text-xl font-semibold mt-1">{openDaysCount}<span className="text-sm text-muted-foreground font-normal"> / 7</span></p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Today</p>
          <p className="text-sm font-semibold mt-1 truncate">{todaySummary}</p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Currency</p>
          <p className="text-sm font-semibold mt-1">{form.currencyCode} · {form.locale}</p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Timezone</p>
          <p className="text-sm font-semibold mt-1 truncate">{form.timezone.split('/').pop()?.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 px-4 md:px-6 py-4 md:py-5 xl:grid-cols-[1.1fr_1fr] xl:items-start overflow-auto">
        <div className="space-y-6">

          {/* Identity & Contact */}
          <Section title="Identity & Contact" icon={<Store size={13} />}>
            {/* Row 1: Name + Tagline */}
            <div className="grid grid-cols-2 divide-x divide-border">
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Store Name</p>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. The Great Kitchen"
                  className={fieldInput}
                />
              </div>
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Tagline</p>
                <Input
                  value={form.tagline}
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                  placeholder="e.g. Best food in town"
                  className={fieldInput}
                />
              </div>
            </div>
            {/* Row 2: Address */}
            <div className="px-5 py-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Address</p>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="123 Main St, City, State"
                className={fieldInput}
              />
            </div>
            {/* Row 3: Phone + Email + Country */}
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Phone</p>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(555) 000-0000"
                  className={fieldInput}
                />
              </div>
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</p>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="info@restaurant.com"
                  className={fieldInput}
                />
              </div>
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Country Code</p>
                <Input
                  value={form.countryCode}
                  onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase() }))}
                  placeholder="US"
                  className={fieldInput}
                />
              </div>
            </div>
            {/* Row 4: Promo Banner */}
            <div className="px-5 py-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Promo Banner</p>
              <Input
                value={form.promoBanner}
                onChange={(e) => setForm((f) => ({ ...f, promoBanner: e.target.value }))}
                placeholder="e.g. Free delivery on orders over $30"
                className={fieldInput}
              />
            </div>
          </Section>

          {/* Localization */}
          <Section title="Localization" icon={<Globe2 size={13} />}>
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Currency</p>
                <Select value={form.currencyCode} onValueChange={(v) => setForm((f) => ({ ...f, currencyCode: v }))}>
                  <SelectTrigger className={fieldSelect}><SelectValue /></SelectTrigger>
                  <SelectContent>{currencyOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Locale</p>
                <Select value={form.locale} onValueChange={(v) => setForm((f) => ({ ...f, locale: v }))}>
                  <SelectTrigger className={fieldSelect}><SelectValue /></SelectTrigger>
                  <SelectContent>{localeOptions.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Timezone</p>
                <Select value={form.timezone} onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}>
                  <SelectTrigger className={fieldSelect}><SelectValue /></SelectTrigger>
                  <SelectContent>{timezoneOptions.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          {/* Order Defaults */}
          <Section title="Order Defaults" icon={<CalendarClock size={13} />}>
            {/* Row 1: Delivery fee + Minimum */}
            <div className="grid grid-cols-2 divide-x divide-border">
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Delivery Fee</p>
                <Input
                  value={form.deliveryFee}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryFee: e.target.value }))}
                  placeholder="4.99"
                  className={fieldInput}
                />
              </div>
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Delivery Minimum</p>
                <Input
                  value={form.deliveryMinimum}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryMinimum: e.target.value }))}
                  placeholder="15.00"
                  className={fieldInput}
                />
              </div>
            </div>
            {/* Row 2: Pickup discount + est. pickup + est. delivery */}
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pickup Discount %</p>
                <Input
                  type="number"
                  value={form.pickupDiscount}
                  onChange={(e) => setForm((f) => ({ ...f, pickupDiscount: Number(e.target.value) }))}
                  placeholder="10"
                  className={fieldInput}
                />
              </div>
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Est. Pickup</p>
                <Input
                  value={form.estimatedPickup}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedPickup: e.target.value }))}
                  placeholder="15-20 min"
                  className={fieldInput}
                />
              </div>
              <div className="px-5 py-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Est. Delivery</p>
                <Input
                  value={form.estimatedDelivery}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedDelivery: e.target.value }))}
                  placeholder="30-45 min"
                  className={fieldInput}
                />
              </div>
            </div>
          </Section>

        </div>

        <div className="space-y-6">
          <WeeklyHoursEditor
            days={days}
            hours={hours}
            openDaysCount={openDaysCount}
            todaySummary={todaySummary}
            locale={form.locale}
            timezone={form.timezone}
            error={error}
            onSetDayEnabled={setDayEnabled}
            onSetRangeValue={setRangeValue}
            onAddRange={addRange}
            onRemoveRange={removeRange}
            onCopyDayToAll={copyDayToAll}
          />
        </div>
      </div>
    </div>
  )
}

export default StoreSettingsPage
