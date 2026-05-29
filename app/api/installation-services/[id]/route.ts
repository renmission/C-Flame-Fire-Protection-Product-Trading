import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { installationServices, customers, users } from "@/lib/db/schema";
import { getSessionOr401, requirePermission } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { withRouteErrorHandling } from "@/lib/errors";
import { installationServiceUpdateSchema } from "@/schemas/installation-services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { user, response } = await getSessionOr401();
  if (response) return response;
  const forbidden = requirePermission(user, PERMISSIONS.INSTALLATIONS_READ);
  if (forbidden) return forbidden;

  const { id } = await ctx.params;

  const [record] = await db
    .select()
    .from(installationServices)
    .where(eq(installationServices.id, id))
    .limit(1);

  if (!record) {
    return Response.json({ error: "Installation service not found" }, { status: 404 });
  }

  let createdByName: string | null = null;
  if (record.createdById) {
    const [creator] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, record.createdById))
      .limit(1);
    createdByName = creator?.name ?? null;
  }

  return Response.json({
    data: {
      ...record,
      createdByName,
      serviceDate: record.serviceDate.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  return withRouteErrorHandling(async () => {
    const { user, response } = await getSessionOr401();
    if (response) return response;
    const forbidden = requirePermission(user, PERMISSIONS.INSTALLATIONS_WRITE);
    if (forbidden) return forbidden;

    const { id } = await ctx.params;

    const [existing] = await db
      .select()
      .from(installationServices)
      .where(eq(installationServices.id, id))
      .limit(1);

    if (!existing) {
      return Response.json({ error: "Installation service not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = installationServiceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { feeType, feePreset, feeCustom, customerId, serviceDate, ...rest } =
      parsed.data;

    // Validate customerId if changing it
    if (customerId !== undefined && customerId !== null) {
      const [cust] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);
      if (!cust) {
        return Response.json({ error: "Customer not found" }, { status: 404 });
      }
    }

    // Recompute feeAmount if fee fields are changing
    const effectiveFeeType = feeType ?? existing.feeType;
    const effectiveFeePreset =
      feePreset !== undefined ? feePreset : existing.feePreset;
    const effectiveFeeCustom =
      feeCustom !== undefined ? feeCustom : existing.feeCustom;

    let feeAmount: string | undefined;
    if (feeType !== undefined || feePreset !== undefined || feeCustom !== undefined) {
      feeAmount =
        effectiveFeeType === "preset"
          ? (effectiveFeePreset ?? existing.feeAmount)
          : effectiveFeeCustom != null
            ? String(effectiveFeeCustom)
            : existing.feeAmount;
    }

    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (serviceDate !== undefined) updateValues.serviceDate = new Date(serviceDate);
    if (customerId !== undefined) updateValues.customerId = customerId ?? null;
    if (rest.customerName !== undefined) updateValues.customerName = rest.customerName.trim();
    if (rest.customerAddress !== undefined) updateValues.customerAddress = rest.customerAddress.trim();
    if (rest.customerPhone !== undefined) updateValues.customerPhone = rest.customerPhone?.trim() || null;
    if (rest.customerEmail !== undefined) updateValues.customerEmail = rest.customerEmail?.trim() || null;
    if (feeType !== undefined) updateValues.feeType = feeType;
    if (feePreset !== undefined) updateValues.feePreset = feePreset ?? null;
    if (feeCustom !== undefined) updateValues.feeCustom = feeCustom != null ? String(feeCustom) : null;
    if (feeAmount !== undefined) updateValues.feeAmount = feeAmount;
    if (rest.status !== undefined) updateValues.status = rest.status;
    if (rest.notes !== undefined) updateValues.notes = rest.notes?.trim() || null;

    const [updated] = await db
      .update(installationServices)
      .set(updateValues)
      .where(eq(installationServices.id, id))
      .returning();

    let createdByName: string | null = null;
    if (updated.createdById) {
      const [creator] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, updated.createdById))
        .limit(1);
      createdByName = creator?.name ?? null;
    }

    return Response.json({
      data: {
        ...updated,
        createdByName,
        serviceDate: updated.serviceDate.toISOString(),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  return withRouteErrorHandling(async () => {
    const { user, response } = await getSessionOr401();
    if (response) return response;
    const forbidden = requirePermission(user, PERMISSIONS.INSTALLATIONS_WRITE);
    if (forbidden) return forbidden;

    const { id } = await ctx.params;

    const [deleted] = await db
      .delete(installationServices)
      .where(eq(installationServices.id, id))
      .returning({ id: installationServices.id });

    if (!deleted) {
      return Response.json({ error: "Installation service not found" }, { status: 404 });
    }

    return Response.json({ data: { id: deleted.id } });
  });
}
