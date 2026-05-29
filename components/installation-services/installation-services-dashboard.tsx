"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { can, PERMISSIONS, type SessionUser } from "@/lib/auth/permissions";
import {
  fetchInstallationServices,
  createInstallationService,
  updateInstallationService,
  deleteInstallationService,
  type InstallationServiceListItem,
} from "@/lib/installation-services-api";
import type { InstallationServiceFormValues } from "@/schemas/installation-services";
import { installationServiceStatuses } from "@/lib/db/schema";
import { InstallationServiceForm } from "./installation-service-form";
import { InstallationServiceDetail } from "./installation-service-detail";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";

const INSTALLATIONS_QUERY_KEY = ["installation-services"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatFee(feeAmount: string): string {
  const n = parseFloat(feeAmount);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface InstallationServicesDashboardProps {
  user: SessionUser | null;
}

type DialogState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; service: InstallationServiceListItem }
  | { type: "view"; service: InstallationServiceListItem }
  | { type: "delete"; service: InstallationServiceListItem };

export function InstallationServicesDashboard({
  user,
}: InstallationServicesDashboardProps) {
  const canRead = can(user, PERMISSIONS.INSTALLATIONS_READ);
  const canWrite = can(user, PERMISSIONS.INSTALLATIONS_WRITE);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [mutationError, setMutationError] = useState<string | null>(null);

  const limit = 20;

  const queryClient = useQueryClient();

  const queryParams = {
    page,
    limit,
    search: search.trim() || undefined,
    status:
      statusFilter !== "all"
        ? (statusFilter as (typeof installationServiceStatuses)[number])
        : undefined,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: [...INSTALLATIONS_QUERY_KEY, queryParams],
    queryFn: () => fetchInstallationServices(queryParams),
    enabled: canRead,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: INSTALLATIONS_QUERY_KEY });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: createInstallationService,
    onSuccess: () => {
      invalidate();
      setDialog({ type: "none" });
      setMutationError(null);
    },
    onError: (err) => setMutationError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: InstallationServiceFormValues;
    }) => updateInstallationService(id, body),
    onSuccess: () => {
      invalidate();
      setDialog({ type: "none" });
      setMutationError(null);
    },
    onError: (err) => setMutationError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInstallationService,
    onSuccess: () => {
      invalidate();
      setDialog({ type: "none" });
    },
    onError: (err) => setMutationError(getErrorMessage(err)),
  });

  const handleFormSubmit = (values: InstallationServiceFormValues) => {
    setMutationError(null);
    if (dialog.type === "create") {
      createMutation.mutate(values);
    } else if (dialog.type === "edit") {
      updateMutation.mutate({ id: dialog.service.id, body: values });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const services = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const isFormOpen = dialog.type === "create" || dialog.type === "edit";
  const isFormSubmitting = createMutation.isPending || updateMutation.isPending;

  if (!canRead) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        You do not have permission to view installation services.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Installation Services</h1>
          <p className="text-sm text-muted-foreground">
            Track fire protection installation jobs
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => {
              setMutationError(null);
              setDialog({ type: "create" });
            }}
            size="sm"
          >
            + New Service
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search by customer or address…"
          value={search}
          onChange={handleSearchChange}
          className="sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-44"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {installationServiceStatuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Table — desktop */}
      <div className="hidden sm:block rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Service Date</th>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-left font-medium">Fee</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created By</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Loading…
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-destructive"
                >
                  Failed to load installation services.
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No installation services found.
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr
                  key={service.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(service.serviceDate)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{service.customerName}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {service.customerAddress}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {formatFee(service.feeAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[service.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {STATUS_LABELS[service.status] ?? service.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {service.createdByName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDialog({ type: "view", service })
                        }
                      >
                        View
                      </Button>
                      {canWrite && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setMutationError(null);
                              setDialog({ type: "edit", service });
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              setDialog({ type: "delete", service })
                            }
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="sm:hidden space-y-2">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading…</div>
        ) : isError ? (
          <div className="py-8 text-center text-destructive">
            Failed to load installation services.
          </div>
        ) : services.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No installation services found.
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="rounded-md border bg-card p-4 space-y-2 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{service.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {service.customerAddress}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[service.status] ?? "bg-gray-100 text-gray-800"}`}
                >
                  {STATUS_LABELS[service.status] ?? service.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(service.serviceDate)}</span>
                <span className="font-semibold text-foreground">
                  {formatFee(service.feeAmount)}
                </span>
              </div>
              <div className="flex gap-1 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setDialog({ type: "view", service })}
                >
                  View
                </Button>
                {canWrite && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => {
                        setMutationError(null);
                        setDialog({ type: "edit", service });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
                      onClick={() => setDialog({ type: "delete", service })}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Form dialog */}
      {isFormOpen && (
        <InstallationServiceForm
          onSubmit={handleFormSubmit}
          onCancel={() => setDialog({ type: "none" })}
          isSubmitting={isFormSubmitting}
          error={mutationError}
          existing={dialog.type === "edit" ? dialog.service : undefined}
          canWrite={canWrite}
        />
      )}

      {/* Detail dialog */}
      {dialog.type === "view" && (
        <InstallationServiceDetail
          service={dialog.service}
          canWrite={canWrite}
          onEdit={() => {
            setMutationError(null);
            setDialog({ type: "edit", service: dialog.service });
          }}
          onClose={() => setDialog({ type: "none" })}
        />
      )}

      {/* Delete confirm dialog */}
      {dialog.type === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-xl">
            <h2 className="text-base font-semibold">Delete Installation Service?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently delete the service record for{" "}
              <span className="font-medium text-foreground">
                {dialog.service.customerName}
              </span>{" "}
              on {formatDate(dialog.service.serviceDate)}. This action cannot be
              undone.
            </p>
            {mutationError && (
              <p className="mt-2 text-sm text-destructive">{mutationError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMutationError(null);
                  setDialog({ type: "none" });
                }}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate(dialog.service.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
