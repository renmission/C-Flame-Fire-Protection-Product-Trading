import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { customers, orders, orderItems, products } from "@/lib/db/schema";
import { getSessionOr401 } from "@/lib/api-auth";
import { withRouteErrorHandling } from "@/lib/errors";
import { z } from "zod";
import { eq, inArray } from "drizzle-orm";

const customerOrderSchema = z.object({
  customerName: z.string().min(1, "Name is required").max(200),
  contact: z.string().min(1, "Contact is required").max(50),
  address: z.string().min(1, "Address is required").max(500),
  paymentMode: z.enum(["Cash", "GCash"]),
  gcashRef: z.string().max(100).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
      })
    )
    .min(1, "At least one item is required"),
});

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export async function POST(req: NextRequest) {
  return withRouteErrorHandling(async () => {
    const { user, response } = await getSessionOr401();
    if (response) return response;

    const body = await req.json();
    const parsed = customerOrderSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { customerName, contact, address, paymentMode, gcashRef, items } = parsed.data;

    // Verify all products exist
    const productIds = items.map((i) => i.productId);
    const foundProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, productIds));
    if (foundProducts.length !== productIds.length) {
      return Response.json({ error: "One or more products not found" }, { status: 404 });
    }

    // Find or create customer record by email
    let customerId: string;
    const email = user.email ?? null;

    if (email) {
      const [existingByEmail] = await db.select().from(customers).where(eq(customers.email, email));

      if (existingByEmail) {
        customerId = existingByEmail.id;
        // Update contact info in case it changed
        await db
          .update(customers)
          .set({
            name: customerName.trim(),
            phone: contact.trim(),
            address: address.trim(),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, customerId));
      } else {
        const [newCustomer] = await db
          .insert(customers)
          .values({
            name: customerName.trim(),
            address: address.trim(),
            phone: contact.trim(),
            email,
            createdById: user.id,
          })
          .returning();
        if (!newCustomer) {
          return Response.json({ error: "Failed to create customer record" }, { status: 500 });
        }
        customerId = newCustomer.id;
      }
    } else {
      // No email — create a customer record without email
      const [newCustomer] = await db
        .insert(customers)
        .values({
          name: customerName.trim(),
          address: address.trim(),
          phone: contact.trim(),
          createdById: user.id,
        })
        .returning();
      if (!newCustomer) {
        return Response.json({ error: "Failed to create customer record" }, { status: 500 });
      }
      customerId = newCustomer.id;
    }

    // Build notes from payment info
    const noteParts: string[] = [`Payment: ${paymentMode}`];
    if (paymentMode === "GCash" && gcashRef?.trim()) {
      noteParts.push(`GCash Ref: ${gcashRef.trim()}`);
    }
    const notes = noteParts.join(" · ");

    const orderNumber = generateOrderNumber();

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerId,
        notes,
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
          status: order.status,
        },
      },
      { status: 201 }
    );
  });
}
