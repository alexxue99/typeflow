import { neon } from "@neondatabase/serverless";

export async function isUsernameAvailable(username: string) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required to check username availability.");

  const sql = neon(connectionString);
  const matches = await sql.query(
    `SELECT 1
      FROM neon_auth."user"
      WHERE lower("name") = lower($1)
      LIMIT 1`,
    [username],
  );

  return matches.length === 0;
}
