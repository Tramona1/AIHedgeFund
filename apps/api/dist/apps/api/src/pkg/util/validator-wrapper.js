import { validator } from "hono/validator";
import { logger } from "@repo/logger";
/**
 * Type-safe validator wrapper for Hono using Zod
 * This is a simplified version to get the API server running
 */
export const zValidator = (target, schema) => {
    return validator(target, (value, c) => {
        const result = schema.safeParse(value);
        if (!result.success) {
            return c.json({
                status: "error",
                message: "Validation failed",
                errors: result.error.format(),
                code: 400,
            }, 400);
        }
        return result.data;
    });
};
// Export a utility function to create a validator with logging
export function createValidator(location) {
    return (schema) => {
        const validator = zValidator(location, schema);
        return async (c, next) => {
            try {
                await validator(c, next);
            }
            catch (error) {
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
//# sourceMappingURL=validator-wrapper.js.map