import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrderForm } from "@/components/products/order-form";

export const metadata = {
  title: "Order Products — C'FLAME Fire Protection",
};

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/products");

  return (
    <OrderForm
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
    />
  );
}
