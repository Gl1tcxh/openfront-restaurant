export type Session = {
  itemId: string
  listKey: string
  data: {
    name: string
    role: {
      id: string
      name: string
      canAccessDashboard: boolean
      canReadOrders: boolean
      canManageOrders: boolean
      canReadPayments: boolean
      canManagePayments: boolean
      canReadProducts: boolean
      canManageProducts: boolean
      canReadCart: boolean
      canManageCart: boolean
      canReadInventory: boolean
      canManageInventory: boolean
      canReadUsers: boolean
      canManageUsers: boolean
      canSeeOtherPeople: boolean
      canEditOtherPeople: boolean
      canManagePeople: boolean
      canReadRoles: boolean
      canManageRoles: boolean
      canReadKitchen: boolean
      canManageKitchen: boolean
      canReadTables: boolean
      canManageTables: boolean
      canReadStaff: boolean
      canManageStaff: boolean
      canManageSettings: boolean
      canManageOnboarding: boolean
      canReadVendors: boolean
      canManageVendors: boolean
      canReadGiftCards: boolean
      canManageGiftCards: boolean
      canReadDiscounts: boolean
      canManageDiscounts: boolean
    }
  }
}

type AccessArgs = {
  session?: Session
}

export function isSignedIn({ session }: AccessArgs) {
  return Boolean(session)
}

// ─── Permissions (boolean checks) ───────────────────────────────────
// Each reads a checkbox from session.data.role. auto-generated from Role model fields.

export const permissions = {
  canAccessDashboard:       ({ session }: AccessArgs) => !!session?.data?.role?.canAccessDashboard,

  canReadOrders:            ({ session }: AccessArgs) => !!session?.data?.role?.canReadOrders,
  canManageOrders:          ({ session }: AccessArgs) => !!session?.data?.role?.canManageOrders,

  canReadPayments:          ({ session }: AccessArgs) => !!session?.data?.role?.canReadPayments,
  canManagePayments:        ({ session }: AccessArgs) => !!session?.data?.role?.canManagePayments,

  canReadProducts:          ({ session }: AccessArgs) => !!session?.data?.role?.canReadProducts,
  canManageProducts:        ({ session }: AccessArgs) => !!session?.data?.role?.canManageProducts,

  canReadCart:              ({ session }: AccessArgs) => !!session?.data?.role?.canReadCart,
  canManageCart:            ({ session }: AccessArgs) => !!session?.data?.role?.canManageCart,

  canReadInventory:         ({ session }: AccessArgs) => !!session?.data?.role?.canReadInventory,
  canManageInventory:       ({ session }: AccessArgs) => !!session?.data?.role?.canManageInventory,

  canReadUsers:             ({ session }: AccessArgs) => !!session?.data?.role?.canReadUsers,
  canManageUsers:           ({ session }: AccessArgs) => !!session?.data?.role?.canManageUsers,
  canSeeOtherPeople:        ({ session }: AccessArgs) => !!session?.data?.role?.canSeeOtherPeople,
  canEditOtherPeople:       ({ session }: AccessArgs) => !!session?.data?.role?.canEditOtherPeople,
  canManagePeople:          ({ session }: AccessArgs) => !!session?.data?.role?.canManagePeople,

  canReadRoles:             ({ session }: AccessArgs) => !!session?.data?.role?.canReadRoles,
  canManageRoles:           ({ session }: AccessArgs) => !!session?.data?.role?.canManageRoles,

  canReadKitchen:           ({ session }: AccessArgs) => !!session?.data?.role?.canReadKitchen,
  canManageKitchen:         ({ session }: AccessArgs) => !!session?.data?.role?.canManageKitchen,

  canReadTables:            ({ session }: AccessArgs) => !!session?.data?.role?.canReadTables,
  canManageTables:          ({ session }: AccessArgs) => !!session?.data?.role?.canManageTables,

  canReadStaff:             ({ session }: AccessArgs) => !!session?.data?.role?.canReadStaff,
  canManageStaff:           ({ session }: AccessArgs) => !!session?.data?.role?.canManageStaff,

  canManageSettings:        ({ session }: AccessArgs) => !!session?.data?.role?.canManageSettings,
  canManageOnboarding:      ({ session }: AccessArgs) => !!session?.data?.role?.canManageOnboarding,

  canReadVendors:           ({ session }: AccessArgs) => !!session?.data?.role?.canReadVendors,
  canManageVendors:         ({ session }: AccessArgs) => !!session?.data?.role?.canManageVendors,

  canReadGiftCards:         ({ session }: AccessArgs) => !!session?.data?.role?.canReadGiftCards,
  canManageGiftCards:       ({ session }: AccessArgs) => !!session?.data?.role?.canManageGiftCards,

  canReadDiscounts:         ({ session }: AccessArgs) => !!session?.data?.role?.canReadDiscounts,
  canManageDiscounts:       ({ session }: AccessArgs) => !!session?.data?.role?.canManageDiscounts,
}

// ─── Rules (boolean or filter returns) ──────────────────────────────
// Rules return true/false or a Keystone filter object for scoped queries.

export const rules = {
  canManageOrders({ session }: AccessArgs) {
    if (!isSignedIn({ session })) return false
    if (permissions.canManageOrders({ session })) return true
    return false
  },

  canManagePayments({ session }: AccessArgs) {
    if (!isSignedIn({ session })) return false
    if (permissions.canManagePayments({ session })) return true
    return false
  },

  canReadPeople({ session }: AccessArgs) {
    if (!session) return false
    if (permissions.canSeeOtherPeople({ session })) return true
    return { id: { equals: session.itemId } }
  },

  canUpdatePeople({ session }: AccessArgs) {
    if (!session) return false
    if (permissions.canEditOtherPeople({ session })) return true
    return { id: { equals: session.itemId } }
  },
}
