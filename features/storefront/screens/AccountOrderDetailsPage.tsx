import { retrieveOrder } from "@/features/storefront/lib/data/orders";
import OrderDetailsTemplate from "@/features/storefront/modules/order/templates/order-details-template";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const order = await retrieveOrder(params.id, null).catch(() => null);

  if (!order) {
    notFound();
  }

  return {
    title: `Order #${order.orderNumber}`,
    description: "View your order",
  };
}

export async function AccountOrderDetailsPage(props: Props) {
  const params = await props.params;
  const order = await retrieveOrder(params.id, null).catch(() => null);

  if (!order) {
    return notFound();
  }

  return <OrderDetailsTemplate order={order} />;
}
