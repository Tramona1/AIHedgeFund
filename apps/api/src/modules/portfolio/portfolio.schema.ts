import { z } from "zod";

// Schema for validating portfolio creation requests
export const createPortfolioSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  name: z.string().min(1, "Portfolio name is required"),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// Schema for validating portfolio update requests
export const updatePortfolioSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

// Schema for validating position creation requests
export const addPositionSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  quantity: z.number().positive("Quantity must be positive"),
  averageCost: z.number().positive("Average cost must be positive"),
  notes: z.string().optional(),
});

// Schema for validating position update requests
export const updatePositionSchema = z.object({
  quantity: z.number().positive("Quantity must be positive").optional(),
  averageCost: z.number().positive("Average cost must be positive").optional(),
  notes: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

// Schema for validating transaction recording requests
export const recordTransactionSchema = z.object({
  portfolioId: z.string().uuid("Invalid portfolio ID"),
  positionId: z.string().uuid("Invalid position ID"),
  type: z.enum(["BUY", "SELL"], {
    errorMap: () => ({ message: "Transaction type must be either BUY or SELL" })
  }),
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
  fees: z.number().nonnegative("Fees must be non-negative").optional(),
  notes: z.string().optional(),
  transactionDate: z.coerce.date().optional().default(() => new Date()),
});

// Schema for validating portfolio performance request
export const portfolioPerformanceRequestSchema = z.object({
  days: z.number().int().positive("Days must be a positive integer").optional().default(30),
}); 