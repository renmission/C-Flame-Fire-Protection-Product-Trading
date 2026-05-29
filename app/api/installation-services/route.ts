import { NextRequest } from "next/server";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  installationServices,
  customers,
  users,
} from "@/lib/db/schema";
import { getSessionOr401, requirePermission } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { withRouteErrorHandling } from "@/lib/errors";
import {
  installationServicesListQuerySchema,
  installationServiceSchema,
} from "@/schemas/installation-services";

export async function GET(req: NextRequest) {
  const { user, response } = await getSessionOr401();
  if (response) return response;
  const forbidden = requirePermission(user, PERMISSIONS.INSTALLATIONS_READ);
  if (forbidden) return forbidden;

  const parsed = installationServicesListQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  const q = parsed.success
    ? parsed.data
    : { page: 1, limit: 20, sortBy: "createdAt" as const, sortOrder: "desc" as const };

  const page = q.page ?? 1;
  const limit = q.limit ?? 20;
  const offset = (page - 1) * limit;

  const orderCol = (() => {
    switch (q.sortBy) {
      case "serviceDate":
        return q.sortOrder === "asc"
          ? asc(installationServices.serviceDate)
          : desc(installationServices.serviceDate);
      case "customerName":
        return q.sortOrder === "asc"
          ? asc(installationServices.customerName)
          : desc(installationServices.customerName);
      case "status":
        return q.sortOrder === "asc"
          ? asc(installationServices.status)
          : desc(installationServices.status);
      case "feeAmount":
        return q.sortOrder === "asc"
          ? asc(installationServices.feeAmount)
          : desc(installationServices.feeAmount);
      default:
        return q.sortOrder === "asc"
          ? asc(installationServices.createdAt)
          : desc(installationServices.createdAt);
    }
  })();

  const conditions = [];
  if (q.status) conditions.push(eq(installationServices.status, q.status));
  if (q.search?.trim()) {
    const term = `%${q.search.trim()}%`;
    conditions.push(
      or(
        ilike(installationServices.customerName, term),
        ilike(installationServices.customerAddress, term)
      )!
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(installationServices)
      .where(where)
      .orderBy(orderCol)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(installationServices)
      .where(where),
  ]);

  const creatorIds = [
    ...new Set(
      rows
        .map((r) => r.createdById)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const creators =
    creatorIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, creatorIds))
      : [];
  const creatorMap = new Map(creators.map((u) => [u.id, u.name]));

  return Response.json({
    data: rows.map((r) => ({
      ...r,
      createdByName: r.createdById ? (creatorMap.get(r.createdById) ?? null) : null,
      serviceDate: r.serviceDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
}

export async function POST(req: NextRequest) {
  return withRouteErrorHandling(async () => {
    const { user, response } = await getSessionOr401();
    if (response) return response;
    const forbidden = requirePermission(user, PERMISSIONS.INSTALLATIONS_WRITE);
    if (forbidden) return forbidden;

    const body = await req.json();
    const parsed = installationServiceSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { feeType, feePreset, feeCustom, customerId, serviceDate, ...rest } =
      parsed.data;

    // Resolve feeAmount server-side to prevent client tampering
    const feeAmount =
      feeType === "preset" ? feePreset! : String(feeCustom!);

    // Validate customerId if provided
    if (customerId) {
      const [existing] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);
      if (!existing) {
        return Response.json({ error: "Customer not found" }, { status: 404 });
      }
    }

    const [record] = await db
      .insert(installationServices)
      .values({
        serviceDate: new Date(serviceDate),
        customerId: customerId ?? null,
        customerName: rest.customerName.trim(),
        customerAddress: rest.customerAddress.trim(),
        customerPhone: rest.customerPhone?.trim() || null,
        customerEmail: rest.customerEmail?.trim() || null,
        feeType,
        feePreset: feePreset ?? null,
        feeCustom: feeCustom ? String(feeCustom) : null,
        feeAmount,
        status: rest.status ?? "pending",
        notes: rest.notes?.trim() || null,
        createdById: user.id,
      })
      .returning();

    if (!record) {
      return Response.json(
        { error: "Failed to create installation service" },
        { status: 500 }
      );
    }

    return Response.json(
      {
        data: {
          ...record,
          createdByName: null,
          serviceDate: record.serviceDate.toISOString(),
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  });
}
