import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, customers, products } from "@/lib/db/schema";
import { getSessionOr401, requirePermission } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { withRouteErrorHandling } from "@/lib/errors";
import { orderUpdateSchema } from "@/schemas/orders";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { user, response } = await getSessionOr401();
  if (response) return response;
  const forbidden = requirePermission(user, PERMISSIONS.ORDERS_READ);
  if (forbidden) return forbidden;

  const { id } = await params;

  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerName: customers.name,
      customerAddress: customers.address,
      customerPhone: customers.phone,
      status: orders.status,
      notes: orders.notes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, id));

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const items = await db
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      productName: products.name,
      productSku: products.sku,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      subtotal: orderItems.subtotal,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

  return Response.json({
    data: {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName ?? null,
      customerAddress: order.customerAddress ?? null,
      customerPhone: order.customerPhone ?? null,
      status: order.status,
      notes: order.notes ?? null,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName ?? null,
        productSku: item.productSku ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return withRouteErrorHandling(async () => {
    const { user, response } = await getSessionOr401();
    if (response) return response;
    const forbidden = requirePermission(user, PERMISSIONS.ORDERS_WRITE);
    if (forbidden) return forbidden;

    const { id } = await params;

    const [existing] = await db.select().from(orders).where(eq(orders.id, id));
    if (!existing) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = orderUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, notes } = parsed.data;

    const [updated] = await db
      .update(orders)
      .set({
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes: notes.trim() || null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return Response.json({
      data: {
        id: updated.id,
        orderNumber: updated.orderNumber,
        customerId: updated.customerId,
        status: updated.status,
        notes: updated.notes ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return withRouteErrorHandling(async () => {
    const { user, response } = await getSessionOr401();
    if (response) return response;
    const forbidden = requirePermission(user, PERMISSIONS.ORDERS_WRITE);
    if (forbidden) return forbidden;

    const { id } = await params;

    const [existing] = await db.select().from(orders).where(eq(orders.id, id));
    if (!existing) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (existing.status !== "pending" && existing.status !== "cancelled") {
      return Response.json(
        { error: "Only pending or cancelled orders can be deleted" },
        { status: 409 }
      );
    }

    await db.delete(orders).where(eq(orders.id, id));
    return Response.json({ data: { id } });
  });
}
