'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { gql, request } from 'graphql-request'
import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Globe2, Save, Store, CalendarClock, Sparkles } from 'lucide-react'
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
  subtitle,
  icon,
  children,
}: {
  title: string
  subtitle: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="mb-5 flex items-start gap-3 border-b border-border/60 pb-4">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/90">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

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
    { type: 'link' as const, label: 'Dashboard', href: '/dashboard' },
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
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top_right,rgba(100,116,139,0.08),transparent_45%)]">
      <PageBreadcrumbs items={breadcrumbs} />

      <div className="border-b border-border/60 px-6 py-6">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em]">
              <Sparkles className="mr-1.5 h-3 w-3" /> Platform configuration
            </Badge>
            <h1 className="text-3xl font-black tracking-tight">Store Settings</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Clean, centralized controls for how your restaurant appears and operates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {savedAt ? <Badge variant="secondary">Saved {savedAt}</Badge> : null}
            <Button onClick={onSave} disabled={isSaving} className="h-11 rounded-xl px-5 font-semibold">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-6 p-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <Section title="Identity & Contact" subtitle="Core profile details shown in admin and storefront." icon={<Store className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label>Store name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Tagline</Label><Input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} /></div>
            </div>
            <div className="mt-4"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Country code</Label><Input value={form.countryCode} onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase() }))} /></div>
            </div>
          </Section>

          <Section title="Localization" subtitle="Controls for currency, locale, and timezone formatting." icon={<Globe2 className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label>Currency</Label>
                <Select value={form.currencyCode} onValueChange={(v) => setForm((f) => ({ ...f, currencyCode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{currencyOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Locale</Label>
                <Select value={form.locale} onValueChange={(v) => setForm((f) => ({ ...f, locale: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{localeOptions.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timezone</Label>
                <Select value={form.timezone} onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{timezoneOptions.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <Section title="Order Defaults" subtitle="Default settings for pickup and delivery estimations." icon={<CalendarClock className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label>Delivery fee</Label><Input value={form.deliveryFee} onChange={(e) => setForm((f) => ({ ...f, deliveryFee: e.target.value }))} /></div>
              <div><Label>Delivery minimum</Label><Input value={form.deliveryMinimum} onChange={(e) => setForm((f) => ({ ...f, deliveryMinimum: e.target.value }))} /></div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div><Label>Pickup discount (%)</Label><Input type="number" value={form.pickupDiscount} onChange={(e) => setForm((f) => ({ ...f, pickupDiscount: Number(e.target.value) }))} /></div>
              <div><Label>Estimated pickup</Label><Input value={form.estimatedPickup} onChange={(e) => setForm((f) => ({ ...f, estimatedPickup: e.target.value }))} /></div>
              <div><Label>Estimated delivery</Label><Input value={form.estimatedDelivery} onChange={(e) => setForm((f) => ({ ...f, estimatedDelivery: e.target.value }))} /></div>
            </div>
          </Section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
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
