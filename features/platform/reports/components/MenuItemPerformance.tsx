"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercentage } from "../lib/reportHelpers";
import { TrendingUp, TrendingDown, Star, AlertCircle } from "lucide-react";

interface MenuItemPerformanceData {
  id: string;
  name: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
  cost?: number;
  profitMargin?: number;
  percentageOfSales: number;
}

interface MenuItemPerformanceProps {
  items: MenuItemPerformanceData[];
  totalRevenue: number;
}

function getClassification(item: MenuItemPerformanceData): { label: string; color: string; icon: React.ReactNode } {
  const highVolume = item.percentageOfSales > 5;
  const highMargin = (item.profitMargin ?? 50) > 60;

  if (highVolume && highMargin) {
    return { label: "Star", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: <Star className="w-3 h-3" /> };
  } else if (highVolume && !highMargin) {
    return { label: "Plow Horse", color: "bg-blue-100 text-blue-800 border-blue-300", icon: <TrendingUp className="w-3 h-3" /> };
  } else if (!highVolume && highMargin) {
    return { label: "Puzzle", color: "bg-purple-100 text-purple-800 border-purple-300", icon: <AlertCircle className="w-3 h-3" /> };
  }
  return { label: "Dog", color: "bg-gray-100 text-gray-800 border-gray-300", icon: <TrendingDown className="w-3 h-3" /> };
}

export function MenuItemPerformance({ items, totalRevenue }: MenuItemPerformanceProps) {
  const topItems = items.slice(0, 10);
  const bottomItems = items.slice(-5).reverse();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Selling Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topItems.map((item, index) => {
              const classification = getClassification(item);
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.name}</span>
                      <Badge variant="outline" className={`text-xs ${classification.color}`}>
                        {classification.icon}
                        <span className="ml-1">{classification.label}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{item.categoryName}</span>
                      <span>•</span>
                      <span>{formatNumber(item.quantitySold)} sold</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(item.revenue)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercentage(item.percentageOfSales)} of sales
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Slow Moving Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bottomItems.map((item) => {
              const classification = getClassification(item);
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.name}</span>
                      <Badge variant="outline" className={`text-xs ${classification.color}`}>
                        {classification.icon}
                        <span className="ml-1">{classification.label}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{item.categoryName}</span>
                      <span>•</span>
                      <span>{formatNumber(item.quantitySold)} sold</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(item.revenue)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercentage(item.percentageOfSales)} of sales
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
            <strong>Recommendation:</strong> Consider promoting these items or reviewing pricing/placement on the menu.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
