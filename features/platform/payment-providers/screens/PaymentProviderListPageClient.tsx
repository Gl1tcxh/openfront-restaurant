/**
 * PaymentProviderListPageClient - Client Component
 * Redesigned as an integration hub / app store
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Plus,
  Triangle,
  Square,
  Circle,
  Search,
  CreditCard,
  RefreshCw,
  LayoutGrid,
  ShieldCheck,
  Zap,
  Globe,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Lock
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PlatformFilterBar } from '../../components/PlatformFilterBar'
import { StatusTabs } from '../components/StatusTabs'
import { Pagination } from '../../../dashboard/components/Pagination'
import { FilterList } from '../../../dashboard/components/FilterList'
import { CreateItemDrawerClientWrapper } from '@/features/platform/components/CreateItemDrawerClientWrapper'
import { useDashboard } from '../../../dashboard/context/DashboardProvider'
import { useSelectedFields } from '../../../dashboard/hooks/useSelectedFields'
import { useListItemsQuery } from '../../../dashboard/hooks/useListItems.query'
import { buildOrderByClause } from '../../../dashboard/lib/buildOrderByClause'
import { buildWhereClause } from '../../../dashboard/lib/buildWhereClause'
import { cn } from '@/lib/utils'

interface PaymentProviderListPageClientProps {
  list: any
  initialData: { items: any[], count: number }
  initialError: string | null
  initialSearchParams: {
    page: number
    pageSize: number  
    search: string
  }
  statusCounts: {
    all: number
    installed: number
    notInstalled: number
  } | null
}

export function PaymentProviderListPageClient({
  list,
  initialData,
  initialError,
  initialSearchParams,
  statusCounts
}: PaymentProviderListPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { basePath } = useDashboard()
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)

  // Hooks for field selection
  const selectedFields = useSelectedFields(list)

  // Extract current search params
  const currentSearchParams = useMemo(() => {
    const params: Record<string, string> = {}
    searchParams?.forEach((value, key) => {
      params[key] = value
    })
    return params
  }, [searchParams])

  const currentPage = parseInt(currentSearchParams.page || '1', 10) || 1
  const pageSize = parseInt(currentSearchParams.pageSize || list.pageSize?.toString() || '50', 10)
  const searchString = currentSearchParams.search || ''

  // Build query variables
  const variables = useMemo(() => {
    const orderBy = buildOrderByClause(list, currentSearchParams)
    const filterWhere = buildWhereClause(list, currentSearchParams)
    const searchParameters = searchString ? { search: searchString } : {}
    const searchWhere = buildWhereClause(list, searchParameters)

    const whereConditions = []
    if (Object.keys(searchWhere).length > 0) {
      whereConditions.push(searchWhere)
    }
    if (Object.keys(filterWhere).length > 0) {
      whereConditions.push(filterWhere)
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {}

    return {
      where,
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
      orderBy
    }
  }, [list, currentSearchParams, currentPage, pageSize, searchString])

  const querySelectedFields = `
    id name providerType isInstalled credentials config status createdAt
  `

  const { data: queryData, error: queryError, isLoading, isFetching } = useListItemsQuery(
    {
      listKey: list.key,
      variables,
      selectedFields: querySelectedFields
    },
    {
      initialData: initialError ? undefined : initialData,
    }
  )

  const data = queryData || initialData
  const error = queryError ? queryError.message : initialError

  const handleResetFilters = useCallback(() => {
    router.push(window.location.pathname)
  }, [router])

  const isEmpty = data?.count === 0 && !searchString

  const providerIcons: Record<string, any> = {
    stripe: Zap,
    paypal: Globe,
    square: LayoutGrid,
    adyen: ShieldCheck,
    manual: CreditCard
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-10 border-b bg-gradient-to-br from-background via-blue-500/5 to-background">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Payment Integration Hub</h1>
            <p className="text-muted-foreground max-w-2xl font-medium">
              Seamlessly connect your restaurant with global payment processors. Secure transactions, automated payouts, and diverse checkout options.
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDrawerOpen(true)}
            className="h-12 px-6 rounded-2xl bg-primary font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus className="size-4 mr-2" />
            Connect Provider
          </Button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="flex items-center gap-4 p-4 rounded-3xl bg-card border-2 border-dashed">
              <div className="p-3 rounded-2xl bg-blue-500/10">
                 <ShieldCheck className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                 <div className="text-xs font-black uppercase tracking-widest">PCI Compliant</div>
                 <div className="text-[10px] text-muted-foreground">Highest security standards</div>
              </div>
           </div>
           <div className="flex items-center gap-4 p-4 rounded-3xl bg-card border-2 border-dashed">
              <div className="p-3 rounded-2xl bg-emerald-500/10">
                 <Zap className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                 <div className="text-xs font-black uppercase tracking-widest">Instant Payouts</div>
                 <div className="text-[10px] text-muted-foreground">Access funds within minutes</div>
              </div>
           </div>
           <div className="flex items-center gap-4 p-4 rounded-3xl bg-card border-2 border-dashed">
              <div className="p-3 rounded-2xl bg-amber-500/10">
                 <Lock className="size-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                 <div className="text-xs font-black uppercase tracking-widest">Safe & Secure</div>
                 <div className="text-[10px] text-muted-foreground">End-to-end encryption</div>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 pb-20">
          <div className="mb-8">
             <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-black uppercase tracking-tight">Active & Available Integrations</h2>
                {statusCounts && <StatusTabs statusCounts={statusCounts as any} />}
             </div>
             <PlatformFilterBar list={list} showDisplayButton={false} />
          </div>

          {error ? (
             <Alert variant="destructive" className="rounded-2xl border-2">
               <AlertDescription>Connectivity error: {error}</AlertDescription>
             </Alert>
          ) : isEmpty ? (
             <div className="py-24 text-center flex flex-col items-center">
                <div className="size-24 rounded-[2rem] bg-muted flex items-center justify-center mb-6">
                   <LayoutGrid className="size-10 text-muted-foreground opacity-20" />
                </div>
                <h2 className="text-2xl font-black mb-2 tracking-tight">No integrations installed</h2>
                <p className="text-muted-foreground max-w-sm mb-8">Choose from our list of supported payment providers to start accepting orders online and in-person.</p>
                <Button onClick={() => setIsCreateDrawerOpen(true)} size="lg" className="rounded-2xl px-8 font-black uppercase tracking-widest text-xs">
                   View Provider Marketplace
                </Button>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data?.items?.map((provider) => {
                  const Icon = providerIcons[provider.providerType?.toLowerCase()] || CreditCard
                  const isInstalled = provider.isInstalled
                  
                  return (
                    <Card key={provider.id} className={cn(
                      "border-2 rounded-[2.5rem] overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                      isInstalled ? "border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5" : "hover:border-primary/30"
                    )}>
                      <CardContent className="p-8 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-8">
                           <div className={cn(
                             "size-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500",
                             isInstalled ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                           )}>
                              <Icon className="size-8" />
                           </div>
                           <Badge className={cn(
                             "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                             isInstalled ? "bg-emerald-500/20 text-emerald-600" : "bg-zinc-500/10 text-zinc-500"
                           )}>
                             {isInstalled ? 'Connected' : 'Available'}
                           </Badge>
                        </div>

                        <h3 className="text-2xl font-black mb-2 group-hover:text-primary transition-colors">
                           {provider.name}
                        </h3>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                           <Badge variant="outline" className="text-[9px] font-bold uppercase rounded-lg border-2">API v3.0</Badge>
                           <Badge variant="outline" className="text-[9px] font-bold uppercase rounded-lg border-2">OAUTH 2.0</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">
                           Standard integration for {provider.name}. Supports global credit cards, digital wallets, and local payment methods.
                        </p>

                        <div className="pt-6 border-t flex items-center justify-between">
                           <Button variant="ghost" className="rounded-xl font-bold text-xs uppercase tracking-widest px-0 hover:bg-transparent hover:text-primary group/btn">
                              Manage <ArrowRight className="size-3.5 ml-1 transition-transform group-hover/btn:translate-x-1" />
                           </Button>
                           <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              DOCS <ExternalLink className="size-2.5" />
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
             </div>
          )}
        </div>
      </ScrollArea>

      <CreateItemDrawerClientWrapper
        listKey="payment-providers"
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onCreate={() => {
          window.location.reload();
        }}
      />
    </div>
  )
}
