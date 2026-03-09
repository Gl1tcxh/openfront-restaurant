import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Users, ChefHat, Wallet, Clock, Activity, ArrowRight, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'

const REPORT_TYPES = [
  {
    title: 'Sales Overview',
    description: 'Revenue, order counts, and average check performance over time.',
    href: '/dashboard/platform/reports/sales',
    icon: TrendingUp,
    color: 'bg-blue-500',
    details: ['Net Sales', 'Tax & Tips', 'Discounts']
  },
  {
    title: 'Menu Performance',
    description: 'Identify your bestsellers and underperforming items to optimize your menu.',
    href: '/dashboard/platform/reports/menu-performance',
    icon: ChefHat,
    color: 'bg-emerald-500',
    details: ['Top Sellers', 'Food Cost %', 'Menu Engineering']
  },
  {
    title: 'Labor & Staffing',
    description: 'Analyze labor costs versus sales to optimize scheduling efficiency.',
    href: '/dashboard/platform/reports/labor',
    icon: Users,
    color: 'bg-amber-500',
    details: ['Labor Cost %', 'Sales per Hour', 'Staff Tips']
  },
  {
    title: 'Operational Health',
    description: 'Monitor kitchen efficiency, void rates, and service times.',
    href: '/dashboard/platform/operations',
    icon: Activity,
    color: 'bg-rose-500',
    details: ['Ticket Times', 'Void Rates', 'Kitchen Load']
  }
]

export default function ReportsHub() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="px-6 py-12 border-b bg-card">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-black tracking-tight mb-2">Report Hub</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Centralized data intelligence for your restaurant operations. Track every metric that matters to your bottom line.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="px-6 py-12 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {REPORT_TYPES.map((report) => {
              const Icon = report.icon
              return (
                <Link 
                  key={report.title} 
                  href={report.href}
                  className="group block"
                >
                  <Card className="h-full border-2 rounded-[2.5rem] overflow-hidden transition-all duration-300 group-hover:border-primary group-hover:shadow-2xl group-hover:-translate-y-1">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="p-8 flex-1">
                        <div className={cn(
                          "w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 text-white shadow-lg",
                          report.color
                        )}>
                          <Icon className="size-8" />
                        </div>
                        <h2 className="text-2xl font-black mb-3 group-hover:text-primary transition-colors">
                          {report.title}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                          {report.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-6">
                          {report.details.map(detail => (
                            <span key={detail} className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {detail}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="px-8 py-5 bg-muted/30 border-t flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                        <span className="text-sm font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                          Launch Report
                        </span>
                        <div className="w-10 h-10 rounded-full border-2 border-muted flex items-center justify-center group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <ArrowRight className="size-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Bottom Callout */}
          <div className="mt-16 p-8 rounded-[2rem] bg-zinc-900 dark:bg-zinc-800 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">Need custom insights?</h3>
              <p className="text-zinc-400 max-w-md">Our data team can build custom reporting dashboards tailored to your specific franchise requirements.</p>
            </div>
            <Button size="lg" className="relative z-10 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold px-8">
              Contact Enterprise Support
            </Button>
            {/* Decorative Background Icon */}
            <BarChart3 className="absolute -right-8 -bottom-8 size-48 text-white/5 -rotate-12" />
          </div>
        </div>
      </div>
    </div>
  )
}
