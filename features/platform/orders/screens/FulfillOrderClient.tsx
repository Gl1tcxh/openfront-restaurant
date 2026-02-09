"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChefHat, 
  Utensils, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus } from "../actions";

interface FulfillOrderClientProps {
  order: any;
}

export function FulfillOrderClient({ order }: FulfillOrderClientProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleFireSelected = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to send to kitchen");
      return;
    }
    
    // In a real app, we would have a 'fireOrderItems' action
    // For now, let's just update the order status
    const result = await updateOrderStatus(order.id, 'sent_to_kitchen');
    if (result.success) {
      toast.success(`${selectedItems.length} items sent to kitchen`);
      setSelectedItems([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Management</h1>
          <p className="text-muted-foreground">Mark items for kitchen or service</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => setSelectedItems(order.orderItems.map((i: any) => i.id))}>
             Select All
           </Button>
           <Button 
            disabled={selectedItems.length === 0}
            onClick={handleFireSelected}
            className="bg-orange-600 hover:bg-orange-700"
           >
             <ChefHat className="h-4 w-4 mr-2" />
             Send to Kitchen ({selectedItems.length})
           </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {order.orderItems?.map((item: any) => (
              <div 
                key={item.id} 
                className={`p-4 flex items-center gap-4 transition-colors ${
                  selectedItems.includes(item.id) ? "bg-orange-50/50" : "hover:bg-muted/50"
                }`}
                onClick={() => toggleItem(item.id)}
              >
                <Checkbox 
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => toggleItem(item.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{item.quantity}x</span>
                    <span className="font-medium">{item.menuItem?.name}</span>
                  </div>
                  {item.specialInstructions && (
                    <p className="text-sm text-muted-foreground italic ml-7">
                      "{item.specialInstructions}"
                    </p>
                  )}
                </div>
                <Badge variant="outline">
                   Course {item.courseNumber || 1}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="border-emerald-100 bg-emerald-50/20">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-emerald-900">
             Current order status: <Badge className="bg-emerald-600 ml-1">{order.status?.replace('_', ' ')}</Badge>
             <p className="mt-2 opacity-80">All items are logged and ready for processing.</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/20">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2 text-blue-800">
              <Utensils className="h-4 w-4" />
              Dining Info
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900">
             Table: {order.tables?.map((t: any) => t.name).join(', ') || 'N/A'}
             <br />
             Server: {order.server?.name || 'Unassigned'}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
