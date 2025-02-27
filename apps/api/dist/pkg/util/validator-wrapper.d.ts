import { zValidator } from "@hono/zod-validator";
export { zValidator };
export declare function createValidator(location: "json" | "form" | "query" | "param" | "header"): (schema: any) => (c: any, next: any) => Promise<void>;
