"use client";

import * as React from "react";
import { useState, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchCustomers } from "@/lib/customers-api";
import { createOrder, type OrderListItem } from "@/lib/orders-api";
import { useOrderCartStore } from "@/stores/order-cart-store";
import type { SessionUser } from "@/lib/auth/permissions";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, ArrowLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatCurrency(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function OrderCheckoutPage({ user: _user }: { user: SessionUser | null }) {
  const router = useRouter();
  const cart = useOrderCartStore();

  // Redirect to product page if cart is empty (no flash — useLayoutEffect)
  useLayoutEffect(() => {
    if (cart.items.length === 0) {
      router.replace("/dashboard/orders/new");
    }
    // only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Customer autocomplete
  const [customerInput, setCustomerInput] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const debouncedCustomerInput = useDebouncedValue(customerInput, 300);

  // Notes
  const [notes, setNotes] = useState("");

  // Success
  const [successOrder, setSuccessOrder] = useState<OrderListItem | null>(null);

  const { data: customersData } = useQuery({
    queryKey: ["customers-checkout", { search: debouncedCustomerInput, limit: 20 }],
    queryFn: () =>
      fetchCustomers({ search: debouncedCustomerInput.trim() || undefined, limit: 20 }),
    enabled: showCustomerDropdown,
  });
  const customers = customersData?.data ?? [];

  const placeMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      cart.clearCart();
      setSuccessOrder(data.data);
    },
  });

  const handlePlaceOrder = () => {
    if (!customerId) {
      setCustomerError("Please select a customer");
      return;
    }
    setCustomerError("");
    placeMutation.mutate({
      customerId,
      notes: notes.trim() || undefined,
      items: cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    });
  };

  const cartTotal = cart.total();

  // Success state
  if (successOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <CheckCircle2 className="h-14 w-14 text-green-500" />
          <h2 className="text-2xl font-bold">Order Placed!</h2>
          <p className="text-muted-foreground text-sm">
            Your order has been successfully submitted.
          </p>
          <div className="mt-1 px-4 py-2 rounded-md bg-muted font-mono text-lg font-semibold tracking-wide">
            {successOrder.orderNumber}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/dashboard/orders")}>
            View All Orders
          </Button>
          <Button onClick={() => router.push("/dashboard/orders/new")}>New Order</Button>
        </div>
      </div>
    );
  }

  // Empty cart — show nothing while redirect fires
  if (cart.items.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/dashboard/orders" className="hover:underline">
            Orders
          </Link>
          <span>/</span>
          <Link href="/dashboard/orders/new" className="hover:underline">
            New Order
          </Link>
          <span>/</span>
          <span>Customer Details</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/orders/new">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Customer Details</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Customer + Notes form */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Customer autocomplete */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customer-input">Select Customer *</Label>
                <div className="relative">
                  <Input
                    id="customer-input"
                    placeholder="Type to search customers…"
                    value={customerInput}
                    onChange={(e) => {
                      setCustomerInput(e.target.value);
                      if (customerId) {
                        setCustomerId("");
                        setCustomerName("");
                      }
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
                    className={cn(customerError && "border-destructive")}
                    autoComplete="off"
                  />
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  {showCustomerDropdown && customers.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-56 overflow-y-auto">
                      {customers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                          onMouseDown={() => {
                            setCustomerId(c.id);
                            setCustomerName(c.name);
                            setCustomerInput(c.name);
                            setShowCustomerDropdown(false);
                            setCustomerError("");
                          }}
                        >
                          <span className="font-medium">{c.name}</span>
                          {c.phone && (
                            <span className="text-muted-foreground ml-2 text-xs">{c.phone}</span>
                          )}
                          {c.address && (
                            <span className="block text-xs text-muted-foreground truncate">
                              {c.address}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {customerError && (
                  <p className="text-xs text-destructive">{customerError}</p>
                )}
                {customerId && customerName && (
                  <p className="text-xs text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{customerName}</span>
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Add any special instructions or notes…"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{notes.length}/1000</p>
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {placeMutation.isError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {getErrorMessage(placeMutation.error)}
            </div>
          )}

          <Button
            size="lg"
            onClick={handlePlaceOrder}
            disabled={placeMutation.isPending || !customerId}
            className="w-full"
          >
            {placeMutation.isPending ? "Placing Order…" : "Place Order"}
          </Button>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Order Summary ({cart.items.length} item{cart.items.length !== 1 ? "s" : ""})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right pr-4">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="pl-4">
                        <p className="text-sm font-medium leading-tight">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.productSku} · {formatCurrency(item.unitPrice)} each
                        </p>
                      </TableCell>
                      <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm font-medium pr-4">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(cartTotal)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
