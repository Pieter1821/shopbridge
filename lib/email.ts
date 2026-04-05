import { formatZAR } from "@/lib/utils";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

function getEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function getRequiredTemplateId(type: "account" | "password" | "order") {
  const sharedTemplateId = getEnvValue("EMAILJS_TEMPLATE_ID", "EMAIL.JS_TEMPLATE_ID");

  if (type === "account") {
    return getEnvValue("EMAILJS_ACCOUNT_TEMPLATE_ID") ?? sharedTemplateId;
  }

  if (type === "password") {
    return getEnvValue("EMAILJS_PASSWORD_TEMPLATE_ID") ?? sharedTemplateId;
  }

  return getEnvValue("EMAILJS_ORDER_TEMPLATE_ID") ?? sharedTemplateId;
}

function isEmailJsConfigured(templateId?: string | null) {
  return Boolean(
    getEnvValue("EMAILJS_SERVICE_ID", "EMAIL.JS_SERVICE_ID") &&
      getEnvValue("EMAILJS_PUBLIC_KEY", "EMAIL.JS_PUBLIC_KEY") &&
      templateId,
  );
}

async function sendEmailViaEmailJs(templateId: string, templateParams: Record<string, unknown>) {
  if (!isEmailJsConfigured(templateId)) {
    console.warn("EmailJS is not fully configured. Skipping transactional email send.");
    return;
  }

  const response = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service_id: getEnvValue("EMAILJS_SERVICE_ID", "EMAIL.JS_SERVICE_ID"),
      template_id: templateId,
      user_id: getEnvValue("EMAILJS_PUBLIC_KEY", "EMAIL.JS_PUBLIC_KEY"),
      accessToken: getEnvValue("EMAILJS_PRIVATE_KEY", "EMAIL.JS_PRIVATE_KEY"),
      template_params: templateParams,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`EmailJS send failed: ${details || response.statusText}`);
  }
}

type ManagedUserEmailParams = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: "customer" | "staff" | "admin";
  temporaryPassword: string;
};

export async function sendManagedUserWelcomeEmail({
  email,
  firstName,
  lastName,
  role,
  temporaryPassword,
}: ManagedUserEmailParams) {
  const templateId = getRequiredTemplateId("account");
  if (!templateId) {
    return;
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || email;
  await sendEmailViaEmailJs(templateId, {
    to_email: email,
    to_name: fullName,
    first_name: firstName ?? "",
    last_name: lastName ?? "",
    role,
    temporary_password: temporaryPassword,
    sign_in_url: `${getSiteUrl()}/sign-in`,
    subject: `Your ShopBridge ${role} account is ready`,
    message: `Your ShopBridge ${role} account has been created. Sign in using your email address and the temporary password provided below.`,
  });
}

export async function sendManagedUserPasswordEmail({
  email,
  firstName,
  lastName,
  role,
  temporaryPassword,
}: ManagedUserEmailParams) {
  const templateId = getRequiredTemplateId("password");
  if (!templateId) {
    return;
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || email;
  await sendEmailViaEmailJs(templateId, {
    to_email: email,
    to_name: fullName,
    first_name: firstName ?? "",
    last_name: lastName ?? "",
    role,
    temporary_password: temporaryPassword,
    sign_in_url: `${getSiteUrl()}/sign-in`,
    subject: "Your ShopBridge password was updated",
    message: "An admin updated your ShopBridge password. Use the temporary password below and sign in again.",
  });
}

type OrderConfirmationEmailParams = {
  email: string;
  customerName?: string | null;
  orderNumber: string;
  totalCents: number;
  shippingMethod?: string | null;
  itemSummary: string[];
};

export async function sendOrderConfirmationEmail({
  email,
  customerName,
  orderNumber,
  totalCents,
  shippingMethod,
  itemSummary,
}: OrderConfirmationEmailParams) {
  const templateId = getRequiredTemplateId("order");
  if (!templateId) {
    return;
  }

  await sendEmailViaEmailJs(templateId, {
    to_email: email,
    to_name: customerName ?? email,
    order_number: orderNumber,
    order_total: formatZAR(totalCents),
    shipping_method: shippingMethod ?? "Standard delivery",
    items_summary: itemSummary.join(", "),
    order_url: `${getSiteUrl()}/account`,
    subject: `Order confirmation ${orderNumber}`,
    message: "Your payment was received and your ShopBridge order is now confirmed.",
  });
}
