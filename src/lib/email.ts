import { Resend } from "resend";
import { formatCurrency } from "@/lib/store";

let resendClient: Resend | null | undefined;

/**
 * Email is optional: if RESEND_API_KEY isn't set, every send* function here
 * silently no-ops instead of throwing, so checkout always works even
 * before email is configured.
 */
function getResendClient(): Resend | null {
  if (resendClient !== undefined) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  resendClient = apiKey ? new Resend(apiKey) : null;
  return resendClient;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || "onboarding@resend.dev";
}

function getNotificationEmail(): string | null {
  return process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || null;
}

type EmailOrderItem = {
  productName: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
};

function itemsToHtml(items: EmailOrderItem[]): string {
  return items
    .map(
      (i) =>
        `<li>${i.quantity}× ${i.productName} (${i.variantLabel}) — ${formatCurrency(
          i.unitPrice * i.quantity
        )}</li>`
    )
    .join("");
}

type NewOrderEmailData = {
  orderId: string;
  storeName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  items: EmailOrderItem[];
  totalAmount: number;
  reservationMinutes: number;
  bizumPhone: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  paymentNotes: string | null;
  siteUrl: string;
};

export async function sendNewOrderEmails(data: NewOrderEmailData) {
  const client = getResendClient();
  if (!client) return;

  await Promise.allSettled([
    sendBuyerConfirmation(client, data),
    sendAdminNotification(client, data),
  ]);
}

async function sendBuyerConfirmation(client: Resend, data: NewOrderEmailData) {
  const paymentLines: string[] = [];
  if (data.bizumPhone) paymentLines.push(`<p><strong>Bizum:</strong> ${data.bizumPhone}</p>`);
  if (data.bankAccount) {
    paymentLines.push(
      `<p><strong>Transferencia a:</strong> ${data.bankAccount}${
        data.bankHolder ? ` (${data.bankHolder})` : ""
      }</p>`
    );
  }
  if (data.paymentNotes) {
    paymentLines.push(`<p>${data.paymentNotes}</p>`);
  }

  try {
    await client.emails.send({
      from: getFromAddress(),
      to: data.buyerEmail,
      subject: `Tu pedido en ${data.storeName}`,
      html: `
        <p>Hola ${data.buyerName},</p>
        <p>Hemos recibido tu pedido en <strong>${data.storeName}</strong>:</p>
        <ul>${itemsToHtml(data.items)}</ul>
        <p>Total a pagar: <strong>${formatCurrency(data.totalAmount)}</strong></p>
        ${paymentLines.join("\n")}
        <p>Indica en el concepto tu nombre y el número de pedido para que podamos identificar tu pago.</p>
        <p>Tienes ${data.reservationMinutes} minutos para completar el pago antes de que la reserva caduque.</p>
        <p><a href="${data.siteUrl}/pedido/${data.orderId}">Ver mi pedido</a></p>
      `,
    });
  } catch (err) {
    console.error("Failed to send buyer confirmation email", err);
  }
}

async function sendAdminNotification(client: Resend, data: NewOrderEmailData) {
  const to = getNotificationEmail();
  if (!to) return;

  try {
    await client.emails.send({
      from: getFromAddress(),
      to,
      subject: `Nuevo pedido: ${data.buyerName} · ${formatCurrency(data.totalAmount)}`,
      html: `
        <p>Nuevo pedido en <strong>${data.storeName}</strong>.</p>
        <p><strong>Comprador:</strong> ${data.buyerName} — ${data.buyerEmail} — ${data.buyerPhone}</p>
        <ul>${itemsToHtml(data.items)}</ul>
        <p><strong>Total:</strong> ${formatCurrency(data.totalAmount)}</p>
        <p><a href="${data.siteUrl}/admin/pedidos">Ver en el panel de administración</a></p>
      `,
    });
  } catch (err) {
    console.error("Failed to send admin notification email", err);
  }
}

export async function sendPaymentConfirmedEmail(data: {
  buyerEmail: string;
  buyerName: string;
  storeName: string;
  items: EmailOrderItem[];
  siteUrl: string;
  orderId: string;
}) {
  const client = getResendClient();
  if (!client) return;

  try {
    await client.emails.send({
      from: getFromAddress(),
      to: data.buyerEmail,
      subject: `¡Pago confirmado! Tu pedido en ${data.storeName} va en camino`,
      html: `
        <p>Hola ${data.buyerName},</p>
        <p>Hemos confirmado tu pago. Tu pedido en <strong>${data.storeName}</strong>:</p>
        <ul>${itemsToHtml(data.items)}</ul>
        <p>Lo prepararemos y te lo enviaremos en breve. ¡Gracias por tu compra!</p>
        <p><a href="${data.siteUrl}/pedido/${data.orderId}">Ver mi pedido</a></p>
      `,
    });
  } catch (err) {
    console.error("Failed to send payment confirmation email", err);
  }
}
