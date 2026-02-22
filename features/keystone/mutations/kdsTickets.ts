import type { Context } from ".keystone/types";

type TicketItem = {
  id: string;
  name: string;
  quantity: number;
  notes?: string | null;
  station: string;
  status: 'new' | 'in_progress' | 'fulfilled';
  fulfilledAt?: string | null;
};

interface MutationResult {
  success: boolean;
  error: string | null;
}

interface SyncResult extends MutationResult {
  created: number;
  updated: number;
}

function normalizeStationName(name: string) {
  return name.trim().toLowerCase();
}

function displayStationName(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isExpediterStation(stationName?: string | null) {
  const n = (stationName || '').toLowerCase();
  return n.includes('expo') || n.includes('expediter');
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

  const seen = new Set<string>();
  const pushItem = (item: any) => {
    if (!item?.id || seen.has(item.id)) return;
    seen.add(item.id);
    const station = item.menuItem?.kitchenStation || 'expo';
    if (!grouped[station]) grouped[station] = [];
    grouped[station].push({
      id: item.id,
      name: item.menuItem?.name || 'Item',
      quantity: item.quantity || 1,
      notes: item.specialInstructions || null,
      station,
      status: 'new',
      fulfilledAt: null,
    });
  };

  for (const course of order.courses || []) {
    for (const item of course.orderItems || []) {
      pushItem(item);
    }
  }

  // Fallback for existing orders that may not have courses wired
  for (const item of order.orderItems || []) {
    pushItem(item);
  }

  return grouped;
}

async function reconcileRestaurantOrderStatus(orderId: string, context: Context) {
  const tickets = await context.sudo().query.KitchenTicket.findMany({
    where: { order: { id: { equals: orderId } } },
    query: 'id status',
  });

  if (!tickets.length) return;

  const hasNewOrInProgress = tickets.some((t: any) => ['new', 'in_progress'].includes(t.status));
  const hasReady = tickets.some((t: any) => t.status === 'ready');
  const hasServed = tickets.some((t: any) => t.status === 'served');
  const allServed = tickets.every((t: any) => t.status === 'served');

  let nextStatus: string | null = null;
  if (hasNewOrInProgress) nextStatus = 'in_progress';
  else if (hasReady) nextStatus = 'ready';
  else if (allServed || hasServed) nextStatus = 'served';

  if (nextStatus) {
    await context.sudo().db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: { status: nextStatus },
    });
  }
}

export async function syncKitchenTickets(root: any, args: any, context: Context): Promise<SyncResult> {
  if (!context.session?.itemId) {
    return { success: false, error: 'Must be signed in', created: 0, updated: 0 };
  }

  try {
    const sudo = context.sudo();
    const stations = await sudo.query.KitchenStation.findMany({
      query: 'id name displayOrder',
      where: { isActive: { equals: true } },
      orderBy: { displayOrder: 'asc' },
    });

    const orders = await sudo.query.RestaurantOrder.findMany({
      where: {
        status: { in: ['open', 'sent_to_kitchen', 'in_progress', 'ready'] },
      },
      orderBy: { createdAt: 'asc' },
      query: `
        id
        status
        isUrgent
        onHold
        createdAt
        courses {
          id
          orderItems {
            id
            quantity
            specialInstructions
            menuItem { id name kitchenStation }
          }
        }
        orderItems {
          id
          quantity
          specialInstructions
          menuItem { id name kitchenStation }
        }
      `,
    });

    let created = 0;
    let updated = 0;

    for (const order of orders) {
      const stationItemMap = mapOrderItemsByStation(order);

      for (const [stationKey, items] of Object.entries(stationItemMap)) {
        const station = await getOrCreateStation(stationKey, context, stations as any);

        const existingTickets = await sudo.query.KitchenTicket.findMany({
          where: {
            order: { id: { equals: order.id } },
            station: { id: { equals: station.id } },
            status: { in: ['new', 'in_progress', 'ready'] },
          },
          query: 'id items status',
          take: 1,
        });

        const priority = order.isUrgent ? 100 : order.onHold ? -10 : 0;

        if (existingTickets.length > 0) {
          const existing = existingTickets[0];
          const existingItems = (existing.items as TicketItem[] | null) || [];
          const existingMap = new Map(existingItems.map((i) => [i.id, i]));

          const mergedItems = items.map((item) => {
            const prev = existingMap.get(item.id);
            if (!prev) return item;
            return {
              ...item,
              status: prev.status || 'new',
              fulfilledAt: prev.fulfilledAt || null,
            };
          });

          await sudo.db.KitchenTicket.updateOne({
            where: { id: existing.id },
            data: {
              items: mergedItems,
              priority,
              status: existing.status === 'ready' && order.status !== 'ready' ? 'in_progress' : undefined,
            },
          });
          updated += 1;
        } else {
          await sudo.db.KitchenTicket.createOne({
            data: {
              order: { connect: { id: order.id } },
              station: { connect: { id: station.id } },
              items,
              priority,
              status: order.status === 'ready' ? 'ready' : 'new',
              firedAt: order.createdAt,
            },
          });
          updated += 1;
          created += 1;
        }
      }

      // If order is just received and now has kitchen tickets, move it into kitchen pipeline.
      if (Object.keys(stationItemMap).length > 0 && order.status === 'open') {
        await sudo.db.RestaurantOrder.updateOne({
          where: { id: order.id },
          data: { status: 'sent_to_kitchen' },
        });
      }

      await reconcileRestaurantOrderStatus(order.id, context);
    }

    return { success: true, error: null, created, updated };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      created: 0,
      updated: 0,
    };
  }
}

export async function updateKitchenTicketStatus(
  root: any,
  args: { ticketId: string; status: 'new' | 'in_progress' | 'ready' | 'served' | 'cancelled' },
  context: Context
): Promise<MutationResult> {
  if (!context.session?.itemId) {
    return { success: false, error: 'Must be signed in' };
  }

  try {
    const now = new Date().toISOString();
    const sudo = context.sudo();

    const ticket = await sudo.query.KitchenTicket.findOne({
      where: { id: args.ticketId },
      query: 'id order { id } station { name }',
    });

    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    // Sequenced prep -> expediter gate
    if (args.status === 'served' && isExpediterStation(ticket.station?.name) && ticket.order?.id) {
      const siblingTickets = await sudo.query.KitchenTicket.findMany({
        where: {
          order: { id: { equals: ticket.order.id } },
          status: { in: ['new', 'in_progress'] },
        },
        query: 'id status station { name }',
      });

      const blockingPrep = siblingTickets.filter((t: any) => t.id !== ticket.id && !isExpediterStation(t.station?.name));

      if (blockingPrep.length > 0) {
        const stations = blockingPrep.map((t: any) => t.station?.name).filter(Boolean).join(', ');
        return {
          success: false,
          error: stations
            ? `Prep stations still working: ${stations}`
            : 'Prep tickets must be completed before expediter can bump served',
        };
      }
    }

    await sudo.db.KitchenTicket.updateOne({
      where: { id: args.ticketId },
      data: {
        status: args.status,
        completedAt: args.status === 'ready' ? now : args.status === 'in_progress' ? null : undefined,
        servedAt: args.status === 'served' ? now : undefined,
      },
    });

    if (ticket.order?.id) {
      await reconcileRestaurantOrderStatus(ticket.order.id, context);
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function fulfillKitchenTicketItem(
  root: any,
  args: { ticketId: string; itemId: string; fulfilled: boolean },
  context: Context
): Promise<MutationResult> {
  if (!context.session?.itemId) {
    return { success: false, error: 'Must be signed in' };
  }

  try {
    const sudo = context.sudo();
    const now = new Date().toISOString();

    const ticket = await sudo.query.KitchenTicket.findOne({
      where: { id: args.ticketId },
      query: 'id items order { id }',
    });

    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    const items = ((ticket.items as TicketItem[] | null) || []).map((item) => {
      if (item.id !== args.itemId) return item;
      return {
        ...item,
        status: args.fulfilled ? 'fulfilled' : 'in_progress',
        fulfilledAt: args.fulfilled ? now : null,
      };
    });

    const allFulfilled = items.length > 0 && items.every((i) => i.status === 'fulfilled');

    await sudo.db.KitchenTicket.updateOne({
      where: { id: args.ticketId },
      data: {
        items,
        status: allFulfilled ? 'ready' : 'in_progress',
        completedAt: allFulfilled ? now : null,
      },
    });

    if (ticket.order?.id) {
      await reconcileRestaurantOrderStatus(ticket.order.id, context);
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
