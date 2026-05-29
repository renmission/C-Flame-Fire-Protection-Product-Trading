"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstallationServiceListItem } from "@/lib/installation-services-api";

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

interface InstallationServiceDetailProps {
  service: InstallationServiceListItem;
  onEdit?: () => void;
  onClose: () => void;
  canWrite: boolean;
}

function formatFee(service: InstallationServiceListItem): string {
  const amount = parseFloat(service.feeAmount);
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function InstallationServiceDetail({
  service,
  onEdit,
  onClose,
  canWrite,
}: InstallationServiceDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[95vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">Installation Service Details</CardTitle>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[service.status] ?? "bg-gray-100 text-gray-800"}`}
            >
              {STATUS_LABELS[service.status] ?? service.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {/* Service Date */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Service Date
            </p>
            <p className="mt-0.5 font-medium">{formatDate(service.serviceDate)}</p>
          </div>

          {/* Customer */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Customer
            </p>
            <p className="mt-0.5 font-medium">{service.customerName}</p>
            <p className="text-muted-foreground">{service.customerAddress}</p>
            {service.customerPhone && (
              <p className="text-muted-foreground">{service.customerPhone}</p>
            )}
            {service.customerEmail && (
              <p className="text-muted-foreground">{service.customerEmail}</p>
            )}
          </div>

          {/* Fee */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Service Fee
            </p>
            <p className="mt-0.5 text-lg font-semibold">{formatFee(service)}</p>
            <p className="text-xs text-muted-foreground">
              {service.feeType === "custom" ? "Custom amount" : "Preset amount"}
            </p>
          </div>

          {/* Notes */}
          {service.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes
              </p>
              <p className="mt-0.5 whitespace-pre-wrap">{service.notes}</p>
            </div>
          )}

          {/* Meta */}
          <div className="border-t pt-3 text-xs text-muted-foreground space-y-1">
            {service.createdByName && (
              <p>Created by {service.createdByName}</p>
            )}
            <p>Created {formatDate(service.createdAt)}</p>
            {service.updatedAt !== service.createdAt && (
              <p>Updated {formatDate(service.updatedAt)}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            {canWrite && onEdit && (
              <Button type="button" onClick={onEdit}>
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
