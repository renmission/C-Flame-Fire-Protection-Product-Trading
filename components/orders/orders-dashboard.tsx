"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrders,
  fetchOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  type OrderListItem,
  type OrderDetail,
} from "@/lib/orders-api";
import { fetchCustomers } from "@/lib/customers-api";
import { fetchProducts } from "@/lib/inventory-api";
import type { OrderFormValues, OrderUpdateValues } from "@/schemas/orders";
import type { OrderStatus } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";
import { can, PERMISSIONS, type SessionUser } from "@/lib/auth/permissions";
import { orderStatuses } from "@/lib/db/schema";

const ORDERS_QUERY_KEY = ["orders"];
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  ready: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatCurrency(amount: string | number) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type DialogState =
  | null
  | "create"
  | { type: "view"; order: OrderListItem }
  | { type: "status"; order: OrderListItem };

export function OrdersDashboard({ user }: { user: SessionUser | null }) {
  const canWrite = user ? can(user, PERMISSIONS.ORDERS_WRITE) : false;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [dialog, setDialog] = useState<DialogState>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: [
      ...ORDERS_QUERY_KEY,
      { search: debouncedSearch, page, limit, status: statusFilter || undefined },
    ],
    queryFn: () =>
      fetchOrders({
        search: debouncedSearch.trim() || undefined,
        page,
        limit,
        status: statusFilter || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  const ordersList = ordersData?.data ?? [];
  const total = ordersData?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      setDialog(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: OrderUpdateValues }) => updateOrder(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      setDialog(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Track and manage customer orders</p>
        </div>
        {canWrite && <Button onClick={() => setDialog("create")}>New Order</Button>}
      </div>

      <Card>
        <CardHeader className="pb-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <Input
              placeholder="Search by order number…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full min-h-11 touch-manipulation sm:max-w-xs sm:min-h-0"
              aria-label="Search orders"
            />
            <select
              className="input-select h-9 min-w-[10rem]"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as OrderStatus | "");
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {orderStatuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="p-4 sm:p-0">
              <p className="text-muted-foreground">Loading…</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Date</TableHead>
                      {canWrite && <TableHead className="w-0 px-2 text-center">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersList.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={canWrite ? 7 : 6}
                          className="text-center text-muted-foreground py-8"
                        >
                          No orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ordersList.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono font-medium text-sm">
                            <button
                              className="hover:underline text-left"
                              onClick={() => setDialog({ type: "view", order })}
                            >
                              {order.orderNumber}
                            </button>
                          </TableCell>
                          <TableCell>{order.customerName ?? "—"}</TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {order.itemCount}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatCurrency(order.totalAmount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(order.createdAt)}
                          </TableCell>
                          {canWrite && (
                            <TableCell className="w-0 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => setDialog({ type: "status", order })}
                                >
                                  Update
                                </Button>
                                {(order.status === "pending" || order.status === "cancelled") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-destructive hover:text-destructive"
                                    onClick={() => {
                                      if (confirm(`Delete order ${order.orderNumber}?`)) {
                                        deleteMutation.mutate(order.id);
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col gap-4 items-center justify-between p-4 sm:flex-row sm:p-6 sm:pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <select
                      className="input-select h-9 min-w-[5rem]"
                      aria-label="Rows per page"
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n} per page
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-9"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-9"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {dialog === "create" && (
        <CreateOrderDialog
          onClose={() => setDialog(null)}
          onSubmit={(body) => createMutation.mutate(body)}
          isSubmitting={createMutation.isPending}
          error={createMutation.error ? getErrorMessage(createMutation.error) : null}
        />
      )}

      {dialog !== null && typeof dialog === "object" && dialog.type === "view" && (
        <OrderDetailDialog order={dialog.order} onClose={() => setDialog(null)} />
      )}

      {dialog !== null && typeof dialog === "object" && dialog.type === "status" && (
        <UpdateStatusDialog
          order={dialog.order}
          onClose={() => setDialog(null)}
          onSubmit={(body) => updateStatusMutation.mutate({ id: dialog.order.id, body })}
          isSubmitting={updateStatusMutation.isPending}
          error={updateStatusMutation.error ? getErrorMessage(updateStatusMutation.error) : null}
        />
      )}
    </div>
  );
}

// ---- Create Order Dialog ----

type OrderItemDraft = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

function CreateOrderDialog({
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  onClose: () => void;
  onSubmit: (body: OrderFormValues) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItemDraft[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productDropdown, setProductDropdown] = useState(false);

  const { data: customersData } = useQuery({
    queryKey: ["customers", { limit: 200 }],
    queryFn: () => fetchCustomers({ limit: 200 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products", { limit: 200, archived: 0 }],
    queryFn: () => fetchProducts({ limit: 200 }),
  });

  const customers = customersData?.data ?? [];
  const products = (productsData?.data ?? []).filter(
    (p) =>
      p.archived === 0 &&
      (productSearch.trim() === "" ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const addProduct = (product: { id: string; name: string; listPrice: string | null }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.listPrice ? parseFloat(product.listPrice) : 0,
        },
      ];
    });
    setProductSearch("");
    setProductDropdown(false);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateItem = (productId: string, field: "quantity" | "unitPrice", value: number) => {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, [field]: value } : i)));
  };

  const grandTotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      customerId,
      notes: notes.trim() || undefined,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-6">
      <div className="w-full h-[95vh] sm:h-auto sm:max-w-2xl sm:max-h-[90vh] flex flex-col bg-background shadow-xl rounded-t-2xl sm:rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b shrink-0">
          <h2 className="text-lg font-semibold">New Order</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="text-xl font-semibold leading-none">×</span>
          </Button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <form id="create-order-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="customer">Customer *</Label>
              <select
                id="customer"
                title="Customer"
                className="input-select mt-1 w-full"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Products *</Label>
              <div className="relative mt-1">
                <Input
                  placeholder="Search product by name or SKU…"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductDropdown(true);
                  }}
                  onFocus={() => setProductDropdown(true)}
                  onBlur={() => setTimeout(() => setProductDropdown(false), 150)}
                  autoComplete="off"
                />
                {productDropdown && productSearch.trim() !== "" && products.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {products.slice(0, 20).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
                        onMouseDown={() => addProduct(p)}
                      >
                        <span>
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{p.sku}</span>
                        </span>
                        {p.listPrice && (
                          <span className="text-muted-foreground text-xs">
                            {formatCurrency(p.listPrice)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="mt-3 rounded-md border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Product</th>
                        <th className="text-right px-3 py-2 font-medium w-20">Qty</th>
                        <th className="text-right px-3 py-2 font-medium w-28">Unit Price</th>
                        <th className="text-right px-3 py-2 font-medium w-24">Subtotal</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.productId} className="border-t border-border">
                          <td className="px-3 py-2">{item.productName}</td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  item.productId,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="h-7 text-right w-full"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(
                                  item.productId,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-7 text-right w-full"
                            />
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                          <td className="px-1 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="text-muted-foreground hover:text-destructive text-lg leading-none"
                              aria-label="Remove item"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-border bg-muted/30">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right font-medium">
                          Total
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">
                          {formatCurrency(grandTotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="input-select mt-1 w-full min-h-[72px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes…"
              />
            </div>
          </form>
        </div>

        <div className="shrink-0 border-t p-4 sm:p-6 flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-order-form"
            disabled={isSubmitting || items.length === 0}
            className="flex-1"
          >
            {isSubmitting ? "Creating…" : "Create Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Order Detail Dialog ----

function OrderDetailDialog({ order, onClose }: { order: OrderListItem; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["orders", order.id],
    queryFn: () => fetchOrder(order.id),
  });

  const detail: OrderDetail | undefined = data?.data;

  const grandTotal = detail?.items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0) ?? 0;

  const handlePrintReceipt = () => {
    if (!detail) return;
    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow popups for this site to print receipts.");
      return;
    }
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt</title></head><body style="font-family:system-ui;padding:2rem;text-align:center;color:#666;">Loading…</body></html>'
    );
    w.document.close();

    const logoUrl = `${window.location.origin}/logo.png`;
    const date = new Date(detail.createdAt).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const itemsHtml = detail.items
      .map((item) => {
        const unitPrice = parseFloat(String(item.unitPrice));
        const subtotal = parseFloat(String(item.subtotal));
        return `<div class="item-row"><div class="item-main"><div class="item-name">${escapeHtml(item.productName ?? "—")}</div><div class="item-meta">Qty ${item.quantity} × ₱${unitPrice.toFixed(2)}</div></div><div class="item-amount">₱${subtotal.toFixed(2)}</div></div>`;
      })
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt - ${escapeHtml(detail.orderNumber)}</title>
<style>
  *{box-sizing:border-box;}
  body{font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;max-width:320px;margin:0 auto;padding:12px;font-size:12px;color:#111;background:#fff;}
  .receipt-header{text-align:center;margin-bottom:8px;}
  .logo{width:64px;height:64px;object-fit:contain;margin-bottom:6px;}
  .company-name{font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;line-height:1.3;}
  .company-address{font-size:10px;color:#555;margin-top:3px;line-height:1.5;}
  .receipt-meta{font-size:11px;color:#555;margin-top:3px;}
  .section-title{margin:8px 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#555;}
  .divider{border-top:1px dashed #ccc;margin:6px 0;}
  .line-items{padding:4px 0;}
  .item-row{display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;}
  .item-main{flex:1;min-width:0;}
  .item-name{font-weight:500;word-break:break-word;}
  .item-meta{font-size:11px;color:#666;margin-top:1px;}
  .item-amount{white-space:nowrap;text-align:right;}
  .totals{margin-top:4px;}
  .totals-row{display:flex;justify-content:space-between;margin-top:2px;}
  .totals-row.total{font-weight:700;border-top:1px solid #000;padding-top:4px;margin-top:4px;font-size:13px;}
  .footer{margin-top:16px;text-align:center;font-size:11px;color:#555;line-height:1.5;}
</style></head><body>
<div class="receipt-header">
  <img src="${logoUrl}" class="logo" alt="" onerror="this.style.display='none'" />
  <div class="company-name">C'Flame Fire Protection<br>Product Trading</div>
  <div class="company-address">MPJR BLDG General Malvar Ave, Poblacion 4<br>Santo Tomas, Philippines 4234</div>
</div>
<div class="divider"></div>
<div style="text-align:center;">
  <div class="receipt-meta">Order Receipt</div>
  <div class="receipt-meta"><strong>${escapeHtml(detail.orderNumber)}</strong></div>
  <div class="receipt-meta">${escapeHtml(date)}</div>
</div>
${detail.customerName ? `<div class="divider"></div><div class="section-title">Customer</div><div style="font-size:11px;"><strong>${escapeHtml(detail.customerName)}</strong>${detail.customerAddress ? `<div style="color:#555;margin-top:2px;">${escapeHtml(detail.customerAddress)}</div>` : ""}${detail.customerPhone ? `<div style="color:#555;">${escapeHtml(detail.customerPhone)}</div>` : ""}</div>` : ""}
<div class="divider"></div>
<div class="section-title">Items</div>
<div class="line-items">${itemsHtml}</div>
<div class="divider"></div>
<div class="totals">
  <div class="totals-row total"><span>Total</span><span>₱${grandTotal.toFixed(2)}</span></div>
</div>
${detail.notes ? `<div class="divider"></div><div class="section-title">Notes</div><div style="font-size:11px;">${escapeHtml(detail.notes)}</div>` : ""}
<div class="footer">Thank you for your business.</div>
</body></html>`;

    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.onafterprint = () => w.close();
      setTimeout(() => {
        try {
          if (!w.closed) w.close();
        } catch {
          // ignore
        }
      }, 1000);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-6">
      <div className="w-full h-[95vh] sm:h-auto sm:max-w-2xl sm:max-h-[90vh] flex flex-col bg-background shadow-xl rounded-t-2xl sm:rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold font-mono">{order.orderNumber}</h2>
            <StatusBadge status={order.status} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="text-xl font-semibold leading-none">×</span>
          </Button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : detail ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{detail.customerName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(detail.createdAt)}</p>
                </div>
                {detail.customerAddress && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{detail.customerAddress}</p>
                  </div>
                )}
                {detail.customerPhone && (
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{detail.customerPhone}</p>
                  </div>
                )}
                {detail.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="font-medium">{detail.notes}</p>
                  </div>
                )}
              </div>

              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Product</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">SKU</th>
                      <th className="text-right px-3 py-2 font-medium">Qty</th>
                      <th className="text-right px-3 py-2 font-medium">Unit Price</th>
                      <th className="text-right px-3 py-2 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{item.productName ?? "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">
                          {item.productSku ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-border bg-muted/30">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right font-medium">
                        Total
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {formatCurrency(grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Order not found.</p>
          )}
        </div>

        <div className="shrink-0 border-t p-4 sm:p-6 flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrintReceipt}
            disabled={!detail}
            className="flex-1 gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Update Status Dialog ----

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

function UpdateStatusDialog({
  order,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  order: OrderListItem;
  onClose: () => void;
  onSubmit: (body: OrderUpdateValues) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const allowedStatuses = STATUS_TRANSITIONS[order.status];
  const [status, setStatus] = useState<OrderStatus>(allowedStatuses[0] ?? order.status);
  const [notes, setNotes] = useState(order.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ status, notes: notes.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-6">
      <div className="w-full sm:max-w-sm bg-background shadow-xl rounded-t-2xl sm:rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg font-semibold">Update Order</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="text-xl font-semibold leading-none">×</span>
          </Button>
        </div>

        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <p className="text-sm text-muted-foreground mb-4">
            Current status: <StatusBadge status={order.status} />
          </p>

          {allowedStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">This order cannot be updated further.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="status">New Status</Label>
                <select
                  id="status"
                  className="input-select mt-1 w-full"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  title="Select new order status"
                >
                  {allowedStatuses.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="update-notes">Notes</Label>
                <textarea
                  id="update-notes"
                  className="input-select mt-1 w-full min-h-[64px] resize-y"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes…"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
