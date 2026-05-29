import { auth } from "@/lib/auth";
import { InstallationServicesDashboard } from "@/components/installation-services/installation-services-dashboard";
import type { SessionUser } from "@/lib/auth/permissions";

export default async function InstallationServicesPage() {
  const session = await auth();
  const user = (session?.user ?? null) as SessionUser | null;
  return <InstallationServicesDashboard user={user} />;
}
