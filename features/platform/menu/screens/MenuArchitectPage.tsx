"use client";

import React, { useState, useEffect, useMemo } from "react";
import { gql, request } from "graphql-request";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit2, Utensils, BookOpen, Layers, Zap, Info, Search, Trash2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs";
import { formatCurrency } from "@/features/storefront/lib/currency";
import { EditItemDrawerClientWrapper } from "@/features/platform/components/EditItemDrawerClientWrapper";
import { CreateItemDrawerClientWrapper } from "@/features/platform/components/CreateItemDrawerClientWrapper";

const GET_MENU_DATA = gql`
  query GetMenuData {
    menuCategories(orderBy: { sortOrder: asc }) {
      id
      name
      icon
      description
    }
    menuItems(orderBy: { name: asc }) {
      id
      name
      price
      available
      popular
      kitchenStation
      category { id }
      modifiers {
        id
        name
        priceAdjustment
      }
    }
    storeSettings {
      currencyCode
      locale
    }
  }
`;

export function MenuArchitectPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createListKey, setCreateListKey] = useState<string>("menu-items");

  const fetchData = async () => {
    try {
      const res = await request("/api/graphql", GET_MENU_DATA);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currencyConfig = useMemo(() => {
    return {
      currencyCode: data?.storeSettings?.currencyCode || "USD",
      locale: data?.storeSettings?.locale || "en-US",
    };
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data?.menuItems) return [];
    if (activeCategoryId === "all") return data.menuItems;
    return data.menuItems.filter((item: any) => item.category?.id === activeCategoryId);
  }, [data, activeCategoryId]);

  if (loading) return <div className="flex items-center justify-center p-20">Loading...</div>;

  const breadcrumbs = [
    { type: "link" as const, label: "Dashboard", href: "/dashboard" },
    { type: "page" as const, label: "Platform" },
    { type: "page" as const, label: "Menu Architect" },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <PageBreadcrumbs items={breadcrumbs} />

      <div className="px-6 py-8 border-b bg-gradient-to-br from-emerald-500/5 via-background to-amber-500/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
              <BookOpen className="size-8 text-primary" />
              Menu Architect
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium">
              Unified design center for your culinary offerings. Manage categories, items, and modifiers in a single visual workspace.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              className="rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] h-12 px-6"
              onClick={() => {
                setCreateListKey("menu-categories");
                setIsCreateOpen(true);
              }}
            >
              New Category
            </Button>
            <Button 
              className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 px-6 shadow-xl shadow-primary/20"
              onClick={() => {
                setCreateListKey("menu-items");
                setIsCreateOpen(true);
              }}
            >
              <Plus className="size-4 mr-2" />
              New Item
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 items-center bg-muted/30 p-2 rounded-3xl border border-dashed border-muted-foreground/20">
          <Button
            variant={activeCategoryId === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveCategoryId("all")}
            className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 px-5"
          >
            All Items
          </Button>
          <div className="h-4 w-px bg-muted mx-1" />
          {data?.menuCategories?.map((cat: any) => (
            <Button
              key={cat.id}
              variant={activeCategoryId === cat.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveCategoryId(cat.id)}
              className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 px-5"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 pb-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item: any) => (
            <Card key={item.id} className={cn(
              "group border-2 rounded-[2rem] overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:-translate-y-1 bg-card flex flex-col",
              !item.available && "opacity-60 grayscale"
            )}>
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-primary/5 text-primary">
                    <Utensils className="size-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="font-black text-lg tracking-tighter">{formatCurrency(parseInt(item.price), currencyConfig)}</div>
                    {!item.available && <Badge variant="destructive" className="rounded-md font-bold text-[8px] uppercase tracking-widest px-1.5 py-0">Unavailable</Badge>}
                    {item.popular && <Badge variant="secondary" className="rounded-md font-bold text-[8px] uppercase tracking-widest px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20">Star Item</Badge>}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                   <div>
                      <h3 className="font-black text-xl leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Station: {item.kitchenStation || "Kitchen"}</p>
                   </div>

                   {item.modifiers?.length > 0 && (
                     <div className="space-y-2">
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                           <Layers className="size-3" />
                           Active Modifiers
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.modifiers.map((mod: any) => (
                            <Badge key={mod.id} variant="outline" className="rounded-lg font-bold text-[9px] bg-muted/30 border-muted group-hover:border-primary/20">
                              {mod.name}
                            </Badge>
                          ))}
                        </div>
                     </div>
                   )}
                </div>

                <div className="pt-6 mt-6 border-t flex items-center justify-between">
                   <Button 
                    variant="ghost" 
                    className="h-9 px-0 font-black uppercase tracking-widest text-[10px] hover:bg-transparent hover:text-primary"
                    onClick={() => setEditingItemId(item.id)}
                   >
                     Configure <Edit2 className="size-3 ml-2" />
                   </Button>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50">
                         <Trash2 className="size-4" />
                      </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <button 
            className="border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-12 hover:bg-muted/50 hover:border-primary/30 transition-all gap-4 group/add"
            onClick={() => {
              setCreateListKey("menu-items");
              setIsCreateOpen(true);
            }}
          >
            <div className="size-16 rounded-[1.5rem] bg-muted flex items-center justify-center group-hover/add:bg-primary/10 transition-colors">
              <Plus className="size-8 text-muted-foreground group-hover/add:text-primary" />
            </div>
            <div className="text-center">
              <p className="font-black uppercase tracking-widest text-[10px]">Add Item</p>
              <p className="text-[10px] text-muted-foreground mt-1">Expansion Slot</p>
            </div>
          </button>
        </div>
      </ScrollArea>

      {editingItemId && (
        <EditItemDrawerClientWrapper
          listKey="menu-items"
          itemId={editingItemId}
          open={!!editingItemId}
          onClose={() => setEditingItemId(null)}
          onSave={() => fetchData()}
        />
      )}

      <CreateItemDrawerClientWrapper
        listKey={createListKey}
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={() => fetchData()}
      />
    </div>
  );
}

export default MenuArchitectPage;
