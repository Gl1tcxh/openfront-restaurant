import { Context } from ".keystone/types";
import { assertCanAccessCart } from "../utils/cartAccess";
import {
  assertDeliveryAddressComplete,
  assertDeliveryAddressEligible,
  assertDeliveryModeAllowed,
  getStoreDeliverySettings,
  normalizeDeliveryFields,
} from "../utils/deliveryValidation";

export default async function updateActiveCart(root: any, { cartId, data }: { cartId: string, data: any }, context: Context) {
  const sudoContext = context.sudo();

  await assertCanAccessCart(context, cartId, "write");

  const normalizedData = normalizeDeliveryFields(data);
  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      orderType
      deliveryAddress
      deliveryCity
      deliveryCountryCode
      deliveryZip
    `,
  });

  const storeSettings = await getStoreDeliverySettings(context);
  const nextOrderType = normalizedData.orderType ?? cart?.orderType;

  assertDeliveryModeAllowed({
    orderType: nextOrderType,
    storeSettings,
  });

  const isUpdatingDeliveryAddress =
    "deliveryAddress" in normalizedData ||
    "deliveryAddress2" in normalizedData ||
    "deliveryCity" in normalizedData ||
    "deliveryState" in normalizedData ||
    "deliveryZip" in normalizedData ||
    "deliveryCountryCode" in normalizedData;

  if (isUpdatingDeliveryAddress) {
    assertDeliveryAddressComplete({
      orderType: nextOrderType,
      deliveryAddress: normalizedData.deliveryAddress ?? cart?.deliveryAddress,
      deliveryCity: normalizedData.deliveryCity ?? cart?.deliveryCity,
      deliveryCountryCode:
        normalizedData.deliveryCountryCode ?? cart?.deliveryCountryCode,
      deliveryZip: normalizedData.deliveryZip ?? cart?.deliveryZip,
    });

    assertDeliveryAddressEligible({
      orderType: nextOrderType,
      storeSettings,
      deliveryCountryCode:
        normalizedData.deliveryCountryCode ?? cart?.deliveryCountryCode,
      deliveryZip: normalizedData.deliveryZip ?? cart?.deliveryZip,
    });
  }

  // Update cart with modified data
  return await sudoContext.db.Cart.updateOne({
    where: { id: cartId },
    data: normalizedData,
  });
}
