/**
 * GiftCardListPageClient - Client Component  
 * Redesigned with a premium card-focused aesthetic
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
  Wallet
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs"
import { PageContainer } from '../../../dashboard/components/PageContainer'
import { PlatformFilterBar } from '../../components/PlatformFilterBar'
import { StatusTabs } from '../components/StatusTabs'
import { GiftCardDetailsComponent } from '../components/GiftCardDetailsComponent'
import { Pagination } from '../../../dashboard/components/Pagination'
import { FilterList } from '../../../dashboard/components/FilterList'
import { CreateItemDrawerClientWrapper } from '@/features/platform/components/CreateItemDrawerClientWrapper'
import { useDashboard } from '../../../dashboard/context/DashboardProvider'
import { useSelectedFields } from '../../../dashboard/hooks/useSelectedFields'
import { useSort } from '../../../dashboard/hooks/useSort'
import { useListItemsQuery } from '../../../dashboard/hooks/useListItems.query'
import { buildOrderByClause } from '../../../dashboard/lib/buildOrderByClause'
import { buildWhereClause } from '../../../dashboard/lib/buildWhereClause'
import { ScrollArea } from '@/components/ui/scroll-area'

interface GiftCardListPageClientProps {
  list: any
  initialData: { items: any[], count: number }
  initialError: string | null
  initialSearchParams: {
    page: number
    pageSize: number  
    search: string
  }
  statusCounts: {
    active: number
    all: number
    disabled: number
  } | null
  currencyCode?: string
  locale?: string
}

export function GiftCardListPageClient({
  list,
  initialData,
  initialError,
  initialSearchParams,
  statusCounts,
  currencyCode = "USD",
  locale = "en-US"
}: GiftCardListPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { basePath } = useDashboard()
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)

  // Hooks for sorting and field selection
  const selectedFields = useSelectedFields(list)
  const sort = useSort(list)

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
    id code value balance isDisabled endsAt metadata createdAt updatedAt
    order {
      id orderNumber total
    }
    giftCardTransactions {
      id amount createdAt
      order { id orderNumber total }
    }
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

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: basePath },
    { type: 'page' as const, label: 'Platform' },
    { type: 'page' as const, label: 'GiftCards' }
  ]

  return (
    <div className="flex flex-col h-full bg-background">
      <PageBreadcrumbs items={breadcrumbs} />

      {/* Header Section */}
      <div className="px-6 py-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-background via-emerald-500/5 to-background">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Gift Cards</h1>
          <p className="text-muted-foreground mt-1">Issue and track stored value cards for your customers</p>
        </div>
        <Button 
          onClick={() => setIsCreateDrawerOpen(true)}
          className="h-12 px-6 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black uppercase tracking-widest text-xs hover:scale-105 transition-all active:scale-95 shadow-xl shadow-zinc-200 dark:shadow-none"
        >
          <Plus className="size-4 mr-2" />
          Issue New Card
        </Button>
      </div>

      {/* Stats/Tabs Section */}
      {statusCounts && (
        <div className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 bg-muted/20">
          <StatusTabs statusCounts={statusCounts} />
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-2 font-bold px-4" onClick={handleResetFilters}>
              <RefreshCw className="size-3.5 mr-2" />
              Sync
            </Button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="px-6 py-4 border-b">
        <PlatformFilterBar 
          list={list}
          showDisplayButton={true}
          selectedFields={selectedFields}
        />
        <FilterList list={list} />
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="pb-12">
          {error ? (
            <div className="p-6">
              <Alert variant="destructive" className="rounded-2xl border-2">
                <AlertDescription>Failed to load gift cards: {error}</AlertDescription>
              </Alert>
            </div>
          ) : isEmpty ? (
            <div className="p-24 flex flex-col items-center justify-center text-center">
              <div className="w-32 h-20 rounded-2xl bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-6 relative">
                <CreditCard className="size-10 text-muted-foreground opacity-20" />
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                   <Plus className="size-4" />
                </div>
              </div>
              <h2 className="text-2xl font-black mb-2 tracking-tight">Zero Cards Issued</h2>
              <p className="text-muted-foreground max-w-sm mb-8">Gift cards are a great way to increase customer loyalty and upfront cash flow.</p>
              <Button onClick={() => setIsCreateDrawerOpen(true)} size="lg" className="rounded-2xl px-8 font-black uppercase tracking-widest text-xs">
                Issue First Gift Card
              </Button>
            </div>
          ) : data?.count === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Search className="size-12 text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-bold uppercase tracking-widest">No matching cards found</h3>
              <Button variant="link" onClick={handleResetFilters}>Clear search criteria</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1">
                {data?.items?.map((giftcard: any) => (
                  <GiftCardDetailsComponent
                    key={giftcard.id}
                    giftcard={giftcard}
                    list={list}
                    currencyCode={currencyCode}
                    locale={locale}
                  />
                ))}
              </div>
              
              {data && data.count > pageSize && (
                <div className="px-6 py-8">
                  <Pagination
                    currentPage={currentPage}
                    total={data.count}
                    pageSize={pageSize}
                    list={{ singular: 'giftcard', plural: 'giftcards' }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
      
      <CreateItemDrawerClientWrapper
        listKey="gift-cards"
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onCreate={() => {
          window.location.reload();
        }}
      />
    </div>
  )
}
