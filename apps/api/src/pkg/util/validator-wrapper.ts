import { zValidator } from "@hono/zod-validator";
import { logger } from "@repo/logger";

// Export a wrapped version of zValidator that includes logging
export { zValidator };

// Export a utility function to create a validator with logging
export function createValidator(location: "json" | "form" | "query" | "param" | "header") {
  return (schema: any) => {
    const validator = zValidator(location, schema);
    
    return async (c: any, next: any) => {
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