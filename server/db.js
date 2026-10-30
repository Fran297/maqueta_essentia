import mysql from "mysql2/promise";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
let pool;
export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
    pool = mysql.createPool(process.env.DATABASE_URL);
  }
  return pool;
}

export async function ensureSchema() {
  const db = getPool();
  await db.query("SELECT 1");
  const directory = path.join(here, "..", "db", "migrations");
  const files = (await fs.readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await fs.readFile(path.join(directory, file), "utf8");
    for (const statement of sql.split(";").map((part) => part.trim()).filter(Boolean)) await db.query(statement);
  }
  return db;
}
