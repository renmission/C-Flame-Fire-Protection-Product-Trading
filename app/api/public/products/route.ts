import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { products, stockLevels } from "@/lib/db/schema";
import { getSessionOr401 } from "@/lib/api-auth";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { user, response } = await getSessionOr401();
  if (response) return response;
  void user;

  const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 12), 50);
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1));
  const offset = (page - 1) * limit;

  const conditions = [eq(products.archived, 0)];
  if (search) {
    conditions.push(or(ilike(products.name, `%${search}%`), ilike(products.sku, `%${search}%`))!);
  }

  const where = and(...conditions);

  const [countResult, rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(products)
      .leftJoin(stockLevels, eq(products.id, stockLevels.productId))
      .where(where),
    db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        unit: products.unit,
        listPrice: products.listPrice,
        category: products.category,
        imageUrl: products.imageUrl,
        quantity: stockLevels.quantity,
      })
      .from(products)
      .leftJoin(stockLevels, eq(products.id, stockLevels.productId))
      .where(where)
      .orderBy(asc(products.name))
      .limit(limit)
      .offset(offset),
  ]);

  return Response.json({
    data: rows.map((r) => ({
      ...r,
      quantity: r.quantity ?? 0,
      listPrice: r.listPrice ? Number(r.listPrice) : null,
    })),
    total: countResult[0].total,
    page,
    limit,
  });
}
