"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useOrderCartStore } from "@/stores/order-cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LogOut, ShoppingCart, Minus, Plus, Trash2, ArrowRight, Package, Loader2 } from "lucide-react";

type PublicProduct = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  listPrice: number | null;
  category: string | null;
  imageUrl: string | null;
  quantity: number;
};

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

type ProductsPage = {
  data: PublicProduct[];
  total: number;
  page: number;
  limit: number;
};

async function fetchPublicProducts(search: string, page: number): Promise<ProductsPage> {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);
  const res = await fetch(`/api/public/products?${params}`);
  if (!res.ok) return { data: [], total: 0, page, limit: 12 };
  return res.json();
}

function ProductCard({ product }: { product: PublicProduct }) {
  const cart = useOrderCartStore();
  const cartItem = cart.items.find((i) => i.productId === product.id);
  const [qty, setQty] = useState(1);
  const price = product.listPrice ?? 0;

  const handleAdd = () => {
    cart.addItem({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: qty,
      unitPrice: price,
    });
    setQty(1);
  };

  return (
    <div className="flex flex-col rounded-lg border bg-card overflow-hidden hover:shadow-sm transition-shadow">
      {product.imageUrl ? (
        <div className="relative w-full h-36 bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
      ) : (
        <div className="w-full h-36 bg-muted flex items-center justify-center">
          <Package className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}
      <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <p className="font-medium text-sm leading-snug" title={product.name}>
          {product.name}
        </p>
        <p className="text-xs text-muted-foreground">{product.sku}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {product.category && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">
              {product.category}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{product.quantity} {product.unit}</span>
        </div>
      </div>

      <div>
        {product.listPrice != null ? (
          <span className="text-base font-semibold text-primary">{formatCurrency(product.listPrice)}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Price on request</span>
        )}
      </div>

      {cartItem ? (
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 flex-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  if (cartItem.quantity === 1) cart.removeItem(product.id);
                  else cart.updateQuantity(product.id, cartItem.quantity - 1);
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium flex-1 text-center">{cartItem.quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => cart.updateQuantity(product.id, cartItem.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              onClick={() => cart.removeItem(product.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center justify-center border rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm flex-1 text-center">{qty}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setQty((q) => q + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={handleAdd}
            disabled={product.listPrice == null}
          >
            Add to Cart
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}

type UserInfo = { name?: string | null; email?: string | null };

export function ShopProductsPage({ user }: { user: UserInfo }) {
  const router = useRouter();
  const cart = useOrderCartStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCart, setShowCart] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["public-products", debouncedSearch],
    queryFn: ({ pageParam }) => fetchPublicProducts(debouncedSearch, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined,
  });

  const products = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [products]);

  useEffect(() => {
    setCategoryFilter("all");
  }, [debouncedSearch]);

  const filtered = useMemo(
    () => (categoryFilter === "all" ? products : products.filter((p) => p.category === categoryFilter)),
    [products, categoryFilter]
  );

  const cartTotal = cart.total();
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/">
            <Image src="/logo.png" alt="C'FLAME" width={160} height={40} className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted-foreground">{user.email}</span>
            <Button
              type="button"
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

      <main className="mx-auto w-full max-w-6xl px-4 py-8 flex-1 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Order Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse products and add them to your cart.
          </p>
        </div>

        <div className="flex gap-6 flex-1">
          {/* Product catalog */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <Input
              placeholder="Search products by name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 max-w-sm"
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

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-lg border bg-muted animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <Package className="h-10 w-10 opacity-40" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filtered.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                <div className="flex flex-col items-center gap-2 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Showing {products.length} of {total} product{total !== 1 ? "s" : ""}
                    {categoryFilter !== "all" && ` · ${filtered.length} in "${categoryFilter}"`}
                  </p>
                  {hasNextPage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="gap-2"
                    >
                      {isFetchingNextPage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Load more
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Cart sidebar — desktop */}
          <div className="hidden lg:flex flex-col w-72 shrink-0 rounded-lg border bg-card self-start sticky top-24">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <ShoppingCart className="h-4 w-4" />
              <span className="font-semibold text-sm">Cart</span>
              {cartCount > 0 && (
                <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                  {cartCount}
                </span>
              )}
            </div>

            <div className="p-3 space-y-2 max-h-[50vh] overflow-y-auto">
              {cart.items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No items yet. Add products from the catalog.
                </p>
              ) : (
                cart.items.map((item) => (
                  <div key={item.productId} className="flex items-start gap-2 p-2 rounded-md bg-muted/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs font-semibold">{formatCurrency(item.subtotal)}</span>
                      <div className="flex items-center gap-0.5">
                        <Button
                          type="button"
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
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          type="button"
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
                  type="button"
                  className="w-full gap-2"
                  onClick={() => router.push("/products/checkout")}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

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
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/products/checkout")}
          >
            Checkout
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Mobile cart sheet */}
      {showCart && cart.items.length > 0 && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowCart(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold">Cart ({cartCount} items)</span>
              <button
                type="button"
                onClick={() => setShowCart(false)}
                className="text-muted-foreground text-sm"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 py-2 border-b last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.productSku}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
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
                        type="button"
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
                type="button"
                onClick={() => {
                  setShowCart(false);
                  router.push("/products/checkout");
                }}
                className="gap-2"
              >
                Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
