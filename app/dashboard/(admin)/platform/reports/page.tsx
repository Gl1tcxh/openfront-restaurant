import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs'
import { BarChart3, TrendingUp, Users, ChefHat } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const AVAILABLE_REPORTS = [
  {
    title: 'Sales Overview',
    href: '/dashboard/platform/reports/sales',
    icon: TrendingUp,
    ready: true,
  },
  {
    title: 'Menu Performance',
    href: '/dashboard/platform/reports/menu-performance',
    icon: ChefHat,
    ready: true,
  },
  {
    title: 'Labor & Staffing',
    href: '/dashboard/platform/reports/labor',
    icon: Users,
    ready: true,
  },
]

const COMING_SOON = [
  { title: 'Revenue Analytics', icon: BarChart3 },
  { title: 'Customer Insights', icon: Users },
  { title: 'Inventory Cost Tracking', icon: BarChart3 },
  { title: 'Comparative Period Reports', icon: TrendingUp },
]

export default function ReportsHub() {
  return (
    <div className="flex flex-col h-full bg-background">
      <PageBreadcrumbs
        items={[
          { type: 'link', label: 'Dashboard', href: '/dashboard' },
          { type: 'page', label: 'Platform' },
          { type: 'page', label: 'Reports' },
        ]}
      />

      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-border">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Data and analytics for your restaurant operations.
        </p>
      </div>

      {/* Available reports */}
      <div className="px-4 md:px-6 py-5 border-b border-border">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Available</p>
        <div className="divide-y rounded-lg border border-border overflow-hidden">
          {AVAILABLE_REPORTS.map((report) => {
            const Icon = report.icon
            return (
              <Link
                key={report.title}
                href={report.href}
                className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors group"
              >
                <div className="w-8 h-8 rounded border border-border bg-background flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-muted-foreground" />
                </div>
                <span className="text-sm font-medium flex-1">{report.title}</span>
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">Live</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">›</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Coming soon */}
      <div className="px-4 md:px-6 py-5">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Coming Soon</p>
        <div className="divide-y rounded-lg border border-border border-dashed overflow-hidden">
          {COMING_SOON.map((report) => {
            const Icon = report.icon
            return (
              <div
                key={report.title}
                className="flex items-center gap-3 px-4 py-3 opacity-40"
              >
                <div className="w-8 h-8 rounded border border-border bg-background flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-muted-foreground" />
                </div>
                <span className="text-sm font-medium flex-1">{report.title}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">
                  Soon
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
