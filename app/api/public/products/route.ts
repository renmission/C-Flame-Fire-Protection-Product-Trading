import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { products, stockLevels } from "@/lib/db/schema";
import { getSessionOr401 } from "@/lib/api-auth";
import { and, asc, eq, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { user, response } = await getSessionOr401();
  if (response) return response;
  void user;

  const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 20), 50);

  const conditions = [eq(products.archived, 0)];
  if (search) {
    conditions.push(or(ilike(products.name, `%${search}%`), ilike(products.sku, `%${search}%`))!);
  }

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      unit: products.unit,
      listPrice: products.listPrice,
      category: products.category,
      quantity: stockLevels.quantity,
    })
    .from(products)
    .leftJoin(stockLevels, eq(products.id, stockLevels.productId))
    .where(and(...conditions))
    .orderBy(asc(products.name))
    .limit(limit);

  return Response.json({
    data: rows.map((r) => ({
      ...r,
      quantity: r.quantity ?? 0,
      listPrice: r.listPrice ? Number(r.listPrice) : null,
    })),
  });
}
