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
  const stripe2 = getStripeClient();
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
  const stripe2 = getStripeClient();
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
  const stripe2 = getStripeClient();
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
  const stripe2 = getStripeClient();
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
  const stripe2 = getStripeClient();
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
var import_stripe2, getStripeClient;
var init_stripe = __esm({
  "features/integrations/payment/stripe.ts"() {
    "use strict";
    import_stripe2 = __toESM(require("stripe"));
    getStripeClient = () => {
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
var import_core27 = require("@keystone-6/core");
var import_config = require("dotenv/config");

// features/keystone/models/User.ts
var import_core = require("@keystone-6/core");
var import_access = require("@keystone-6/core/access");
var import_fields = require("@keystone-6/core/fields");

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
    name: (0, import_fields.text)({
      validation: {
        isRequired: true
      }
    }),
    email: (0, import_fields.text)({
      isFilterable: false,
      isOrderable: false,
      isIndexed: "unique",
      validation: {
        isRequired: true
      }
    }),
    password: (0, import_fields.password)({
      access: {
        read: import_access.denyAll,
        update: ({ session, item }) => permissions.canManagePeople({ session }) || session?.itemId === item.id
      },
      validation: { isRequired: true }
    }),
    role: (0, import_fields.relationship)({
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
    apiKeys: (0, import_fields.relationship)({
      ref: "ApiKey.user",
      many: true,
      ui: {
        itemView: { fieldMode: "read" }
      }
    }),
    // Restaurant Staff Fields
    employeeId: (0, import_fields.text)({
      isIndexed: "unique",
      ui: {
        description: "Unique employee identifier"
      }
    }),
    staffRole: (0, import_fields.select)({
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
    hireDate: (0, import_fields.timestamp)({
      ui: {
        description: "Date employee was hired"
      }
    }),
    hourlyRate: (0, import_fields.decimal)({
      precision: 10,
      scale: 2,
      ui: {
        description: "Hourly wage rate"
      }
    }),
    pin: (0, import_fields.text)({
      access: {
        read: import_access.denyAll,
        update: ({ session, item }) => permissions.canManagePeople({ session }) || session?.itemId === item.id
      },
      ui: {
        description: "4-digit PIN for quick POS login"
      }
    }),
    staffPermissions: (0, import_fields.json)({
      ui: {
        description: "Additional staff permissions and settings"
      }
    }),
    isActive: (0, import_fields.checkbox)({
      defaultValue: true,
      ui: {
        description: "Whether this employee is currently active"
      }
    }),
    onboardingStatus: (0, import_fields.select)({
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
    photo: (0, import_fields.image)({
      storage: "my_images"
    }),
    // Emergency Contact Info
    emergencyContactName: (0, import_fields.text)({
      ui: {
        description: "Emergency contact person name"
      }
    }),
    emergencyContactPhone: (0, import_fields.text)({
      ui: {
        description: "Emergency contact phone number"
      }
    }),
    // Certifications
    certifications: (0, import_fields.json)({
      ui: {
        description: "Food handler, alcohol service, and other certifications (JSON)"
      }
    })
  }
});

// features/keystone/models/Role.ts
var import_core2 = require("@keystone-6/core");
var import_access3 = require("@keystone-6/core/access");
var import_fields2 = require("@keystone-6/core/fields");
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
    name: (0, import_fields2.text)({ validation: { isRequired: true } }),
    canCreateTodos: (0, import_fields2.checkbox)({ defaultValue: false }),
    canManageAllTodos: (0, import_fields2.checkbox)({ defaultValue: false }),
    canSeeOtherPeople: (0, import_fields2.checkbox)({ defaultValue: false }),
    canEditOtherPeople: (0, import_fields2.checkbox)({ defaultValue: false }),
    canManagePeople: (0, import_fields2.checkbox)({ defaultValue: false }),
    canManageRoles: (0, import_fields2.checkbox)({ defaultValue: false }),
    canManageOnboarding: (0, import_fields2.checkbox)({ defaultValue: true }),
    canAccessDashboard: (0, import_fields2.checkbox)({ defaultValue: false }),
    assignedTo: (0, import_fields2.relationship)({
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
var import_fields3 = require("@keystone-6/core/fields");
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
    name: (0, import_fields3.text)({
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    // Relationships
    tables: (0, import_fields3.relationship)({
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
var import_fields4 = require("@keystone-6/core/fields");
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
    name: (0, import_fields4.text)({
      validation: { isRequired: true },
      ui: {
        description: "Floor name (e.g., Main Floor, Second Floor, Patio)"
      }
    }),
    level: (0, import_fields4.integer)({
      validation: { isRequired: true },
      defaultValue: 1,
      ui: {
        description: "Floor level number (1 for ground floor, 2 for second floor, etc.)"
      }
    }),
    isActive: (0, import_fields4.checkbox)({
      defaultValue: true,
      ui: {
        description: "Whether this floor is currently active for seating"
      }
    }),
    // Relationships
    tables: (0, import_fields4.relationship)({
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
var import_fields5 = require("@keystone-6/core/fields");
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
    tableNumber: (0, import_fields5.text)({
      validation: { isRequired: true },
      isIndexed: true
    }),
    capacity: (0, import_fields5.integer)({
      validation: { isRequired: true, min: 1 },
      defaultValue: 4
    }),
    status: (0, import_fields5.select)({
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
    shape: (0, import_fields5.select)({
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
    positionX: (0, import_fields5.float)({
      defaultValue: 0,
      ui: {
        description: "X coordinate for floor plan rendering"
      }
    }),
    positionY: (0, import_fields5.float)({
      defaultValue: 0,
      ui: {
        description: "Y coordinate for floor plan rendering"
      }
    }),
    metadata: (0, import_fields5.json)({
      ui: {
        description: "Additional table metadata (dimensions, notes, etc.)"
      }
    }),
    // Relationships
    floor: (0, import_fields5.relationship)({
      ref: "Floor.tables",
      ui: {
        displayMode: "select",
        description: "Floor this table belongs to"
      }
    }),
    section: (0, import_fields5.relationship)({
      ref: "Section.tables",
      ui: {
        displayMode: "select"
      }
    })
  }
});

// features/keystone/models/MenuCategory.ts
var import_core6 = require("@keystone-6/core");
var import_fields6 = require("@keystone-6/core/fields");
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
    name: (0, import_fields6.text)({
      validation: { isRequired: true }
    }),
    icon: (0, import_fields6.text)({
      defaultValue: "\u{1F37D}\uFE0F",
      ui: {
        description: "Emoji icon for this category (e.g. \u{1F354}, \u{1F357}, \u{1F964})"
      }
    }),
    description: (0, import_fields6.text)({
      ui: {
        displayMode: "textarea"
      }
    }),
    mealPeriods: (0, import_fields6.multiselect)({
      type: "string",
      options: [
        { label: "Breakfast", value: "breakfast" },
        { label: "Lunch", value: "lunch" },
        { label: "Dinner", value: "dinner" },
        { label: "All Day", value: "all_day" }
      ],
      defaultValue: ["all_day"]
    }),
    sortOrder: (0, import_fields6.integer)({
      defaultValue: 0,
      ui: {
        description: "Order in which categories appear on the menu"
      }
    }),
    // Relationships
    menuItems: (0, import_fields6.relationship)({
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
var import_fields7 = require("@keystone-6/core/fields");
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
    name: (0, import_fields7.text)({
      validation: { isRequired: true }
    }),
    image: (0, import_fields7.image)({
      storage: "my_images"
    }),
    description: (0, import_fields_document.document)({
      formatting: true,
      links: true
    }),
    price: (0, import_fields7.decimal)({
      precision: 10,
      scale: 2,
      validation: { isRequired: true }
    }),
    available: (0, import_fields7.checkbox)({
      defaultValue: true
    }),
    featured: (0, import_fields7.checkbox)({
      defaultValue: false,
      ui: {
        description: "Highlight this item on the storefront"
      }
    }),
    popular: (0, import_fields7.checkbox)({
      defaultValue: false,
      ui: {
        description: "Mark as popular item (shows 'Popular' badge)"
      }
    }),
    prepTime: (0, import_fields7.integer)({
      defaultValue: 15,
      ui: {
        description: "Preparation time in minutes"
      }
    }),
    calories: (0, import_fields7.integer)({
      ui: {
        description: "Calorie count for this menu item"
      }
    }),
    kitchenStation: (0, import_fields7.select)({
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
    allergens: (0, import_fields7.multiselect)({
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
    dietaryFlags: (0, import_fields7.multiselect)({
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
    // Relationships
    category: (0, import_fields7.relationship)({
      ref: "MenuCategory.menuItems",
      ui: {
        displayMode: "select"
      }
    }),
    modifiers: (0, import_fields7.relationship)({
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

// features/keystone/models/MenuItemModifier.ts
var import_core8 = require("@keystone-6/core");
var import_fields8 = require("@keystone-6/core/fields");
var MenuItemModifier = (0, import_core8.list)({
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
    name: (0, import_fields8.text)({
      validation: { isRequired: true }
    }),
    modifierGroup: (0, import_fields8.select)({
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
    modifierGroupLabel: (0, import_fields8.text)({
      ui: {
        description: "Display name for this modifier group (e.g. 'Choose Your Patty')"
      }
    }),
    required: (0, import_fields8.checkbox)({
      defaultValue: false,
      ui: {
        description: "Whether a selection from this group is required"
      }
    }),
    minSelections: (0, import_fields8.integer)({
      defaultValue: 0,
      ui: {
        description: "Minimum number of selections required"
      }
    }),
    maxSelections: (0, import_fields8.integer)({
      defaultValue: 1,
      ui: {
        description: "Maximum number of selections allowed"
      }
    }),
    priceAdjustment: (0, import_fields8.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "0.00",
      ui: {
        description: "Price change (can be negative for removals like no-cheese)"
      }
    }),
    calories: (0, import_fields8.integer)({
      ui: {
        description: "Calorie count for this modifier"
      }
    }),
    defaultSelected: (0, import_fields8.checkbox)({
      defaultValue: false,
      ui: {
        description: "Whether this modifier is selected by default"
      }
    }),
    // Relationships
    menuItem: (0, import_fields8.relationship)({
      ref: "MenuItem.modifiers",
      ui: {
        displayMode: "select"
      }
    })
  }
});

// features/keystone/models/RestaurantOrder.ts
var import_core9 = require("@keystone-6/core");
var import_fields10 = require("@keystone-6/core/fields");

// features/keystone/models/trackingFields.ts
var import_fields9 = require("@keystone-6/core/fields");
var trackingFields = {
  createdAt: (0, import_fields9.timestamp)({
    access: { read: () => true, create: () => false, update: () => false },
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: {
      createView: { fieldMode: "hidden" },
      itemView: { fieldMode: "read" }
    }
  }),
  updatedAt: (0, import_fields9.timestamp)({
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

// features/keystone/models/RestaurantOrder.ts
var RestaurantOrder = (0, import_core9.list)({
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
      initialColumns: ["orderNumber", "orderType", "status", "table", "server", "total"]
    }
  },
  fields: {
    orderNumber: (0, import_fields10.text)({
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    orderType: (0, import_fields10.select)({
      type: "string",
      options: [
        { label: "Dine-in", value: "dine_in" },
        { label: "Takeout", value: "takeout" },
        { label: "Delivery", value: "delivery" }
      ],
      defaultValue: "dine_in"
    }),
    orderSource: (0, import_fields10.select)({
      type: "string",
      options: [
        { label: "POS", value: "pos" },
        { label: "Online", value: "online" },
        { label: "Kiosk", value: "kiosk" },
        { label: "Phone", value: "phone" }
      ],
      defaultValue: "pos"
    }),
    status: (0, import_fields10.select)({
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
    guestCount: (0, import_fields10.integer)({
      defaultValue: 1,
      validation: { min: 1 }
    }),
    specialInstructions: (0, import_fields10.text)({
      ui: {
        displayMode: "textarea"
      }
    }),
    subtotal: (0, import_fields10.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "0.00"
    }),
    tax: (0, import_fields10.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "0.00"
    }),
    tip: (0, import_fields10.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "0.00"
    }),
    discount: (0, import_fields10.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "0.00"
    }),
    total: (0, import_fields10.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "0.00"
    }),
    // Relationships
    table: (0, import_fields10.relationship)({
      ref: "Table",
      ui: {
        displayMode: "select"
      }
    }),
    server: (0, import_fields10.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        labelField: "name"
      }
    }),
    createdBy: (0, import_fields10.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        labelField: "name",
        description: "Staff member who created this order"
      }
    }),
    orderItems: (0, import_fields10.relationship)({
      ref: "OrderItem.order",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["menuItem", "quantity", "price"],
        inlineCreate: { fields: ["menuItem", "quantity", "specialInstructions"] },
        inlineEdit: { fields: ["menuItem", "quantity", "specialInstructions"] }
      }
    }),
    payments: (0, import_fields10.relationship)({
      ref: "Payment.order",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["amount", "status", "paymentMethod"],
        inlineCreate: { fields: ["amount", "paymentMethod", "tipAmount"] },
        inlineEdit: { fields: ["amount", "paymentMethod", "status", "tipAmount"] }
      }
    }),
    discounts: (0, import_fields10.relationship)({
      ref: "Discount.orders",
      many: true
    }),
    giftCards: (0, import_fields10.relationship)({
      ref: "GiftCard.order",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/OrderItem.ts
var import_core10 = require("@keystone-6/core");
var import_fields11 = require("@keystone-6/core/fields");
var OrderItem = (0, import_core10.list)({
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
    quantity: (0, import_fields11.integer)({
      defaultValue: 1,
      validation: { min: 1, isRequired: true }
    }),
    price: (0, import_fields11.decimal)({
      precision: 10,
      scale: 2,
      validation: { isRequired: true },
      ui: {
        description: "Price at time of order (snapshot)"
      }
    }),
    specialInstructions: (0, import_fields11.text)({
      ui: {
        displayMode: "textarea"
      }
    }),
    courseNumber: (0, import_fields11.integer)({
      defaultValue: 1,
      ui: {
        description: "For fine dining: 1=appetizer, 2=main, 3=dessert"
      }
    }),
    seatNumber: (0, import_fields11.integer)({
      ui: {
        description: "Seat number for split check support"
      }
    }),
    sentToKitchen: (0, import_fields11.timestamp)({
      ui: {
        description: "When this item was sent to kitchen"
      }
    }),
    // Relationships
    order: (0, import_fields11.relationship)({
      ref: "RestaurantOrder.orderItems",
      ui: {
        displayMode: "select"
      }
    }),
    menuItem: (0, import_fields11.relationship)({
      ref: "MenuItem",
      ui: {
        displayMode: "select"
      }
    }),
    // Applied modifiers for this order item
    appliedModifiers: (0, import_fields11.relationship)({
      ref: "MenuItemModifier",
      many: true,
      ui: {
        displayMode: "select"
      }
    })
  }
});

// features/keystone/models/Reservation.ts
var import_core11 = require("@keystone-6/core");
var import_fields12 = require("@keystone-6/core/fields");
var Reservation = (0, import_core11.list)({
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
    customerName: (0, import_fields12.text)({
      validation: { isRequired: true }
    }),
    customerPhone: (0, import_fields12.text)({
      validation: { isRequired: true }
    }),
    customerEmail: (0, import_fields12.text)(),
    reservationDate: (0, import_fields12.timestamp)({
      validation: { isRequired: true }
    }),
    partySize: (0, import_fields12.integer)({
      validation: { isRequired: true, min: 1 },
      defaultValue: 2
    }),
    duration: (0, import_fields12.integer)({
      defaultValue: 90,
      ui: {
        description: "Expected duration in minutes"
      }
    }),
    status: (0, import_fields12.select)({
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
    specialRequests: (0, import_fields12.text)({
      ui: {
        displayMode: "textarea"
      }
    }),
    // Relationships
    assignedTable: (0, import_fields12.relationship)({
      ref: "Table",
      ui: {
        displayMode: "select"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/Payment.ts
var import_core12 = require("@keystone-6/core");
var import_fields13 = require("@keystone-6/core/fields");
var Payment = (0, import_core12.list)({
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
    amount: (0, import_fields13.decimal)({
      precision: 10,
      scale: 2,
      validation: { isRequired: true },
      ui: {
        description: "Payment amount in dollars"
      }
    }),
    status: (0, import_fields13.select)({
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
    paymentMethod: (0, import_fields13.select)({
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
    paymentProvider: (0, import_fields13.relationship)({
      ref: "PaymentProvider",
      ui: {
        displayMode: "select",
        description: "Optional provider backing this payment"
      }
    }),
    providerPaymentId: (0, import_fields13.text)({
      ui: {
        description: "Provider payment identifier (Stripe/PayPal/etc.)"
      }
    }),
    // Stripe integration fields
    stripePaymentIntentId: (0, import_fields13.text)({
      isIndexed: "unique",
      ui: {
        description: "Stripe PaymentIntent ID"
      }
    }),
    stripeChargeId: (0, import_fields13.text)({
      ui: {
        description: "Stripe Charge ID for successful payments"
      }
    }),
    stripeRefundId: (0, import_fields13.text)({
      ui: {
        description: "Stripe Refund ID if refunded"
      }
    }),
    // Card details (last 4 digits for reference)
    cardLast4: (0, import_fields13.text)({
      ui: {
        description: "Last 4 digits of card"
      }
    }),
    cardBrand: (0, import_fields13.text)({
      ui: {
        description: "Card brand (visa, mastercard, etc.)"
      }
    }),
    // Tip handling
    tipAmount: (0, import_fields13.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "0.00",
      ui: {
        description: "Tip amount included in payment"
      }
    }),
    // Split payment support
    isSplitPayment: (0, import_fields13.checkbox)({
      defaultValue: false,
      ui: {
        description: "Whether this payment is part of a split bill"
      }
    }),
    splitPaymentIndex: (0, import_fields13.integer)({
      ui: {
        description: "Index of this payment in split (1, 2, 3, etc.)"
      }
    }),
    splitTotal: (0, import_fields13.integer)({
      ui: {
        description: "Total number of split payments for this order"
      }
    }),
    processedAt: (0, import_fields13.timestamp)({
      ui: {
        description: "When payment was successfully processed"
      }
    }),
    // Metadata for errors or additional info
    errorMessage: (0, import_fields13.text)({
      ui: {
        description: "Error message if payment failed"
      }
    }),
    notes: (0, import_fields13.text)({
      ui: {
        displayMode: "textarea",
        description: "Internal notes about this payment"
      }
    }),
    // Relationships
    order: (0, import_fields13.relationship)({
      ref: "RestaurantOrder.payments",
      ui: {
        displayMode: "select"
      }
    }),
    processedBy: (0, import_fields13.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        description: "Staff member who processed payment"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/PaymentProvider.ts
var import_core13 = require("@keystone-6/core");
var import_fields14 = require("@keystone-6/core/fields");
var PaymentProvider = (0, import_core13.list)({
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
    name: (0, import_fields14.text)({
      validation: { isRequired: true }
    }),
    code: (0, import_fields14.text)({
      isIndexed: "unique",
      validation: {
        isRequired: true,
        match: {
          regex: /^pp_[a-zA-Z0-9-_]+$/,
          explanation: 'Payment provider code must start with "pp_" followed by alphanumeric characters, hyphens or underscores'
        }
      }
    }),
    isInstalled: (0, import_fields14.checkbox)({
      defaultValue: true
    }),
    credentials: (0, import_fields14.json)({
      defaultValue: {}
    }),
    metadata: (0, import_fields14.json)({
      defaultValue: {}
    }),
    createPaymentFunction: (0, import_fields14.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to create payments"
      }
    }),
    capturePaymentFunction: (0, import_fields14.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to capture payments"
      }
    }),
    refundPaymentFunction: (0, import_fields14.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to refund payments"
      }
    }),
    getPaymentStatusFunction: (0, import_fields14.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to check payment status"
      }
    }),
    generatePaymentLinkFunction: (0, import_fields14.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to generate payment dashboard links"
      }
    }),
    handleWebhookFunction: (0, import_fields14.text)({
      validation: { isRequired: true },
      ui: {
        description: "Name of the adapter function to handle provider webhooks"
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/ApiKey.ts
var import_fields15 = require("@keystone-6/core/fields");
var import_core14 = require("@keystone-6/core");
var ApiKey = (0, import_core14.list)({
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
    name: (0, import_fields15.text)({
      validation: { isRequired: true },
      ui: {
        description: "A descriptive name for this API key (e.g. 'POS Integration')"
      }
    }),
    tokenSecret: (0, import_fields15.password)({
      validation: { isRequired: true },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "hidden" },
        listView: { fieldMode: "hidden" },
        description: "Secure API key token (hashed and never displayed)"
      }
    }),
    tokenPreview: (0, import_fields15.text)({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
        description: "Preview of the API key (actual key is hidden)"
      }
    }),
    scopes: (0, import_fields15.json)({
      defaultValue: [],
      ui: {
        description: "Array of scopes for this API key"
      }
    }),
    status: (0, import_fields15.select)({
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
    expiresAt: (0, import_fields15.timestamp)({
      ui: {
        description: "When this API key expires (optional - leave blank for no expiration)"
      }
    }),
    lastUsedAt: (0, import_fields15.timestamp)({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        description: "Last time this API key was used"
      }
    }),
    usageCount: (0, import_fields15.json)({
      defaultValue: { total: 0, daily: {} },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        description: "Usage statistics for this API key"
      }
    }),
    restrictedToIPs: (0, import_fields15.json)({
      defaultValue: [],
      ui: {
        description: "Optional: Restrict this key to specific IP addresses (array of IPs)"
      }
    }),
    ...trackingFields,
    user: (0, import_fields15.relationship)({
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
var import_core15 = require("@keystone-6/core");
var import_fields16 = require("@keystone-6/core/fields");
var Discount = (0, import_core15.list)({
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
    code: (0, import_fields16.text)({
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    isDynamic: (0, import_fields16.checkbox)(),
    isDisabled: (0, import_fields16.checkbox)(),
    stackable: (0, import_fields16.checkbox)({
      defaultValue: false
    }),
    startsAt: (0, import_fields16.timestamp)({
      defaultValue: { kind: "now" },
      validation: { isRequired: true }
    }),
    endsAt: (0, import_fields16.timestamp)(),
    metadata: (0, import_fields16.json)(),
    usageLimit: (0, import_fields16.integer)(),
    usageCount: (0, import_fields16.integer)({
      defaultValue: 0,
      validation: { isRequired: true }
    }),
    validDuration: (0, import_fields16.text)(),
    ...trackingFields,
    discountRule: (0, import_fields16.relationship)({
      ref: "DiscountRule.discounts"
    }),
    orders: (0, import_fields16.relationship)({
      ref: "RestaurantOrder.discounts",
      many: true
    })
  }
});

// features/keystone/models/DiscountRule.ts
var import_core16 = require("@keystone-6/core");
var import_fields17 = require("@keystone-6/core/fields");
var DiscountRule = (0, import_core16.list)({
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
    description: (0, import_fields17.text)(),
    type: (0, import_fields17.select)({
      type: "enum",
      options: [
        { label: "Fixed", value: "fixed" },
        { label: "Percentage", value: "percentage" },
        { label: "Free Item", value: "free_item" }
      ],
      validation: { isRequired: true }
    }),
    value: (0, import_fields17.integer)({
      validation: { isRequired: true }
    }),
    allocation: (0, import_fields17.select)({
      type: "enum",
      options: [
        { label: "Total", value: "total" },
        { label: "Item", value: "item" }
      ]
    }),
    metadata: (0, import_fields17.json)(),
    discounts: (0, import_fields17.relationship)({
      ref: "Discount.discountRule",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/GiftCard.ts
var import_core17 = require("@keystone-6/core");
var import_fields18 = require("@keystone-6/core/fields");
var GiftCard = (0, import_core17.list)({
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
    code: (0, import_fields18.text)({
      validation: { isRequired: true },
      isIndexed: "unique"
    }),
    value: (0, import_fields18.integer)({
      validation: { isRequired: true }
    }),
    balance: (0, import_fields18.integer)({
      validation: { isRequired: true }
    }),
    isDisabled: (0, import_fields18.checkbox)(),
    endsAt: (0, import_fields18.timestamp)(),
    metadata: (0, import_fields18.json)(),
    ...trackingFields,
    order: (0, import_fields18.relationship)({
      ref: "RestaurantOrder.giftCards"
    }),
    giftCardTransactions: (0, import_fields18.relationship)({
      ref: "GiftCardTransaction.giftCard",
      many: true
    })
  }
});

// features/keystone/models/GiftCardTransaction.ts
var import_core18 = require("@keystone-6/core");
var import_fields19 = require("@keystone-6/core/fields");
var GiftCardTransaction = (0, import_core18.list)({
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
    amount: (0, import_fields19.integer)({
      validation: { isRequired: true }
    }),
    ...trackingFields,
    giftCard: (0, import_fields19.relationship)({
      ref: "GiftCard.giftCardTransactions"
    }),
    order: (0, import_fields19.relationship)({
      ref: "RestaurantOrder"
    })
  }
});

// features/keystone/models/KitchenStation.ts
var import_core19 = require("@keystone-6/core");
var import_fields20 = require("@keystone-6/core/fields");
var KitchenStation = (0, import_core19.list)({
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
    name: (0, import_fields20.text)({
      validation: { isRequired: true },
      ui: {
        description: "Station name (e.g., Grill, Fryer, Salad, Expo)"
      }
    }),
    displayOrder: (0, import_fields20.integer)({
      defaultValue: 0,
      ui: {
        description: "Order in which stations are displayed (lower numbers first)"
      }
    }),
    isActive: (0, import_fields20.checkbox)({
      defaultValue: true,
      ui: {
        description: "Whether this station is currently active"
      }
    }),
    // Relationships
    assignedStaff: (0, import_fields20.relationship)({
      ref: "User",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["name", "email"],
        inlineConnect: true,
        description: "Staff members assigned to this station"
      }
    }),
    tickets: (0, import_fields20.relationship)({
      ref: "KitchenTicket.station",
      many: true
    }),
    prepStations: (0, import_fields20.relationship)({
      ref: "PrepStation.station",
      many: true
    })
  }
});

// features/keystone/models/PrepStation.ts
var import_core20 = require("@keystone-6/core");
var import_fields21 = require("@keystone-6/core/fields");
var PrepStation = (0, import_core20.list)({
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
    menuItem: (0, import_fields21.relationship)({
      ref: "MenuItem",
      ui: {
        displayMode: "select",
        description: "Menu item to be prepared at this station"
      }
    }),
    station: (0, import_fields21.relationship)({
      ref: "KitchenStation.prepStations",
      ui: {
        displayMode: "select",
        description: "Kitchen station for preparation"
      }
    }),
    preparationTime: (0, import_fields21.integer)({
      defaultValue: 15,
      ui: {
        description: "Expected preparation time in minutes"
      }
    })
  }
});

// features/keystone/models/KitchenTicket.ts
var import_core21 = require("@keystone-6/core");
var import_fields22 = require("@keystone-6/core/fields");
var KitchenTicket = (0, import_core21.list)({
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
    status: (0, import_fields22.select)({
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
    priority: (0, import_fields22.integer)({
      defaultValue: 0,
      ui: {
        description: "Priority level (higher numbers = higher priority)"
      }
    }),
    items: (0, import_fields22.json)({
      ui: {
        description: "Order items for this ticket (JSON array)"
      }
    }),
    firedAt: (0, import_fields22.timestamp)({
      defaultValue: { kind: "now" },
      ui: {
        description: "When the ticket was sent to the kitchen"
      }
    }),
    completedAt: (0, import_fields22.timestamp)({
      ui: {
        description: "When all items were completed"
      }
    }),
    servedAt: (0, import_fields22.timestamp)({
      ui: {
        description: "When the items were served to the customer"
      }
    }),
    // Relationships
    order: (0, import_fields22.relationship)({
      ref: "RestaurantOrder",
      ui: {
        displayMode: "select",
        description: "Restaurant order this ticket belongs to"
      }
    }),
    station: (0, import_fields22.relationship)({
      ref: "KitchenStation.tickets",
      ui: {
        displayMode: "select",
        description: "Kitchen station assigned to this ticket"
      }
    }),
    preparedBy: (0, import_fields22.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        description: "Staff member who prepared this ticket"
      }
    })
  }
});

// features/keystone/models/Vendor.ts
var import_core22 = require("@keystone-6/core");
var import_fields23 = require("@keystone-6/core/fields");
var Vendor = (0, import_core22.list)({
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
    name: (0, import_fields23.text)({
      validation: { isRequired: true },
      ui: {
        description: "Vendor company name"
      }
    }),
    contact: (0, import_fields23.text)({
      ui: {
        description: "Primary contact person"
      }
    }),
    email: (0, import_fields23.text)({
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
    phone: (0, import_fields23.text)({
      ui: {
        description: "Vendor phone number"
      }
    }),
    paymentTerms: (0, import_fields23.text)({
      ui: {
        description: "Payment terms (e.g., Net 30, COD)"
      }
    }),
    leadTime: (0, import_fields23.integer)({
      ui: {
        description: "Lead time in days for orders"
      }
    }),
    // Relationships
    ingredients: (0, import_fields23.relationship)({
      ref: "Ingredient.vendor",
      many: true
    })
  }
});

// features/keystone/models/InventoryLocation.ts
var import_core23 = require("@keystone-6/core");
var import_fields24 = require("@keystone-6/core/fields");
var InventoryLocation = (0, import_core23.list)({
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
    name: (0, import_fields24.text)({
      validation: { isRequired: true },
      ui: {
        description: "Storage location name (e.g., Walk-in, Freezer, Dry Storage)"
      }
    }),
    description: (0, import_fields24.text)({
      ui: {
        displayMode: "textarea",
        description: "Description of the storage location"
      }
    }),
    isActive: (0, import_fields24.checkbox)({
      defaultValue: true,
      ui: {
        description: "Whether this location is currently in use"
      }
    }),
    // Relationships
    ingredients: (0, import_fields24.relationship)({
      ref: "Ingredient.location",
      many: true
    })
  }
});

// features/keystone/models/Ingredient.ts
var import_core24 = require("@keystone-6/core");
var import_fields25 = require("@keystone-6/core/fields");
var Ingredient = (0, import_core24.list)({
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
    name: (0, import_fields25.text)({
      validation: { isRequired: true },
      ui: {
        description: "Ingredient name"
      }
    }),
    unit: (0, import_fields25.select)({
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
    category: (0, import_fields25.select)({
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
    currentStock: (0, import_fields25.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "0.00",
      validation: { isRequired: true },
      ui: {
        description: "Current stock quantity"
      }
    }),
    parLevel: (0, import_fields25.decimal)({
      precision: 10,
      scale: 2,
      ui: {
        description: "Ideal stock level to maintain"
      }
    }),
    reorderPoint: (0, import_fields25.decimal)({
      precision: 10,
      scale: 2,
      ui: {
        description: "Stock level at which to reorder"
      }
    }),
    reorderQuantity: (0, import_fields25.decimal)({
      precision: 10,
      scale: 2,
      ui: {
        description: "Quantity to order when restocking"
      }
    }),
    costPerUnit: (0, import_fields25.decimal)({
      precision: 10,
      scale: 2,
      ui: {
        description: "Cost per unit in dollars"
      }
    }),
    expirationDate: (0, import_fields25.timestamp)({
      ui: {
        description: "Expiration date for perishable items"
      }
    }),
    sku: (0, import_fields25.text)({
      ui: {
        description: "SKU or product code"
      }
    }),
    // Relationships
    vendor: (0, import_fields25.relationship)({
      ref: "Vendor.ingredients",
      ui: {
        displayMode: "select",
        description: "Primary vendor for this ingredient"
      }
    }),
    location: (0, import_fields25.relationship)({
      ref: "InventoryLocation.ingredients",
      ui: {
        displayMode: "select",
        description: "Storage location"
      }
    }),
    stockMovements: (0, import_fields25.relationship)({
      ref: "StockMovement.ingredient",
      many: true
    })
  }
});

// features/keystone/models/StockMovement.ts
var import_core25 = require("@keystone-6/core");
var import_fields26 = require("@keystone-6/core/fields");
var StockMovement = (0, import_core25.list)({
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
    type: (0, import_fields26.select)({
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
    quantity: (0, import_fields26.decimal)({
      precision: 10,
      scale: 2,
      validation: { isRequired: true },
      ui: {
        description: "Quantity moved (positive for additions, negative for reductions)"
      }
    }),
    reason: (0, import_fields26.text)({
      ui: {
        displayMode: "textarea",
        description: "Reason for the stock movement"
      }
    }),
    // Relationships
    ingredient: (0, import_fields26.relationship)({
      ref: "Ingredient.stockMovements",
      ui: {
        displayMode: "select",
        description: "Ingredient this movement affects"
      }
    }),
    createdBy: (0, import_fields26.relationship)({
      ref: "User",
      ui: {
        displayMode: "select",
        description: "Staff member who recorded this movement"
      }
    }),
    order: (0, import_fields26.relationship)({
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
var import_core26 = require("@keystone-6/core");
var import_fields27 = require("@keystone-6/core/fields");
var StoreSettings = (0, import_core26.list)({
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
    name: (0, import_fields27.text)({
      validation: { isRequired: true },
      ui: { description: "Restaurant name" }
    }),
    tagline: (0, import_fields27.text)({
      ui: { description: "Short tagline (e.g., 'Artisan Burgers & Craft Sides')" }
    }),
    // Contact
    address: (0, import_fields27.text)({
      ui: { description: "Full street address" }
    }),
    phone: (0, import_fields27.text)({
      ui: { description: "Phone number" }
    }),
    email: (0, import_fields27.text)({
      ui: { description: "Contact email" }
    }),
    // Hours (stored as JSON for flexibility)
    hours: (0, import_fields27.json)({
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
    deliveryFee: (0, import_fields27.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "4.99",
      ui: { description: "Delivery fee amount" }
    }),
    deliveryMinimum: (0, import_fields27.decimal)({
      precision: 10,
      scale: 2,
      defaultValue: "15.00",
      ui: { description: "Minimum order for delivery" }
    }),
    pickupDiscount: (0, import_fields27.integer)({
      defaultValue: 10,
      ui: { description: "Pickup discount percentage" }
    }),
    estimatedDelivery: (0, import_fields27.text)({
      defaultValue: "30-45 min",
      ui: { description: "Estimated delivery time" }
    }),
    estimatedPickup: (0, import_fields27.text)({
      defaultValue: "15-20 min",
      ui: { description: "Estimated pickup time" }
    }),
    // Hero/Branding
    heroHeadline: (0, import_fields27.text)({
      defaultValue: "Thoughtfully crafted burgers.",
      ui: { description: "Main hero headline" }
    }),
    heroSubheadline: (0, import_fields27.text)({
      defaultValue: "Premium ingredients from local farms, bold flavors, and a commitment to quality in every bite.",
      ui: { description: "Hero subheadline/description" }
    }),
    heroTagline: (0, import_fields27.text)({
      defaultValue: "Locally Sourced \xB7 Made Fresh Daily",
      ui: { description: "Small tagline above headline" }
    }),
    // Promo Banner
    promoBanner: (0, import_fields27.text)({
      defaultValue: "Free pickup discount \xB7 10% off all pickup orders",
      ui: { description: "Promotional banner text at top of page" }
    }),
    // Social/Reviews (optional display data)
    rating: (0, import_fields27.decimal)({
      precision: 2,
      scale: 1,
      defaultValue: "4.8",
      ui: { description: "Average rating to display" }
    }),
    reviewCount: (0, import_fields27.integer)({
      defaultValue: 0,
      ui: { description: "Number of reviews to display" }
    })
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
  MenuItemModifier,
  RestaurantOrder,
  OrderItem,
  Reservation,
  Payment,
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
  StoreSettings
};

// features/keystone/index.ts
var import_session = require("@keystone-6/core/session");

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
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Warning: STRIPE_SECRET_KEY is not set. Stripe functionality will not work.");
}
var stripe = new import_stripe.default(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
  typescript: true
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
        amount: (amount / 100).toFixed(2),
        // Convert cents to dollars
        status: paymentStatus,
        paymentMethod,
        stripePaymentIntentId: usesStripe ? providerPaymentId : null,
        providerPaymentId,
        paymentProvider: provider ? { connect: { id: provider.id } } : void 0,
        tipAmount: (tipAmount / 100).toFixed(2),
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

// features/keystone/mutations/index.ts
var graphql = String.raw;
function extendGraphqlSchema(baseSchema) {
  return (0, import_schema.mergeSchemas)({
    schemas: [baseSchema],
    typeDefs: graphql`
      input UserUpdateProfileInput {
        email: String
        name: String
        phone: String
        password: String
        onboardingStatus: String
      }

      type Query {
        redirectToInit: Boolean
        getPaymentStatus(paymentIntentId: String!): GetPaymentStatusResult
      }

      type Mutation {
        updateActiveUser(data: UserUpdateProfileInput!): User

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
    `,
    resolvers: {
      Query: {
        redirectToInit: redirectToInit_default,
        getPaymentStatus: getPaymentStatus2
      },
      Mutation: {
        updateActiveUser: updateActiveUser_default,
        processPayment,
        capturePayment: capturePaymentMutation,
        splitCheckByItem,
        splitCheckByGuest,
        voidOrderItem,
        compOrderItem,
        voidOrder
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
  (0, import_core27.config)({
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
      isAccessAllowed: ({ session }) => permissions.canAccessDashboard({ session })
    },
    session: (0, import_session.statelessSessions)(sessionConfig),
    graphql: {
      extendGraphqlSchema
    }
  })
);

// keystone.ts
var keystone_default2 = keystone_default;
//# sourceMappingURL=config.js.map
