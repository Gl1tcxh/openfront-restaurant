/**
 * ApiKeyListPageClient - Client Component for API Keys Platform Page
 * Redesigned with a clean security-focused aesthetic
 */

'use client'

import React, { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Triangle,
  Square,
  Circle,
  Search,
  Key,
  Lock,
  Shield,
  Activity,
  Calendar,
  MoreVertical,
  Copy,
  Trash2,
  RefreshCw,
  Terminal,
  ExternalLink,
  Plus,
  Clock
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs"
import { PlatformFilterBar } from '@/features/platform/components/PlatformFilterBar'
import { FilterList } from '@/features/dashboard/components/FilterList'
import { useSelectedFields } from '@/features/dashboard/hooks/useSelectedFields'
import { useListItemsQuery } from '@/features/dashboard/hooks/useListItems.query'
import { buildOrderByClause } from '@/features/dashboard/lib/buildOrderByClause'
import { buildWhereClause } from '@/features/dashboard/lib/buildWhereClause'
import { CreateApiKey } from './CreateApiKey'
import { cn } from '@/lib/utils'

interface ApiKeyListPageClientProps {
  list: any
  initialData: { items: any[], count: number }
  initialError: string | null
  initialSearchParams: {
    page: number
    pageSize: number
    search: string
  }
}

export function ApiKeyListPageClient({
  list,
  initialData,
  initialError,
  initialSearchParams
}: ApiKeyListPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

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
    id name tokenPreview scopes status expiresAt lastUsedAt usageCount restrictedToIPs
    user { id name email }
    createdAt updatedAt
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

  return (
    <div className="flex flex-col h-full bg-background">
      <PageBreadcrumbs
        items={[
          { type: "link", label: "Dashboard", href: "/dashboard" },
          { type: "page", label: "Platform" },
          { type: "page", label: "API Keys" },
        ]}
      />

      {/* Header */}
      <div className="px-6 py-8 border-b bg-gradient-to-br from-background via-zinc-500/5 to-background">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
              <Shield className="size-8 text-primary" />
              API Access Keys
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Securely manage programmatic access to your restaurant data. Use these keys to integrate with third-party logistics, custom websites, and analytics engines.
            </p>
          </div>
          <CreateApiKey />
        </div>

        {/* Security Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 rounded-2xl bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Keys</div>
                <div className="text-2xl font-black mt-1">{data?.items?.filter(k => k.status === 'active').length || 0}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 rounded-2xl bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Requests</div>
                <div className="text-2xl font-black mt-1">
                  {data?.items?.reduce((sum, k) => sum + (k.usageCount || 0), 0).toLocaleString() || 0}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 rounded-2xl bg-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Terminal className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Version</div>
                <div className="text-2xl font-black mt-1">v1.2.4</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 border-b">
         <PlatformFilterBar 
          list={list} 
          showDisplayButton={false}
         />
      </div>

      {/* Keys List */}
      <ScrollArea className="flex-1">
        <div className="p-6 pb-20 space-y-4">
          {error ? (
            <Alert variant="destructive" className="rounded-2xl border-2">
              <AlertDescription>Security fault: {error}</AlertDescription>
            </Alert>
          ) : isEmpty ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
               <div className="w-24 h-24 rounded-[2rem] bg-muted flex items-center justify-center mb-6">
                 <Lock className="size-10 text-muted-foreground opacity-20" />
               </div>
               <h2 className="text-2xl font-black mb-2">No keys found</h2>
               <p className="text-muted-foreground max-w-sm mb-8">Generate your first API key to start integrating your restaurant with our public API endpoints.</p>
               <CreateApiKey />
            </div>
          ) : (
            data?.items?.map((apiKey) => (
              <Card key={apiKey.id} className="border-2 rounded-3xl overflow-hidden hover:border-primary/30 transition-all group">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black tracking-tight">{apiKey.name}</h3>
                        <Badge className={cn(
                          "rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-none",
                          apiKey.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                        )}>
                          {apiKey.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-2xl border-2 border-dashed border-muted relative group/token max-w-md">
                        <code className="text-xs font-mono font-bold opacity-70">
                          {apiKey.tokenPreview || "••••••••••••••••••••••••••••"}
                        </code>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl ml-auto hover:bg-muted" onClick={() => {
                          navigator.clipboard.writeText(apiKey.tokenPreview || "");
                        }}>
                          <Copy className="size-3.5" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Activity className="size-3.5" />
                          <span>Used: {apiKey.usageCount || 0} times</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          <span>Last Used: {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : 'Never'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                          <Terminal className="size-3.5" />
                          <span>{apiKey.scopes?.length || 0} Scopes</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                       <Button variant="outline" className="rounded-xl border-2 font-bold text-xs uppercase tracking-widest h-10 px-6">
                         Details
                       </Button>
                       <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-rose-600 hover:bg-rose-50 group-hover:opacity-100 opacity-0 transition-opacity">
                         <Trash2 className="size-4" />
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
