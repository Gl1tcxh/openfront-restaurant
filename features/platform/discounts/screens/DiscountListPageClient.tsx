/**
 * DiscountListPageClient - Client Component  
 * Redesigned for a modern hospitality aesthetic
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
  Ticket,
  Filter,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs"
import { PageContainer } from '../../../dashboard/components/PageContainer'
import { PlatformFilterBar } from '../../components/PlatformFilterBar'
import { StatusTabs } from '../components/StatusTabs'
import { DiscountDetailsComponent } from '../components/DiscountDetailsComponent'
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
import { cn } from '@/lib/utils'

interface DiscountListPageClientProps {
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
}

export function DiscountListPageClient({
  list,
  initialData,
  initialError,
  initialSearchParams,
  statusCounts
}: DiscountListPageClientProps) {
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
    id code isDynamic isDisabled stackable startsAt endsAt usageLimit usageCount validDuration createdAt updatedAt
    discountRule {
      id type value description allocation
    }
    orders {
      id orderNumber createdAt status total
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

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: basePath },
    { type: 'page' as const, label: 'Platform' },
    { type: 'page' as const, label: 'Discounts' }
  ]

  const isEmpty = data?.count === 0 && !searchString

  return (
    <div className="flex flex-col h-full bg-background">
      <PageBreadcrumbs items={breadcrumbs} />

      {/* Header Section */}
      <div className="px-6 py-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-background via-muted/5 to-background">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Discounts & Promos</h1>
          <p className="text-muted-foreground mt-1">Configure and manage active promotions across your platform</p>
        </div>
        <Button 
          onClick={() => setIsCreateDrawerOpen(true)}
          className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform active:scale-95"
        >
          <Plus className="size-4 mr-2" />
          Create Discount
        </Button>
      </div>

      {/* Stats/Tabs Section */}
      {statusCounts && (
        <div className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 bg-muted/20">
          <StatusTabs statusCounts={statusCounts} />
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-2 font-bold px-4" onClick={handleResetFilters}>
              <RefreshCw className="size-3.5 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      )}

      {/* Filter/Search Bar */}
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
                <AlertDescription>Failed to load discounts: {error}</AlertDescription>
              </Alert>
            </div>
          ) : isEmpty ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-muted flex items-center justify-center mb-6">
                <Ticket className="size-12 text-muted-foreground opacity-20" />
              </div>
              <h2 className="text-2xl font-black mb-2">No active promotions</h2>
              <p className="text-muted-foreground max-w-sm mb-8">Start growing your sales by creating your first discount or coupon code.</p>
              <Button onClick={() => setIsCreateDrawerOpen(true)} size="lg" className="rounded-2xl px-8 font-black uppercase tracking-widest text-xs">
                Launch First Campaign
              </Button>
            </div>
          ) : data?.count === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Search className="size-12 text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-bold">No results matching your filter</h3>
              <Button variant="link" onClick={handleResetFilters}>Clear all filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1">
                {data?.items?.map((discount: any) => (
                  <DiscountDetailsComponent key={discount.id} discount={discount} list={list} />
                ))}
              </div>
              
              {data && data.count > pageSize && (
                <div className="px-6 py-8">
                  <Pagination
                    currentPage={currentPage}
                    total={data.count}
                    pageSize={pageSize}
                    list={{ singular: 'discount', plural: 'discounts' }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
      
      <CreateItemDrawerClientWrapper
        listKey="discounts"
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onCreate={() => {
          window.location.reload();
        }}
      />
    </div>
  )
}
