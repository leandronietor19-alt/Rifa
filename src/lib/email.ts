import { Resend } from "resend";
import { formatCurrency, formatRaffleNumber } from "@/lib/raffle";

let resendClient: Resend | null | undefined;

/**
 * Email is optional: if RESEND_API_KEY isn't set, every send* function here
 * silently no-ops instead of throwing, so the reservation flow always works
 * even before email is configured.
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

type OrderEmailData = {
  raffleId: string;
  raffleTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  numbers: number[];
  digits: number;
  totalAmount: number;
  reservationMinutes: number;
  bizumPhone: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  paymentNotes: string | null;
  orderId: string;
  siteUrl: string;
};

export async function sendNewOrderEmails(data: OrderEmailData) {
  const client = getResendClient();
  if (!client) return;

  const numbersFormatted = data.numbers
    .map((n) => formatRaffleNumber(n, data.digits))
    .join(", ");

  await Promise.allSettled([
    sendBuyerConfirmation(client, data, numbersFormatted),
    sendAdminNotification(client, data, numbersFormatted),
  ]);
}

async function sendBuyerConfirmation(
  client: Resend,
  data: OrderEmailData,
  numbersFormatted: string
) {
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
      subject: `Tu reserva en "${data.raffleTitle}"`,
      html: `
        <p>Hola ${data.buyerName},</p>
        <p>Has reservado ${data.numbers.length} número(s) en <strong>${data.raffleTitle}</strong>:</p>
        <p style="font-size:18px;font-weight:bold;">${numbersFormatted}</p>
        <p>Total a pagar: <strong>${formatCurrency(data.totalAmount)}</strong></p>
        ${paymentLines.join("\n")}
        <p>Indica en el concepto tu nombre y los números reservados para que podamos identificar tu pago.</p>
        <p>Tienes ${data.reservationMinutes} minutos para completar el pago antes de que la reserva caduque.</p>
        <p><a href="${data.siteUrl}/pedido/${data.orderId}">Ver mi pedido</a></p>
      `,
    });
  } catch (err) {
    console.error("Failed to send buyer confirmation email", err);
  }
}

async function sendAdminNotification(
  client: Resend,
  data: OrderEmailData,
  numbersFormatted: string
) {
  const to = getNotificationEmail();
  if (!to) return;

  try {
    await client.emails.send({
      from: getFromAddress(),
      to,
      subject: `Nueva reserva: ${data.buyerName} · ${data.numbers.length} número(s)`,
      html: `
        <p>Nueva reserva en <strong>${data.raffleTitle}</strong>.</p>
        <p><strong>Comprador:</strong> ${data.buyerName} — ${data.buyerEmail} — ${data.buyerPhone}</p>
        <p><strong>Números:</strong> ${numbersFormatted}</p>
        <p><strong>Total:</strong> ${formatCurrency(data.totalAmount)}</p>
        <p><a href="${data.siteUrl}/admin/rifas/${data.raffleId}">Ver en el panel de administración</a></p>
      `,
    });
  } catch (err) {
    console.error("Failed to send admin notification email", err);
  }
}

export async function sendPaymentConfirmedEmail(data: {
  buyerEmail: string;
  buyerName: string;
  raffleTitle: string;
  numbers: number[];
  digits: number;
  siteUrl: string;
  orderId: string;
}) {
  const client = getResendClient();
  if (!client) return;

  const numbersFormatted = data.numbers
    .map((n) => formatRaffleNumber(n, data.digits))
    .join(", ");

  try {
    await client.emails.send({
      from: getFromAddress(),
      to: data.buyerEmail,
      subject: `¡Pago confirmado! Ya participas en "${data.raffleTitle}"`,
      html: `
        <p>Hola ${data.buyerName},</p>
        <p>Hemos confirmado tu pago. Estos son tus números para <strong>${data.raffleTitle}</strong>:</p>
        <p style="font-size:18px;font-weight:bold;">${numbersFormatted}</p>
        <p>¡Mucha suerte!</p>
        <p><a href="${data.siteUrl}/pedido/${data.orderId}">Ver mi pedido</a></p>
      `,
    });
  } catch (err) {
    console.error("Failed to send payment confirmation email", err);
  }
}
