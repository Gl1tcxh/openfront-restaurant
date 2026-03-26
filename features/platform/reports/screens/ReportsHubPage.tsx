import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs'
import { BarChart3, ChefHat, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

const availableReports = [
  {
    title: 'Sales Overview',
    href: '/dashboard/platform/reports/sales',
    icon: TrendingUp,
  },
  {
    title: 'Menu Performance',
    href: '/dashboard/platform/reports/menu-performance',
    icon: ChefHat,
  },
  {
    title: 'Labor & Staffing',
    href: '/dashboard/platform/reports/labor',
    icon: Users,
  },
]

const comingSoonReports = [
  { title: 'Revenue Analytics', icon: BarChart3 },
  { title: 'Customer Insights', icon: Users },
  { title: 'Inventory Cost Tracking', icon: BarChart3 },
  { title: 'Comparative Period Reports', icon: TrendingUp },
]

export function ReportsHubPage() {
  return (
    <div className="flex h-full flex-col bg-background">
      <PageBreadcrumbs
        items={[
          { type: 'link', label: 'Dashboard', href: '/dashboard' },
          { type: 'page', label: 'Platform' },
          { type: 'page', label: 'Reports' },
        ]}
      />

      <div className="border-b border-border px-4 py-4 md:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Data and analytics for your restaurant operations.
        </p>
      </div>

      <div className="border-b border-border px-4 py-5 md:px-6">
        <p className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">Available</p>
        <div className="overflow-hidden rounded-lg border border-border">
          {availableReports.map((report) => {
            const Icon = report.icon

            return (
              <Link
                key={report.title}
                href={report.href}
                className="group flex items-center gap-3 border-b border-border bg-card px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/30"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-background">
                  <Icon size={15} className="text-muted-foreground" />
                </div>
                <span className="flex-1 text-sm font-medium">{report.title}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                  Live
                </span>
                <span className="text-muted-foreground transition-colors group-hover:text-foreground">
                  ›
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="px-4 py-5 md:px-6">
        <p className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          Coming Soon
        </p>
        <div className="overflow-hidden rounded-lg border border-dashed border-border">
          {comingSoonReports.map((report) => {
            const Icon = report.icon

            return (
              <div
                key={report.title}
                className="flex items-center gap-3 border-b border-border px-4 py-3 opacity-40 last:border-b-0"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-background">
                  <Icon size={15} className="text-muted-foreground" />
                </div>
                <span className="flex-1 text-sm font-medium">{report.title}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
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
