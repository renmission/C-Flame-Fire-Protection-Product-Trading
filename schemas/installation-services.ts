import { z } from "zod";
import {
  installationServiceStatuses,
  installationFeeTypes,
} from "@/lib/db/schema";

export const PRESET_FEE_OPTIONS = [
  "500",
  "1000",
  "2500",
  "5000",
  "10000",
] as const;
export type PresetFeeOption = (typeof PRESET_FEE_OPTIONS)[number];

const installationServiceBaseSchema = z.object({
  serviceDate: z.string().min(1, "Service date is required"),
  customerId: z.string().optional().nullable(),
  customerName: z.string().min(1, "Customer name is required").max(200),
  customerAddress: z.string().min(1, "Customer address is required").max(500),
  customerPhone: z
    .string()
    .max(50)
    .optional()
    .or(z.literal(""))
    .nullable(),
  customerEmail: z
    .string()
    .email("Invalid email")
    .max(200)
    .optional()
    .or(z.literal(""))
    .nullable(),
  feeType: z.enum(installationFeeTypes),
  feePreset: z.enum(PRESET_FEE_OPTIONS).optional().nullable(),
  feeCustom: z.coerce
    .number()
    .positive("Custom fee must be positive")
    .optional()
    .nullable(),
  status: z.enum(installationServiceStatuses).default("pending"),
  notes: z.string().max(1000).optional().nullable(),
});

export const installationServiceSchema = installationServiceBaseSchema.superRefine(
  (data, ctx) => {
    if (data.feeType === "preset" && !data.feePreset) {
      ctx.addIssue({
        code: "custom",
        path: ["feePreset"],
        message: "Please select a fee amount",
      });
    }
    if (data.feeType === "custom" && !data.feeCustom) {
      ctx.addIssue({
        code: "custom",
        path: ["feeCustom"],
        message: "Please enter a custom fee",
      });
    }
  }
);

export type InstallationServiceFormValues = z.infer<
  typeof installationServiceSchema
>;

export const installationServiceUpdateSchema =
  installationServiceBaseSchema.partial();
export type InstallationServiceUpdateValues = z.infer<
  typeof installationServiceUpdateSchema
>;

export const installationServicesListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  status: z.enum(installationServiceStatuses).optional(),
  sortBy: z
    .enum(["serviceDate", "customerName", "status", "createdAt", "feeAmount"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type InstallationServicesListQuery = z.infer<
  typeof installationServicesListQuerySchema
>;
