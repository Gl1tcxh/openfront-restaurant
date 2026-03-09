import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AlertCircle } from 'lucide-react'
import {
  PlatformMetaStrip,
  PlatformSubcard,
  PlatformSurface,
  PlatformSurfaceBody,
  PlatformSurfaceHeader,
} from '@/features/platform/components/platform-surface'

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface DayRange {
  open: string
  close: string
}

export interface DaySchedule {
  enabled: boolean
  ranges: DayRange[]
}

export interface HoursState {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

interface WeeklyHoursEditorProps {
  days: Array<{ key: DayKey; label: string }>
  hours: HoursState
  openDaysCount: number
  todaySummary: string
  locale: string
  timezone: string
  error: string | null
  onSetDayEnabled: (day: DayKey, enabled: boolean) => void
  onSetRangeValue: (day: DayKey, idx: number, key: 'open' | 'close', value: string) => void
  onAddRange: (day: DayKey) => void
  onRemoveRange: (day: DayKey, idx: number) => void
  onCopyDayToAll: (day: DayKey) => void
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

export function WeeklyHoursEditor({
  days,
  hours,
  openDaysCount,
  todaySummary,
  locale,
  timezone,
  error,
  onSetDayEnabled,
  onSetRangeValue,
  onAddRange,
  onRemoveRange,
  onCopyDayToAll,
}: WeeklyHoursEditorProps) {
  return (
    <PlatformSurface>
      <PlatformSurfaceHeader
        eyebrow="Operations"
        title="Weekly hours"
        description="A quieter operator layout inspired by workflow tooling, adapted for restaurant configuration."
      />

      <PlatformSurfaceBody className="space-y-3">
        <PlatformMetaStrip
          items={[
            { label: 'Open days', value: `${openDaysCount} / 7` },
            { label: 'Today', value: `${todaySummary} · ${timezone}` },
          ]}
        />

        <div className="space-y-2.5">
          {days.map((day) => {
            const dayState = hours[day.key]

            return (
              <PlatformSubcard key={day.key} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{day.label}</h3>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {dayState.enabled ? `${dayState.ranges.length} service ${dayState.ranges.length === 1 ? 'window' : 'windows'}` : 'No service windows'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/5">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {dayState.enabled ? 'Open' : 'Closed'}
                    </span>
                    <Switch checked={dayState.enabled} onCheckedChange={(v) => onSetDayEnabled(day.key, v)} />
                  </div>
                </div>

                {dayState.enabled ? (
                  <>
                    <div className="space-y-2">
                      {dayState.ranges.map((range, idx) => (
                        <div
                          key={`${day.key}-${idx}`}
                          className="grid grid-cols-1 gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end dark:border-white/10 dark:bg-white/[0.03]"
                        >
                          <div className="min-w-0">
                            <Label className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                              Open
                            </Label>
                            <Input
                              type="time"
                              step={1800}
                              value={range.open}
                              onChange={(e) => onSetRangeValue(day.key, idx, 'open', e.target.value)}
                              className="h-11 min-w-0 w-full max-w-full rounded-xl border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100"
                            />
                          </div>

                          <div className="min-w-0">
                            <Label className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                              Close
                            </Label>
                            <Input
                              type="time"
                              step={1800}
                              value={range.close}
                              onChange={(e) => onSetRangeValue(day.key, idx, 'close', e.target.value)}
                              className="h-11 min-w-0 w-full max-w-full rounded-xl border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100"
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-11 rounded-xl border border-zinc-200 px-3 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/10"
                            onClick={() => onRemoveRange(day.key, idx)}
                            disabled={dayState.ranges.length <= 1}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 rounded-xl border-zinc-200 bg-white px-3.5 text-zinc-900 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
                        onClick={() => onAddRange(day.key)}
                      >
                        Add range
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 rounded-xl px-3.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
                        onClick={() => onCopyDayToAll(day.key)}
                      >
                        Copy to all days
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 px-3 py-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
                    Closed all day.
                  </div>
                )}
              </PlatformSubcard>
            )
          })}
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <p className="inline-flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</p>
          </div>
        ) : null}
      </PlatformSurfaceBody>
    </PlatformSurface>
  )
}
