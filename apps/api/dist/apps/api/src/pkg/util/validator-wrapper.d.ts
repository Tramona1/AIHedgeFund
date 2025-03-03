import { z } from "zod";
import type { Context, MiddlewareHandler, Env } from 'hono';
type ValidDataTarget = 'json' | 'form' | 'query' | 'param' | 'header';
/**
 * Type-safe validator wrapper for Hono using Zod
 * This is a simplified version to get the API server running
 */
export declare const zValidator: <T extends z.ZodTypeAny, Target extends ValidDataTarget = ValidDataTarget, E extends Env = Env, P extends string = string, I = z.output<T>>(target: Target, schema: T) => MiddlewareHandler<E, P>;
declare module 'hono' {
    interface RequestValidator {
        valid<T extends ValidDataTarget>(target: T): any;
    }
}
export declare function createValidator(location: ValidDataTarget): (schema: any) => (c: Context, next: () => Promise<void>) => Promise<void>;
export {};
