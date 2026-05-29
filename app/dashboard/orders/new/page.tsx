import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS, type SessionUser } from "@/lib/auth/permissions";
import { OrderProductsPage } from "@/components/orders/order-products-page";

export default async function NewOrderPage() {
  const session = await auth();
  const user = (session?.user ?? null) as SessionUser | null;

  if (!user || !can(user, PERMISSIONS.ORDERS_WRITE)) {
    redirect("/dashboard/orders");
  }

  return <OrderProductsPage user={user} />;
}
