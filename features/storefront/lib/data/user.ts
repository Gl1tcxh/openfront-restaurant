"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { gql } from "graphql-request";
import { openfrontClient } from "@/features/storefront/lib/config";
import { getAuthHeaders, setAuthToken, removeAuthToken } from "./cookies";

export async function getUser() {
  try {
    const headers = await getAuthHeaders();
    const { authenticatedItem } = await openfrontClient.request(
      gql`
        query GetAuthenticatedItem {
          authenticatedItem {
            ... on User {
              id
              email
              name
              firstName
              lastName
              phone
              createdAt
              addresses {
                id
                name
                address1
                address2
                city
                state
                postalCode
                phone
                isDefault
              }
            }
          }
        }
      `,
      {},
      headers
    );

    return authenticatedItem;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function login(_currentState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const result = await openfrontClient.request(
      gql`
        mutation AuthenticateUser($email: String!, $password: String!) {
          authenticateUserWithPassword(email: $email, password: $password) {
            ... on UserAuthenticationWithPasswordSuccess {
              sessionToken
              item {
                id
                email
              }
            }
            ... on UserAuthenticationWithPasswordFailure {
              message
            }
          }
        }
      `,
      { email, password }
    );

    const auth = result.authenticateUserWithPassword;

    if (auth.message) {
      return auth.message;
    }

    if (auth.sessionToken) {
      await setAuthToken(auth.sessionToken);
      (revalidatePath as any)("/");
      (revalidateTag as any)("customer");
      return null; // Success
    }

    return "An unexpected error occurred";
  } catch (error) {
    console.error("Login error:", error);
    return error instanceof Error ? error.message : "An unexpected error occurred";
  }
}

export async function signUp(_currentState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;

  try {
    // First create the user
    const { createUser } = await openfrontClient.request(
      gql`
        mutation CreateUser($data: UserCreateInput!) {
          createUser(data: $data) {
            id
            email
          }
        }
      `,
      {
        data: { email, password, name, phone }
      }
    );

    if (!createUser?.id) {
      return "Failed to create account";
    }

    // Then authenticate them
    const { authenticateUserWithPassword } = await openfrontClient.request(
      gql`
        mutation SignIn($email: String!, $password: String!) {
          authenticateUserWithPassword(email: $email, password: $password) {
            ... on UserAuthenticationWithPasswordSuccess {
              sessionToken
            }
            ... on UserAuthenticationWithPasswordFailure {
              message
            }
          }
        }
      `,
      { email, password }
    );

    if (authenticateUserWithPassword.sessionToken) {
      await setAuthToken(authenticateUserWithPassword.sessionToken);
      revalidatePath("/");
      return null; // Success
    }

    return "Account created but sign in failed. Please sign in manually.";
  } catch (error) {
    console.error("Sign up error:", error);
    return error instanceof Error ? error.message : "An unexpected error occurred";
  }
}

export async function signOut() {
  await removeAuthToken();
  revalidatePath("/");
  redirect("/");
}

export async function updateCustomerEmail(_prevState: any, formData: FormData) {
  try {
    const headers = await getAuthHeaders();
    await openfrontClient.request(
      gql`
        mutation UpdateUser($data: UserUpdateProfileInput!) {
          updateActiveUser(data: $data) {
            id
            email
          }
        }
      `,
      {
        data: {
          email: formData.get("email"),
        },
      },
      headers
    );
    (revalidateTag as any)("customer");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateCustomerName(_prevState: any, formData: FormData) {
  try {
    const headers = await getAuthHeaders();
    await openfrontClient.request(
      gql`
        mutation UpdateUser($data: UserUpdateProfileInput!) {
          updateActiveUser(data: $data) {
            id
            name
          }
        }
      `,
      {
        data: {
          name: formData.get("name"),
        },
      },
      headers
    );
    (revalidateTag as any)("customer");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateCustomerPassword(_prevState: any, formData: FormData) {
  try {
    const headers = await getAuthHeaders();
    await openfrontClient.request(
      gql`
        mutation UpdateUser($data: UserUpdateProfileInput!) {
          updateActiveUser(data: $data) {
            id
          }
        }
      `,
      {
        data: {
          password: formData.get("password"),
        },
      },
      headers
    );
    (revalidateTag as any)("customer");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateCustomerPhone(_prevState: any, formData: FormData) {
  try {
    const headers = await getAuthHeaders();
    await openfrontClient.request(
      gql`
        mutation UpdateUser($data: UserUpdateProfileInput!) {
          updateActiveUser(data: $data) {
            id
            phone
          }
        }
      `,
      {
        data: {
          phone: formData.get("phone"),
        },
      },
      headers
    );
    (revalidateTag as any)("customer");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getUserOrders() {
  try {
    const authHeaders = await getAuthHeaders();
    const { getCustomerOrders: orders } = await openfrontClient.request(
      gql`
        query GetCustomerOrders($limit: Int, $offset: Int) {
          getCustomerOrders(limit: $limit, offset: $offset)
        }
      `,
      { limit: 10, offset: 0 },
      authHeaders
    );

    return orders || [];
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

export async function createAddress(_currentState: any, formData: FormData) {
  try {
    const headers = await getAuthHeaders();
    const addressData = {
      name: formData.get("name") as string,
      address1: formData.get("address1") as string,
      address2: formData.get("address2") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      postalCode: formData.get("postalCode") as string,
      phone: formData.get("phone") as string,
      isDefault: formData.get("isDefault") === "on",
    };

    const user = await getUser();
    if (!user) return { error: "Not authenticated" };

    await openfrontClient.request(
      gql`
        mutation CreateAddress($data: AddressCreateInput!) {
          createAddress(data: $data) {
            id
          }
        }
      `,
      {
        data: {
          ...addressData,
          user: { connect: { id: user.id } }
        }
      },
      headers
    );

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Create address error:", error);
    return { error: "Failed to create address" };
  }
}

export async function updateAddress(_currentState: any, formData: FormData) {
  try {
    const headers = await getAuthHeaders();
    const id = formData.get("id") as string;
    const addressData = {
      name: formData.get("name") as string,
      address1: formData.get("address1") as string,
      address2: formData.get("address2") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      postalCode: formData.get("postalCode") as string,
      phone: formData.get("phone") as string,
      isDefault: formData.get("isDefault") === "on",
    };

    await openfrontClient.request(
      gql`
        mutation UpdateAddress($id: ID!, $data: AddressUpdateInput!) {
          updateAddress(where: { id: $id }, data: $data) {
            id
          }
        }
      `,
      {
        id,
        data: addressData
      },
      headers
    );

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Update address error:", error);
    return { error: "Failed to update address" };
  }
}

export async function deleteAddress(id: string) {
  try {
    const headers = await getAuthHeaders();
    await openfrontClient.request(
      gql`
        mutation DeleteAddress($id: ID!) {
          deleteAddress(where: { id: $id }) {
            id
          }
        }
      `,
      { id },
      headers
    );

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Delete address error:", error);
    return { error: "Failed to delete address" };
  }
}

/**
 * Attempt to create a guest account and authenticate the user.
 * Mirrors OpenFront's checkout guest-auth flow:
 *   1. If user is already authenticated → no-op.
 *   2. Try createUser with a random password.
 *   3. If email already exists (unique constraint) → return a human-readable error.
 *   4. If created → immediately authenticateUserWithPassword → set session cookie.
 */
export async function createGuestUser(params: {
  email: string;
  name: string;
  phone?: string;
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // 1. Already authenticated?
    const existing = await getUser();
    if (existing) return { success: true, userId: existing.id };

    const { email, name, phone } = params;

    // 2. Random password the user never sees
    const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 3. Create user
    const { createUser: guestUser } = await openfrontClient.request(
      gql`
        mutation CreateGuestUser($data: UserCreateInput!) {
          createUser(data: $data) {
            id
            email
          }
        }
      `,
      {
        data: {
          email,
          name,
          phone,
          password: randomPassword,
        },
      }
    );

    if (!guestUser?.id) {
      return { success: false, error: "Failed to create account." };
    }

    // 4. Authenticate immediately so the session cookie is set
    const { authenticateUserWithPassword } = await openfrontClient.request(
      gql`
        mutation AuthenticateGuestUser($email: String!, $password: String!) {
          authenticateUserWithPassword(email: $email, password: $password) {
            ... on UserAuthenticationWithPasswordSuccess {
              sessionToken
            }
            ... on UserAuthenticationWithPasswordFailure {
              message
              __typename
            }
          }
        }
      `,
      { email, password: randomPassword }
    );

    if (authenticateUserWithPassword.__typename === "UserAuthenticationWithPasswordFailure") {
      return { success: false, error: "Authentication failed. Please try again or contact support." };
    }

    if (authenticateUserWithPassword.sessionToken) {
      await setAuthToken(authenticateUserWithPassword.sessionToken);
      (revalidateTag as any)("customer");
      (revalidateTag as any)("auth");
    }

    const authenticatedUser = await getUser();
    return { success: true, userId: authenticatedUser?.id || guestUser.id };
  } catch (error: any) {
    // 5. Unique constraint → email already has an account
    const msg = error instanceof Error ? error.message : String(error);
    const lower = msg.toLowerCase();
    const errorStr = JSON.stringify(error).toLowerCase();

    if (
      lower.includes("unique constraint") ||
      lower.includes("already exists") ||
      lower.includes("duplicate") ||
      lower.includes("unique") ||
      errorStr.includes("unique constraint") ||
      errorStr.includes("duplicate") ||
      errorStr.includes("email_unique") ||
      error?.code === "P2002"
    ) {
      return {
        success: false,
        error:
          "This email address already has an account. Please sign in or use a different email to continue with your order.",
      };
    }

    return { success: false, error: msg };
  }
}
