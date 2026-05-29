import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS, type SessionUser } from "@/lib/auth/permissions";
import { OrderCheckoutPage } from "@/components/orders/order-checkout-page";

export default async function OrderCheckoutRoute() {
  const session = await auth();
  const user = (session?.user ?? null) as SessionUser | null;

  if (!user || !can(user, PERMISSIONS.ORDERS_WRITE)) {
    redirect("/dashboard/orders");
  }

  return <OrderCheckoutPage user={user} />;
}
