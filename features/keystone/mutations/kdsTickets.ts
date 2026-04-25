import type { Context } from ".keystone/types";
import { permissions } from "../access";
import {
  isExpediterStation,
  reconcileRestaurantOrderStatus,
  syncKitchenTicketsForActiveOrders,
} from "../utils/kitchenTicketSync";

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


export async function syncKitchenTickets(root: any, args: any, context: Context): Promise<SyncResult> {
  if (!permissions.canManageKitchen({ session: context.session })) {
    return { success: false, error: 'Not authorized', created: 0, updated: 0 };
  }

  try {
    const result = await syncKitchenTicketsForActiveOrders(context);
    return { success: true, error: null, created: result.created, updated: result.updated };
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
  if (!permissions.canManageKitchen({ session: context.session })) {
    return { success: false, error: 'Not authorized' };
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
  if (!permissions.canManageKitchen({ session: context.session })) {
    return { success: false, error: 'Not authorized' };
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
