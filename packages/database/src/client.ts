import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDatabase(connectionString: string) {
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

const databaseUrl = process.env.DATABASE_URL;
export const database = databaseUrl ? createDatabase(databaseUrl) : null;
