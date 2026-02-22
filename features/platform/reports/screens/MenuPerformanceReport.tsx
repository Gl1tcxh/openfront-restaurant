'use client'

import React, { useMemo } from 'react'
import {
  getMenuItemPerformance,
} from "../actions";
import {
  getDateRange,
  calculateMenuItemPerformance,
  calculateCategoryPerformance,
  formatCurrency,
  formatNumber,
} from "../lib/reportHelpers";
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs";
import { PeriodSelector } from "../components/PeriodSelector";
import { DateRangePickerWrapper } from "../components/DateRangePickerWrapper";
import { MenuItemPerformance } from "../components/MenuItemPerformance";
import { CategoryPerformance } from "../components/CategoryPerformance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, Utensils, PieChart, Star, Zap, Search, Layers, ArrowUpRight, Target, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function MenuPerformanceReport({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedPeriod = (resolvedSearchParams.period as string) || "30d";

  const customStartDate = resolvedSearchParams.startDate as string;
  const customEndDate = resolvedSearchParams.endDate as string;

  let startDate: string;
  let endDate: string;

  if (customStartDate && customEndDate) {
    startDate = customStartDate;
    endDate = customEndDate;
  } else {
    const range = getDateRange(selectedPeriod);
    startDate = range.startDate;
    endDate = range.endDate;
  }

  try {
    const response = await getMenuItemPerformance(startDate, endDate);
    const orderItems = response.success ? response.data?.orderItems || [] : [];

    const menuItemPerformance = calculateMenuItemPerformance(orderItems);
    const categoryPerformance = calculateCategoryPerformance(orderItems);
    
    const totalRevenue = menuItemPerformance.reduce((sum, item) => sum + item.revenue, 0);
    const totalItemsSold = menuItemPerformance.reduce((sum, item) => sum + item.quantitySold, 0);
    const uniqueItems = menuItemPerformance.length;

    const statsData = [
      { name: "Total Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400' },
      { name: "Items Sold", value: formatNumber(totalItemsSold), icon: Layers, color: 'text-emerald-600 dark:text-emerald-400' },
      { name: "Unique Items", value: formatNumber(uniqueItems), icon: Utensils, color: 'text-amber-600 dark:text-amber-400' },
      { name: "Avg Revenue/Item", value: formatCurrency(uniqueItems > 0 ? totalRevenue / uniqueItems : 0), icon: Target, color: 'text-indigo-600 dark:text-indigo-400' },
    ];

    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header Section */}
        <div className="px-6 py-6 border-b bg-gradient-to-br from-indigo-500/5 via-background to-emerald-500/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
                <PieChart className="size-8 text-primary" />
                Menu Engineering
              </h1>
              <p className="text-muted-foreground max-w-2xl font-medium">
                Strategic analysis of your menu item popularity and profitability. Identify your "Stars" and address your "Dogs".
              </p>
            </div>
            <div className="flex items-center gap-3 bg-card p-2 border-2 rounded-2xl shadow-sm">
              <PeriodSelector />
              <div className="h-4 w-px bg-muted mx-1" />
              <DateRangePickerWrapper />
            </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statsData.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.name} className="border-2 rounded-[1.5rem] bg-card hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-xl bg-muted/50", stat.color)}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{stat.name}</div>
                      <div className="text-2xl font-black">{stat.value}</div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-10 pb-20">
            {/* Top Performers Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  <section>
                    <div className="flex items-center justify-between mb-4">
                       <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                         <Star className="size-5 text-amber-500 fill-amber-500" />
                         Item Performance Audit
                       </h2>
                       <Badge variant="outline" className="rounded-lg font-bold border-2">Ranked by Sales</Badge>
                    </div>
                    <MenuItemPerformance items={menuItemPerformance} totalRevenue={totalRevenue} />
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                       <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                         <Layers className="size-5 text-blue-500" />
                         Category Heatmap
                       </h2>
                    </div>
                    <CategoryPerformance categories={categoryPerformance} totalRevenue={totalRevenue} />
                  </section>
               </div>

               {/* Strategic Sidebar */}
               <div className="space-y-8">
                  <Card className="border-2 rounded-[2rem] overflow-hidden bg-zinc-900 text-white shadow-2xl relative">
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-2xl font-black flex items-center gap-3">
                         <Zap className="size-6 text-amber-400 fill-amber-400" />
                         Engineering Guide
                      </CardTitle>
                      <p className="text-zinc-400 text-sm font-medium">Use these quadrants to optimize your profit margin.</p>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                       <div className="space-y-4">
                          <div className="group">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="size-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                               <span className="font-black text-xs uppercase tracking-widest text-amber-400">Stars</span>
                             </div>
                             <p className="text-xs text-zinc-300 leading-relaxed">High Profit + High Popularity. Promote these items everywhere. Don't touch the recipe.</p>
                          </div>
                          
                          <div className="group">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="size-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                               <span className="font-black text-xs uppercase tracking-widest text-blue-400">Plow Horses</span>
                             </div>
                             <p className="text-xs text-zinc-300 leading-relaxed">Low Profit + High Popularity. Consider a price increase or finding cheaper ingredient alternatives.</p>
                          </div>

                          <div className="group">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="size-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.5)]" />
                               <span className="font-black text-xs uppercase tracking-widest text-purple-400">Puzzles</span>
                             </div>
                             <p className="text-xs text-zinc-300 leading-relaxed">High Profit + Low Popularity. Train staff to upsell these. Give them better placement on the menu.</p>
                          </div>

                          <div className="group">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="size-2 rounded-full bg-zinc-500" />
                               <span className="font-black text-xs uppercase tracking-widest text-zinc-500">Dogs</span>
                             </div>
                             <p className="text-xs text-zinc-300 leading-relaxed">Low Profit + Low Popularity. Consider removing these from the menu to reduce inventory waste.</p>
                          </div>
                       </div>

                       <Button className="w-full h-12 rounded-2xl bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-xs">
                          Download Strategy PDF
                       </Button>
                    </CardContent>
                    <Utensils className="absolute -right-12 -bottom-12 size-48 text-white/5 -rotate-12" />
                  </Card>

                  <Card className="border-2 rounded-[2rem] border-dashed bg-muted/20 p-8 flex flex-col items-center text-center">
                     <div className="size-16 rounded-[1.25rem] bg-background border-2 flex items-center justify-center mb-4">
                        <Info className="size-8 text-muted-foreground opacity-30" />
                     </div>
                     <h3 className="font-bold text-lg mb-2">Need Deeper Insights?</h3>
                     <p className="text-muted-foreground text-xs leading-relaxed mb-6">Connect your inventory data to get automated food cost percentage calculations per item.</p>
                     <Button variant="outline" className="rounded-xl border-2 font-bold text-xs uppercase tracking-widest px-6 h-10">
                        Connect Recipes
                     </Button>
                  </Card>
               </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  } catch (error) {
    console.error("Error loading menu performance report:", error);
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="size-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
           <ArrowUpRight className="size-10 text-rose-600 rotate-45" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-rose-600 mb-2">Intelligence Fault</h1>
        <p className="text-muted-foreground max-w-sm mb-8">We encountered an error processing your sales data. This usually happens if the selected date range has no completed transactions.</p>
        <Button variant="outline" className="rounded-xl border-2 font-bold px-8">Return to Hub</Button>
      </div>
    );
  }
}
