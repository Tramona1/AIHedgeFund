import { MiddlewareHandler } from "hono";
import { z } from "zod";
import { Env } from "hono/types";

export type ValidDataTarget = 'json' | 'form' | 'query' | 'param' | 'header';

/**
 * Zod validator middleware for Hono
 */
export function zValidator<
  T extends z.ZodTypeAny,
  Target extends ValidDataTarget = ValidDataTarget,
  E extends Env = Env,
  P extends string = string,
  I = z.output<T>
>(
  target: Target,
  schema: T
): MiddlewareHandler<E, P>;

/**
 * Interface for request validation
 */
export interface RequestValidator {
  valid<T extends ValidDataTarget>(target: T): any;
}

/**
 * Create a validator for a specific location
 */
export function createValidator(location: ValidDataTarget): RequestValidator; 