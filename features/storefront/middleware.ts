import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Handles storefront routes for the restaurant app
// Restaurant doesn't need region/country handling like e-commerce openfront
export async function handleStorefrontRoutes(request: NextRequest, user: any | null) {
  const cartId = request.nextUrl.searchParams.get("cart_id");
  const cartIdCookie = request.cookies.get("_restaurant_cart_id");

  let response = NextResponse.next();

  // Handle cart_id in URL (for shared cart links)
  if (cartId && !cartIdCookie) {
    response = NextResponse.redirect(request.nextUrl.href);
    response.cookies.set("_restaurant_cart_id", cartId, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  return response;
}
