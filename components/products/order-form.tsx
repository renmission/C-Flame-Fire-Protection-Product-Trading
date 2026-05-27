"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
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
import { LogOut, Search, X, ShoppingCart, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type PublicProduct = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  listPrice: number | null;
  category: string | null;
  quantity: number;
};

type OrderItem = {
  product: PublicProduct;
  qty: number;
};

type UserInfo = {
  name?: string | null;
  email?: string | null;
};

const PAYMENT_MODES = ["Cash", "GCash"] as const;
type PaymentMode = (typeof PAYMENT_MODES)[number];

const GCASH_NUMBERS = [
  { number: "09123654789", name: "Jaybee S." },
  { number: "09987456321", name: "Panday B." },
];

const ORDERING_INSTRUCTIONS = [
  "Orders must be placed at least 1 day in advance.",
  "Maximum of 1 active order per customer at a time.",
  "Please prepare a valid ID upon delivery.",
  "Bring previous purchase records if requesting warranty service.",
  "Orders placed after 5:00 PM will be processed the next business day.",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function OrderForm({ user }: { user: UserInfo }) {
  const [customerName, setCustomerName] = useState(user.name ?? "");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [gcashRef, setGcashRef] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchProducts = useCallback(async (q: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/public/products?search=${encodeURIComponent(q)}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.data ?? []);
        setShowDropdown(true);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchProducts(searchQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, fetchProducts]);

  const addProduct = (product: PublicProduct) => {
    setOrderItems((prev) => {
      const exists = prev.find((i) => i.product.id === product.id);
      if (exists) return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { product, qty: 1 }];
    });
    setSearchQuery("");
    setShowDropdown(false);
  };

  const updateQty = (id: string, raw: string) => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 1) return;
    setOrderItems((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty: n } : i)));
  };

  const removeItem = (id: string) => {
    setOrderItems((prev) => prev.filter((i) => i.product.id !== id));
  };

  const total = orderItems.reduce(
    (sum, item) => sum + (item.product.listPrice ?? 0) * item.qty,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (orderItems.length === 0) {
      setSubmitError("Please add at least one product to your order.");
      return;
    }
    if (paymentMode === "GCash" && !gcashRef.trim()) {
      setSubmitError("Please enter your GCash reference number.");
      return;
    }
    setIsSubmitting(true);
    // Simulate submission delay (replace with real API call when order endpoint is ready)
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <h2 className="text-2xl font-semibold">Order Submitted!</h2>
            <p className="text-muted-foreground text-sm">
              Thank you, <strong>{customerName}</strong>. Your order has been received. We will
              contact you at <strong>{contact}</strong> to confirm.
            </p>
            {paymentMode === "GCash" && (
              <div className="w-full rounded-lg border border-border bg-muted/40 p-4 text-left space-y-2">
                <p className="text-sm font-medium">Complete your GCash payment:</p>
                {GCASH_NUMBERS.map((g) => (
                  <div key={g.number} className="text-sm">
                    <span className="font-mono font-semibold">{g.number}</span>
                    <span className="text-muted-foreground"> — {g.name}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  Reference No.: <span className="font-mono font-semibold text-foreground">{gcashRef}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Send your GCash payment screenshot to our contact number to confirm your order.
                </p>
              </div>
            )}
            <Button asChild className="w-full mt-2">
              <Link href="/products">Place Another Order</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="C'FLAME"
              width={160}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Order Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in your details and select the products you need.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
          {/* Order Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Contact Number *</Label>
                <Input
                  id="contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="09XXXXXXXXX"
                  required
                  type="tel"
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="address">Delivery Address *</Label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House no., Street, Barangay, City, Province"
                  required
                  rows={3}
                  className={cn(
                    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "ring-offset-background placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "resize-none"
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentMode">Mode of Payment *</Label>
                <select
                  id="paymentMode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  {PAYMENT_MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {paymentMode === "GCash" && (
                  <>
                    <div className="rounded-md border border-border bg-muted/50 p-3 text-xs space-y-1">
                      <p className="font-medium text-foreground">GCash Numbers:</p>
                      {GCASH_NUMBERS.map((g) => (
                        <p key={g.number} className="text-muted-foreground">
                          <span className="font-mono font-semibold text-foreground">{g.number}</span>
                          {" — "}{g.name}
                        </p>
                      ))}
                    </div>
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="gcashRef">GCash Reference Number *</Label>
                      <Input
                        id="gcashRef"
                        value={gcashRef}
                        onChange={(e) => setGcashRef(e.target.value)}
                        placeholder="e.g. 1234567890"
                        maxLength={30}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Search */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Select Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search product by name or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute z-30 mt-1 w-full rounded-md border border-border bg-background shadow-lg max-h-60 overflow-y-auto">
                    {isSearching && (
                      <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
                    )}
                    {!isSearching && searchResults.length === 0 && (
                      <div className="px-4 py-3 text-sm text-muted-foreground">No products found.</div>
                    )}
                    {!isSearching &&
                      searchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addProduct(product)}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted transition-colors text-left"
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              SKU: {product.sku} · {product.unit}
                              {product.category ? ` · ${product.category}` : ""}
                            </p>
                          </div>
                          <div className="text-right ml-4 shrink-0">
                            <p className="font-semibold text-primary">
                              {product.listPrice != null
                                ? formatCurrency(product.listPrice)
                                : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">{product.quantity} in stock</p>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Selected Products Table */}
              {orderItems.length > 0 ? (
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="w-20 text-center">Unit</TableHead>
                        <TableHead className="w-24 text-center">Qty</TableHead>
                        <TableHead className="w-28 text-right">Unit Price</TableHead>
                        <TableHead className="w-28 text-right">Subtotal</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.product.id}>
                          <TableCell>
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {item.product.unit}
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={(e) => updateQty(item.product.id, e.target.value)}
                              className="w-16 text-center h-8 mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {item.product.listPrice != null
                              ? formatCurrency(item.product.listPrice)
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {item.product.listPrice != null
                              ? formatCurrency(item.product.listPrice * item.qty)
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => removeItem(item.product.id)}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* Total Row */}
                  <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/30 px-4 py-3">
                    <span className="text-sm font-medium text-muted-foreground">Order Total</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  No products added yet. Search above to add items to your order.
                </div>
              )}
            </CardContent>
          </Card>

          {submitError && (
            <div className="rounded-md bg-destructive/15 border border-destructive/50 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || orderItems.length === 0}
              className="px-10"
            >
              {isSubmitting ? "Placing order..." : "Place Order"}
            </Button>
          </div>
          </form>

          {/* Ordering Instructions — sticky right column */}
          <div className="sticky top-20">
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <Info className="h-4 w-4" />
                  Ordering Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <p className="text-sm text-amber-900/80 dark:text-amber-300/80 font-medium">
                  Please follow the guidelines below before confirming your order.
                </p>
                <ul className="space-y-1">
                  {ORDERING_INSTRUCTIONS.map((instruction) => (
                    <li key={instruction} className="text-sm text-amber-800/80 dark:text-amber-400/80 flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {instruction}
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-amber-200 dark:border-amber-900">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">GCash Payment Numbers:</p>
                  {GCASH_NUMBERS.map((g) => (
                    <p key={g.number} className="text-sm text-amber-800/80 dark:text-amber-400/80">
                      <span className="font-mono font-semibold">{g.number}</span>
                      <span className="text-amber-700/60 dark:text-amber-500/60"> — {g.name}</span>
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
