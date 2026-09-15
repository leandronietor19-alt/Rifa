import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/store";
import OrdersTable, { type OrderRow } from "./OrdersTable";

export default async function AdminOrdersPage() {
  await releaseExpiredReservations();

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const orderRows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    buyerName: o.buyerName,
    buyerEmail: o.buyerEmail,
    buyerPhone: o.buyerPhone,
    buyerAddress: o.buyerAddress,
    totalAmount: o.totalAmount,
    status: o.status,
    paymentReference: o.paymentReference,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      productName: i.productName,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
    })),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Pedidos ({orders.length})</h1>
      <OrdersTable orders={orderRows} />
    </div>
  );
}
