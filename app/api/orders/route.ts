import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, customers, products } from "@/lib/db/schema";
import { getSessionOr401, requirePermission } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { withRouteErrorHandling } from "@/lib/errors";
import { ordersListQuerySchema, orderSchema } from "@/schemas/orders";
import { and, asc, desc, eq, ilike, or, sql, inArray } from "drizzle-orm";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export async function GET(req: NextRequest) {
  const { user, response } = await getSessionOr401();
  if (response) return response;
  const forbidden = requirePermission(user, PERMISSIONS.ORDERS_READ);
  if (forbidden) return forbidden;

  const parsed = ordersListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  const q = parsed.success
    ? parsed.data
    : { page: 1, limit: 20, sortBy: "createdAt" as const, sortOrder: "desc" as const };

  const page = q.page ?? 1;
  const limit = q.limit ?? 20;
  const offset = (page - 1) * limit;

  const orderBy =
    q.sortBy === "orderNumber"
      ? q.sortOrder === "desc"
        ? desc(orders.orderNumber)
        : asc(orders.orderNumber)
      : q.sortBy === "status"
        ? q.sortOrder === "desc"
          ? desc(orders.status)
          : asc(orders.status)
        : q.sortBy === "updatedAt"
          ? q.sortOrder === "desc"
            ? desc(orders.updatedAt)
            : asc(orders.updatedAt)
          : q.sortOrder === "desc"
            ? desc(orders.createdAt)
            : asc(orders.createdAt);

  const conditions = [];
  if (q.status) {
    conditions.push(eq(orders.status, q.status));
  }
  if (q.customerId) {
    conditions.push(eq(orders.customerId, q.customerId));
  }
  if (q.search?.trim()) {
    conditions.push(
      or(
        ilike(orders.orderNumber, `%${q.search.trim()}%`),
        ilike(orders.notes ?? "", `%${q.search.trim()}%`)
      )!
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        customerName: customers.name,
        status: orders.status,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(where),
  ]);

  // Fetch item counts per order
  const orderIds = rows.map((r) => r.id);
  const itemCounts =
    orderIds.length > 0
      ? await db
          .select({
            orderId: orderItems.orderId,
            itemCount: sql<number>`count(*)::int`,
            totalAmount: sql<string>`sum(${orderItems.subtotal})`,
          })
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
          .groupBy(orderItems.orderId)
      : [];

  const itemCountMap = new Map(itemCounts.map((r) => [r.orderId, r]));

  const total = countResult[0]?.count ?? 0;
  return Response.json({
    data: rows.map((r) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      customerId: r.customerId,
      customerName: r.customerName ?? null,
      status: r.status,
      notes: r.notes ?? null,
      itemCount: itemCountMap.get(r.id)?.itemCount ?? 0,
      totalAmount: itemCountMap.get(r.id)?.totalAmount ?? "0",
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    total,
    page,
    limit,
  });
}

export async function POST(req: NextRequest) {
  return withRouteErrorHandling(async () => {
    const { user, response } = await getSessionOr401();
    if (response) return response;
    const forbidden = requirePermission(user, PERMISSIONS.ORDERS_WRITE);
    if (forbidden) return forbidden;

    const body = await req.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { customerId, notes, items } = parsed.data;

    // Verify customer exists
    const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
    if (!customer) {
      return Response.json({ error: "Customer not found" }, { status: 404 });
    }

    // Verify all products exist
    const productIds = items.map((i) => i.productId);
    const foundProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, productIds));
    if (foundProducts.length !== productIds.length) {
      return Response.json({ error: "One or more products not found" }, { status: 404 });
    }

    const orderNumber = generateOrderNumber();

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerId,
        notes: notes?.trim() || null,
        createdById: user.id,
      })
      .returning();

    if (!order) {
      return Response.json({ error: "Failed to create order" }, { status: 500 });
    }

    const lineItems = items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      subtotal: String(item.quantity * item.unitPrice),
    }));

    await db.insert(orderItems).values(lineItems);

    return Response.json(
      {
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          status: order.status,
          notes: order.notes ?? null,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  });
}
