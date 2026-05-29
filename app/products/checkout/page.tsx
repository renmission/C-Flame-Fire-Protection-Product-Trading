import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShopCheckoutPage } from "@/components/products/shop-checkout-page";

export const metadata = {
  title: "Checkout — C'FLAME Fire Protection",
};

export default async function ProductCheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/products");

  return (
    <ShopCheckoutPage
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
    />
  );
}
