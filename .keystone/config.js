"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __glob = (map) => (path) => {
  var fn = map[path];
  if (fn) return fn();
  throw new Error("Module not found in bundle: " + path);
};
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// features/integrations/payment/stripe.ts
var stripe_exports = {};
__export(stripe_exports, {
  capturePaymentFunction: () => capturePaymentFunction,
  createPaymentFunction: () => createPaymentFunction,
  generatePaymentLinkFunction: () => generatePaymentLinkFunction,
  getPaymentStatusFunction: () => getPaymentStatusFunction,
  handleWebhookFunction: () => handleWebhookFunction,
  refundPaymentFunction: () => refundPaymentFunction
});
async function createPaymentFunction({ order, amount, currency }) {
  const stripe2 = getStripeClient2();
  const paymentIntent = await stripe2.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    automatic_payment_methods: {
      enabled: true
    },
    metadata: {
      orderId: order?.id || "",
      orderNumber: order?.orderNumber || ""
    }
  });
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  };
}
async function capturePaymentFunction({ paymentId, amount }) {
  const stripe2 = getStripeClient2();
  const paymentIntent = await stripe2.paymentIntents.capture(paymentId, {
    amount_to_capture: amount
  });
  return {
    status: paymentIntent.status,
    amount: paymentIntent.amount_captured,
    data: paymentIntent
  };
}
async function refundPaymentFunction({ paymentId, amount }) {
  const stripe2 = getStripeClient2();
  const refund = await stripe2.refunds.create({
    payment_intent: paymentId,
    amount
  });
  return {
    status: refund.status,
    amount: refund.amount,
    data: refund
  };
}
async function getPaymentStatusFunction({ paymentId }) {
  const stripe2 = getStripeClient2();
  const paymentIntent = await stripe2.paymentIntents.retrieve(paymentId);
  return {
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    data: paymentIntent
  };
}
async function generatePaymentLinkFunction({ paymentId }) {
  return `https://dashboard.stripe.com/payments/${paymentId}`;
}
async function handleWebhookFunction({ event, headers }) {
  const webhookSecret2 = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret2) {
    throw new Error("Stripe webhook secret is not configured");
  }
  const stripe2 = getStripeClient2();
  try {
    const stripeEvent = stripe2.webhooks.constructEvent(
      JSON.stringify(event),
      headers["stripe-signature"],
      webhookSecret2
    );
    return {
      isValid: true,
      event: stripeEvent,
      type: stripeEvent.type,
      resource: stripeEvent.data.object
    };
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err?.message || "Unknown error"}`);
  }
}
var import_stripe2, getStripeClient2;
var init_stripe = __esm({
  "features/integrations/payment/stripe.ts"() {
    "use strict";
    import_stripe2 = __toESM(require("stripe"));
    getStripeClient2 = () => {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        throw new Error("Stripe secret key not configured");
      }
      return new import_stripe2.default(stripeKey, {
        apiVersion: "2023-10-16"
      });
    };
  }
});

// features/integrations/payment/paypal.ts
var paypal_exports = {};
__export(paypal_exports, {
  capturePaymentFunction: () => capturePaymentFunction2,
  createPaymentFunction: () => createPaymentFunction2,
  generatePaymentLinkFunction: () => generatePaymentLinkFunction2,
  getPaymentStatusFunction: () => getPaymentStatusFunction2,
  handleWebhookFunction: () => handleWebhookFunction2,
  refundPaymentFunction: () => refundPaymentFunction2
});
async function handleWebhookFunction2({ event, headers }) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error("PayPal webhook ID is not configured");
  }
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(
    `${baseUrl}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        auth_algo: headers["paypal-auth-algo"],
        cert_url: headers["paypal-cert-url"],
        transmission_id: headers["paypal-transmission-id"],
        transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
        webhook_id: webhookId,
        webhook_event: event
      })
    }
  );
  const verification = await response.json();
  const isValid = verification.verification_status === "SUCCESS";
  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }
  return {
    isValid: true,
    event,
    type: event.event_type,
    resource: event.resource
  };
}
async function createPaymentFunction2({ order, amount, currency }) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      intent: "AUTHORIZE",
      purchase_units: [
        {
          amount: {
            currency_code: currency.toUpperCase(),
            value: formatPayPalAmount(amount, currency)
          },
          custom_id: order?.id
        }
      ]
    })
  });
  const orderResult = await response.json();
  if (orderResult.error) {
    throw new Error(`PayPal order creation failed: ${orderResult.error.message}`);
  }
  return {
    orderId: orderResult.id,
    status: orderResult.status
  };
}
async function capturePaymentFunction2({ paymentId }) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${paymentId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  const capture = await response.json();
  if (capture.error) {
    throw new Error(`PayPal capture failed: ${capture.error.message}`);
  }
  const capturedAmount = capture.purchase_units[0].payments.captures[0].amount;
  return {
    status: capture.status,
    amount: parsePayPalAmount(capturedAmount.value, capturedAmount.currency_code),
    data: capture
  };
}
async function refundPaymentFunction2({ paymentId, amount, currency = "USD" }) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(
    `${baseUrl}/v2/payments/captures/${paymentId}/refund`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        amount: {
          value: formatPayPalAmount(amount, currency),
          currency_code: currency.toUpperCase()
        }
      })
    }
  );
  const refund = await response.json();
  if (refund.error) {
    throw new Error(`PayPal refund failed: ${refund.error.message}`);
  }
  return {
    status: refund.status,
    amount: parsePayPalAmount(refund.amount.value, refund.amount.currency_code),
    data: refund
  };
}
async function getPaymentStatusFunction2({ paymentId }) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(`${baseUrl}/v2/checkout/orders/${paymentId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    }
  });
  const orderResult = await response.json();
  if (orderResult.error) {
    throw new Error(`PayPal status check failed: ${orderResult.error.message}`);
  }
  const orderAmount = orderResult.purchase_units[0].amount;
  return {
    status: orderResult.status,
    amount: parsePayPalAmount(orderAmount.value, orderAmount.currency_code),
    data: orderResult
  };
}
async function generatePaymentLinkFunction2({ paymentId }) {
  return `https://www.paypal.com/activity/payment/${paymentId}`;
}
var NO_DIVISION_CURRENCIES, getPayPalBaseUrl, formatPayPalAmount, parsePayPalAmount, getPayPalAccessToken;
var init_paypal = __esm({
  "features/integrations/payment/paypal.ts"() {
    "use strict";
    NO_DIVISION_CURRENCIES = [
      "JPY",
      "KRW",
      "VND",
      "CLP",
      "PYG",
      "XAF",
      "XOF",
      "BIF",
      "DJF",
      "GNF",
      "KMF",
      "MGA",
      "RWF",
      "XPF",
      "HTG",
      "VUV",
      "XAG",
      "XDR",
      "XAU"
    ];
    getPayPalBaseUrl = () => {
      const isSandbox = process.env.NEXT_PUBLIC_PAYPAL_SANDBOX !== "false";
      return isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
    };
    formatPayPalAmount = (amount, currency) => {
      const upperCurrency = currency.toUpperCase();
      const isNoDivision = NO_DIVISION_CURRENCIES.includes(upperCurrency);
      if (isNoDivision) {
        return amount.toString();
      }
      return (amount / 100).toFixed(2);
    };
    parsePayPalAmount = (value, currency) => {
      const upperCurrency = currency.toUpperCase();
      const isNoDivision = NO_DIVISION_CURRENCIES.includes(upperCurrency);
      if (isNoDivision) {
        return parseInt(value, 10);
      }
      return Math.round(parseFloat(value) * 100);
    };
    getPayPalAccessToken = async () => {
      const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new Error("PayPal credentials not configured");
      }
      const baseUrl = getPayPalBaseUrl();
      const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Language": "en_US",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
        },
        body: "grant_type=client_credentials"
      });
      const { access_token } = await response.json();
      if (!access_token) {
        throw new Error("Failed to get PayPal access token");
      }
      return access_token;
    };
  }
});

// features/integrations/payment/manual.ts
var manual_exports = {};
__export(manual_exports, {
  capturePaymentFunction: () => capturePaymentFunction3,
  createPaymentFunction: () => createPaymentFunction3,
  generatePaymentLinkFunction: () => generatePaymentLinkFunction3,
  getPaymentStatusFunction: () => getPaymentStatusFunction3,
  handleWebhookFunction: () => handleWebhookFunction3,
  refundPaymentFunction: () => refundPaymentFunction3
});
async function handleWebhookFunction3({ event, headers }) {
  return {
    isValid: true,
    event,
    type: event.type,
    resource: event.data
  };
}
async function createPaymentFunction3({ order, amount, currency }) {
  return {
    status: "pending",
    data: {
      status: "pending",
      amount,
      currency: currency.toLowerCase(),
      orderId: order?.id
    }
  };
}
async function capturePaymentFunction3({ paymentId, amount }) {
  return {
    status: "captured",
    amount,
    data: {
      status: "captured",
      amount,
      captured_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
async function refundPaymentFunction3({ paymentId, amount }) {
  return {
    status: "refunded",
    amount,
    data: {
      status: "refunded",
      amount,
      refunded_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
async function getPaymentStatusFunction3({ paymentId }) {
  return {
    status: "succeeded",
    data: {
      status: "succeeded"
    }
  };
}
async function generatePaymentLinkFunction3({ paymentId }) {
  return null;
}
var init_manual = __esm({
  "features/integrations/payment/manual.ts"() {
    "use strict";
  }
});

// features/integrations/payment/index.ts
var payment_exports = {};
__export(payment_exports, {
  paymentProviderAdapters: () => paymentProviderAdapters
});
var paymentProviderAdapters;
var init_payment = __esm({
  "features/integrations/payment/index.ts"() {
    "use strict";
    paymentProviderAdapters = {
      stripe: () => Promise.resolve().then(() => (init_stripe(), stripe_exports)),
      paypal: () => Promise.resolve().then(() => (init_paypal(), paypal_exports)),
      manual: () => Promise.resolve().then(() => (init_manual(), manual_exports))
    };
  }
});

// keystone.ts
var keystone_exports = {};
__export(keystone_exports, {
  default: () => keystone_default2
});
module.exports = __toCommonJS(keystone_exports);

// features/keystone/index.ts
var import_auth = require("@keystone-6/auth");
var import_core40 = require("@keystone-6/core");
var import_config = require("dotenv/config");

// features/keystone/models/User.ts
var import_core = require("@keystone-6/core");
var import_access = require("@keystone-6/core/access");
var import_fields2 = require("@keystone-6/core/fields");

// features/keystone/access.ts
function isSignedIn({ session }) {
  return Boolean(session);
}
var permissions = {
  canCreateTodos: ({ session }) => session?.data.role?.canCreateTodos ?? false,
  canManageAllTodos: ({ session }) => session?.data.role?.canManageAllTodos ?? false,
  canManagePeople: ({ session }) => session?.data.role?.canManagePeople ?? false,
  canManageRoles: ({ session }) => session?.data.role?.canManageRoles ?? false,
  canAccessDashboard: ({ session }) => session?.data.role?.canAccessDashboard ?? false
};
var rules = {
  canReadTodos: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageAllTodos) {
      return {
        OR: [
          { assignedTo: { id: { equals: session.itemId } } },
          { assignedTo: null, isPrivate: { equals: true } },
          { NOT: { isPrivate: { equals: true } } }
        ]
      };
    }
    return { assignedTo: { id: { equals: session.itemId } } };
  },
  canManageTodos: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageAllTodos) return true;
    return { assignedTo: { id: { equals: session.itemId } } };
  },
  canReadPeople: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canSeeOtherPeople) return true;
    return { id: { equals: session.itemId } };
  },
  canUpdatePeople: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canEditOtherPeople) return true;
    return { id: { equals: session.itemId } };
  }
};

// features/keystone/models/trackingFields.ts
var import_fields = require("@keystone-6/core/fields");
var trackingFields = {
  createdAt: (0, import_fields.timestamp)({
    access: { read: () => true, create: () => false, update: () => false },
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: {
      createView: { fieldMode: "hidden" },
      itemView: { fieldMode: "read" }
    }
  }),
  updatedAt: (0, import_fields.timestamp)({
    access: { read: () => true, create: () => false, update: () => false },
    db: { updatedAt: true },
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: {
      createView: { fieldMode: "hidden" },
      itemView: { fieldMode: "read" }
    }
  })
};

// features/keystone/models/User.ts
var User = (0, import_core.list)({
  access: {
    operation: {
      query: () => true,
      create: (args) => {
        if (process.env.PUBLIC_SIGNUPS_ALLOWED === "true") {
          return true;
        }
        return permissions.canManagePeople(args);
      },
      update: isSignedIn,
      delete: permissions.canManagePeople
    },
    filter: {
      query: rules.canReadPeople,
      update: rules.canUpdatePeople
    }
  },
  ui: {
    hideCreate: (args) => !permissions.canManagePeople(args),
    hideDelete: (args) => !permissions.canManagePeople(args),
    listView: {
      initialColumns: ["name", "email", "role", "employeeId", "staffRole", "isActive"]
    },
    itemView: {
      defaultFieldMode: ({ session, item }) => {
        if (session?.data.role?.canEditOtherPeople) return "edit";
        if (session?.itemId === item?.id) return "edit";
        return "read";
      }
    }
  },
  fields: {
    name: (0, import_fields2.text)({
      validation: {
        isRequired: true
      }
    }),
    email: (0, import_fields2.text)({
      isFilterable: false,
      isOrderable: false,
      isIndexed: "unique",
      validation: {
        isRequired: true
      }
    }),
    password: (0, import_fields2.password)({
      access: {
        read: import_access.denyAll,
        update: ({ session, item }) => permissions.canManagePeople({ session }) || session?.itemId === item.id
      },
      validation: { isRequired: true }
    }),
    role: (0, import_fields2.relationship)({
      ref: "Role.assignedTo",
      access: {
        create: permissions.canManagePeople,
        update: permissions.canManagePeople
      },
      ui: {
        itemView: {
          fieldMode: (args) => permissions.canManagePeople(args) ? "edit" : "read"
        }
      }
    }),
    apiKeys: (0, import_fields2.relationship)({
      ref: "ApiKey.user",
      many: true,
      ui: {
        itemView: { fieldMode: "read" }
      }
    }),
    phone: (0, import_fields2.text)({
      ui: {
        description: "Primary phone number for the user"
      }
    }),
    restaurantOrders: (0, import_fields2.relationship)({
      ref: "RestaurantOrder.customer",
      many: true,
      ui: {
        itemView: { fieldMode: "read" }
      }
    }),
    addresses: (0, import_fields2.relationship)({
      ref: "Address.user",
      many: true
    }),
    carts: (0, import_fields2.relationship)({
      ref: "Cart.user",
      many: true
    }),
    firstName: (0, import_fields2.virtual)({
      field: import_core.graphql.field({
        type: import_core.graphql.String,
        resolve(item) {
          if (!item.name) return "";
          return item.name.trim().split(/\s+/)[0] || "";
        }
      })
    }),
    lastName: (0, import_fields2.virtual)({
      field: import_core.graphql.field({
        type: import_core.graphql.String,
        resolve(item) {
          if (!item.name) return "";
          const parts = item.name.trim().split(/\s+/);
          return parts.length > 1 ? parts.slice(1).join(" ") : "";
        }
      })
    }),
    billingAddress: (0, import_fields2.virtual)({
      field: (lists) => import_core.graphql.field({
        type: lists.Address.types.output,
        async resolve(item, args, context) {
          const address = await context.db.Address.findMany({
            where: {
              user: { id: { equals: item.id } },
              isBilling: { equals: true }
            },
            take: 1
          });
          if (!address.length) return null;
          return address[0];
        }
      }),
      ui: {
        query: "{ id name address1 address2 city state postalCode phone isBilling }"
      }
    }),
    // Restaurant Staff Fields
    employeeId: (0, import_fields2.text)({
      isIndexed: "unique",
      ui: {
        description: "Unique employee identifier"
      }
    }),
    staffRole: (0, import_fields2.select)({
      type: "string",
      options: [
        { label: "Server", value: "server" },
        { label: "Bartender", value: "bartender" },
        { label: "Host", value: "host" },
        { label: "Cook", value: "cook" },
        { label: "Manager", value: "manager" },
        { label: "Admin", value: "admin" },
        { label: "Busser", value: "busser" },
        { label: "Chef", value: "chef" }
      ],
      ui: {
        displayMode: "select",
        description: "Staff role in the restaurant"
      }
    }),
    hireDate: (0, import_fields2.timestamp)({
      ui: {
        description: "Date employee was hired"
      }
    }),
    hourlyRate: (0, import_fields2.decimal)({
      precision: 10,
      scale: 2,
      ui: {
        description: "Hourly wage rate"
      }
    }),
    pin: (0, import_fields2.text)({
      access: {
        read: import_access.denyAll,
        update: ({ session, item }) => permissions.canManagePeople({ session }) || session?.itemId === item.id
      },
      ui: {
        description: "4-digit PIN for quick POS login"
      }
    }),
    staffPermissions: (0, import_fields2.json)({
      ui: {
        description: "Additional staff permissions and settings"
      }
    }),
    isActive: (0, import_fields2.checkbox)({
      defaultValue: true,
      ui: {
        description: "Whether this employee is currently active"
      }
    }),
    onboardingStatus: (0, import_fields2.select)({
      type: "string",
      options: [
        { label: "Not Started", value: "not_started" },
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
        { label: "Dismissed", value: "dismissed" }
      ],
      defaultValue: "not_started",
      ui: {
        description: "Restaurant onboarding progress"
      }
    }),
    photo: (0, import_fields2.image)({
      storage: "my_images"
    }),
    // Emergency Contact Info
    emergencyContactName: (0, import_fields2.text)({
      ui: {
        description: "Emergency contact person name"
      }
    }),
    emergencyContactPhone: (0, import_fields2.text)({
      ui: {
        description: "Emergency contact phone number"
      }
    }),
    // Certifications
    certifications: (0, import_fields2.json)({
      ui: {
        description: "Food handler, alcohol service, and other certifications (JSON)"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/Role.ts
var import_core2 = require("@keystone-6/core");
var import_access3 = require("@keystone-6/core/access");
var import_fields3 = require("@keystone-6/core/fields");
var Role = (0, import_core2.list)({
  access: {
    operation: {
      ...(0, import_access3.allOperations)(permissions.canManageRoles),
      query: () => true
    }
  },
  ui: {
    hideCreate: (args) => !permissions.canManageRoles(args),
    hideDelete: (args) => !permissions.canManageRoles(args),
    listView: {
      initialColumns: ["name", "assignedTo"]
    },
    itemView: {
      defaultFieldMode: (args) => permissions.canManageRoles(args) ? "edit" : "read"
    }
  },
  fields: {
    name: (0, import_fields3.text)({ validation: { isRequired: true } }),
    canCreateTodos: (0, import_fields3.checkbox)({ defaultValue: false }),
    canManageAllTodos: (0, import_fields3.checkbox)({ defaultValue: false }),
    canSeeOtherPeople: (0, import_fields3.checkbox)({ defaultValue: false }),
    canEditOtherPeople: (0, import_fields3.checkbox)({ defaultValue: false }),
    canManagePeople: (0, import_fields3.checkbox)({ defaultValue: false }),
    canManageRoles: (0, import_fields3.checkbox)({ defaultValue: false }),
    canManageOnboarding: (0, import_fields3.checkbox)({ defaultValue: true }),
    canAccessDashboard: (0, import_fields3.checkbox)({ defaultValue: false }),
    assignedTo: (0, import_fields3.relationship)({
      ref: "User.role",
      many: true,
      ui: {
        itemView: { fieldMode: "read" }
      }
    })
  }
});

// features/keystone/models/Section.ts
var import_core3 = require("@keystone-6/core");
var import_fields4 = require("@keystone-6/core/fields");
var Section = (0, import_core3.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "tables"]
    }
  },
  fields: {
    name: (0, import_fields4.text)({
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    // Relationships
    tables: (0, import_fields4.relationship)({
      ref: "Table.section",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["tableNumber", "capacity", "status"],
        inlineCreate: { fields: ["tableNumber", "capacity", "status"] },
        inlineEdit: { fields: ["tableNumber", "capacity", "status"] }
      }
    })
  }
});

// features/keystone/models/Floor.ts
var import_core4 = require("@keystone-6/core");
var import_fields5 = require("@keystone-6/core/fields");
var Floor = (0, import_core4.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "level", "isActive"]
    }
  },
  fields: {
    name: (0, import_fields5.text)({
      validation: { isRequired: true },
      ui: {
        description: "Floor name (e.g., Main Floor, Second Floor, Patio)"
      }
    }),
    level: (0, import_fields5.integer)({
      validation: { isRequired: true },
      defaultValue: 1,
      ui: {
        description: "Floor level number (1 for ground floor, 2 for second floor, etc.)"
      }
    }),
    isActive: (0, import_fields5.checkbox)({
      defaultValue: true,
      ui: {
        description: "Whether this floor is currently active for seating"
      }
    }),
    // Relationships
    tables: (0, import_fields5.relationship)({
      ref: "Table.floor",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["tableNumber", "capacity", "status"],
        inlineCreate: { fields: ["tableNumber", "capacity", "positionX", "positionY"] },
        inlineEdit: { fields: ["tableNumber", "capacity", "status", "positionX", "positionY"] }
      }
    })
  }
});

// features/keystone/models/Table.ts
var import_core5 = require("@keystone-6/core");
var import_fields6 = require("@keystone-6/core/fields");
var Table = (0, import_core5.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["tableNumber", "capacity", "section", "status"]
    }
  },
  fields: {
    tableNumber: (0, import_fields6.text)({
      validation: { isRequired: true },
      isIndexed: true
    }),
    capacity: (0, import_fields6.integer)({
      validation: { isRequired: true, min: 1 },
      defaultValue: 4
    }),
    status: (0, import_fields6.select)({
      type: "string",
      options: [
        { label: "Available", value: "available" },
        { label: "Occupied", value: "occupied" },
        { label: "Reserved", value: "reserved" },
        { label: "Cleaning", value: "cleaning" }
      ],
      defaultValue: "available",
      ui: {
        displayMode: "segmented-control"
      }
    }),
    shape: (0, import_fields6.select)({
      type: "string",
      options: [
        { label: "Round", value: "round" },
        { label: "Square", value: "square" },
        { label: "Rectangle", value: "rectangle" }
      ],
      defaultValue: "rectangle",
      ui: {
        description: "Table shape for floor plan rendering"
      }
    }),
    // Floor plan positioning
    positionX: (0, import_fields6.float)({
      defaultValue: 0,
      ui: {
        description: "X coordinate for floor plan rendering"
      }
    }),
    positionY: (0, import_fields6.float)({
      defaultValue: 0,
      ui: {
        description: "Y coordinate for floor plan rendering"
      }
    }),
    metadata: (0, import_fields6.json)({
      ui: {
        description: "Additional table metadata (dimensions, notes, etc.)"
      }
    }),
    // Relationships
    floor: (0, import_fields6.relationship)({
      ref: "Floor.tables",
      ui: {
        displayMode: "select",
        description: "Floor this table belongs to"
      }
    }),
    section: (0, import_fields6.relationship)({
      ref: "Section.tables",
      ui: {
        displayMode: "select"
      }
    }),
    orders: (0, import_fields6.relationship)({
      ref: "RestaurantOrder.tables",
      many: true,
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" }
      }
    }),
    turnoverRate: (0, import_fields6.virtual)({
      field: import_core5.graphql.field({
        type: import_core5.graphql.Float,
        async resolve(item, args, context) {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1e3);
          const ordersCount = await context.sudo().query.RestaurantOrder.count({
            where: {
              tables: { some: { id: { equals: item.id } } },
              createdAt: { gte: dayAgo.toISOString() },
              status: { equals: "completed" }
            }
          });
          return ordersCount;
        }
      }),
      ui: {
        description: "Number of completed orders in the last 24 hours"
      }
    })
  }
});

// features/keystone/models/MenuCategory.ts
var import_core6 = require("@keystone-6/core");
var import_fields7 = require("@keystone-6/core/fields");
var MenuCategory = (0, import_core6.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "icon", "mealPeriods", "sortOrder"]
    }
  },
  fields: {
    name: (0, import_fields7.text)({
      validation: { isRequired: true }
    }),
    icon: (0, import_fields7.text)({
      defaultValue: "\u{1F37D}\uFE0F",
      ui: {
        description: "Emoji icon for this category (e.g. \u{1F354}, \u{1F357}, \u{1F964})"
      }
    }),
    description: (0, import_fields7.text)({
      ui: {
        displayMode: "textarea"
      }
    }),
    mealPeriods: (0, import_fields7.multiselect)({
      type: "string",
      options: [
        { label: "Breakfast", value: "breakfast" },
        { label: "Lunch", value: "lunch" },
        { label: "Dinner", value: "dinner" },
        { label: "All Day", value: "all_day" }
      ],
      defaultValue: ["all_day"]
    }),
    sortOrder: (0, import_fields7.integer)({
      defaultValue: 0,
      ui: {
        description: "Order in which categories appear on the menu"
      }
    }),
    // Relationships
    menuItems: (0, import_fields7.relationship)({
      ref: "MenuItem.category",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["name", "price", "available"],
        inlineCreate: { fields: ["name", "price", "available"] },
        inlineEdit: { fields: ["name", "price", "available"] }
      }
    })
  }
});

// features/keystone/models/MenuItem.ts
var import_core7 = require("@keystone-6/core");
var import_fields8 = require("@keystone-6/core/fields");
var import_fields_document = require("@keystone-6/fields-document");
var MenuItem = (0, import_core7.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "price", "category", "available", "kitchenStation"]
    }
  },
  fields: {
    name: (0, import_fields8.text)({
      validation: { isRequired: true }
    }),
    menuItemImages: (0, import_fields8.relationship)({
      ref: "MenuItemImage.menuItems",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["image", "altText", "imagePath"],
        inlineCreate: { fields: ["image", "altText", "imagePath"] },
        inlineEdit: { fields: ["image", "altText", "imagePath"] },
        inlineConnect: true,
        removeMode: "disconnect",
        linkToItem: false
      }
    }),
    description: (0, import_fields_document.document)({
      formatting: true,
      links: true
    }),
    price: (0, import_fields8.integer)({
      validation: { isRequired: true },
      ui: {
        description: "Price in cents"
      }
    }),
    available: (0, import_fields8.checkbox)({
      defaultValue: true
    }),
    featured: (0, import_fields8.checkbox)({
      defaultValue: false,
      ui: {
        description: "Highlight this item on the storefront"
      }
    }),
    popular: (0, import_fields8.checkbox)({
      defaultValue: false,
      ui: {
        description: "Mark as popular item (shows 'Popular' badge)"
      }
    }),
    prepTime: (0, import_fields8.integer)({
      defaultValue: 15,
      ui: {
        description: "Preparation time in minutes"
      }
    }),
    calories: (0, import_fields8.integer)({
      ui: {
        description: "Calorie count for this menu item"
      }
    }),
    kitchenStation: (0, import_fields8.select)({
      type: "string",
      options: [
        { label: "Grill", value: "grill" },
        { label: "Fryer", value: "fryer" },
        { label: "Salad", value: "salad" },
        { label: "Dessert", value: "dessert" },
        { label: "Bar", value: "bar" },
        { label: "Expo", value: "expo" }
      ],
      defaultValue: "grill"
    }),
    allergens: (0, import_fields8.multiselect)({
      type: "string",
      options: [
        { label: "Gluten", value: "gluten" },
        { label: "Dairy", value: "dairy" },
        { label: "Eggs", value: "eggs" },
        { label: "Nuts", value: "nuts" },
        { label: "Shellfish", value: "shellfish" },
        { label: "Soy", value: "soy" },
        { label: "Fish", value: "fish" }
      ],
      defaultValue: []
    }),
    dietaryFlags: (0, import_fields8.multiselect)({
      type: "string",
      options: [
        { label: "Vegan", value: "vegan" },
        { label: "Vegetarian", value: "vegetarian" },
        { label: "Gluten-Free", value: "gluten_free" },
        { label: "Dairy-Free", value: "dairy_free" },
        { label: "Keto", value: "keto" }
      ],
      defaultValue: []
    }),
    mealPeriods: (0, import_fields8.multiselect)({
      type: "string",
      options: [
        { label: "Breakfast", value: "breakfast" },
        { label: "Lunch", value: "lunch" },
        { label: "Dinner", value: "dinner" },
        { label: "All Day", value: "all_day" }
      ],
      defaultValue: ["all_day"]
    }),
    // Relationships
    category: (0, import_fields8.relationship)({
      ref: "MenuCategory.menuItems",
      ui: {
        displayMode: "select"
      }
    }),
    modifiers: (0, import_fields8.relationship)({
      ref: "MenuItemModifier.menuItem",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["name", "priceAdjustment", "modifierGroup"],
        inlineCreate: { fields: ["name", "priceAdjustment", "modifierGroup"] },
        inlineEdit: { fields: ["name", "priceAdjustment", "modifierGroup"] }
      }
    })
  }
});

// features/keystone/models/MenuItemImage.ts
var import_core8 = require("@keystone-6/core");
var import_fields9 = require("@keystone-6/core/fields");
var MenuItemImage = (0, import_core8.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  fields: {
    image: (0, import_fields9.image)({ storage: "my_images" }),
    imagePath: (0, import_fields9.text)(),
    altText: (0, import_fields9.text)(),
    order: (0, import_fields9.integer)({
      defaultValue: 0
    }),
    menuItems: (0, import_fields9.relationship)({ ref: "MenuItem.menuItemImages", many: true }),
    metadata: (0, import_fields9.json)()
  },
  ui: {
    listView: {
      initialColumns: ["image", "imagePath", "altText", "menuItems"]
    }
  }
});

// features/keystone/models/MenuItemModifier.ts
var import_core9 = require("@keystone-6/core");
var import_fields10 = require("@keystone-6/core/fields");
var MenuItemModifier = (0, import_core9.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "modifierGroup", "priceAdjustment", "defaultSelected"]
    }
  },
  fields: {
    name: (0, import_fields10.text)({
      validation: { isRequired: true }
    }),
    modifierGroup: (0, import_fields10.select)({
      type: "string",
      options: [
        { label: "Size", value: "size" },
        { label: "Temperature", value: "temperature" },
        { label: "Add-ons", value: "addons" },
        { label: "Removals", value: "removals" },
        { label: "Sides", value: "sides" },
        { label: "Dressings", value: "dressings" },
        { label: "Cheese", value: "cheese" },
        { label: "Toppings", value: "toppings" },
        { label: "Sauces", value: "sauces" },
        { label: "Patty", value: "patty" },
        { label: "Ice", value: "ice" },
        { label: "Dipping", value: "dipping" }
      ],
      defaultValue: "addons"
    }),
    modifierGroupLabel: (0, import_fields10.text)({
      ui: {
        description: "Display name for this modifier group (e.g. 'Choose Your Patty')"
      }
    }),
    required: (0, import_fields10.checkbox)({
      defaultValue: false,
      ui: {
        description: "Whether a selection from this group is required"
      }
    }),
    minSelections: (0, import_fields10.integer)({
      defaultValue: 0,
      ui: {
        description: "Minimum number of selections required"
      }
    }),
    maxSelections: (0, import_fields10.integer)({
      defaultValue: 1,
      ui: {
        description: "Maximum number of selections allowed"
      }
    }),
    priceAdjustment: (0, import_fields10.integer)({
      defaultValue: 0,
      ui: {
        description: "Price adjustment in cents (can be negative for removals like no-cheese)"
      }
    }),
    calories: (0, import_fields10.integer)({
      ui: {
        description: "Calorie count for this modifier"
      }
    }),
    defaultSelected: (0, import_fields10.checkbox)({
      defaultValue: false,
      ui: {
        description: "Whether this modifier is selected by default"
      }
    }),
    // Relationships
    menuItem: (0, import_fields10.relationship)({
      ref: "MenuItem.modifiers",
      ui: {
        displayMode: "select"
      }
    })
  }
});

// features/keystone/models/RestaurantOrder.ts
var import_core10 = require("@keystone-6/core");
var import_fields11 = require("@keystone-6/core/fields");
var import_crypto = __toESM(require("crypto"));
var RestaurantOrder = (0, import_core10.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["orderNumber", "orderType", "status", "tables", "server", "total"]
    }
  },
  hooks: {
    afterOperation: async ({ operation, item, originalItem, context }) => {
      const sudo = context.sudo();
      if (operation === "create" && item && item.orderType === "dine_in") {
        const orderWithTables = await sudo.query.RestaurantOrder.findOne({
          where: { id: item.id },
          query: "tables { id }"
        });
        if (orderWithTables?.tables?.length) {
          await Promise.all(orderWithTables.tables.map(
            (table) => sudo.db.Table.updateOne({ where: { id: table.id }, data: { status: "occupied" } })
          ));
        }
      }
      if (operation === "update" && item && item.orderType === "dine_in") {
        if (item.status === "completed" || item.status === "cancelled") {
          const orderWithTables = await sudo.query.RestaurantOrder.findOne({
            where: { id: item.id },
            query: "tables { id }"
          });
          if (orderWithTables?.tables?.length) {
            await Promise.all(orderWithTables.tables.map(
              (table) => sudo.db.Table.updateOne({ where: { id: table.id }, data: { status: "cleaning" } })
            ));
          }
        }
      }
      if (operation === "update" && item?.status === "completed" && originalItem?.status !== "completed") {
        try {
          const orderItems = await sudo.query.OrderItem.findMany({
            where: { order: { id: { equals: item.id } } },
            query: "id quantity menuItem { id }"
          });
          for (const orderItem of orderItems) {
            if (!orderItem.menuItem?.id) continue;
            const recipes = await sudo.query.Recipe.findMany({
              where: { menuItem: { id: { equals: orderItem.menuItem.id } } },
              query: "id recipeIngredients yield"
            });
            if (recipes.length === 0) continue;
            const recipe = recipes[0];
            if (!recipe.recipeIngredients) continue;
            const recipeIngredients = recipe.recipeIngredients;
            const portionsOrdered = orderItem.quantity / (recipe.yield || 1);
            for (const ri of recipeIngredients) {
              if (!ri.ingredientId) continue;
              const depleteAmount = ri.quantity * portionsOrdered;
              const ingredient = await sudo.query.Ingredient.findOne({
                where: { id: ri.ingredientId },
                query: "id currentStock"
              });
              if (ingredient) {
                const newStock = Math.max(0, parseFloat(ingredient.currentStock || "0") - depleteAmount);
                await sudo.db.Ingredient.updateOne({
                  where: { id: ri.ingredientId },
                  data: { currentStock: newStock.toFixed(2) }
                });
                await sudo.db.StockMovement.createOne({
                  data: {
                    ingredient: { connect: { id: ri.ingredientId } },
                    type: "sale",
                    quantity: (-depleteAmount).toFixed(2),
                    notes: `Auto-depleted for order ${item.orderNumber}`
                  }
                });
              }
            }
          }
        } catch (err) {
          console.error("Auto-depletion error:", err);
        }
      }
    }
  },
  fields: {
    orderNumber: (0, import_fields11.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    orderType: (0, import_fields11.select)({
      type: "string",
      options: [
        { label: "Dine-in", value: "dine_in" },
        { label: "Takeout", value: "takeout" },
        { label: "Delivery", value: "delivery" }
      ],
      defaultValue: "dine_in"
    }),
    orderSource: (0, import_fields11.select)({
      type: "string",
      options: [
        { label: "POS", value: "pos" },
        { label: "Online", value: "online" },
        { label: "Kiosk", value: "kiosk" },
        { label: "Phone", value: "phone" }
      ],
      defaultValue: "pos"
    }),
    status: (0, import_fields11.select)({
      type: "string",
      options: [
        { label: "Open", value: "open" },
        { label: "Sent to Kitchen", value: "sent_to_kitchen" },
        { label: "In Progress", value: "in_progress" },
        { label: "Ready", value: "ready" },
        { label: "Served", value: "served" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" }
      ],
      defaultValue: "open"
    }),
    guestCount: (0, import_fields11.integer)({ defaultValue: 1, validation: { min: 1 } }),
    specialInstructions: (0, import_fields11.text)({ ui: { displayMode: "textarea" } }),
    onHold: (0, import_fields11.checkbox)({ defaultValue: false }),
    holdReason: (0, import_fields11.text)(),
    isUrgent: (0, import_fields11.checkbox)({ defaultValue: false }),
    subtotal: (0, import_fields11.integer)({ defaultValue: 0 }),
    tax: (0, import_fields11.integer)({ defaultValue: 0 }),
    tip: (0, import_fields11.integer)({ defaultValue: 0 }),
    discount: (0, import_fields11.integer)({ defaultValue: 0 }),
    total: (0, import_fields11.integer)({ defaultValue: 0 }),
    // Customer Info
    customerName: (0, import_fields11.text)(),
    customerEmail: (0, import_fields11.text)(),
    customerPhone: (0, import_fields11.text)(),
    // Delivery Info
    deliveryAddress: (0, import_fields11.text)({ ui: { displayMode: "textarea" } }),
    deliveryCity: (0, import_fields11.text)(),
    deliveryZip: (0, import_fields11.text)(),
    secretKey: (0, import_fields11.text)({
      hooks: {
        resolveInput: ({ operation }) => {
          if (operation === "create") {
            return import_crypto.default.randomBytes(32).toString("hex");
          }
          return void 0;
        }
      }
    }),
    tableSeatedAt: (0, import_fields11.timestamp)({ defaultValue: { kind: "now" } }),
    tableFreedAt: (0, import_fields11.timestamp)(),
    tableDurationMinutes: (0, import_fields11.virtual)({
      field: import_core10.graphql.field({
        type: import_core10.graphql.Int,
        resolve(item) {
          if (!item.tableSeatedAt) return null;
          const end = item.tableFreedAt ? new Date(item.tableFreedAt) : /* @__PURE__ */ new Date();
          const start = new Date(item.tableSeatedAt);
          return Math.floor((end.getTime() - start.getTime()) / 6e4);
        }
      })
    }),
    courseCompletionPercentage: (0, import_fields11.virtual)({
      field: import_core10.graphql.field({
        type: import_core10.graphql.Int,
        async resolve(item, args, context) {
          const courses = await context.sudo().query.OrderCourse.findMany({
            where: { order: { id: { equals: item.id } } },
            query: "status"
          });
          if (courses.length === 0) return 0;
          return Math.round(courses.filter((c) => c.status === "served").length / courses.length * 100);
        }
      })
    }),
    tables: (0, import_fields11.relationship)({ ref: "Table.orders", many: true }),
    customer: (0, import_fields11.relationship)({ ref: "User.restaurantOrders" }),
    server: (0, import_fields11.relationship)({ ref: "User", ui: { labelField: "name" } }),
    createdBy: (0, import_fields11.relationship)({ ref: "User", ui: { labelField: "name" } }),
    courses: (0, import_fields11.relationship)({ ref: "OrderCourse.order", many: true }),
    orderItems: (0, import_fields11.relationship)({ ref: "OrderItem.order", many: true }),
    payments: (0, import_fields11.relationship)({ ref: "Payment.order", many: true }),
    discounts: (0, import_fields11.relationship)({ ref: "Discount.orders", many: true }),
    giftCards: (0, import_fields11.relationship)({ ref: "GiftCard.order", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/Address.ts
var import_core11 = require("@keystone-6/core");
var import_fields12 = require("@keystone-6/core/fields");
var Address = (0, import_core11.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    },
    filter: {
      query: ({ session }) => {
        if (permissions.canManagePeople({ session })) return true;
        return { user: { id: { equals: session?.itemId } } };
      },
      update: ({ session }) => {
        if (permissions.canManagePeople({ session })) return true;
        return { user: { id: { equals: session?.itemId } } };
      },
      delete: ({ session }) => {
        if (permissions.canManagePeople({ session })) return true;
        return { user: { id: { equals: session?.itemId } } };
      }
    }
  },
  fields: {
    label: (0, import_fields12.virtual)({
      field: import_core11.graphql.field({
        type: import_core11.graphql.String,
        resolve(item) {
          const parts = [];
          if (item.name) parts.push(item.name);
          if (item.address1) parts.push(item.address1);
          if (item.city) parts.push(item.city);
          return parts.join(", ");
        }
      })
    }),
    name: (0, import_fields12.text)({ validation: { isRequired: true } }),
    address1: (0, import_fields12.text)({ validation: { isRequired: true } }),
    address2: (0, import_fields12.text)(),
    city: (0, import_fields12.text)({ validation: { isRequired: true } }),
    state: (0, import_fields12.text)(),
    postalCode: (0, import_fields12.text)({ validation: { isRequired: true } }),
    country: (0, import_fields12.text)({ defaultValue: "USA" }),
    phone: (0, import_fields12.text)(),
    isDefault: (0, import_fields12.checkbox)({ defaultValue: false }),
    isBilling: (0, import_fields12.checkbox)({ defaultValue: false }),
    metadata: (0, import_fields12.json)(),
    user: (0, import_fields12.relationship)({ ref: "User.addresses" }),
    ...trackingFields
  },
  ui: {
    labelField: "label",
    listView: {
      initialColumns: ["label", "user", "isDefault"]
    }
  }
});

// features/keystone/models/OrderItem.ts
var import_core12 = require("@keystone-6/core");
var import_fields13 = require("@keystone-6/core/fields");
var OrderItem = (0, import_core12.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["menuItem", "quantity", "price", "order"]
    }
  },
  fields: {
    quantity: (0, import_fields13.integer)({
      defaultValue: 1,
      validation: { min: 1, isRequired: true }
    }),
    price: (0, import_fields13.integer)({
      validation: { isRequired: true },
      ui: {
        description: "Price at time of order in cents (snapshot)"
      }
    }),
    unitPrice: (0, import_fields13.virtual)({
      field: import_core12.graphql.field({
        type: import_core12.graphql.Int,
        resolve(item) {
          return item.price || 0;
        }
      })
    }),
    totalPrice: (0, import_fields13.virtual)({
      field: import_core12.graphql.field({
        type: import_core12.graphql.Int,
        resolve(item) {
          return (item.price || 0) * (item.quantity || 1);
        }
      })
    }),
    specialInstructions: (0, import_fields13.text)({
      ui: {
        displayMode: "textarea"
      }
    }),
    courseNumber: (0, import_fields13.integer)({
      defaultValue: 1,
      ui: {
        description: "For fine dining: 1=appetizer, 2=main, 3=dessert"
      }
    }),
    seatNumber: (0, import_fields13.integer)({
      ui: {
        description: "Seat number for split check support"
      }
    }),
    sentToKitchen: (0, import_fields13.timestamp)({
      ui: {
        description: "When this item was sent to kitchen"
      }
    }),
    // Relationships
    order: (0, import_fields13.relationship)({
      ref: "RestaurantOrder.orderItems",
      ui: {
        displayMode: "select"
      }
    }),
    course: (0, import_fields13.relationship)({
      ref: "OrderCourse.orderItems",
      ui: {
        displayMode: "select"
      }
    }),
    menuItem: (0, import_fields13.relationship)({
      ref: "MenuItem",
      ui: {
        displayMode: "select"
      }
    }),
    // Applied modifiers for this order item
    appliedModifiers: (0, import_fields13.relationship)({
      ref: "MenuItemModifier",
      many: true,
      ui: {
        displayMode: "select"
      }
    })
  }
});

// features/keystone/models/OrderCourse.ts
var import_core13 = require("@keystone-6/core");
var import_fields14 = require("@keystone-6/core/fields");
var OrderCourse = (0, import_core13.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["order", "courseType", "status", "fireTime"]
    }
  },
  fields: {
    courseType: (0, import_fields14.select)({
      type: "string",
      options: [
        { label: "Appetizers", value: "appetizers" },
        { label: "Mains", value: "mains" },
        { label: "Desserts", value: "desserts" },
        { label: "Drinks", value: "drinks" }
      ],
      defaultValue: "mains",
      validation: { isRequired: true }
    }),
    status: (0, import_fields14.select)({
      type: "string",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Fired", value: "fired" },
        { label: "Ready", value: "ready" },
        { label: "Served", value: "served" }
      ],
      defaultValue: "pending"
    }),
    fireTime: (0, import_fields14.timestamp)({
      ui: {
        description: "When this course was sent to the kitchen"
      }
    }),
    autoFireAt: (0, import_fields14.timestamp)({
      ui: {
        description: "Scheduled time to auto-fire this course"
      }
    }),
    onHold: (0, import_fields14.checkbox)({ defaultValue: false }),
    allItemsReady: (0, import_fields14.checkbox)({
      defaultValue: false
    }),
    courseNumber: (0, import_fields14.integer)({
      defaultValue: 1
    }),
    // Relationships
    order: (0, import_fields14.relationship)({
      ref: "RestaurantOrder.courses",
      ui: {
        displayMode: "select"
      }
    }),
    orderItems: (0, import_fields14.relationship)({
      ref: "OrderItem.course",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/KitchenMessage.ts
var import_core14 = require("@keystone-6/core");
var import_fields15 = require("@keystone-6/core/fields");
var KitchenMessage = (0, import_core14.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  fields: {
    content: (0, import_fields15.text)({ validation: { isRequired: true } }),
    type: (0, import_fields15.select)({
      options: [
        { label: "General", value: "general" },
        { label: "Urgent", value: "urgent" },
        { label: "86 Alert", value: "86_alert" }
      ],
      defaultValue: "general"
    }),
    fromStation: (0, import_fields15.select)({
      options: [
        { label: "Kitchen", value: "kitchen" },
        { label: "FOH", value: "foh" }
      ],
      defaultValue: "foh"
    }),
    // Relationships
    order: (0, import_fields15.relationship)({ ref: "RestaurantOrder" }),
    sender: (0, import_fields15.relationship)({ ref: "User" }),
    ...trackingFields
  }
});

// features/keystone/models/Recipe.ts
var import_core15 = require("@keystone-6/core");
var import_fields16 = require("@keystone-6/core/fields");
var Recipe = (0, import_core15.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "menuItem", "yield", "totalCost"]
    },
    labelField: "name"
  },
  fields: {
    name: (0, import_fields16.text)({ validation: { isRequired: true } }),
    menuItem: (0, import_fields16.relationship)({
      ref: "MenuItem",
      many: false
    }),
    recipeIngredients: (0, import_fields16.json)({
      ui: {
        description: "Array of { ingredientId: string, quantity: number, unit: string }"
      }
    }),
    yield: (0, import_fields16.integer)({
      defaultValue: 1,
      ui: { description: "Number of servings this recipe produces" }
    }),
    prepTime: (0, import_fields16.integer)({
      ui: { description: "Preparation time in minutes" }
    }),
    instructions: (0, import_fields16.text)({
      ui: { displayMode: "textarea" }
    }),
    totalCost: (0, import_fields16.virtual)({
      field: import_core15.graphql.field({
        type: import_core15.graphql.Float,
        async resolve(item, args, context) {
          if (!item.recipeIngredients) return 0;
          const ingredients = item.recipeIngredients;
          let total = 0;
          for (const ri of ingredients) {
            if (!ri.ingredientId) continue;
            const ingredient = await context.sudo().query.Ingredient.findOne({
              where: { id: ri.ingredientId },
              query: "costPerUnit"
            });
            if (ingredient?.costPerUnit) {
              total += parseFloat(ingredient.costPerUnit) * (ri.quantity || 0);
            }
          }
          return total;
        }
      })
    }),
    costPerServing: (0, import_fields16.virtual)({
      field: import_core15.graphql.field({
        type: import_core15.graphql.Float,
        async resolve(item, args, context) {
          if (!item.recipeIngredients) return 0;
          const ingredients = item.recipeIngredients;
          let total = 0;
          for (const ri of ingredients) {
            if (!ri.ingredientId) continue;
            const ingredient = await context.sudo().query.Ingredient.findOne({
              where: { id: ri.ingredientId },
              query: "costPerUnit"
            });
            if (ingredient?.costPerUnit) {
              total += parseFloat(ingredient.costPerUnit) * (ri.quantity || 0);
            }
          }
          return total / (item.yield || 1);
        }
      })
    }),
    foodCostPercentage: (0, import_fields16.virtual)({
      field: import_core15.graphql.field({
        type: import_core15.graphql.Float,
        async resolve(item, args, context) {
          if (!item.menuItemId) return 0;
          const menuItem = await context.sudo().query.MenuItem.findOne({
            where: { id: item.menuItemId },
            query: "price"
          });
          if (!menuItem?.price || parseFloat(menuItem.price) === 0) return 0;
          if (!item.recipeIngredients) return 0;
          const ingredients = item.recipeIngredients;
          let total = 0;
          for (const ri of ingredients) {
            if (!ri.ingredientId) continue;
            const ingredient = await context.sudo().query.Ingredient.findOne({
              where: { id: ri.ingredientId },
              query: "costPerUnit"
            });
            if (ingredient?.costPerUnit) {
              total += parseFloat(ingredient.costPerUnit) * (ri.quantity || 0);
            }
          }
          const costPerServing = total / (item.yield || 1);
          return costPerServing / parseFloat(menuItem.price) * 100;
        }
      })
    }),
    ...trackingFields
  }
});

// features/keystone/models/Reservation.ts
var import_core16 = require("@keystone-6/core");
var import_fields17 = require("@keystone-6/core/fields");
var Reservation = (0, import_core16.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["customerName", "reservationDate", "partySize", "status", "assignedTable"]
    }
  },
  fields: {
    customerName: (0, import_fields17.text)({
      validation: { isRequired: true }
    }),
    customerPhone: (0, import_fields17.text)({
      validation: { isRequired: true }
    }),
    customerEmail: (0, import_fields17.text)(),
    reservationDate: (0, import_fields17.timestamp)({
      validation: { isRequired: true }
    }),
    partySize: (0, import_fields17.integer)({
      validation: { isRequired: true, min: 1 },
      defaultValue: 2
    }),
    duration: (0, import_fields17.integer)({
      defaultValue: 90,
      ui: {
        description: "Expected duration in minutes"
      }
    }),
    status: (0, import_fields17.select)({
      type: "string",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Seated", value: "seated" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
        { label: "No-show", value: "no_show" }
      ],
      defaultValue: "pending"
    }),
    specialRequests: (0, import_fields17.text)({
      ui: {
        displayMode: "textarea"
      }
    }),
    // Relationships
    assignedTable: (0, import_fields17.relationship)({
      ref: "Table",
      ui: {
        displayMode: "select"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/Payment.ts
var import_core17 = require("@keystone-6/core");
var import_fields18 = require("@keystone-6/core/fields");
var Payment = (0, import_core17.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["amount", "status", "paymentMethod", "order", "createdAt"]
    }
  },
  fields: {
    amount: (0, import_fields18.integer)({
      validation: { isRequired: true },
      ui: {
        description: "Payment amount in cents"
      }
    }),
    status: (0, import_fields18.select)({
      type: "string",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "Succeeded", value: "succeeded" },
        { label: "Failed", value: "failed" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Refunded", value: "refunded" },
        { label: "Partially Refunded", value: "partially_refunded" }
      ],
      defaultValue: "pending",
      validation: { isRequired: true }
    }),
    paymentMethod: (0, import_fields18.select)({
      type: "string",
      options: [
        { label: "Credit Card", value: "credit_card" },
        { label: "Debit Card", value: "debit_card" },
        { label: "Cash", value: "cash" },
        { label: "Gift Card", value: "gift_card" },
        { label: "Apple Pay", value: "apple_pay" },
        { label: "Google Pay", value: "google_pay" }
      ],
      defaultValue: "credit_card"
    }),
    paymentProvider: (0, import_fields18.relationship)({
      ref: "PaymentProvider",
      ui: {
        displayMode: "select",
        description: "Optional provider backing this payment"
      }
    }),
    providerPaymentId: (0, import_fields18.text)({
      ui: {
        description: "Provider payment identifier (Stripe/PayPal/etc.)"
      }
    }),
    // Stripe integration fields
    stripePaymentIntentId: (0, import_fields18.text)({
      isIndexed: "unique",
      ui: {
        description: "Stripe PaymentIntent ID"
      }
    }),
    stripeChargeId: (0, import_fields18.text)({
      ui: {
        description: "Stripe Charge ID for successful payments"
      }
    }),
    stripeRefundId: (0, import_fields18.text)({
      ui: {
        description: "Stripe Refund ID if refunded"
      }
    }),
    // Card details (last 4 digits for reference)
    cardLast4: (0, import_fields18.text)({
      ui: {
        description: "Last 4 digits of card"
      }
    }),
    cardBrand: (0, import_fields18.text)({
      ui: {
        description: "Card brand (visa, mastercard, etc.)"
      }
    }),
    // Tip handling
    tipAmount: (0, import_fields18.integer)({
      defaultValue: 0,
      ui: {
        description: "Tip amount included in payment in cents"
      }
    }),
    // Split payment support
    isSplitPayment: (0, import_fields18.checkbox)({
      defaultValue: false,
      ui: {
        description: "Whether this payment is part of a split bill"
      }
    }),
    splitPaymentIndex: (0, import_fields18.integer)({
      ui: {
        description: "Index of this payment in split (1, 2, 3, etc.)"
      }
    }),
    splitTotal: (0, import_fields18.integer)({
      ui: {
        description: "Total number of split payments for this order"
      }
    }),
    processedAt: (0, import_fields18.timestamp)({
      ui: {
        description: "When payment was successfully processed"
      }
    }),
    // Metadata for errors or additional info
    errorMessage: (0, import_fields18.text)({
      ui: {
        description: "Error message if payment failed"
      }
    }),
    notes: (0, import_fields18.text)({
      ui: {
        displayMode: "textarea",
        description: "Internal notes about this payment"
      }
    }),
    // Relationships
    order: (0, import_fields18.relationship)({
      ref: "RestaurantOrder.payments",
      ui: {
        displayMode: "select"
      }
    }),
    processedBy: (0, import_fields18.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        description: "Staff member who processed payment"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/Cart.ts
var import_core18 = require("@keystone-6/core");
var import_fields19 = require("@keystone-6/core/fields");
var import_access20 = require("@keystone-6/core/access");
var Cart = (0, import_core18.list)({
  access: import_access20.allowAll,
  fields: {
    user: (0, import_fields19.relationship)({ ref: "User.carts" }),
    items: (0, import_fields19.relationship)({ ref: "CartItem.cart", many: true }),
    orderType: (0, import_fields19.select)({
      options: [
        { label: "Pickup", value: "pickup" },
        { label: "Delivery", value: "delivery" }
      ],
      defaultValue: "pickup"
    }),
    subtotal: (0, import_fields19.virtual)({
      field: import_core18.graphql.field({
        type: import_core18.graphql.Int,
        async resolve(item, args, context) {
          const cart = await context.sudo().query.Cart.findOne({
            where: { id: item.id },
            query: "items { quantity menuItem { price } modifiers { priceAdjustment } }"
          });
          if (!cart?.items) return 0;
          return cart.items.reduce((total, cartItem) => {
            const modifiersTotal = cartItem.modifiers?.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0) || 0;
            return total + ((cartItem.menuItem?.price || 0) + modifiersTotal) * cartItem.quantity;
          }, 0);
        }
      })
    }),
    ...trackingFields
  }
});

// features/keystone/models/CartItem.ts
var import_core19 = require("@keystone-6/core");
var import_fields20 = require("@keystone-6/core/fields");
var import_access21 = require("@keystone-6/core/access");
var CartItem = (0, import_core19.list)({
  access: import_access21.allowAll,
  fields: {
    cart: (0, import_fields20.relationship)({ ref: "Cart.items" }),
    menuItem: (0, import_fields20.relationship)({ ref: "MenuItem" }),
    quantity: (0, import_fields20.integer)({ defaultValue: 1, validation: { min: 1 } }),
    modifiers: (0, import_fields20.relationship)({ ref: "MenuItemModifier", many: true }),
    specialInstructions: (0, import_fields20.text)()
  }
});

// features/keystone/models/PaymentProvider.ts
var import_core20 = require("@keystone-6/core");
var import_fields21 = require("@keystone-6/core/fields");
var PaymentProvider = (0, import_core20.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "code", "isInstalled"]
    }
  },
  fields: {
    name: (0, import_fields21.text)({
      validation: { isRequired: true }
    }),
    code: (0, import_fields21.text)({
      isIndexed: "unique",
      validation: {
        isRequired: true,
        match: {
          regex: /^pp_[a-zA-Z0-9-_]+$/,
          explanation: 'Payment provider code must start with "pp_" followed by alphanumeric characters, hyphens or underscores'
        }
      }
    }),
    isInstalled: (0, import_fields21.checkbox)({
      defaultValue: true
    }),
    credentials: (0, import_fields21.json)({
      defaultValue: {}
    }),
    metadata: (0, import_fields21.json)({
      defaultValue: {}
    }),
    createPaymentFunction: (0, import_fields21.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to create payments"
      }
    }),
    capturePaymentFunction: (0, import_fields21.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to capture payments"
      }
    }),
    refundPaymentFunction: (0, import_fields21.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to refund payments"
      }
    }),
    getPaymentStatusFunction: (0, import_fields21.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to check payment status"
      }
    }),
    generatePaymentLinkFunction: (0, import_fields21.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to generate payment dashboard links"
      }
    }),
    handleWebhookFunction: (0, import_fields21.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to handle provider webhooks"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/ApiKey.ts
var import_fields22 = require("@keystone-6/core/fields");
var import_core21 = require("@keystone-6/core");
var ApiKey = (0, import_core21.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    },
    filter: {
      query: ({ session }) => ({ user: { id: { equals: session?.itemId } } }),
      update: ({ session }) => ({ user: { id: { equals: session?.itemId } } }),
      delete: ({ session }) => ({ user: { id: { equals: session?.itemId } } })
    }
  },
  hooks: {
    validate: {
      create: async ({ resolvedData, addValidationError }) => {
        if (!resolvedData.scopes || resolvedData.scopes.length === 0) {
          addValidationError("At least one scope is required for API keys");
        }
      }
    },
    resolveInput: {
      create: async ({ resolvedData, context }) => {
        return {
          ...resolvedData,
          user: resolvedData.user || (context.session?.itemId ? { connect: { id: context.session.itemId } } : void 0)
        };
      }
    }
  },
  fields: {
    name: (0, import_fields22.text)({
      validation: { isRequired: true },
      ui: {
        description: "A descriptive name for this API key (e.g. 'POS Integration')"
      }
    }),
    tokenSecret: (0, import_fields22.password)({
      validation: { isRequired: true },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "hidden" },
        listView: { fieldMode: "hidden" },
        description: "Secure API key token (hashed and never displayed)"
      }
    }),
    tokenPreview: (0, import_fields22.text)({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
        description: "Preview of the API key (actual key is hidden)"
      }
    }),
    scopes: (0, import_fields22.json)({
      defaultValue: [],
      ui: {
        description: "Array of scopes for this API key"
      }
    }),
    status: (0, import_fields22.select)({
      type: "enum",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Revoked", value: "revoked" }
      ],
      defaultValue: "active",
      ui: {
        description: "Current status of this API key"
      }
    }),
    expiresAt: (0, import_fields22.timestamp)({
      ui: {
        description: "When this API key expires (optional - leave blank for no expiration)"
      }
    }),
    lastUsedAt: (0, import_fields22.timestamp)({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        description: "Last time this API key was used"
      }
    }),
    usageCount: (0, import_fields22.json)({
      defaultValue: { total: 0, daily: {} },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        description: "Usage statistics for this API key"
      }
    }),
    restrictedToIPs: (0, import_fields22.json)({
      defaultValue: [],
      ui: {
        description: "Optional: Restrict this key to specific IP addresses (array of IPs)"
      }
    }),
    ...trackingFields,
    user: (0, import_fields22.relationship)({
      ref: "User.apiKeys",
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" }
      }
    })
  },
  ui: {
    labelField: "name",
    listView: {
      initialColumns: ["name", "tokenPreview", "scopes", "status", "lastUsedAt"]
    },
    description: "Secure API keys for programmatic access"
  }
});

// features/keystone/models/Discount.ts
var import_core22 = require("@keystone-6/core");
var import_fields23 = require("@keystone-6/core/fields");
var Discount = (0, import_core22.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["code", "isDisabled", "usageCount", "startsAt"]
    }
  },
  fields: {
    code: (0, import_fields23.text)({
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    isDynamic: (0, import_fields23.checkbox)(),
    isDisabled: (0, import_fields23.checkbox)(),
    stackable: (0, import_fields23.checkbox)({
      defaultValue: false
    }),
    startsAt: (0, import_fields23.timestamp)({
      defaultValue: { kind: "now" },
      validation: { isRequired: true }
    }),
    endsAt: (0, import_fields23.timestamp)(),
    metadata: (0, import_fields23.json)(),
    usageLimit: (0, import_fields23.integer)(),
    usageCount: (0, import_fields23.integer)({
      defaultValue: 0,
      validation: { isRequired: true }
    }),
    validDuration: (0, import_fields23.text)(),
    ...trackingFields,
    discountRule: (0, import_fields23.relationship)({
      ref: "DiscountRule.discounts"
    }),
    orders: (0, import_fields23.relationship)({
      ref: "RestaurantOrder.discounts",
      many: true
    })
  }
});

// features/keystone/models/DiscountRule.ts
var import_core23 = require("@keystone-6/core");
var import_fields24 = require("@keystone-6/core/fields");
var DiscountRule = (0, import_core23.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["description", "type", "value"]
    }
  },
  fields: {
    description: (0, import_fields24.text)(),
    type: (0, import_fields24.select)({
      type: "enum",
      options: [
        { label: "Fixed", value: "fixed" },
        { label: "Percentage", value: "percentage" },
        { label: "Free Item", value: "free_item" }
      ],
      validation: { isRequired: true }
    }),
    value: (0, import_fields24.integer)({
      validation: { isRequired: true }
    }),
    allocation: (0, import_fields24.select)({
      type: "enum",
      options: [
        { label: "Total", value: "total" },
        { label: "Item", value: "item" }
      ]
    }),
    metadata: (0, import_fields24.json)(),
    discounts: (0, import_fields24.relationship)({
      ref: "Discount.discountRule",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/GiftCard.ts
var import_core24 = require("@keystone-6/core");
var import_fields25 = require("@keystone-6/core/fields");
var GiftCard = (0, import_core24.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["code", "value", "balance", "isDisabled"]
    }
  },
  fields: {
    code: (0, import_fields25.text)({
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    value: (0, import_fields25.integer)({
      validation: { isRequired: true }
    }),
    balance: (0, import_fields25.integer)({
      validation: { isRequired: true }
    }),
    isDisabled: (0, import_fields25.checkbox)(),
    endsAt: (0, import_fields25.timestamp)(),
    metadata: (0, import_fields25.json)(),
    ...trackingFields,
    order: (0, import_fields25.relationship)({
      ref: "RestaurantOrder.giftCards"
    }),
    giftCardTransactions: (0, import_fields25.relationship)({
      ref: "GiftCardTransaction.giftCard",
      many: true
    })
  }
});

// features/keystone/models/GiftCardTransaction.ts
var import_core25 = require("@keystone-6/core");
var import_fields26 = require("@keystone-6/core/fields");
var GiftCardTransaction = (0, import_core25.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["giftCard", "amount", "createdAt", "order"]
    }
  },
  fields: {
    amount: (0, import_fields26.integer)({
      validation: { isRequired: true }
    }),
    ...trackingFields,
    giftCard: (0, import_fields26.relationship)({
      ref: "GiftCard.giftCardTransactions"
    }),
    order: (0, import_fields26.relationship)({
      ref: "RestaurantOrder"
    })
  }
});

// features/keystone/models/KitchenStation.ts
var import_core26 = require("@keystone-6/core");
var import_fields27 = require("@keystone-6/core/fields");
var KitchenStation = (0, import_core26.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "displayOrder", "isActive"]
    }
  },
  fields: {
    name: (0, import_fields27.text)({
      validation: { isRequired: true },
      ui: {
        description: "Station name (e.g., Grill, Fryer, Salad, Expo)"
      }
    }),
    displayOrder: (0, import_fields27.integer)({
      defaultValue: 0,
      ui: {
        description: "Order in which stations are displayed (lower numbers first)"
      }
    }),
    isActive: (0, import_fields27.checkbox)({
      defaultValue: true,
      ui: {
        description: "Whether this station is currently active"
      }
    }),
    // Relationships
    assignedStaff: (0, import_fields27.relationship)({
      ref: "User",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["name", "email"],
        inlineConnect: true,
        description: "Staff members assigned to this station"
      }
    }),
    tickets: (0, import_fields27.relationship)({
      ref: "KitchenTicket.station",
      many: true
    }),
    prepStations: (0, import_fields27.relationship)({
      ref: "PrepStation.station",
      many: true
    })
  }
});

// features/keystone/models/PrepStation.ts
var import_core27 = require("@keystone-6/core");
var import_fields28 = require("@keystone-6/core/fields");
var PrepStation = (0, import_core27.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["menuItem", "station", "preparationTime"]
    },
    labelField: "menuItem"
  },
  fields: {
    menuItem: (0, import_fields28.relationship)({
      ref: "MenuItem",
      ui: {
        displayMode: "select",
        description: "Menu item to be prepared at this station"
      }
    }),
    station: (0, import_fields28.relationship)({
      ref: "KitchenStation.prepStations",
      ui: {
        displayMode: "select",
        description: "Kitchen station for preparation"
      }
    }),
    preparationTime: (0, import_fields28.integer)({
      defaultValue: 15,
      ui: {
        description: "Expected preparation time in minutes"
      }
    })
  }
});

// features/keystone/models/KitchenTicket.ts
var import_core28 = require("@keystone-6/core");
var import_fields29 = require("@keystone-6/core/fields");
var KitchenTicket = (0, import_core28.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["order", "station", "status", "priority", "firedAt"]
    }
  },
  fields: {
    status: (0, import_fields29.select)({
      type: "string",
      options: [
        { label: "New", value: "new" },
        { label: "In Progress", value: "in_progress" },
        { label: "Ready", value: "ready" },
        { label: "Served", value: "served" },
        { label: "Cancelled", value: "cancelled" }
      ],
      defaultValue: "new",
      validation: { isRequired: true }
    }),
    priority: (0, import_fields29.integer)({
      defaultValue: 0,
      ui: {
        description: "Priority level (higher numbers = higher priority)"
      }
    }),
    items: (0, import_fields29.json)({
      ui: {
        description: "Order items for this ticket (JSON array)"
      }
    }),
    firedAt: (0, import_fields29.timestamp)({
      defaultValue: { kind: "now" },
      ui: {
        description: "When the ticket was sent to the kitchen"
      }
    }),
    completedAt: (0, import_fields29.timestamp)({
      ui: {
        description: "When all items were completed"
      }
    }),
    servedAt: (0, import_fields29.timestamp)({
      ui: {
        description: "When the items were served to the customer"
      }
    }),
    // Relationships
    order: (0, import_fields29.relationship)({
      ref: "RestaurantOrder",
      ui: {
        displayMode: "select",
        description: "Restaurant order this ticket belongs to"
      }
    }),
    station: (0, import_fields29.relationship)({
      ref: "KitchenStation.tickets",
      ui: {
        displayMode: "select",
        description: "Kitchen station assigned to this ticket"
      }
    }),
    preparedBy: (0, import_fields29.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        description: "Staff member who prepared this ticket"
      }
    })
  }
});

// features/keystone/models/Vendor.ts
var import_core29 = require("@keystone-6/core");
var import_fields30 = require("@keystone-6/core/fields");
var Vendor = (0, import_core29.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "contact", "email", "phone"]
    }
  },
  fields: {
    name: (0, import_fields30.text)({
      validation: { isRequired: true },
      ui: {
        description: "Vendor company name"
      }
    }),
    contact: (0, import_fields30.text)({
      ui: {
        description: "Primary contact person"
      }
    }),
    email: (0, import_fields30.text)({
      validation: {
        match: {
          regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          explanation: "Please enter a valid email address"
        }
      },
      ui: {
        description: "Vendor email address"
      }
    }),
    phone: (0, import_fields30.text)({
      ui: {
        description: "Vendor phone number"
      }
    }),
    paymentTerms: (0, import_fields30.text)({
      ui: {
        description: "Payment terms (e.g., Net 30, COD)"
      }
    }),
    leadTime: (0, import_fields30.integer)({
      ui: {
        description: "Lead time in days for orders"
      }
    }),
    // Relationships
    ingredients: (0, import_fields30.relationship)({
      ref: "Ingredient.vendor",
      many: true
    })
  }
});

// features/keystone/models/InventoryLocation.ts
var import_core30 = require("@keystone-6/core");
var import_fields31 = require("@keystone-6/core/fields");
var InventoryLocation = (0, import_core30.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "isActive"]
    }
  },
  fields: {
    name: (0, import_fields31.text)({
      validation: { isRequired: true },
      ui: {
        description: "Storage location name (e.g., Walk-in, Freezer, Dry Storage)"
      }
    }),
    description: (0, import_fields31.text)({
      ui: {
        displayMode: "textarea",
        description: "Description of the storage location"
      }
    }),
    isActive: (0, import_fields31.checkbox)({
      defaultValue: true,
      ui: {
        description: "Whether this location is currently in use"
      }
    }),
    // Relationships
    ingredients: (0, import_fields31.relationship)({
      ref: "Ingredient.location",
      many: true
    })
  }
});

// features/keystone/models/Ingredient.ts
var import_core31 = require("@keystone-6/core");
var import_fields32 = require("@keystone-6/core/fields");
var Ingredient = (0, import_core31.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "category", "currentStock", "unit", "parLevel"]
    }
  },
  fields: {
    name: (0, import_fields32.text)({
      validation: { isRequired: true },
      ui: {
        description: "Ingredient name"
      }
    }),
    unit: (0, import_fields32.select)({
      type: "string",
      options: [
        { label: "Kilogram", value: "kg" },
        { label: "Pound", value: "lb" },
        { label: "Ounce", value: "oz" },
        { label: "Liter", value: "liter" },
        { label: "Gallon", value: "gallon" },
        { label: "Each", value: "each" },
        { label: "Case", value: "case" },
        { label: "Box", value: "box" }
      ],
      defaultValue: "lb",
      validation: { isRequired: true },
      ui: {
        description: "Unit of measurement"
      }
    }),
    category: (0, import_fields32.select)({
      type: "string",
      options: [
        { label: "Produce", value: "produce" },
        { label: "Meat", value: "meat" },
        { label: "Dairy", value: "dairy" },
        { label: "Dry Goods", value: "dry_goods" },
        { label: "Beverages", value: "beverages" },
        { label: "Spices", value: "spices" },
        { label: "Seafood", value: "seafood" },
        { label: "Other", value: "other" }
      ],
      ui: {
        description: "Ingredient category"
      }
    }),
    currentStock: (0, import_fields32.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "0.00",
      validation: { isRequired: true },
      ui: {
        description: "Current stock quantity"
      }
    }),
    parLevel: (0, import_fields32.decimal)({
      precision: 10,
      scale: 2,
      ui: {
        description: "Ideal stock level to maintain"
      }
    }),
    reorderPoint: (0, import_fields32.decimal)({
      precision: 10,
      scale: 2,
      ui: {
        description: "Stock level at which to reorder"
      }
    }),
    reorderQuantity: (0, import_fields32.decimal)({
      precision: 10,
      scale: 2,
      ui: {
        description: "Quantity to order when restocking"
      }
    }),
    costPerUnit: (0, import_fields32.decimal)({
      precision: 10,
      scale: 2,
      ui: {
        description: "Cost per unit in dollars"
      }
    }),
    expirationDate: (0, import_fields32.timestamp)({
      ui: {
        description: "Expiration date for perishable items"
      }
    }),
    sku: (0, import_fields32.text)({
      ui: {
        description: "SKU or product code"
      }
    }),
    // Relationships
    vendor: (0, import_fields32.relationship)({
      ref: "Vendor.ingredients",
      ui: {
        displayMode: "select",
        description: "Primary vendor for this ingredient"
      }
    }),
    location: (0, import_fields32.relationship)({
      ref: "InventoryLocation.ingredients",
      ui: {
        displayMode: "select",
        description: "Storage location"
      }
    }),
    stockMovements: (0, import_fields32.relationship)({
      ref: "StockMovement.ingredient",
      many: true
    })
  }
});

// features/keystone/models/StockMovement.ts
var import_core32 = require("@keystone-6/core");
var import_fields33 = require("@keystone-6/core/fields");
var StockMovement = (0, import_core32.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["ingredient", "type", "quantity", "createdAt", "createdBy"]
    }
  },
  fields: {
    type: (0, import_fields33.select)({
      type: "string",
      options: [
        { label: "Sale", value: "sale" },
        { label: "Waste", value: "waste" },
        { label: "Spoilage", value: "spoilage" },
        { label: "Theft", value: "theft" },
        { label: "Adjustment", value: "adjustment" },
        { label: "Delivery", value: "delivery" },
        { label: "Return", value: "return" }
      ],
      validation: { isRequired: true },
      ui: {
        description: "Type of stock movement"
      }
    }),
    quantity: (0, import_fields33.decimal)({
      precision: 10,
      scale: 2,
      validation: { isRequired: true },
      ui: {
        description: "Quantity moved (positive for additions, negative for reductions)"
      }
    }),
    reason: (0, import_fields33.text)({
      ui: {
        displayMode: "textarea",
        description: "Reason for the stock movement"
      }
    }),
    // Relationships
    ingredient: (0, import_fields33.relationship)({
      ref: "Ingredient.stockMovements",
      ui: {
        displayMode: "select",
        description: "Ingredient this movement affects"
      }
    }),
    createdBy: (0, import_fields33.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        description: "Staff member who recorded this movement"
      }
    }),
    order: (0, import_fields33.relationship)({
      ref: "RestaurantOrder",
      ui: {
        displayMode: "select",
        description: "Related order (for sale movements)"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/StoreSettings.ts
var import_core33 = require("@keystone-6/core");
var import_fields34 = require("@keystone-6/core/fields");
var StoreSettings = (0, import_core33.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  isSingleton: true,
  graphql: {
    plural: "storeSettingsItems"
  },
  ui: {
    listView: {
      initialColumns: ["name", "tagline", "phone"]
    }
  },
  fields: {
    // Basic Info
    name: (0, import_fields34.text)({
      validation: { isRequired: true },
      ui: { description: "Restaurant name" }
    }),
    tagline: (0, import_fields34.text)({
      ui: { description: "Short tagline (e.g., 'Artisan Burgers & Craft Sides')" }
    }),
    // Contact
    address: (0, import_fields34.text)({
      ui: { description: "Full street address" }
    }),
    phone: (0, import_fields34.text)({
      ui: { description: "Phone number" }
    }),
    email: (0, import_fields34.text)({
      ui: { description: "Contact email" }
    }),
    // Hours (stored as JSON for flexibility)
    hours: (0, import_fields34.json)({
      defaultValue: {
        monday: "11:00 AM - 10:00 PM",
        tuesday: "11:00 AM - 10:00 PM",
        wednesday: "11:00 AM - 10:00 PM",
        thursday: "11:00 AM - 10:00 PM",
        friday: "11:00 AM - 11:00 PM",
        saturday: "10:00 AM - 11:00 PM",
        sunday: "10:00 AM - 9:00 PM"
      },
      ui: { description: "Operating hours by day of week" }
    }),
    // Delivery/Pickup Settings
    deliveryFee: (0, import_fields34.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "4.99",
      ui: { description: "Delivery fee amount" }
    }),
    deliveryMinimum: (0, import_fields34.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "15.00",
      ui: { description: "Minimum order for delivery" }
    }),
    pickupDiscount: (0, import_fields34.integer)({
      defaultValue: 10,
      ui: { description: "Pickup discount percentage" }
    }),
    estimatedDelivery: (0, import_fields34.text)({
      defaultValue: "30-45 min",
      ui: { description: "Estimated delivery time" }
    }),
    estimatedPickup: (0, import_fields34.text)({
      defaultValue: "15-20 min",
      ui: { description: "Estimated pickup time" }
    }),
    // Hero/Branding
    heroHeadline: (0, import_fields34.text)({
      defaultValue: "Thoughtfully crafted burgers.",
      ui: { description: "Main hero headline" }
    }),
    heroSubheadline: (0, import_fields34.text)({
      defaultValue: "Premium ingredients from local farms, bold flavors, and a commitment to quality in every bite.",
      ui: { description: "Hero subheadline/description" }
    }),
    heroTagline: (0, import_fields34.text)({
      defaultValue: "Locally Sourced \xB7 Made Fresh Daily",
      ui: { description: "Small tagline above headline" }
    }),
    // Promo Banner
    promoBanner: (0, import_fields34.text)({
      defaultValue: "Free pickup discount \xB7 10% off all pickup orders",
      ui: { description: "Promotional banner text at top of page" }
    }),
    // Social/Reviews (optional display data)
    rating: (0, import_fields34.decimal)({
      precision: 2,
      scale: 1,
      defaultValue: "4.8",
      ui: { description: "Average rating to display" }
    }),
    reviewCount: (0, import_fields34.integer)({
      defaultValue: 0,
      ui: { description: "Number of reviews to display" }
    })
  }
});

// features/keystone/models/WaitlistEntry.ts
var import_core34 = require("@keystone-6/core");
var import_fields35 = require("@keystone-6/core/fields");
var WaitlistEntry = (0, import_core34.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["customerName", "partySize", "quotedWaitTime", "status", "addedAt"]
    },
    labelField: "customerName"
  },
  fields: {
    customerName: (0, import_fields35.text)({
      validation: { isRequired: true }
    }),
    phoneNumber: (0, import_fields35.text)({
      validation: { isRequired: true },
      ui: {
        description: "Phone number for SMS notifications"
      }
    }),
    partySize: (0, import_fields35.integer)({
      validation: { isRequired: true, min: 1 },
      defaultValue: 2
    }),
    quotedWaitTime: (0, import_fields35.integer)({
      validation: { min: 0 },
      defaultValue: 15,
      ui: {
        description: "Quoted wait time in minutes"
      }
    }),
    status: (0, import_fields35.select)({
      type: "string",
      options: [
        { label: "Waiting", value: "waiting" },
        { label: "Notified", value: "notified" },
        { label: "Seated", value: "seated" },
        { label: "Cancelled", value: "cancelled" },
        { label: "No Show", value: "no_show" }
      ],
      defaultValue: "waiting",
      ui: {
        displayMode: "segmented-control"
      }
    }),
    addedAt: (0, import_fields35.timestamp)({
      defaultValue: { kind: "now" },
      validation: { isRequired: true }
    }),
    notifiedAt: (0, import_fields35.timestamp)({
      ui: {
        description: "When the customer was notified their table is ready"
      }
    }),
    seatedAt: (0, import_fields35.timestamp)({
      ui: {
        description: "When the customer was actually seated"
      }
    }),
    notes: (0, import_fields35.text)({
      ui: {
        displayMode: "textarea",
        description: "Special requests, high chair needed, etc."
      }
    }),
    // Relationships
    table: (0, import_fields35.relationship)({
      ref: "Table",
      ui: {
        displayMode: "select",
        description: "Table assigned when seated"
      }
    }),
    addedBy: (0, import_fields35.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        labelField: "name",
        description: "Staff member who added this entry"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/Shift.ts
var import_core35 = require("@keystone-6/core");
var import_fields36 = require("@keystone-6/core/fields");
var Shift = (0, import_core35.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["staff", "startTime", "endTime", "role", "status"]
    }
  },
  fields: {
    startTime: (0, import_fields36.timestamp)({
      validation: { isRequired: true }
    }),
    endTime: (0, import_fields36.timestamp)({
      validation: { isRequired: true }
    }),
    role: (0, import_fields36.select)({
      type: "string",
      options: [
        { label: "Server", value: "server" },
        { label: "Bartender", value: "bartender" },
        { label: "Host", value: "host" },
        { label: "Busser", value: "busser" },
        { label: "Cook", value: "cook" },
        { label: "Dishwasher", value: "dishwasher" },
        { label: "Manager", value: "manager" }
      ],
      defaultValue: "server",
      validation: { isRequired: true }
    }),
    status: (0, import_fields36.select)({
      type: "string",
      options: [
        { label: "Scheduled", value: "scheduled" },
        { label: "Started", value: "started" },
        { label: "Completed", value: "completed" },
        { label: "No Show", value: "no_show" },
        { label: "Called Out", value: "called_out" }
      ],
      defaultValue: "scheduled"
    }),
    hourlyRate: (0, import_fields36.decimal)({
      precision: 10,
      scale: 2,
      ui: { description: "Hourly rate for this shift" }
    }),
    clockIn: (0, import_fields36.timestamp)({
      ui: { description: "Actual clock in time" }
    }),
    clockOut: (0, import_fields36.timestamp)({
      ui: { description: "Actual clock out time" }
    }),
    notes: (0, import_fields36.text)({
      ui: { displayMode: "textarea" }
    }),
    hoursWorked: (0, import_fields36.virtual)({
      field: import_core35.graphql.field({
        type: import_core35.graphql.Float,
        resolve(item) {
          if (!item.clockIn || !item.clockOut) return null;
          const start = new Date(item.clockIn);
          const end = new Date(item.clockOut);
          return Math.round((end.getTime() - start.getTime()) / 36e5 * 100) / 100;
        }
      })
    }),
    laborCost: (0, import_fields36.virtual)({
      field: import_core35.graphql.field({
        type: import_core35.graphql.Float,
        resolve(item) {
          if (!item.clockIn || !item.clockOut || !item.hourlyRate) return null;
          const start = new Date(item.clockIn);
          const end = new Date(item.clockOut);
          const hours = (end.getTime() - start.getTime()) / 36e5;
          return Math.round(hours * parseFloat(item.hourlyRate) * 100) / 100;
        }
      })
    }),
    // Relationships
    staff: (0, import_fields36.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        labelField: "name"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/TipPool.ts
var import_core36 = require("@keystone-6/core");
var import_fields37 = require("@keystone-6/core/fields");
var TipPool = (0, import_core36.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["date", "tipPoolType", "totalTips", "status"]
    }
  },
  fields: {
    date: (0, import_fields37.timestamp)({
      validation: { isRequired: true },
      ui: { description: "Date this tip pool is for" }
    }),
    tipPoolType: (0, import_fields37.select)({
      type: "string",
      options: [
        { label: "Individual", value: "individual" },
        { label: "Pool by Role", value: "pool_by_role" },
        { label: "House Pool", value: "house_pool" }
      ],
      defaultValue: "individual"
    }),
    totalTips: (0, import_fields37.integer)({
      defaultValue: 0,
      validation: { isRequired: true },
      ui: { description: "Total tips in cents" }
    }),
    cashTips: (0, import_fields37.integer)({
      defaultValue: 0,
      ui: { description: "Cash tips in cents" }
    }),
    creditTips: (0, import_fields37.integer)({
      defaultValue: 0,
      ui: { description: "Credit tips in cents" }
    }),
    distributions: (0, import_fields37.json)({
      ui: {
        description: "Array of { staffId, staffName, role, hoursWorked, amount }"
      }
    }),
    status: (0, import_fields37.select)({
      type: "string",
      options: [
        { label: "Open", value: "open" },
        { label: "Calculated", value: "calculated" },
        { label: "Distributed", value: "distributed" }
      ],
      defaultValue: "open"
    }),
    notes: (0, import_fields37.text)({
      ui: { displayMode: "textarea" }
    }),
    // Relationships
    createdBy: (0, import_fields37.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        labelField: "name"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/TimeEntry.ts
var import_core37 = require("@keystone-6/core");
var import_fields38 = require("@keystone-6/core/fields");
var TimeEntry = (0, import_core37.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["staff", "clockIn", "clockOut", "role", "hoursWorked"]
    }
  },
  fields: {
    clockIn: (0, import_fields38.timestamp)({
      validation: { isRequired: true }
    }),
    clockOut: (0, import_fields38.timestamp)(),
    role: (0, import_fields38.select)({
      type: "string",
      options: [
        { label: "Server", value: "server" },
        { label: "Bartender", value: "bartender" },
        { label: "Host", value: "host" },
        { label: "Busser", value: "busser" },
        { label: "Cook", value: "cook" },
        { label: "Dishwasher", value: "dishwasher" },
        { label: "Manager", value: "manager" }
      ],
      defaultValue: "server"
    }),
    hourlyRate: (0, import_fields38.decimal)({
      precision: 10,
      scale: 2,
      ui: { description: "Hourly rate at time of clock in" }
    }),
    tips: (0, import_fields38.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "0.00",
      ui: { description: "Tips earned during this shift" }
    }),
    breakMinutes: (0, import_fields38.decimal)({
      precision: 5,
      scale: 0,
      defaultValue: "0",
      ui: { description: "Break time in minutes" }
    }),
    notes: (0, import_fields38.text)({
      ui: { displayMode: "textarea" }
    }),
    hoursWorked: (0, import_fields38.virtual)({
      field: import_core37.graphql.field({
        type: import_core37.graphql.Float,
        resolve(item) {
          if (!item.clockIn || !item.clockOut) return null;
          const start = new Date(item.clockIn);
          const end = new Date(item.clockOut);
          const breakMins = parseFloat(item.breakMinutes || "0");
          const totalMins = (end.getTime() - start.getTime()) / 6e4 - breakMins;
          return Math.round(totalMins / 60 * 100) / 100;
        }
      })
    }),
    laborCost: (0, import_fields38.virtual)({
      field: import_core37.graphql.field({
        type: import_core37.graphql.Float,
        resolve(item) {
          if (!item.clockIn || !item.clockOut || !item.hourlyRate) return null;
          const start = new Date(item.clockIn);
          const end = new Date(item.clockOut);
          const breakMins = parseFloat(item.breakMinutes || "0");
          const hours = ((end.getTime() - start.getTime()) / 6e4 - breakMins) / 60;
          return Math.round(hours * parseFloat(item.hourlyRate) * 100) / 100;
        }
      })
    }),
    // Relationships
    staff: (0, import_fields38.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        labelField: "name"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/WasteLog.ts
var import_core38 = require("@keystone-6/core");
var import_fields39 = require("@keystone-6/core/fields");
var WasteLog = (0, import_core38.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["ingredient", "quantity", "reason", "cost", "createdAt"]
    }
  },
  fields: {
    quantity: (0, import_fields39.decimal)({
      precision: 10,
      scale: 2,
      validation: { isRequired: true },
      ui: { description: "Amount wasted" }
    }),
    reason: (0, import_fields39.select)({
      type: "string",
      options: [
        { label: "Spoilage", value: "spoilage" },
        { label: "Preparation Error", value: "preparation_error" },
        { label: "Overproduction", value: "overproduction" },
        { label: "Plate Waste", value: "plate_waste" },
        { label: "Expired", value: "expired" },
        { label: "Damaged", value: "damaged" },
        { label: "Other", value: "other" }
      ],
      defaultValue: "spoilage",
      validation: { isRequired: true }
    }),
    cost: (0, import_fields39.virtual)({
      field: import_core38.graphql.field({
        type: import_core38.graphql.Float,
        async resolve(item, args, context) {
          if (!item.ingredientId || !item.quantity) return 0;
          const ingredient = await context.sudo().query.Ingredient.findOne({
            where: { id: item.ingredientId },
            query: "costPerUnit"
          });
          if (!ingredient?.costPerUnit) return 0;
          return parseFloat(ingredient.costPerUnit) * parseFloat(item.quantity);
        }
      })
    }),
    notes: (0, import_fields39.text)({
      ui: { displayMode: "textarea" }
    }),
    // Relationships
    ingredient: (0, import_fields39.relationship)({
      ref: "Ingredient",
      ui: {
        displayMode: "select"
      }
    }),
    loggedBy: (0, import_fields39.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        labelField: "name"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/PurchaseOrder.ts
var import_core39 = require("@keystone-6/core");
var import_fields40 = require("@keystone-6/core/fields");
var PurchaseOrder = (0, import_core39.list)({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    }
  },
  ui: {
    listView: {
      initialColumns: ["poNumber", "vendor", "orderDate", "status", "totalCost"]
    },
    labelField: "poNumber"
  },
  fields: {
    poNumber: (0, import_fields40.text)({
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    orderDate: (0, import_fields40.timestamp)({
      validation: { isRequired: true },
      defaultValue: { kind: "now" }
    }),
    expectedDelivery: (0, import_fields40.timestamp)({
      ui: { description: "Expected delivery date" }
    }),
    receivedDate: (0, import_fields40.timestamp)({
      ui: { description: "Actual received date" }
    }),
    status: (0, import_fields40.select)({
      type: "string",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Sent", value: "sent" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Shipped", value: "shipped" },
        { label: "Received", value: "received" },
        { label: "Cancelled", value: "cancelled" }
      ],
      defaultValue: "draft"
    }),
    lineItems: (0, import_fields40.json)({
      ui: {
        description: "Array of { ingredientId, ingredientName, quantity, unit, unitCost, totalCost }"
      }
    }),
    totalCost: (0, import_fields40.virtual)({
      field: import_core39.graphql.field({
        type: import_core39.graphql.Float,
        resolve(item) {
          if (!item.lineItems) return 0;
          const items = item.lineItems;
          return items.reduce((sum, li) => sum + (li.totalCost || 0), 0);
        }
      })
    }),
    notes: (0, import_fields40.text)({
      ui: { displayMode: "textarea" }
    }),
    // Relationships
    vendor: (0, import_fields40.relationship)({
      ref: "Vendor",
      ui: {
        displayMode: "select"
      }
    }),
    createdBy: (0, import_fields40.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        labelField: "name"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/index.ts
var models = {
  User,
  Role,
  Section,
  Floor,
  Table,
  MenuCategory,
  MenuItem,
  MenuItemImage,
  MenuItemModifier,
  RestaurantOrder,
  Address,
  OrderItem,
  OrderCourse,
  KitchenMessage,
  Recipe,
  Reservation,
  Payment,
  Cart,
  CartItem,
  PaymentProvider,
  ApiKey,
  Discount,
  DiscountRule,
  GiftCard,
  GiftCardTransaction,
  KitchenStation,
  PrepStation,
  KitchenTicket,
  Vendor,
  InventoryLocation,
  Ingredient,
  StockMovement,
  StoreSettings,
  WaitlistEntry,
  Shift,
  TipPool,
  TimeEntry,
  WasteLog,
  PurchaseOrder
};

// features/keystone/mutations/index.ts
var import_schema = require("@graphql-tools/schema");

// features/keystone/mutations/redirectToInit.ts
async function redirectToInit(root, args, context) {
  const userCount = await context.sudo().query.User.count({});
  if (userCount === 0) {
    return true;
  }
  return false;
}
var redirectToInit_default = redirectToInit;

// features/keystone/mutations/updateActiveUser.ts
async function updateActiveUser(root, { data }, context) {
  const sudoContext = context.sudo();
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("Not authenticated");
  }
  const existingUser = await sudoContext.query.User.findOne({
    where: { id: session.itemId }
  });
  if (!existingUser) {
    throw new Error("User not found");
  }
  return await sudoContext.db.User.updateOne({
    where: { id: session.itemId },
    data
  });
}
var updateActiveUser_default = updateActiveUser;

// lib/stripe.ts
var import_stripe = __toESM(require("stripe"));
var getStripeClient = () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error("Stripe secret key not configured. Set STRIPE_SECRET_KEY environment variable.");
  }
  return new import_stripe.default(stripeKey, {
    apiVersion: "2023-10-16",
    typescript: true
  });
};
var stripeClient = null;
var stripe = new Proxy({}, {
  get(_, prop) {
    if (!stripeClient) {
      stripeClient = getStripeClient();
    }
    return stripeClient[prop];
  }
});
var webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
async function createPaymentIntent({
  amount,
  currency = "usd",
  orderId,
  customerId,
  metadata = {}
}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    metadata: {
      orderId,
      ...metadata
    },
    automatic_payment_methods: {
      enabled: true
    }
  });
  return paymentIntent;
}
async function capturePayment(paymentIntentId) {
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
}
async function getPaymentIntent(paymentIntentId) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

// import("../../integrations/payment/**/*.ts") in features/keystone/utils/paymentProviderAdapter.ts
var globImport_integrations_payment_ts = __glob({
  "../../integrations/payment/index.ts": () => Promise.resolve().then(() => (init_payment(), payment_exports)),
  "../../integrations/payment/manual.ts": () => Promise.resolve().then(() => (init_manual(), manual_exports)),
  "../../integrations/payment/paypal.ts": () => Promise.resolve().then(() => (init_paypal(), paypal_exports)),
  "../../integrations/payment/stripe.ts": () => Promise.resolve().then(() => (init_stripe(), stripe_exports))
});

// features/keystone/utils/paymentProviderAdapter.ts
async function executeAdapterFunction({ provider, functionName, args }) {
  const functionPath = provider[functionName];
  if (functionPath.startsWith("http")) {
    const response = await fetch(functionPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, ...args })
    });
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }
  const adapter = await globImport_integrations_payment_ts(`../../integrations/payment/${functionPath}.ts`);
  const fn = adapter[functionName];
  if (!fn) {
    throw new Error(
      `Function ${functionName} not found in adapter ${functionPath}`
    );
  }
  try {
    return await fn({ provider, ...args });
  } catch (error) {
    throw new Error(
      `Error executing ${functionName} for provider ${functionPath}: ${error?.message || "Unknown error"}`
    );
  }
}
async function createPayment({ provider, order, amount, currency }) {
  return executeAdapterFunction({
    provider,
    functionName: "createPaymentFunction",
    args: { order, amount, currency }
  });
}
async function capturePayment2({ provider, paymentId, amount }) {
  return executeAdapterFunction({
    provider,
    functionName: "capturePaymentFunction",
    args: { paymentId, amount }
  });
}
async function getPaymentStatus({ provider, paymentId }) {
  return executeAdapterFunction({
    provider,
    functionName: "getPaymentStatusFunction",
    args: { paymentId }
  });
}
async function handleWebhook({ provider, event, headers }) {
  return executeAdapterFunction({
    provider,
    functionName: "handleWebhookFunction",
    args: { event, headers }
  });
}

// features/keystone/mutations/processPayment.ts
async function processPayment(root, args, context) {
  if (!context.session?.itemId) {
    return {
      success: false,
      paymentId: null,
      clientSecret: null,
      error: "Must be signed in to process payment"
    };
  }
  const { orderId, amount, paymentMethod, tipAmount = 0 } = args;
  const currency = "usd";
  try {
    const order = await context.db.RestaurantOrder.findOne({
      where: { id: orderId }
    });
    if (!order) {
      return {
        success: false,
        paymentId: null,
        clientSecret: null,
        error: "Order not found"
      };
    }
    if (order.status === "completed") {
      return {
        success: false,
        paymentId: null,
        clientSecret: null,
        error: "Order is already completed"
      };
    }
    const providerCode = paymentMethod === "cash" ? "pp_manual" : ["credit_card", "debit_card", "apple_pay", "google_pay"].includes(
      paymentMethod
    ) ? "pp_stripe" : null;
    const provider = providerCode ? await context.db.PaymentProvider.findOne({
      where: { code: providerCode }
    }) : null;
    let clientSecret = null;
    let providerPaymentId = null;
    let paymentStatus = "pending";
    let usesStripe = false;
    if (provider && provider.isInstalled) {
      const providerResponse = await createPayment({
        provider,
        order,
        amount,
        currency
      });
      clientSecret = providerResponse?.clientSecret || null;
      providerPaymentId = providerResponse?.paymentIntentId || providerResponse?.orderId || providerResponse?.paymentId || null;
      paymentStatus = providerResponse?.status || "pending";
      usesStripe = provider.code === "pp_stripe" && !!providerPaymentId;
    } else {
      const paymentIntent = await createPaymentIntent({
        amount,
        orderId,
        metadata: {
          orderNumber: order.orderNumber || "",
          paymentMethod
        }
      });
      clientSecret = paymentIntent.client_secret;
      providerPaymentId = paymentIntent.id;
      usesStripe = true;
    }
    const payment = await context.db.Payment.createOne({
      data: {
        amount,
        status: paymentStatus,
        paymentMethod,
        stripePaymentIntentId: usesStripe ? providerPaymentId : null,
        providerPaymentId,
        paymentProvider: provider ? { connect: { id: provider.id } } : void 0,
        tipAmount,
        order: { connect: { id: orderId } },
        processedBy: { connect: { id: context.session.itemId } }
      }
    });
    return {
      success: true,
      paymentId: payment.id,
      clientSecret,
      error: null
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error processing payment: ${errorMessage}`);
    return {
      success: false,
      paymentId: null,
      clientSecret: null,
      error: errorMessage
    };
  }
}
async function capturePaymentMutation(root, args, context) {
  if (!context.session?.itemId) {
    return {
      success: false,
      status: null,
      error: "Must be signed in to capture payment"
    };
  }
  const { paymentIntentId } = args;
  try {
    const sudoContext = context.sudo();
    const payments = await sudoContext.query.Payment.findMany({
      where: {
        OR: [
          { stripePaymentIntentId: { equals: paymentIntentId } },
          { providerPaymentId: { equals: paymentIntentId } }
        ]
      },
      query: "id providerPaymentId stripePaymentIntentId order { id } paymentProvider { id code isInstalled createPaymentFunction capturePaymentFunction refundPaymentFunction getPaymentStatusFunction generatePaymentLinkFunction handleWebhookFunction credentials metadata }"
    });
    const payment = payments[0];
    if (!payment) {
      return {
        success: false,
        status: null,
        error: "Payment not found"
      };
    }
    const provider = payment.paymentProvider;
    const capturedPayment = provider ? await capturePayment2({
      provider,
      paymentId: payment.providerPaymentId || paymentIntentId,
      amount: args.amount ?? void 0
    }) : await capturePayment(paymentIntentId);
    await context.db.Payment.updateOne({
      where: { id: payment.id },
      data: {
        status: capturedPayment.status === "succeeded" ? "succeeded" : "processing",
        processedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    if (capturedPayment.status === "succeeded" && payment.order?.id) {
      await context.db.RestaurantOrder.updateOne({
        where: { id: payment.order.id },
        data: { status: "completed" }
      });
    }
    return {
      success: true,
      status: capturedPayment.status,
      error: null
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error capturing payment: ${errorMessage}`);
    return {
      success: false,
      status: null,
      error: errorMessage
    };
  }
}
async function getPaymentStatus2(root, args, context) {
  if (!context.session?.itemId) {
    return {
      status: null,
      amount: null,
      error: "Must be signed in to check payment status"
    };
  }
  try {
    const sudoContext = context.sudo();
    const payments = await sudoContext.query.Payment.findMany({
      where: {
        OR: [
          { stripePaymentIntentId: { equals: args.paymentIntentId } },
          { providerPaymentId: { equals: args.paymentIntentId } }
        ]
      },
      query: "id providerPaymentId stripePaymentIntentId paymentProvider { id code isInstalled createPaymentFunction capturePaymentFunction refundPaymentFunction getPaymentStatusFunction generatePaymentLinkFunction handleWebhookFunction credentials metadata }"
    });
    const payment = payments[0];
    if (!payment) {
      return {
        status: null,
        amount: null,
        error: "Payment not found"
      };
    }
    const provider = payment.paymentProvider;
    const paymentStatus = provider ? await getPaymentStatus({
      provider,
      paymentId: payment.providerPaymentId || args.paymentIntentId
    }) : await getPaymentIntent(args.paymentIntentId);
    return {
      status: paymentStatus.status,
      amount: paymentStatus.amount ?? null,
      error: null
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      status: null,
      amount: null,
      error: errorMessage
    };
  }
}

// features/keystone/mutations/splitCheck.ts
async function splitCheckByItem(root, args, context) {
  if (!context.session?.itemId) {
    return {
      success: false,
      newOrderIds: [],
      error: "Must be signed in to split check"
    };
  }
  const { orderId, itemIds } = args;
  if (!itemIds || itemIds.length === 0) {
    return {
      success: false,
      newOrderIds: [],
      error: "Must select at least one item to split"
    };
  }
  try {
    const originalOrder = await context.db.RestaurantOrder.findOne({
      where: { id: orderId }
    });
    if (!originalOrder) {
      return {
        success: false,
        newOrderIds: [],
        error: "Order not found"
      };
    }
    const itemsToMove = await context.db.OrderItem.findMany({
      where: {
        id: { in: itemIds },
        order: { id: { equals: orderId } }
      }
    });
    if (itemsToMove.length === 0) {
      return {
        success: false,
        newOrderIds: [],
        error: "No valid items found to split"
      };
    }
    let newSubtotal = 0;
    for (const item of itemsToMove) {
      newSubtotal += parseFloat(String(item.price)) * item.quantity;
    }
    const newTax = newSubtotal * 0.08;
    const newTotal = newSubtotal + newTax;
    const now = /* @__PURE__ */ new Date();
    const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
    const timePart = now.getTime().toString().slice(-4);
    const newOrderNumber = `${datePart}-${timePart}-S`;
    const newOrder = await context.db.RestaurantOrder.createOne({
      data: {
        orderNumber: newOrderNumber,
        orderType: originalOrder.orderType,
        status: originalOrder.status,
        guestCount: 1,
        subtotal: newSubtotal.toFixed(2),
        tax: newTax.toFixed(2),
        total: newTotal.toFixed(2),
        table: originalOrder.tableId ? { connect: { id: originalOrder.tableId } } : void 0,
        server: originalOrder.serverId ? { connect: { id: originalOrder.serverId } } : void 0
      }
    });
    for (const item of itemsToMove) {
      await context.db.OrderItem.updateOne({
        where: { id: item.id },
        data: {
          order: { connect: { id: newOrder.id } }
        }
      });
    }
    const remainingItems = await context.db.OrderItem.findMany({
      where: {
        order: { id: { equals: orderId } }
      }
    });
    let remainingSubtotal = 0;
    for (const item of remainingItems) {
      remainingSubtotal += parseFloat(String(item.price)) * item.quantity;
    }
    const remainingTax = remainingSubtotal * 0.08;
    const remainingTotal = remainingSubtotal + remainingTax;
    await context.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        subtotal: remainingSubtotal.toFixed(2),
        tax: remainingTax.toFixed(2),
        total: remainingTotal.toFixed(2)
      }
    });
    return {
      success: true,
      newOrderIds: [newOrder.id],
      error: null
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error splitting check by item: ${errorMessage}`);
    return {
      success: false,
      newOrderIds: [],
      error: errorMessage
    };
  }
}
async function splitCheckByGuest(root, args, context) {
  if (!context.session?.itemId) {
    return {
      success: false,
      newOrderIds: [],
      error: "Must be signed in to split check"
    };
  }
  const { orderId, guestCount } = args;
  if (guestCount < 2) {
    return {
      success: false,
      newOrderIds: [],
      error: "Guest count must be at least 2 to split"
    };
  }
  try {
    const originalOrder = await context.db.RestaurantOrder.findOne({
      where: { id: orderId }
    });
    if (!originalOrder) {
      return {
        success: false,
        newOrderIds: [],
        error: "Order not found"
      };
    }
    const totalAmount = parseFloat(String(originalOrder.total));
    const splitAmount = totalAmount / guestCount;
    const splitTax = splitAmount * 0.08 / 1.08;
    const splitSubtotal = splitAmount - splitTax;
    const newOrderIds = [];
    for (let i = 1; i < guestCount; i++) {
      const now = /* @__PURE__ */ new Date();
      const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
      const timePart = (now.getTime() + i).toString().slice(-4);
      const newOrderNumber = `${datePart}-${timePart}-G${i + 1}`;
      const newOrder = await context.db.RestaurantOrder.createOne({
        data: {
          orderNumber: newOrderNumber,
          orderType: originalOrder.orderType,
          status: originalOrder.status,
          guestCount: 1,
          subtotal: splitSubtotal.toFixed(2),
          tax: splitTax.toFixed(2),
          total: splitAmount.toFixed(2),
          specialInstructions: `Split from order ${originalOrder.orderNumber} (Guest ${i + 1} of ${guestCount})`,
          table: originalOrder.tableId ? { connect: { id: originalOrder.tableId } } : void 0,
          server: originalOrder.serverId ? { connect: { id: originalOrder.serverId } } : void 0
        }
      });
      newOrderIds.push(newOrder.id);
    }
    await context.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        guestCount: 1,
        subtotal: splitSubtotal.toFixed(2),
        tax: splitTax.toFixed(2),
        total: splitAmount.toFixed(2),
        specialInstructions: originalOrder.specialInstructions ? `${originalOrder.specialInstructions} | Split check (Guest 1 of ${guestCount})` : `Split check (Guest 1 of ${guestCount})`
      }
    });
    return {
      success: true,
      newOrderIds,
      error: null
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error splitting check by guest: ${errorMessage}`);
    return {
      success: false,
      newOrderIds: [],
      error: errorMessage
    };
  }
}

// features/keystone/mutations/voidComp.ts
async function hasManagerPermission(context) {
  if (!context.session?.itemId) return false;
  const user = await context.db.User.findOne({
    where: { id: context.session.itemId }
  });
  if (!user || !user.roleId) return false;
  const role = await context.db.Role.findOne({
    where: { id: user.roleId }
  });
  return role?.canManageAllTodos === true;
}
async function voidOrderItem(root, args, context) {
  if (!context.session?.itemId) {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Must be signed in to void items"
    };
  }
  const { orderItemId, reason, managerApproval, managerId } = args;
  if (!reason || reason.trim() === "") {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Reason is required for void"
    };
  }
  try {
    const orderItem = await context.db.OrderItem.findOne({
      where: { id: orderItemId }
    });
    if (!orderItem) {
      return {
        success: false,
        requiresManagerApproval: false,
        adjustedAmount: null,
        error: "Order item not found"
      };
    }
    const isManager = await hasManagerPermission(context);
    if (!isManager && !managerApproval) {
      return {
        success: false,
        requiresManagerApproval: true,
        adjustedAmount: null,
        error: "Manager approval required for void"
      };
    }
    const voidAmount = parseFloat(String(orderItem.price)) * orderItem.quantity;
    await context.db.OrderItem.deleteOne({
      where: { id: orderItemId }
    });
    if (orderItem.orderId) {
      const order = await context.db.RestaurantOrder.findOne({
        where: { id: orderItem.orderId }
      });
      if (order) {
        const currentSubtotal = parseFloat(String(order.subtotal)) - voidAmount;
        const newTax = currentSubtotal * 0.08;
        const newTotal = currentSubtotal + newTax;
        await context.db.RestaurantOrder.updateOne({
          where: { id: orderItem.orderId },
          data: {
            subtotal: Math.max(0, currentSubtotal).toFixed(2),
            tax: Math.max(0, newTax).toFixed(2),
            total: Math.max(0, newTotal).toFixed(2),
            specialInstructions: order.specialInstructions ? `${order.specialInstructions} | VOID: ${reason}` : `VOID: ${reason}`
          }
        });
      }
    }
    return {
      success: true,
      requiresManagerApproval: false,
      adjustedAmount: Math.round(voidAmount * 100),
      // Return in cents
      error: null
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error voiding item: ${errorMessage}`);
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: errorMessage
    };
  }
}
async function compOrderItem(root, args, context) {
  if (!context.session?.itemId) {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Must be signed in to comp items"
    };
  }
  const { orderItemId, reason, compAmount, managerApproval, managerId } = args;
  if (!reason || reason.trim() === "") {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Reason is required for comp"
    };
  }
  try {
    const orderItem = await context.db.OrderItem.findOne({
      where: { id: orderItemId }
    });
    if (!orderItem) {
      return {
        success: false,
        requiresManagerApproval: false,
        adjustedAmount: null,
        error: "Order item not found"
      };
    }
    const isManager = await hasManagerPermission(context);
    if (!isManager && !managerApproval) {
      return {
        success: false,
        requiresManagerApproval: true,
        adjustedAmount: null,
        error: "Manager approval required for comp"
      };
    }
    const itemTotal = parseFloat(String(orderItem.price)) * orderItem.quantity;
    const actualCompAmount = compAmount ? Math.min(compAmount / 100, itemTotal) : itemTotal;
    const newPrice = parseFloat(String(orderItem.price)) - actualCompAmount / orderItem.quantity;
    if (newPrice <= 0) {
      await context.db.OrderItem.deleteOne({
        where: { id: orderItemId }
      });
    } else {
      await context.db.OrderItem.updateOne({
        where: { id: orderItemId },
        data: {
          price: newPrice.toFixed(2),
          specialInstructions: orderItem.specialInstructions ? `${orderItem.specialInstructions} | COMP: ${reason}` : `COMP: ${reason}`
        }
      });
    }
    if (orderItem.orderId) {
      const order = await context.db.RestaurantOrder.findOne({
        where: { id: orderItem.orderId }
      });
      if (order) {
        const currentSubtotal = parseFloat(String(order.subtotal)) - actualCompAmount;
        const newTax = currentSubtotal * 0.08;
        const newTotal = currentSubtotal + newTax;
        await context.db.RestaurantOrder.updateOne({
          where: { id: orderItem.orderId },
          data: {
            subtotal: Math.max(0, currentSubtotal).toFixed(2),
            tax: Math.max(0, newTax).toFixed(2),
            total: Math.max(0, newTotal).toFixed(2),
            specialInstructions: order.specialInstructions ? `${order.specialInstructions} | COMP: ${reason}` : `COMP: ${reason}`
          }
        });
      }
    }
    return {
      success: true,
      requiresManagerApproval: false,
      adjustedAmount: Math.round(actualCompAmount * 100),
      // Return in cents
      error: null
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error comping item: ${errorMessage}`);
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: errorMessage
    };
  }
}
async function voidOrder(root, args, context) {
  if (!context.session?.itemId) {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Must be signed in to void orders"
    };
  }
  const { orderId, reason, managerApproval, managerId } = args;
  if (!reason || reason.trim() === "") {
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: "Reason is required for void"
    };
  }
  try {
    const order = await context.db.RestaurantOrder.findOne({
      where: { id: orderId }
    });
    if (!order) {
      return {
        success: false,
        requiresManagerApproval: false,
        adjustedAmount: null,
        error: "Order not found"
      };
    }
    const isManager = await hasManagerPermission(context);
    if (!isManager && !managerApproval) {
      return {
        success: false,
        requiresManagerApproval: true,
        adjustedAmount: null,
        error: "Manager approval required for void"
      };
    }
    const voidAmount = parseFloat(String(order.total));
    const orderItems = await context.db.OrderItem.findMany({
      where: { order: { id: { equals: orderId } } }
    });
    for (const item of orderItems) {
      await context.db.OrderItem.deleteOne({
        where: { id: item.id }
      });
    }
    await context.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        status: "cancelled",
        subtotal: "0.00",
        tax: "0.00",
        total: "0.00",
        specialInstructions: order.specialInstructions ? `${order.specialInstructions} | VOIDED: ${reason}` : `VOIDED: ${reason}`
      }
    });
    return {
      success: true,
      requiresManagerApproval: false,
      adjustedAmount: Math.round(voidAmount * 100),
      // Return in cents
      error: null
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error voiding order: ${errorMessage}`);
    return {
      success: false,
      requiresManagerApproval: false,
      adjustedAmount: null,
      error: errorMessage
    };
  }
}

// features/keystone/mutations/createStorefrontOrder.ts
async function createStorefrontOrder(root, args, context) {
  const sudoContext = context.sudo();
  try {
    const {
      orderType,
      customerInfo,
      deliveryAddress,
      items,
      subtotal,
      tax,
      tip,
      total,
      specialInstructions
    } = args;
    if (!customerInfo?.name || !customerInfo?.email || !customerInfo?.phone) {
      return {
        success: false,
        orderId: null,
        orderNumber: null,
        clientSecret: null,
        error: "Customer information is required"
      };
    }
    if (!items || items.length === 0) {
      return {
        success: false,
        orderId: null,
        orderNumber: null,
        clientSecret: null,
        error: "Order must contain at least one item"
      };
    }
    const providers = await sudoContext.query.PaymentProvider.findMany({
      where: { code: { equals: "pp_stripe" }, isInstalled: { equals: true } },
      query: "id code isInstalled createPaymentFunction capturePaymentFunction"
    });
    const stripeProvider = providers[0];
    if (!stripeProvider) {
      return {
        success: false,
        orderId: null,
        orderNumber: null,
        clientSecret: null,
        error: "Stripe payment provider not configured"
      };
    }
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const orderTypeMap = {
      pickup: "takeout",
      delivery: "delivery"
    };
    const dbOrderType = orderTypeMap[orderType] || "takeout";
    const customerNote = `Customer: ${customerInfo.name}, Email: ${customerInfo.email}, Phone: ${customerInfo.phone}`;
    const deliveryNote = deliveryAddress ? `
Delivery: ${deliveryAddress.address}, ${deliveryAddress.city} ${deliveryAddress.zip}` : "";
    const fullInstructions = `${customerNote}${deliveryNote}${specialInstructions ? "\n" + specialInstructions : ""}`;
    const customerId = context.session?.itemId;
    const order = await sudoContext.query.RestaurantOrder.createOne({
      data: {
        orderNumber,
        orderType: dbOrderType,
        orderSource: "online",
        status: "open",
        guestCount: 1,
        specialInstructions: fullInstructions,
        subtotal: parseInt(subtotal),
        tax: parseInt(tax),
        tip: parseInt(tip),
        total: parseInt(total),
        customer: customerId ? { connect: { id: customerId } } : void 0,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        deliveryAddress: deliveryAddress?.address,
        deliveryCity: deliveryAddress?.city,
        deliveryZip: deliveryAddress?.zip
      },
      query: "id orderNumber secretKey"
    });
    for (const item of items) {
      await sudoContext.query.OrderItem.createOne({
        data: {
          quantity: item.quantity,
          price: Math.round(item.price),
          // Assuming price comes in cents or we should handle it
          specialInstructions: item.specialInstructions || "",
          order: { connect: { id: order.id } },
          menuItem: { connect: { id: item.menuItemId } },
          appliedModifiers: item.modifierIds?.length ? { connect: item.modifierIds.map((id) => ({ id })) } : void 0
        },
        query: "id"
      });
    }
    const amountInCents = parseInt(total);
    const sessionData = await createPayment({
      provider: stripeProvider,
      order,
      amount: amountInCents,
      currency: "usd"
    });
    await sudoContext.query.Payment.createOne({
      data: {
        amount: amountInCents,
        status: "pending",
        paymentMethod: "credit_card",
        stripePaymentIntentId: sessionData.paymentIntentId,
        tipAmount: parseInt(tip),
        order: { connect: { id: order.id } },
        paymentProvider: { connect: { id: stripeProvider.id } }
      },
      query: "id"
    });
    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientSecret: sessionData.clientSecret,
      secretKey: order.secretKey,
      error: null
    };
  } catch (error) {
    console.error("Error creating storefront order:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      orderId: null,
      orderNumber: null,
      clientSecret: null,
      error: errorMessage
    };
  }
}

// features/keystone/mutations/completeStorefrontOrder.ts
async function completeStorefrontOrder(root, args, context) {
  const sudoContext = context.sudo();
  try {
    const { orderId } = args;
    const order = await sudoContext.query.RestaurantOrder.findOne({
      where: { id: orderId },
      query: "id orderNumber status"
    });
    if (!order) {
      return {
        success: false,
        orderNumber: null,
        error: "Order not found"
      };
    }
    const payments = await sudoContext.query.Payment.findMany({
      where: { order: { id: { equals: orderId } } },
      query: `
        id 
        status 
        stripePaymentIntentId 
        paymentProvider { 
          id 
          code 
          capturePaymentFunction 
          getPaymentStatusFunction 
        }
      `
    });
    const payment = payments[0];
    if (!payment || !payment.stripePaymentIntentId) {
      return {
        success: false,
        orderNumber: null,
        error: "Payment record not found"
      };
    }
    if (!payment.paymentProvider) {
      return {
        success: false,
        orderNumber: null,
        error: "Payment provider not found"
      };
    }
    const paymentStatus = await getPaymentStatus({
      provider: payment.paymentProvider,
      paymentId: payment.stripePaymentIntentId
    });
    let paymentSucceeded = false;
    if (paymentStatus.status === "succeeded") {
      paymentSucceeded = true;
    } else if (paymentStatus.status === "requires_capture") {
      const captureResult = await capturePayment2({
        provider: payment.paymentProvider,
        paymentId: payment.stripePaymentIntentId
      });
      paymentSucceeded = captureResult.status === "succeeded";
    }
    if (!paymentSucceeded) {
      await sudoContext.query.Payment.updateOne({
        where: { id: payment.id },
        data: {
          status: "failed",
          errorMessage: `Payment status: ${paymentStatus.status}`
        }
      });
      return {
        success: false,
        orderNumber: null,
        error: `Payment not successful. Status: ${paymentStatus.status}`
      };
    }
    await sudoContext.query.Payment.updateOne({
      where: { id: payment.id },
      data: {
        status: "succeeded",
        processedAt: (/* @__PURE__ */ new Date()).toISOString(),
        stripeChargeId: paymentStatus.data?.latest_charge || ""
      }
    });
    await sudoContext.query.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        status: "sent_to_kitchen"
      }
    });
    return {
      success: true,
      orderNumber: order.orderNumber,
      error: null
    };
  } catch (error) {
    console.error("Error completing storefront order:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      orderNumber: null,
      error: errorMessage
    };
  }
}

// features/keystone/mutations/activeCart.ts
async function activeCart(root, { cartId }, context) {
  const sudoContext = context.sudo();
  if (!cartId) {
    throw new Error("Cart ID is required");
  }
  const cart = await sudoContext.query.Cart.findOne({
    where: { id: cartId },
    query: `
      id
      orderType
      subtotal
      items {
        id
        quantity
        specialInstructions
        menuItem {
          id
          name
          price
          menuItemImages(take: 1) {
            id
            image {
              url
            }
            imagePath
            altText
          }
        }
        modifiers {
          id
          name
          priceAdjustment
        }
      }
    `
  });
  return cart || null;
}

// features/keystone/mutations/updateActiveCart.ts
async function updateActiveCart(root, { cartId, data }, context) {
  const sudoContext = context.sudo();
  return await sudoContext.db.Cart.updateOne({
    where: { id: cartId },
    data
  });
}

// features/keystone/mutations/updateCartItemQuantity.ts
async function updateCartItemQuantity(root, { cartItemId, quantity }, context) {
  const sudoContext = context.sudo();
  await sudoContext.db.CartItem.updateOne({
    where: { id: cartItemId },
    data: { quantity }
  });
  const cartItem = await sudoContext.query.CartItem.findOne({
    where: { id: cartItemId },
    query: "cart { id }"
  });
  if (!cartItem?.cart?.id) {
    throw new Error("Cart not found for this item");
  }
  return await sudoContext.db.Cart.findOne({
    where: { id: cartItem.cart.id }
  });
}

// features/keystone/mutations/removeCartItem.ts
async function removeCartItem(root, { cartItemId }, context) {
  const sudoContext = context.sudo();
  const cartItem = await sudoContext.query.CartItem.findOne({
    where: { id: cartItemId },
    query: "cart { id }"
  });
  if (!cartItem?.cart?.id) {
    throw new Error("Cart not found for this item");
  }
  const cartId = cartItem.cart.id;
  await sudoContext.db.CartItem.deleteOne({
    where: { id: cartItemId }
  });
  return await sudoContext.db.Cart.findOne({
    where: { id: cartId }
  });
}

// features/keystone/mutations/getCustomerOrder.ts
async function getCustomerOrder(root, { orderId, secretKey }, context) {
  const sudoContext = context.sudo();
  const order = await sudoContext.query.RestaurantOrder.findOne({
    where: { id: orderId },
    query: `
      id
      orderNumber
      orderType
      orderSource
      status
      guestCount
      specialInstructions
      subtotal
      tax
      tip
      discount
      total
      customerName
      customerEmail
      customerPhone
      deliveryAddress
      deliveryCity
      deliveryZip
      secretKey
      createdAt
      updatedAt
      customer {
        id
      }
      orderItems {
        id
        quantity
        unitPrice
        totalPrice
        specialInstructions
        menuItem {
          id
          name
          price
          menuItemImages(take: 1) {
            id
            image {
              url
            }
            imagePath
            altText
          }
        }
        modifiers: appliedModifiers {
          id
          name
          priceAdjustment
        }
      }
      payments {
        id
        amount
        paymentMethod
        status
        createdAt
      }
    `
  });
  if (!order) {
    throw new Error("Order not found");
  }
  if (secretKey) {
    if (order.secretKey !== secretKey) {
      throw new Error("Invalid secret key");
    }
    return order;
  }
  if (!context.session?.itemId) {
    throw new Error("Not authenticated");
  }
  if (order.customer?.id !== context.session.itemId) {
    throw new Error("Order not found");
  }
  return order;
}

// features/keystone/mutations/tableManagement.ts
async function transferTable(root, args, context) {
  if (!context.session?.itemId) {
    return { success: false, error: "Must be signed in" };
  }
  const { orderId, fromTableId, toTableId } = args;
  const sudo = context.sudo();
  try {
    await sudo.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        tables: {
          disconnect: [{ id: fromTableId }],
          connect: [{ id: toTableId }]
        }
      }
    });
    const fromTableOrders = await sudo.query.RestaurantOrder.count({
      where: {
        tables: { some: { id: { equals: fromTableId } } },
        status: { notIn: ["completed", "cancelled"] }
      }
    });
    if (fromTableOrders === 0) {
      await sudo.db.Table.updateOne({
        where: { id: fromTableId },
        data: { status: "cleaning" }
      });
    }
    await sudo.db.Table.updateOne({
      where: { id: toTableId },
      data: { status: "occupied" }
    });
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
async function combineTables(root, args, context) {
  if (!context.session?.itemId) {
    return { success: false, error: "Must be signed in" };
  }
  const { orderId, tableIds } = args;
  const sudo = context.sudo();
  try {
    await sudo.db.RestaurantOrder.updateOne({
      where: { id: orderId },
      data: {
        tables: {
          connect: tableIds.map((id) => ({ id }))
        }
      }
    });
    await Promise.all(
      tableIds.map(
        (id) => sudo.db.Table.updateOne({
          where: { id },
          data: { status: "occupied" }
        })
      )
    );
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// features/keystone/mutations/courseManagement.ts
async function fireCourse(root, args, context) {
  if (!context.session?.itemId) {
    return { success: false, error: "Must be signed in" };
  }
  const { courseId } = args;
  const sudo = context.sudo();
  try {
    await sudo.db.OrderCourse.updateOne({
      where: { id: courseId },
      data: {
        status: "fired",
        fireTime: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    const course = await sudo.query.OrderCourse.findOne({
      where: { id: courseId },
      query: "orderItems { id }"
    });
    if (course?.orderItems?.length) {
      await Promise.all(
        course.orderItems.map(
          (item) => sudo.db.OrderItem.updateOne({
            where: { id: item.id },
            data: { sentToKitchen: (/* @__PURE__ */ new Date()).toISOString() }
          })
        )
      );
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
async function recallCourse(root, args, context) {
  if (!context.session?.itemId) {
    return { success: false, error: "Must be signed in" };
  }
  const { courseId } = args;
  const sudo = context.sudo();
  try {
    await sudo.db.OrderCourse.updateOne({
      where: { id: courseId },
      data: {
        status: "pending",
        fireTime: null
      }
    });
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// features/keystone/mutations/handlePaymentProviderWebhook.ts
async function handlePaymentProviderWebhook(root, { providerCode, event, headers }, context) {
  const sudoContext = context.sudo();
  const providers = await sudoContext.query.PaymentProvider.findMany({
    where: { code: { equals: providerCode } },
    query: `
      id
      code
      isInstalled
      createPaymentFunction
      capturePaymentFunction
      refundPaymentFunction
      getPaymentStatusFunction
      generatePaymentLinkFunction
      handleWebhookFunction
      credentials
      metadata
    `
  });
  const provider = providers[0];
  if (!provider || !provider.isInstalled) {
    throw new Error(`Payment provider ${providerCode} not found or not installed`);
  }
  const { type, resource } = await handleWebhook({ provider, event, headers });
  if (type === "payment_intent.succeeded" || type === "charge.succeeded") {
    const stripePaymentIntentId = resource.id || resource.payment_intent;
    const payments = await sudoContext.query.Payment.findMany({
      where: {
        OR: [
          { stripePaymentIntentId: { equals: stripePaymentIntentId } },
          { providerPaymentId: { equals: stripePaymentIntentId } }
        ]
      },
      query: "id order { id }"
    });
    if (payments.length > 0) {
      const payment = payments[0];
      await sudoContext.db.Payment.updateOne({
        where: { id: payment.id },
        data: {
          status: "succeeded",
          processedAt: (/* @__PURE__ */ new Date()).toISOString(),
          stripeChargeId: resource.latest_charge || resource.id
        }
      });
      if (payment.order?.id) {
        await sudoContext.db.RestaurantOrder.updateOne({
          where: { id: payment.order.id },
          data: {
            status: "sent_to_kitchen"
          }
        });
      }
    }
  } else if (type === "payment_intent.payment_failed") {
    const stripePaymentIntentId = resource.id;
    const payments = await sudoContext.query.Payment.findMany({
      where: { stripePaymentIntentId: { equals: stripePaymentIntentId } },
      query: "id"
    });
    if (payments.length > 0) {
      await sudoContext.db.Payment.updateOne({
        where: { id: payments[0].id },
        data: {
          status: "failed",
          errorMessage: resource.last_payment_error?.message || "Payment failed"
        }
      });
    }
  } else if (type === "payment_intent.canceled") {
    const stripePaymentIntentId = resource.id;
    const payments = await sudoContext.query.Payment.findMany({
      where: { stripePaymentIntentId: { equals: stripePaymentIntentId } },
      query: "id order { id }"
    });
    if (payments.length > 0) {
      const payment = payments[0];
      await sudoContext.db.Payment.updateOne({
        where: { id: payment.id },
        data: { status: "cancelled" }
      });
      if (payment.order?.id) {
        await sudoContext.db.RestaurantOrder.updateOne({
          where: { id: payment.order.id },
          data: { status: "cancelled" }
        });
      }
    }
  }
  return { success: true };
}

// features/keystone/mutations/index.ts
var graphql13 = String.raw;
function extendGraphqlSchema(baseSchema) {
  return (0, import_schema.mergeSchemas)({
    schemas: [baseSchema],
    typeDefs: graphql13`
      input UserUpdateProfileInput {
        email: String
        name: String
        phone: String
        password: String
        onboardingStatus: String
      }

      input CustomerInfoInput {
        name: String!
        email: String!
        phone: String!
      }

      input DeliveryAddressInput {
        address: String!
        city: String!
        zip: String!
      }

      input StorefrontOrderItemInput {
        menuItemId: String!
        quantity: Int!
        price: Int!
        specialInstructions: String
        modifierIds: [String!]
      }

      type Query {
        redirectToInit: Boolean
        getPaymentStatus(paymentIntentId: String!): GetPaymentStatusResult
        activeCart(cartId: ID): Cart
        getCustomerOrder(orderId: ID!, secretKey: String): JSON
      }

      type Mutation {
        updateActiveUser(data: UserUpdateProfileInput!): User
        updateActiveCart(cartId: ID!, data: CartUpdateInput!): Cart
        updateCartItemQuantity(cartItemId: ID!, quantity: Int!): Cart
        removeCartItem(cartItemId: ID!): Cart

        processPayment(
          orderId: String!
          amount: Int!
          paymentMethod: String!
          tipAmount: Int
        ): ProcessPaymentResult

        capturePayment(
          paymentIntentId: String!
        ): CapturePaymentResult

        splitCheckByItem(
          orderId: String!
          itemIds: [String!]!
        ): SplitCheckResult

        splitCheckByGuest(
          orderId: String!
          guestCount: Int!
        ): SplitCheckResult

        voidOrderItem(
          orderItemId: String!
          reason: String!
          managerApproval: Boolean
          managerId: String
        ): VoidCompResult

        compOrderItem(
          orderItemId: String!
          reason: String!
          compAmount: Int
          managerApproval: Boolean
          managerId: String
        ): VoidCompResult

        voidOrder(
          orderId: String!
          reason: String!
          managerApproval: Boolean
          managerId: String
        ): VoidCompResult

        createStorefrontOrder(
          orderType: String!
          customerInfo: CustomerInfoInput!
          deliveryAddress: DeliveryAddressInput
          items: [StorefrontOrderItemInput!]!
          subtotal: Int!
          tax: Int!
          tip: Int!
          total: Int!
          specialInstructions: String
        ): CreateStorefrontOrderResult

        completeStorefrontOrder(
          orderId: String!
        ): CompleteStorefrontOrderResult

        transferTable(
          orderId: String!
          fromTableId: String!
          toTableId: String!
        ): TableManagementResult

        combineTables(
          orderId: String!
          tableIds: [String!]!
        ): TableManagementResult

        fireCourse(
          courseId: String!
        ): CourseManagementResult

        recallCourse(
          courseId: String!
        ): CourseManagementResult

        handlePaymentProviderWebhook(
          providerCode: String!
          event: JSON!
          headers: JSON!
        ): HandleWebhookResult
      }

      type ProcessPaymentResult {
        success: Boolean!
        paymentId: String
        clientSecret: String
        error: String
      }

      type CapturePaymentResult {
        success: Boolean!
        status: String
        error: String
      }

      type GetPaymentStatusResult {
        status: String
        amount: Int
        error: String
      }

      type SplitCheckResult {
        success: Boolean!
        newOrderIds: [String!]!
        error: String
      }

      type VoidCompResult {
        success: Boolean!
        requiresManagerApproval: Boolean!
        adjustedAmount: Int
        error: String
      }

      type CreateStorefrontOrderResult {
        success: Boolean!
        orderId: String
        orderNumber: String
        clientSecret: String
        secretKey: String
        error: String
      }

      type CompleteStorefrontOrderResult {
        success: Boolean!
        orderNumber: String
        error: String
      }

      type TableManagementResult {
        success: Boolean!
        error: String
      }

      type CourseManagementResult {
        success: Boolean!
        error: String
      }

      type HandleWebhookResult {
        success: Boolean!
        error: String
      }
    `,
    resolvers: {
      Query: {
        redirectToInit: redirectToInit_default,
        getPaymentStatus: getPaymentStatus2,
        activeCart,
        getCustomerOrder
      },
      Mutation: {
        updateActiveUser: updateActiveUser_default,
        updateActiveCart,
        updateCartItemQuantity,
        removeCartItem,
        processPayment,
        capturePayment: capturePaymentMutation,
        splitCheckByItem,
        splitCheckByGuest,
        voidOrderItem,
        compOrderItem,
        voidOrder,
        createStorefrontOrder,
        completeStorefrontOrder,
        transferTable,
        combineTables,
        fireCourse,
        recallCourse,
        handlePaymentProviderWebhook
      }
    }
  });
}

// features/keystone/lib/mail.ts
var import_nodemailer = require("nodemailer");
function getBaseUrlForEmails() {
  if (process.env.SMTP_STORE_LINK) {
    return process.env.SMTP_STORE_LINK;
  }
  console.warn("SMTP_STORE_LINK not set. Please add SMTP_STORE_LINK to your environment variables for email links to work properly.");
  return "";
}
var transport = (0, import_nodemailer.createTransport)({
  // @ts-ignore
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
function passwordResetEmail({ url }) {
  const backgroundColor = "#f9f9f9";
  const textColor = "#444444";
  const mainBackgroundColor = "#ffffff";
  const buttonBackgroundColor = "#346df1";
  const buttonBorderColor = "#346df1";
  const buttonTextColor = "#ffffff";
  return `
    <body style="background: ${backgroundColor};">
      <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: ${mainBackgroundColor}; max-width: 600px; margin: auto; border-radius: 10px;">
        <tr>
          <td align="center" style="padding: 10px 0px 0px 0px; font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
            Please click below to reset your password
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 5px;" bgcolor="${buttonBackgroundColor}"><a href="${url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${buttonTextColor}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${buttonBorderColor}; display: inline-block; font-weight: bold;">Reset Password</a></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
            If you did not request this email you can safely ignore it.
          </td>
        </tr>
      </table>
    </body>
  `;
}
async function sendPasswordResetEmail(resetToken, to, baseUrl) {
  const frontendUrl = baseUrl || getBaseUrlForEmails();
  const info = await transport.sendMail({
    to,
    from: process.env.SMTP_FROM,
    subject: "Your password reset token!",
    html: passwordResetEmail({
      url: `${frontendUrl}/dashboard/reset?token=${resetToken}`
    })
  });
  if (process.env.MAIL_USER?.includes("ethereal.email")) {
    console.log(`\u{1F4E7} Message Sent!  Preview it at ${(0, import_nodemailer.getTestMessageUrl)(info)}`);
  }
}

// features/keystone/index.ts
var import_iron = __toESM(require("@hapi/iron"));
var cookie = __toESM(require("cookie"));
var databaseURL = process.env.DATABASE_URL || "file:./keystone.db";
var sessionConfig = {
  maxAge: 60 * 60 * 24 * 360,
  // How long they stay signed in?
  secret: process.env.SESSION_SECRET || "this secret should only be used in testing"
};
var {
  S3_BUCKET_NAME: bucketName = "keystone-test",
  S3_REGION: region = "ap-southeast-2",
  S3_ACCESS_KEY_ID: accessKeyId = "keystone",
  S3_SECRET_ACCESS_KEY: secretAccessKey = "keystone",
  S3_ENDPOINT: endpoint = "https://sfo3.digitaloceanspaces.com"
} = process.env;
function statelessSessions({
  secret,
  maxAge = 60 * 60 * 24 * 360,
  path = "/",
  secure = process.env.NODE_ENV === "production",
  ironOptions = import_iron.default.defaults,
  domain,
  sameSite = "lax",
  cookieName = "keystonejs-session"
}) {
  if (!secret) {
    throw new Error("You must specify a session secret to use sessions");
  }
  if (secret.length < 32) {
    throw new Error("The session secret must be at least 32 characters long");
  }
  return {
    async get({ context }) {
      if (!context?.req) return;
      const authHeader = context.req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const accessToken = authHeader.replace("Bearer ", "");
        try {
          return await import_iron.default.unseal(accessToken, secret, ironOptions);
        } catch (err) {
        }
      }
      const cookies = cookie.parse(context.req.headers.cookie || "");
      const token = cookies[cookieName];
      if (!token) return;
      try {
        return await import_iron.default.unseal(token, secret, ironOptions);
      } catch (err) {
      }
    },
    async end({ context }) {
      if (!context?.res) return;
      context.res.setHeader(
        "Set-Cookie",
        cookie.serialize(cookieName, "", {
          maxAge: 0,
          expires: /* @__PURE__ */ new Date(),
          httpOnly: true,
          secure,
          path,
          sameSite,
          domain
        })
      );
    },
    async start({ context, data }) {
      if (!context?.res) return;
      const sealedData = await import_iron.default.seal(data, secret, {
        ...ironOptions,
        ttl: maxAge * 1e3
      });
      context.res.setHeader(
        "Set-Cookie",
        cookie.serialize(cookieName, sealedData, {
          maxAge,
          expires: new Date(Date.now() + maxAge * 1e3),
          httpOnly: true,
          secure,
          path,
          sameSite,
          domain
        })
      );
      return sealedData;
    }
  };
}
var { withAuth } = (0, import_auth.createAuth)({
  listKey: "User",
  identityField: "email",
  secretField: "password",
  initFirstItem: {
    fields: ["name", "email", "password"],
    itemData: {
      role: {
        create: {
          name: "Admin",
          canCreateTodos: true,
          canManageAllTodos: true,
          canSeeOtherPeople: true,
          canEditOtherPeople: true,
          canManagePeople: true,
          canManageRoles: true,
          canAccessDashboard: true
        }
      }
    }
  },
  passwordResetLink: {
    async sendToken(args) {
      await sendPasswordResetEmail(args.token, args.identity);
    }
  },
  sessionData: `
    id
    name
    email
    role {
      id
      name
      canCreateTodos
      canManageAllTodos
      canSeeOtherPeople
      canEditOtherPeople
      canManagePeople
      canManageRoles
      canAccessDashboard
    }
  `
});
var keystone_default = withAuth(
  (0, import_core40.config)({
    db: {
      provider: "postgresql",
      url: databaseURL
    },
    lists: models,
    storage: {
      my_images: {
        kind: "s3",
        type: "image",
        bucketName,
        region,
        accessKeyId,
        secretAccessKey,
        endpoint,
        signed: { expiry: 5e3 },
        forcePathStyle: true
      }
    },
    ui: {
      isAccessAllowed: ({ session }) => permissions.canAccessDashboard({ session }),
      basePath: "/dashboard"
    },
    session: statelessSessions(sessionConfig),
    graphql: {
      extendGraphqlSchema
    }
  })
);

// keystone.ts
var keystone_default2 = keystone_default;
//# sourceMappingURL=config.js.map
