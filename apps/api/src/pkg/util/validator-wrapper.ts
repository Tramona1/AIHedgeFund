import { z } from "zod";
import { validator } from "hono/validator";
import { logger } from "@repo/logger";
import type { Context, MiddlewareHandler, Env } from 'hono';

// Define a type that extends the RequestValidator interface
type ValidDataTarget = 'json' | 'form' | 'query' | 'param' | 'header';

/**
 * Type-safe validator wrapper for Hono using Zod
 * This is a simplified version to get the API server running
 */
export const zValidator = <
  T extends z.ZodTypeAny,
  Target extends ValidDataTarget = ValidDataTarget,
  E extends Env = Env,
  P extends string = string,
  I = z.output<T>
>(
  target: Target,
  schema: T
): MiddlewareHandler<E, P> => {
  return validator(target, (value, c) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      return c.json(
        {
          status: "error",
          message: "Validation failed",
          errors: result.error.format(),
          code: 400,
        },
        400
      );
    }
    return result.data as I;
  });
};

// Augment Hono's Request type to include our typed valid method
declare module 'hono' {
  interface RequestValidator {
    valid<T extends ValidDataTarget>(target: T): any;
  }
}

// Export a utility function to create a validator with logging
export function createValidator(location: ValidDataTarget) {
  return (schema: any) => {
    const validator = zValidator(location, schema);
    
    return async (c: Context, next: () => Promise<void>) => {
      try {
        await validator(c, next);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("Validation error", { 
          error: errorMessage, 
          location, 
          path: c.req.path,
          method: c.req.method 
        });
        throw error;
      }
    };
  };
} 