"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPercentage, formatCurrency } from "../lib/reportHelpers";
import { Clock, Users, Table2, ChefHat, AlertTriangle, CheckCircle } from "lucide-react";

interface OperationalMetricsProps {
  currentOrders: number;
  tableOccupancy: number;
  totalTables: number;
  averageTicketTime: number;
  targetTicketTime: number;
  ordersInKitchen: number;
  ordersReady: number;
  voidRate: number;
  serverCount: number;
  revenuePerLaborHour?: number;
  currencyCode?: string;
  locale?: string;
}

export function OperationalMetrics({
  currentOrders,
  tableOccupancy,
  totalTables,
  averageTicketTime,
  targetTicketTime,
  ordersInKitchen,
  ordersReady,
  voidRate,
  serverCount,
  revenuePerLaborHour,
  currencyCode = "USD",
  locale = "en-US",
}: OperationalMetricsProps) {
  const currencyConfig = { currencyCode, locale };
  const occupancyPercent = totalTables > 0 ? (tableOccupancy / totalTables) * 100 : 0;
  const ticketTimeStatus = averageTicketTime <= targetTicketTime ? "good" : "warning";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Table2 className="w-4 h-4 text-blue-600" />
            Table Occupancy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{tableOccupancy}/{totalTables}</div>
          <Progress value={occupancyPercent} className="mt-2" />
          <div className="text-xs text-muted-foreground mt-1">
            {formatPercentage(occupancyPercent)} occupied
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            Avg Ticket Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatNumber(averageTicketTime)}</span>
            <span className="text-muted-foreground">min</span>
            {ticketTimeStatus === "good" ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                On Target
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Slow
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Target: {targetTicketTime} min
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-red-600" />
            Kitchen Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-2xl font-bold text-amber-600">{ordersInKitchen}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-2xl font-bold text-green-600">{ordersReady}</div>
              <div className="text-xs text-muted-foreground">Ready</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            Active Staff
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{serverCount}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Servers on floor
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Void Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatPercentage(voidRate, 2)}</span>
            {voidRate <= 2 ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Normal
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                High
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Target: Under 2%
          </div>
        </CardContent>
      </Card>

      {revenuePerLaborHour !== undefined && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue per Labor Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(revenuePerLaborHour, currencyConfig)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Sales efficiency metric
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
