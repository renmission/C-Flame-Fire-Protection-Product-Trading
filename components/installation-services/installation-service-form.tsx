"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  installationServiceSchema,
  PRESET_FEE_OPTIONS,
  type InstallationServiceFormValues,
  type PresetFeeOption,
} from "@/schemas/installation-services";
import { installationServiceStatuses } from "@/lib/db/schema";
import { CustomerSelector } from "@/components/customers/customer-selector";
import type { CustomerListItem } from "@/lib/customers-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstallationServiceListItem } from "@/lib/installation-services-api";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface InstallationServiceFormProps {
  onSubmit: (values: InstallationServiceFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
  existing?: InstallationServiceListItem;
  canWrite: boolean;
}

export function InstallationServiceForm({
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  existing,
  canWrite,
}: InstallationServiceFormProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    existing?.customerId ?? null
  );

  const todayIso = new Date().toISOString().split("T")[0];

  const defaultValues: InstallationServiceFormValues = existing
    ? {
        serviceDate: existing.serviceDate.split("T")[0],
        customerId: existing.customerId,
        customerName: existing.customerName,
        customerAddress: existing.customerAddress,
        customerPhone: existing.customerPhone ?? "",
        customerEmail: existing.customerEmail ?? "",
        feeType: existing.feeType as "preset" | "custom",
        feePreset: existing.feePreset as PresetFeeOption | null | undefined,
        feeCustom: existing.feeCustom ? parseFloat(existing.feeCustom) : null,
        status: existing.status,
        notes: existing.notes ?? "",
      }
    : {
        serviceDate: todayIso,
        customerId: null,
        customerName: "",
        customerAddress: "",
        customerPhone: "",
        customerEmail: "",
        feeType: "preset",
        feePreset: undefined,
        feeCustom: null,
        status: "pending",
        notes: "",
      };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InstallationServiceFormValues>({
    resolver: zodResolver(installationServiceSchema),
    defaultValues,
  });

  const feeType = watch("feeType");
  const feePreset = watch("feePreset");

  const handleFeeSelectChange = (val: string) => {
    if (val === "custom") {
      setValue("feeType", "custom");
      setValue("feePreset", null);
    } else {
      setValue("feeType", "preset");
      setValue("feePreset", val as PresetFeeOption);
      setValue("feeCustom", null);
    }
  };

  const handleCustomerSelect = (customer: CustomerListItem | null) => {
    if (customer) {
      setSelectedCustomerId(customer.id);
      setValue("customerId", customer.id);
      setValue("customerName", customer.name);
      setValue("customerAddress", customer.address);
      setValue("customerPhone", customer.phone ?? "");
      setValue("customerEmail", customer.email ?? "");
    } else {
      setSelectedCustomerId(null);
      setValue("customerId", null);
    }
  };

  // Keep selectedCustomerId in sync with form reset for editing
  useEffect(() => {
    if (existing?.customerId) setSelectedCustomerId(existing.customerId);
  }, [existing?.customerId]);

  const feeSelectValue =
    feeType === "custom" ? "custom" : (feePreset ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[95vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {existing ? "Edit Installation Service" : "New Installation Service"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Service Date */}
            <div>
              <Label htmlFor="serviceDate">Service Date *</Label>
              <Input
                id="serviceDate"
                type="date"
                className="mt-1"
                {...register("serviceDate")}
              />
              {errors.serviceDate && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.serviceDate.message}
                </p>
              )}
            </div>

            {/* Customer Selector */}
            {canWrite && (
              <CustomerSelector
                value={selectedCustomerId}
                onSelect={handleCustomerSelect}
                showCreate={canWrite}
                onCreateSuccess={handleCustomerSelect}
              />
            )}

            {/* Customer Name */}
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="Full name"
                className="mt-1"
                {...register("customerName")}
              />
              {errors.customerName && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.customerName.message}
                </p>
              )}
            </div>

            {/* Customer Address */}
            <div>
              <Label htmlFor="customerAddress">Address *</Label>
              <Input
                id="customerAddress"
                placeholder="Service location address"
                className="mt-1"
                {...register("customerAddress")}
              />
              {errors.customerAddress && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.customerAddress.message}
                </p>
              )}
            </div>

            {/* Phone & Email side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  placeholder="Optional"
                  className="mt-1"
                  {...register("customerPhone")}
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="Optional"
                  className="mt-1"
                  {...register("customerEmail")}
                />
                {errors.customerEmail && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.customerEmail.message}
                  </p>
                )}
              </div>
            </div>

            {/* Fee */}
            <div>
              <Label htmlFor="feeSelect">Service Fee *</Label>
              <select
                id="feeSelect"
                value={feeSelectValue}
                onChange={(e) => handleFeeSelectChange(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select fee amount</option>
                {PRESET_FEE_OPTIONS.map((amt) => (
                  <option key={amt} value={amt}>
                    ₱{Number(amt).toLocaleString()}
                  </option>
                ))}
                <option value="custom">Custom amount…</option>
              </select>
              {errors.feePreset && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.feePreset.message}
                </p>
              )}
              {feeType === "custom" && (
                <div className="mt-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter custom amount"
                    className={errors.feeCustom ? "border-destructive" : ""}
                    {...register("feeCustom", { valueAsNumber: true })}
                  />
                  {errors.feeCustom && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.feeCustom.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("status")}
              >
                {installationServiceStatuses.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Optional notes about this service"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("notes")}
              />
              {errors.notes && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.notes.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !canWrite}>
                {isSubmitting
                  ? existing
                    ? "Saving…"
                    : "Creating…"
                  : existing
                    ? "Save Changes"
                    : "Create Service"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
