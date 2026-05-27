import { z } from "zod";
import { orderStatuses } from "@/lib/db/schema";

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
});

export type OrderItemFormValues = z.infer<typeof orderItemSchema>;

export const orderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  notes: z.string().max(1000, "Notes are too long").optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

export const orderUpdateSchema = z.object({
  status: z.enum(orderStatuses).optional(),
  notes: z.string().max(1000, "Notes are too long").optional(),
});

export type OrderUpdateValues = z.infer<typeof orderUpdateSchema>;

export const ordersListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  status: z.enum(orderStatuses).optional(),
  customerId: z.string().optional(),
  sortBy: z
    .enum(["orderNumber", "createdAt", "updatedAt", "status"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type OrdersListQuery = z.infer<typeof ordersListQuerySchema>;
