import { auth } from "@/lib/auth";
import { DeliveryDashboard } from "@/components/delivery/delivery-dashboard";
import type { SessionUser } from "@/lib/auth/permissions";

export default async function DeliveriesPage() {
  const session = await auth();
  const user = (session?.user ?? null) as SessionUser | null;

  return (
    <div>
      <DeliveryDashboard user={user} />
    </div>
  );
}
