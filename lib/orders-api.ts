import { parseApiResponse } from "@/lib/errors";
import type { OrdersListQuery, OrderFormValues, OrderUpdateValues } from "@/schemas/orders";
import type { OrderStatus } from "@/lib/db/schema";

export type OrderListItem = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string | null;
  status: OrderStatus;
  notes: string | null;
  itemCount: number;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderItemDetail = {
  id: string;
  productId: string;
  productName: string | null;
  productSku: string | null;
  quantity: number;
  unitPrice: string;
  subtotal: string;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string | null;
  customerAddress: string | null;
  customerPhone: string | null;
  status: OrderStatus;
  notes: string | null;
  items: OrderItemDetail[];
  createdAt: string;
  updatedAt: string;
};

export type OrdersListResponse = {
  data: OrderListItem[];
  total: number;
  page: number;
  limit: number;
};

function buildQueryString(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) search.set(k, String(v));
  });
  const q = search.toString();
  return q ? `?${q}` : "";
}

export async function fetchOrders(
  query: Partial<OrdersListQuery> = {}
): Promise<OrdersListResponse> {
  const qs = buildQueryString(query as Record<string, string | number | boolean | undefined>);
  const res = await fetch(`/api/orders${qs}`);
  return parseApiResponse<OrdersListResponse>(res, "Failed to load orders");
}

export async function fetchOrder(id: string): Promise<{ data: OrderDetail }> {
  const res = await fetch(`/api/orders/${id}`);
  return parseApiResponse<{ data: OrderDetail }>(res, "Failed to load order");
}

export async function createOrder(body: OrderFormValues): Promise<{ data: OrderListItem }> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseApiResponse<{ data: OrderListItem }>(res, "Failed to create order");
}

export async function updateOrder(
  id: string,
  body: OrderUpdateValues
): Promise<{ data: OrderListItem }> {
  const res = await fetch(`/api/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseApiResponse<{ data: OrderListItem }>(res, "Failed to update order");
}

export async function deleteOrder(id: string): Promise<{ data: { id: string } }> {
  const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
  return parseApiResponse<{ data: { id: string } }>(res, "Failed to delete order");
}
