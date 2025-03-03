import { Hono } from "hono";
import { MiddlewareHandler } from "hono/types";

// Define the type for the routes export
// Using a more specific type for the Hono router
export const updatesRoutes: Hono<{
  Variables: {};
  Bindings: {};
}>; 