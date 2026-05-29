import { parseApiResponse } from "@/lib/errors";
import type {
  InstallationServicesListQuery,
  InstallationServiceFormValues,
  InstallationServiceUpdateValues,
} from "@/schemas/installation-services";
import type { InstallationServiceStatus } from "@/lib/db/schema";

export type InstallationServiceListItem = {
  id: string;
  serviceDate: string;
  customerId: string | null;
  customerName: string;
  customerAddress: string;
  customerPhone: string | null;
  customerEmail: string | null;
  feeType: string;
  feePreset: string | null;
  feeCustom: string | null;
  feeAmount: string;
  status: InstallationServiceStatus;
  notes: string | null;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InstallationServicesListResponse = {
  data: InstallationServiceListItem[];
  total: number;
  page: number;
  limit: number;
};

function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  });
  const q = search.toString();
  return q ? `?${q}` : "";
}

export async function fetchInstallationServices(
  query: Partial<InstallationServicesListQuery> = {}
): Promise<InstallationServicesListResponse> {
  const qs = buildQueryString(
    query as Record<string, string | number | boolean | undefined | null>
  );
  const res = await fetch(`/api/installation-services${qs}`);
  return parseApiResponse<InstallationServicesListResponse>(
    res,
    "Failed to load installation services"
  );
}

export async function fetchInstallationService(
  id: string
): Promise<{ data: InstallationServiceListItem }> {
  const res = await fetch(`/api/installation-services/${id}`);
  return parseApiResponse<{ data: InstallationServiceListItem }>(
    res,
    "Failed to load installation service"
  );
}

export async function createInstallationService(
  body: InstallationServiceFormValues
): Promise<{ data: InstallationServiceListItem }> {
  const res = await fetch("/api/installation-services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseApiResponse<{ data: InstallationServiceListItem }>(
    res,
    "Failed to create installation service"
  );
}

export async function updateInstallationService(
  id: string,
  body: InstallationServiceUpdateValues
): Promise<{ data: InstallationServiceListItem }> {
  const res = await fetch(`/api/installation-services/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseApiResponse<{ data: InstallationServiceListItem }>(
    res,
    "Failed to update installation service"
  );
}

export async function deleteInstallationService(
  id: string
): Promise<{ data: { id: string } }> {
  const res = await fetch(`/api/installation-services/${id}`, {
    method: "DELETE",
  });
  return parseApiResponse<{ data: { id: string } }>(
    res,
    "Failed to delete installation service"
  );
}
