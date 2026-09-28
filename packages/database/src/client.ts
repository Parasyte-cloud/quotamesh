import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDatabase(connectionString: string) {
  if (!connectionString.trim()) {
    throw new Error("Database connection string is required");
  }

  const sqlClient = postgres(connectionString, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return {
    db: drizzle(sqlClient, { schema }),
    sqlClient,
  };
}

export type DatabaseClient = ReturnType<typeof createDatabase>;

const databaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
export const database = databaseUrl ? createDatabase(databaseUrl) : null;
