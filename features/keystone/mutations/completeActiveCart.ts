/**
 * completeActiveCart — Restaurant version of OpenFront's completeActiveCart.
 *
 * OpenFront: verifies payment → creates Order from Cart → creates Payment record.
 * Restaurant: same, but creates RestaurantOrder + OrderItems + Payment.
 *
 * Flow:
 *   1. Load cart with items, customer info, paymentData, paymentProvider
 *   2. Verify / capture payment via adapter (skip for cash)
 *   3. Create RestaurantOrder from cart data
 *   4. Create OrderItems from cart items (snapshot menuItem data)
 *   5. Create Payment record with data: json()
 *   6. Link cart → order, return completed order
 */
import type { Context } from ".keystone/types";
import { getPaymentStatus, capturePayment } from "../utils/paymentProviderAdapter";

interface CompleteActiveCartArgs {
  cartId: string;
}

export default async function completeActiveCart(
  root: any,
  { cartId }: CompleteActiveCartArgs,
  context: Context
) {
  const sudoContext = context.sudo();
  const userId = context.session?.itemId;

  // ── 1. Load cart ────────────────────────────────────────────────
  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      orderType
      subtotal
      email
      customerName
      customerPhone
      deliveryAddress
      deliveryCity
      deliveryZip
      tipPercent
      paymentData
      user { id }
      paymentProvider {
        id code
        capturePaymentFunction
        getPaymentStatusFunction
      }
      items {
        id
        quantity
        specialInstructions
        menuItem {
          id name price
          menuItemImages(take: 1) {
            id
            image { url }
            imagePath
          }
        }
        modifiers {
          id name priceAdjustment
        }
      }
    `,
  });

  if (!cart) throw new Error("Cart not found");
  if (!cart.items?.length) throw new Error("Cart is empty");

  const paymentData = cart.paymentData as Record<string, any> | null;
  const providerCode = paymentData?.providerCode as string | undefined;
  const paymentIntentId = paymentData?.paymentIntentId as string | undefined;

  // ── 2. Verify / capture payment ─────────────────────────────────
  const isManual = providerCode === "pp_manual" || providerCode === "pp_system_default";
  let paymentResult: { status: string; paymentIntentId: string | null } = {
    status: "manual_pending",
    paymentIntentId: null,
  };

  if (!isManual && paymentIntentId && cart.paymentProvider) {
    // Stripe / PayPal — verify with provider (same as OpenFront's handlePaidOrder)
    const status = await getPaymentStatus({
      provider: cart.paymentProvider,
      paymentId: paymentIntentId,
    });

    if (status.status === "succeeded") {
      paymentResult = { status: "succeeded", paymentIntentId };
    } else if (status.status === "requires_capture") {
      const captured = await capturePayment({
        provider: cart.paymentProvider,
        paymentId: paymentIntentId,
      });
      paymentResult = {
        status: captured.status === "succeeded" ? "succeeded" : "failed",
        paymentIntentId,
      };
    } else {
      throw new Error(`Payment not successful. Status: ${status.status}`);
    }

    if (paymentResult.status === "failed") {
      throw new Error("Payment capture failed");
    }
  }

  // ── 3. Compute totals ───────────────────────────────────────────
  const subtotal = cart.subtotal || 0;
  const tipPercent = parseInt(cart.tipPercent || "0", 10);
  const tip = Math.round(subtotal * (tipPercent / 100));

  // Get store settings for tax rate + currency
  const settings = await sudoContext.query.StoreSettings.findOne({
    where: { id: "1" },
    query: "taxRate currencyCode pickupDiscount",
  });
  const taxRate = parseFloat(settings?.taxRate || "8.75");
  const currencyCode = settings?.currencyCode || "USD";
  const storePickupDiscount = parseInt(settings?.pickupDiscount || "10", 10);
  const tax = Math.round(subtotal * (taxRate / 100));

  // Pickup discount
  const pickupDiscount = cart.orderType === "pickup" ? Math.round(subtotal * (storePickupDiscount / 100)) : 0;
  const total = subtotal - pickupDiscount + tax + tip;

  // ── 4. Create RestaurantOrder ───────────────────────────────────
  const orderTypeMap: Record<string, string> = {
    pickup: "takeout",
    delivery: "delivery",
  };

  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const customerId = cart.user?.id || userId;

  // Generate secretKey for guest orders (same as OpenFront)
  const secretKey = !customerId
    ? require("crypto").randomBytes(32).toString("hex")
    : undefined;

  const order = await sudoContext.query.RestaurantOrder.createOne({
    data: {
      orderNumber,
      orderType: orderTypeMap[cart.orderType || "pickup"] || "takeout",
      orderSource: "online",
      status: isManual ? "open" : "sent_to_kitchen",
      guestCount: 1,
      subtotal,
      tax,
      tip,
      total,
      currencyCode,
      customer: customerId ? { connect: { id: customerId } } : undefined,
      customerName: cart.customerName || "",
      customerEmail: cart.email || "",
      customerPhone: cart.customerPhone || "",
      deliveryAddress: cart.deliveryAddress || undefined,
      deliveryCity: cart.deliveryCity || undefined,
      deliveryZip: cart.deliveryZip || undefined,
      secretKey,
    },
    query: "id orderNumber secretKey",
  });

  // ── 5. Create OrderItems (snapshot cart items) ──────────────────
  for (const item of cart.items) {
    const modTotal =
      item.modifiers?.reduce(
        (s: number, m: any) => s + (m.priceAdjustment || 0),
        0
      ) || 0;
    const unitPrice = (item.menuItem?.price || 0) + modTotal;

    await sudoContext.query.OrderItem.createOne({
      data: {
        quantity: item.quantity,
        price: Math.round(unitPrice),
        specialInstructions: item.specialInstructions || "",
        order: { connect: { id: order.id } },
        menuItem: { connect: { id: item.menuItem.id } },
        appliedModifiers: item.modifiers?.length
          ? { connect: item.modifiers.map((m: any) => ({ id: m.id })) }
          : undefined,
      },
    });
  }

  // ── 6. Create Payment record ────────────────────────────────────
  const paymentMethodMap: Record<string, string> = {
    pp_stripe: "credit_card",
    pp_paypal: "paypal",
    pp_manual: "cash",
    pp_system_default: "cash",
  };

  await sudoContext.query.Payment.createOne({
    data: {
      amount: total,
      status: paymentResult.status === "succeeded" ? "succeeded" : "pending",
      paymentMethod: paymentMethodMap[providerCode || "pp_manual"] || "cash",
      currencyCode,
      tipAmount: tip,
      providerPaymentId: paymentResult.paymentIntentId || undefined,
      data: paymentData || {},
      processedAt:
        paymentResult.status === "succeeded"
          ? new Date().toISOString()
          : undefined,
      order: { connect: { id: order.id } },
      paymentProvider: cart.paymentProvider
        ? { connect: { id: cart.paymentProvider.id } }
        : undefined,
    },
  });

  // ── 7. Link cart → order (like OpenFront) ───────────────────────
  await sudoContext.query.Cart.updateOne({
    where: { id: cartId },
    data: {
      order: { connect: { id: order.id } },
    },
  });

  // Return order (same shape OpenFront returns from completeActiveCart)
  return await sudoContext.query.RestaurantOrder.findOne({
    where: { id: order.id },
    query: "id orderNumber secretKey status",
  });
}
