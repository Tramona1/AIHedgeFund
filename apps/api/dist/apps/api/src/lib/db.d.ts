import * as schema from "@repo/db/schema";
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema>;
export { eq, and, or, desc, asc, sql } from "drizzle-orm";
