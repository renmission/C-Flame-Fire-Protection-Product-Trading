"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, type ProductListItem } from "@/lib/inventory-api";
import { useOrderCartStore } from "@/stores/order-cart-store";
import type { SessionUser } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Package } from "lucide-react";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatCurrency(amount: number) {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ProductCard({ product }: { product: ProductListItem }) {
  const cart = useOrderCartStore();
  const cartItem = cart.items.find((i) => i.productId === product.id);
  const [qty, setQty] = useState(1);
  const unitPrice = parseFloat(product.listPrice ?? "0") || 0;

  const handleAdd = () => {
    cart.addItem({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: qty,
      unitPrice,
    });
    setQty(1);
  };

  return (
    <div className="flex flex-col rounded-lg border bg-card p-4 gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm leading-tight truncate" title={product.name}>
            {product.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{product.sku}</p>
        </div>
        {product.category && (
          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">
            {product.category}
          </span>
        )}
      </div>

      <div className="text-base font-semibold text-primary">
        {product.listPrice ? formatCurrency(unitPrice) : <span className="text-muted-foreground text-sm">No price</span>}
      </div>

      {cartItem ? (
        <div className="flex items-center gap-2 mt-auto">
          <div className="flex items-center gap-1 flex-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                if (cartItem.quantity === 1) cart.removeItem(product.id);
                else cart.updateQuantity(product.id, cartItem.quantity - 1);
              }}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-6 text-center">{cartItem.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => cart.updateQuantity(product.id, cartItem.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => cart.removeItem(product.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-auto">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-r-none"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm w-6 text-center">{qty}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-l-none"
              onClick={() => setQty((q) => q + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={handleAdd}
            disabled={!product.listPrice}
          >
            Add to Cart
          </Button>
        </div>
      )}
    </div>
  );
}

export function OrderProductsPage({ user: _user }: { user: SessionUser | null }) {
  const router = useRouter();
  const cart = useOrderCartStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCart, setShowCart] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", { search: debouncedSearch, limit: 50 }],
    queryFn: () =>
      fetchProducts({ search: debouncedSearch.trim() || undefined, limit: 50 }),
  });

  const allProducts = (productsData?.data ?? []).filter((p) => p.archived === 0);

  const categories = useMemo(() => {
    const cats = new Set(allProducts.map((p) => p.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [allProducts]);

  // Reset category filter when search changes
  useEffect(() => {
    setCategoryFilter("all");
  }, [debouncedSearch]);

  const filteredProducts = useMemo(() => {
    if (categoryFilter === "all") return allProducts;
    return allProducts.filter((p) => p.category === categoryFilter);
  }, [allProducts, categoryFilter]);

  const cartTotal = cart.total();
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/dashboard/orders" className="hover:underline">
              Orders
            </Link>
            <span>/</span>
            <span>New Order</span>
          </div>
          <h1 className="text-2xl font-bold">Select Products</h1>
        </div>
        <Link href="/dashboard/orders">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Product catalog — scrollable */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Search + category filter */}
          <div className="flex flex-col gap-3 mb-4">
            <Input
              placeholder="Search products by name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    categoryFilter === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-secondary border-border"
                  )}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                      categoryFilter === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-secondary border-border"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product grid — scrollable */}
          <div className="overflow-y-auto flex-1 pr-1">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-lg border bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <Package className="h-10 w-10 opacity-40" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart sidebar — desktop only */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 rounded-lg border bg-card">
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <ShoppingCart className="h-4 w-4" />
            <span className="font-semibold text-sm">Cart</span>
            {cartCount > 0 && (
              <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {cartCount}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.items.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No items added yet</p>
            ) : (
              cart.items.map((item) => (
                <div key={item.productId} className="flex items-start gap-2 p-2 rounded-md bg-muted/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.productSku}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-semibold">{formatCurrency(item.subtotal)}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => {
                          if (item.quantity === 1) cart.removeItem(item.productId);
                          else cart.updateQuantity(item.productId, item.quantity - 1);
                        }}
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-destructive hover:text-destructive"
                        onClick={() => cart.removeItem(item.productId)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.items.length > 0 && (
            <div className="border-t p-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-bold">{formatCurrency(cartTotal)}</span>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => router.push("/dashboard/orders/new/checkout")}
              >
                Proceed to Customer Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      {cart.items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-background p-4 flex items-center justify-between gap-4 z-50 shadow-lg">
          <button
            type="button"
            onClick={() => setShowCart((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
            <span className="text-muted-foreground">·</span>
            <span>{formatCurrency(cartTotal)}</span>
          </button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/dashboard/orders/new/checkout")}
          >
            Proceed
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Mobile cart sheet */}
      {showCart && cart.items.length > 0 && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setShowCart(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold">Cart ({cartCount} items)</span>
              <button type="button" onClick={() => setShowCart(false)} className="text-muted-foreground text-sm">
                Close
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex items-start gap-3 py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.productSku}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          if (item.quantity === 1) cart.removeItem(item.productId);
                          else cart.updateQuantity(item.productId, item.quantity - 1);
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm w-5 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-medium w-20 text-right">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-bold">{formatCurrency(cartTotal)}</p>
              </div>
              <Button
                onClick={() => {
                  setShowCart(false);
                  router.push("/dashboard/orders/new/checkout");
                }}
                className="gap-2"
              >
                Proceed
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
