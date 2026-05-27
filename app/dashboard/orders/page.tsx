import { auth } from "@/lib/auth";
import { OrdersDashboard } from "@/components/orders/orders-dashboard";
import type { SessionUser } from "@/lib/auth/permissions";

export default async function OrdersPage() {
  const session = await auth();
  const user = (session?.user ?? null) as SessionUser | null;

  return (
    <div>
      <OrdersDashboard user={user} />
    </div>
  );
}
