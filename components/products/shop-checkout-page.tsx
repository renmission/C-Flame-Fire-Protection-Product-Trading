"use client";

import * as React from "react";
import { useState, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useOrderCartStore } from "@/stores/order-cart-store";
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
import { LogOut, CheckCircle, ArrowLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const PAYMENT_MODES = ["Cash", "GCash"] as const;
type PaymentMode = (typeof PAYMENT_MODES)[number];

const BATANGAS_LOCATIONS = [
  "Agoncillo", "Alitagtag", "Balayan", "Bauan", "Batangas City",
  "Calaca", "Calatagan", "Cuenca", "Ibaan", "Laurel", "Lemery",
  "Lian", "Lipa City", "Lobo", "Mabini", "Malvar", "Mataas na Kahoy",
  "Nasugbu", "Padre Garcia", "Rosario", "San Jose", "San Juan",
  "San Luis", "San Nicolas", "San Pascual", "Santa Teresita",
  "Santo Tomas", "Taal", "Tanauan City", "Taysan", "Tingloy", "Tuy",
] as const;

const BATANGAS_BARANGAYS: Record<string, string[]> = {
  "Malvar": [
    "Alalum", "Ampid", "Ayusan", "Banaba", "Banga", "Bano", "Bulakin",
    "Bulilan Norte", "Bulilan Sur", "Camandag", "Dulangan", "Luta Norte",
    "Luta Sur", "Poblacion", "San Andres", "San Fernando", "San Gregorio",
    "San Pablo", "Talisay", "Tambo",
  ],
  "Lipa City": [
    "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5",
    "Barangay 6", "Barangay 7", "Barangay 8", "Barangay 9",
    "Adya", "Anilao-Labac", "Antipolo del Norte", "Antipolo del Sur",
    "Bagong Pook", "Balintawak", "Banay-Banay", "Bolbok", "Bugtong na Pulo",
    "Bulacnin", "Calamias", "Cumba", "Dagatan", "Duhatan", "Halang",
    "Inosluban", "Kayumanggi", "Latag", "Lodlod", "Lumbang", "Mabini",
    "Malapit", "Malitlit", "Marawoy", "Mataas na Lupa", "Munting Pulo",
    "Pagolingin Bata", "Pagolingin Matanda", "Pangao", "Pinagkawitan",
    "Pinagtongulan", "Plaridel", "Quezon", "Rizal", "Sabang", "Sampaguita",
    "San Benito", "San Carlos", "San Celestino", "San Francisco",
    "San Guillermo", "San Jose", "San Lucas", "San Salvador", "San Sebastian",
    "Santa Cruz", "Santiago", "Santol", "Sico", "Talisay", "Tambo",
    "Tangob", "Tanguay", "Tibig", "Tipacan",
  ],
  "Tanauan City": [
    "Bagbag", "Bagumbayan", "Balele", "Banjo East", "Banjo West",
    "Bilog-Bilog", "Boot", "Buga-Mangga", "Bulakin", "Bulihan", "Bulsa",
    "Caloocan Norte", "Caloocan Sur", "Darasa", "Gonzales", "Hidalgo",
    "Janopol", "Janopol Oriental", "Laurel", "Leynes", "Luta", "Maria Paz",
    "Muzon", "Natatas", "Pagaspas", "Pantay Bata", "Pantay Matanda", "Pila",
    "Pinagtatapan",
    "Poblacion Barangay 1", "Poblacion Barangay 2", "Poblacion Barangay 3",
    "Poblacion Barangay 4", "Poblacion Barangay 5", "Poblacion Barangay 6",
    "Poblacion Barangay 7", "Poblacion Barangay 8", "Poblacion Barangay 9",
    "Poblacion Barangay 10", "Poblacion Barangay 11", "Poblacion Barangay 12",
    "Pook", "Sala", "San Jose", "Sandaligan", "Santa Cruz", "Santiago",
    "Santol", "Sapac", "Sico", "Sulong", "Talaga", "Tinurik", "Trapiche",
    "Ulango",
  ],
  "Santo Tomas": [
    "Biga", "Bilog-Bilog", "Cunta", "Dahilig", "Dao", "Guinobatan",
    "Kaparangan", "Mabato", "Mahayahay", "Makiling", "Malawaan", "Paliparan",
    "Poblacion", "San Antonio", "San Bartolome", "San Francisco",
    "San Isidro Norte", "San Isidro Sur", "San Jose", "San Juan", "San Pablo",
    "San Pedro", "San Vicente", "Santa Clara", "Santa Cruz", "Santo Niño",
  ],
  "Laurel": [
    "Alas-asin", "Bugaan East", "Bugaan West", "Gulod", "Niyugan",
    "Poblacion", "Quisumbing", "San Gabriel", "Santa Maria",
  ],
  "Batangas City": [
    "Alangilan", "Balagtas", "Balete", "Banaba Center", "Banaba Ibaba",
    "Banaba Kanluran", "Banaba Silangan", "Bolbok", "Bucal", "Calicanto",
    "Conde Itaas", "Conde Labak", "Cuta", "Dalig", "Dela Paz Proper",
    "Dela Paz Pulot Centro", "Dela Paz Pulot Itaas", "Dela Paz Pulot Aplaya",
    "Domoclay", "Dumuclay", "Gulod Itaas", "Gulod Labak", "Ilustre",
    "Kumintang Ibaba", "Kumintang Ilaya", "Libjo", "Liponpon", "Maapaz",
    "Mabacong", "Malibayo", "Malitam", "Maruclap", "Nangka",
    "Pallocan Kanluran", "Pallocan Silangan", "Pinamucan Ibaba",
    "Pinamucan Proper", "Pinamucan Silangan",
    "Poblacion Barangay 1", "Poblacion Barangay 2", "Poblacion Barangay 3",
    "Poblacion Barangay 4", "Poblacion Barangay 5", "Poblacion Barangay 6",
    "Poblacion Barangay 7", "Poblacion Barangay 8", "Poblacion Barangay 9",
    "Poblacion Barangay 10",
    "San Agapito", "San Agustin Kanluran", "San Agustin Silangan",
    "San Andres", "San Isidro", "San Jose Sico", "San Miguel", "San Pedro",
    "Santa Clara", "Santa Rita Aplaya", "Santa Rita Karsada", "Santo Domingo",
    "Santo Niño", "Simlong", "Sirang Lupa", "Sorosoro Ibaba", "Sorosoro Ilaya",
    "Sorosoro Karsada", "Tabangao Aplaya", "Tabangao Ambulong", "Tabangao Dao",
    "Talahib Pandayan", "Talahib Payapa", "Talumpok Kanluran",
    "Talumpok Silangan", "Tinga Itaas", "Tinga Labak", "Tulo", "Wawa",
  ],
};

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

type UserInfo = { name?: string | null; email?: string | null };

type SuccessData = { orderNumber: string; paymentMode: PaymentMode; gcashRef: string; customerName: string; contact: string };

export function ShopCheckoutPage({ user }: { user: UserInfo }) {
  const router = useRouter();
  const cart = useOrderCartStore();

  useLayoutEffect(() => {
    if (cart.items.length === 0) {
      router.replace("/products");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [customerName, setCustomerName] = useState(user.name ?? "");
  const [contact, setContact] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [gcashRef, setGcashRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  React.useEffect(() => {
    setBarangay("");
  }, [municipality]);

  const cartTotal = cart.total();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (paymentMode === "GCash" && !gcashRef.trim()) {
      setSubmitError("Please enter your GCash reference number.");
      return;
    }

    const address = barangay
      ? `${addressDetails.trim()}, Brgy. ${barangay}, ${municipality}`
      : `${addressDetails.trim()}, ${municipality}`;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          contact: contact.trim(),
          address,
          paymentMode,
          gcashRef: gcashRef.trim() || undefined,
          items: cart.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(json.error ?? "Failed to place order. Please try again.");
        return;
      }

      cart.clearCart();
      setSuccess({
        orderNumber: json.data?.orderNumber ?? "",
        paymentMode,
        gcashRef: gcashRef.trim(),
        customerName: customerName.trim(),
        contact: contact.trim(),
      });
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const header = (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
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
  );

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {header}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center shadow-lg">
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <CheckCircle className="h-14 w-14 text-green-500" />
              <h2 className="text-2xl font-semibold">Order Submitted!</h2>
              <p className="text-muted-foreground text-sm">
                Thank you, <strong>{success.customerName}</strong>. Your order has been received.
                We will contact you at <strong>{success.contact}</strong> to confirm.
              </p>
              {success.orderNumber && (
                <div className="px-4 py-2 rounded-md bg-muted font-mono text-sm font-semibold">
                  {success.orderNumber}
                </div>
              )}
              {success.paymentMode === "GCash" && (
                <div className="w-full rounded-lg border bg-muted/40 p-4 text-left space-y-2">
                  <p className="text-sm font-medium">Complete your GCash payment:</p>
                  {GCASH_NUMBERS.map((g) => (
                    <div key={g.number} className="text-sm">
                      <span className="font-mono font-semibold">{g.number}</span>
                      <span className="text-muted-foreground"> — {g.name}</span>
                    </div>
                  ))}
                  {success.gcashRef && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Reference No.:{" "}
                      <span className="font-mono font-semibold text-foreground">{success.gcashRef}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Send your GCash payment screenshot to our contact number to confirm.
                  </p>
                </div>
              )}
              <Button asChild className="w-full mt-2">
                <Link href="/products">Place Another Order</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) return null;

  const barangays = BATANGAS_BARANGAYS[municipality];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {header}

      <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
        {/* Breadcrumb + back */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/products" className="hover:underline">
              Products
            </Link>
            <span>/</span>
            <span>Checkout</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/products">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold">Checkout</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
          {/* Customer details form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Your Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="customerName">Full Name *</Label>
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
                  <Label htmlFor="municipality">Municipality / City *</Label>
                  <select
                    id="municipality"
                    title="Municipality / City"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    required
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                      "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
                      "focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                  >
                    <option value="">Select municipality / city…</option>
                    {BATANGAS_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {barangays && (
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="barangay">Barangay *</Label>
                    <select
                      id="barangay"
                      title="Barangay"
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      required
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                        "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-ring focus-visible:ring-offset-2"
                      )}
                    >
                      <option value="">Select barangay…</option>
                      {barangays.map((brgy) => (
                        <option key={brgy} value={brgy}>{brgy}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="addressDetails">House No. / Street *</Label>
                  <Input
                    id="addressDetails"
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="e.g. 123 Rizal St."
                    required
                  />
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="paymentMode">Mode of Payment *</Label>
                  <select
                    id="paymentMode"
                    title="Mode of Payment"
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
                    <div className="space-y-3 mt-1">
                      <div className="rounded-md border bg-muted/50 p-3 text-xs space-y-1">
                        <p className="font-medium text-foreground">GCash Numbers:</p>
                        {GCASH_NUMBERS.map((g) => (
                          <p key={g.number} className="text-muted-foreground">
                            <span className="font-mono font-semibold text-foreground">{g.number}</span>
                            {" — "}
                            {g.name}
                          </p>
                        ))}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="gcashRef">GCash Reference Number *</Label>
                        <Input
                          id="gcashRef"
                          value={gcashRef}
                          onChange={(e) => setGcashRef(e.target.value)}
                          placeholder="e.g. 1234567890"
                          maxLength={30}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {submitError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || cart.items.length === 0}
              className="w-full"
            >
              {isSubmitting ? "Placing Order…" : "Place Order"}
            </Button>
          </form>

          {/* Right column: order summary + instructions */}
          <div className="space-y-4">
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

            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <Info className="h-4 w-4" />
                  Ordering Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {ORDERING_INSTRUCTIONS.map((instruction) => (
                    <li
                      key={instruction}
                      className="text-xs text-amber-800/80 dark:text-amber-400/80 flex gap-2"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {instruction}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
