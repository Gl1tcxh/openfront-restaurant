import type { Context } from ".keystone/types";

export type TicketItem = {
  id: string;
  name: string;
  quantity: number;
  notes?: string | null;
  station: string;
  status: "new" | "in_progress" | "fulfilled";
  fulfilledAt?: string | null;
};

const ACTIVE_ORDER_STATUSES = ["sent_to_kitchen", "in_progress", "ready"] as const;
const ACTIVE_TICKET_STATUSES = ["new", "in_progress", "ready"] as const;

function normalizeStationName(name: string) {
  return name.trim().toLowerCase();
}

function displayStationName(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isExpediterStation(stationName?: string | null) {
  const n = (stationName || "").toLowerCase();
  return n.includes("expo") || n.includes("expediter");
}

export function isKitchenActiveOrderStatus(status?: string | null) {
  return ACTIVE_ORDER_STATUSES.includes((status || "") as (typeof ACTIVE_ORDER_STATUSES)[number]);
}

function getTicketStatusForOrderStatus(orderStatus?: string | null) {
  if (orderStatus === "ready") return "ready";
  if (orderStatus === "in_progress") return "in_progress";
  return "new";
}

async function getOrCreateStation(
  stationKey: string,
  context: Context,
  cachedStations: Array<{ id: string; name: string; displayOrder?: number | null }>
) {
  const normalized = normalizeStationName(stationKey);
  const existing = cachedStations.find((s) => normalizeStationName(s.name) === normalized);
  if (existing) return existing;

  const created = await context.sudo().db.KitchenStation.createOne({
    data: {
      name: displayStationName(stationKey),
      isActive: true,
      displayOrder: cachedStations.length,
    },
  });

  const createdStation = {
    id: created.id,
    name: displayStationName(stationKey),
    displayOrder: cachedStations.length,
  };

  cachedStations.push(createdStation);
  return createdStation;
}

function mapOrderItemsByStation(order: any): Record<string, TicketItem[]> {
  const grouped: Record<string, TicketItem[]> = {};

  for (const item of order.orderItems || []) {
    if (!item?.id) continue;
    const station = item.menuItem?.kitchenStation || "expo";
    if (!grouped[station]) grouped[station] = [];
    grouped[station].push({
      id: item.id,
      name: item.menuItem?.name || "Item",
      quantity: item.quantity || 1,
      notes: item.specialInstructions || null,
      station,
      status: "new",
      fulfilledAt: null,
    });
  }

  return grouped;
}

export async function reconcileRestaurantOrderStatus(orderId: string, context: Context) {
  const sudo = context.sudo();
  const [order, tickets] = await Promise.all([
    sudo.query.RestaurantOrder.findOne({
      where: { id: orderId },
      query: "id status",
    }),
    sudo.query.KitchenTicket.findMany({
      where: { order: { id: { equals: orderId } } },
      query: "id status",
    }),
  ]);

  if (!order || !tickets.length) return;

  const hasNew = tickets.some((t: any) => t.status === "new");
  const hasInProgress = tickets.some((t: any) => t.status === "in_progress");
  const hasReady = tickets.some((t: any) => t.status === "ready");
  const hasServed = tickets.some((t: any) => t.status === "served");
  const allServed = tickets.every((t: any) => ["served", "cancelled"].includes(t.status));

  let nextStatus: string | null = null;
  if (hasInProgress) nextStatus = "in_progress";
  else if (hasReady && !hasNew) nextStatus = "ready";
  else if (hasReady || hasNew) nextStatus = "sent_to_kitchen";
  else if (allServed || hasServed) nextStatus = "served";

  if (nextStatus && nextStatus !== order.status) {
    await sudo.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: { status: nextStatus },
    });
  }
}

export async function syncKitchenTicketsForOrder(orderId: string, context: Context) {
  const sudo = context.sudo();

  const order = await sudo.query.RestaurantOrder.findOne({
    where: { id: orderId },
    query: `
      id
      status
      isUrgent
      onHold
      createdAt
      orderItems {
        id
        quantity
        specialInstructions
        menuItem { id name kitchenStation }
      }
    `,
  });

  if (!order) {
    return { created: 0, updated: 0, removed: 0 };
  }

  const existingTickets = await sudo.query.KitchenTicket.findMany({
    where: {
      order: { id: { equals: order.id } },
      status: { in: [...ACTIVE_TICKET_STATUSES, "served", "cancelled"] },
    },
    query: "id items status firedAt station { id name }",
    orderBy: { firedAt: "asc" },
  });

  if (order.status === "completed" || order.status === "cancelled") {
    const now = new Date().toISOString();
    let updated = 0;

    for (const ticket of existingTickets.filter((t: any) => ACTIVE_TICKET_STATUSES.includes(t.status))) {
      await sudo.db.KitchenTicket.updateOne({
        where: { id: ticket.id },
        data: {
          status: order.status === "completed" ? "served" : "cancelled",
          completedAt: order.status === "completed" ? now : undefined,
          servedAt: order.status === "completed" ? now : undefined,
        },
      });
      updated += 1;
    }

    return { created: 0, updated, removed: 0 };
  }

  if (!isKitchenActiveOrderStatus(order.status)) {
    return { created: 0, updated: 0, removed: 0 };
  }

  const stations = await sudo.query.KitchenStation.findMany({
    query: "id name displayOrder",
    where: { isActive: { equals: true } },
    orderBy: { displayOrder: "asc" },
  });

  const stationItemMap = mapOrderItemsByStation(order);
  let created = 0;
  let updated = 0;
  let removed = 0;

  const desiredStationKeys = new Set(Object.keys(stationItemMap).map(normalizeStationName));

  if (desiredStationKeys.size === 0) {
    for (const ticket of existingTickets.filter((t: any) => ACTIVE_TICKET_STATUSES.includes(t.status))) {
      await sudo.db.KitchenTicket.deleteOne({ where: { id: ticket.id } });
      removed += 1;
    }
    return { created, updated, removed };
  }

  for (const [stationKey, items] of Object.entries(stationItemMap)) {
    const station = await getOrCreateStation(stationKey, context, stations as any);
    const matchingTickets = existingTickets.filter(
      (ticket: any) => normalizeStationName(ticket.station?.name || "") === normalizeStationName(station.name)
    );

    const priority = order.isUrgent ? 100 : order.onHold ? -10 : 0;
    const ticketType = isExpediterStation(station.name) ? "expediter" : "prep";

    if (matchingTickets.length > 0) {
      const existing = matchingTickets[0];
      const existingItems = (existing.items as TicketItem[] | null) || [];
      const existingMap = new Map(existingItems.map((i) => [i.id, i]));

      const mergedItems = items.map((item) => {
        const prev = existingMap.get(item.id);
        if (!prev) return item;
        return {
          ...item,
          status: prev.status || "new",
          fulfilledAt: prev.fulfilledAt || null,
        };
      });

      await sudo.db.KitchenTicket.updateOne({
        where: { id: existing.id },
        data: {
          items: mergedItems,
          priority,
          ticketType,
          firedAt: existing.firedAt || order.createdAt,
        },
      });
      updated += 1;

      for (const duplicate of matchingTickets.slice(1)) {
        await sudo.db.KitchenTicket.deleteOne({ where: { id: duplicate.id } });
        removed += 1;
      }
    } else {
      await sudo.db.KitchenTicket.createOne({
        data: {
          order: { connect: { id: order.id } },
          station: { connect: { id: station.id } },
          items,
          priority,
          ticketType,
          status: getTicketStatusForOrderStatus(order.status),
          firedAt: order.createdAt,
        },
      });
      created += 1;
    }
  }

  for (const ticket of existingTickets.filter((ticket: any) => ACTIVE_TICKET_STATUSES.includes(ticket.status))) {
    const stationName = normalizeStationName(ticket.station?.name || "");
    if (!desiredStationKeys.has(stationName)) {
      await sudo.db.KitchenTicket.deleteOne({ where: { id: ticket.id } });
      removed += 1;
    }
  }

  await reconcileRestaurantOrderStatus(order.id, context);

  return { created, updated, removed };
}

export async function syncKitchenTicketsForActiveOrders(context: Context) {
  const orders = await context.sudo().query.RestaurantOrder.findMany({
    where: {
      status: { in: [...ACTIVE_ORDER_STATUSES] },
    },
    orderBy: { createdAt: "asc" },
    query: "id",
  });

  let created = 0;
  let updated = 0;
  let removed = 0;

  for (const order of orders) {
    const result = await syncKitchenTicketsForOrder(order.id, context);
    created += result.created;
    updated += result.updated;
    removed += result.removed;
  }

  return { created, updated, removed };
}
