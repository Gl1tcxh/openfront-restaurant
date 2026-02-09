import { retrieveOrder } from "@/features/storefront/lib/data/orders";
import OrderCompletedTemplate from "@/features/storefront/modules/order/templates/order-completed-template";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order was placed successfully",
};

export async function OrderConfirmedPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Props) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;

  const secretKey =
    typeof searchParams?.secretKey === "string" ? searchParams.secretKey : null;

  const order = await retrieveOrder(params.id, secretKey).catch(() => null);

  if (!order) {
    return notFound();
  }

  return <OrderCompletedTemplate order={order} />;
}
