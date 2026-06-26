import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import pg from "pg";

type QueryResult<T> = {
  rows: T[];
};

type QueryablePool = {
  query<T = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
  end(): Promise<void>;
};

const { Pool } = pg as unknown as {
  Pool: new (config: { connectionString: string }) => QueryablePool;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

async function tableExists(pool: QueryablePool, tableName: string) {
  const result = await pool.query<{ exists: boolean }>(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = current_schema()
          and table_name = $1
      ) as exists
    `,
    [tableName],
  );

  return Boolean(result.rows[0]?.exists);
}

async function main() {
  const connectionString = requiredEnv("DATABASE_URL");
  const email = requiredEnv("STARX_FIRST_ADMIN_EMAIL").toLowerCase();
  const name = process.env.STARX_FIRST_ADMIN_NAME?.trim() || "初始管理员";
  const plainPassword = process.env.STARX_FIRST_ADMIN_PASSWORD?.trim();
  const configuredHash = process.env.STARX_FIRST_ADMIN_PASSWORD_HASH?.trim();

  if (!plainPassword && !configuredHash) {
    throw new Error("STARX_FIRST_ADMIN_PASSWORD or STARX_FIRST_ADMIN_PASSWORD_HASH is required.");
  }

  if (plainPassword && plainPassword.length < 8) {
    throw new Error("STARX_FIRST_ADMIN_PASSWORD must be at least 8 characters.");
  }

  const passwordHash = configuredHash || (await hashPassword(plainPassword || ""));
  const pool = new Pool({ connectionString });

  try {
    const [hasUserTable, hasAccountTable] = await Promise.all([
      tableExists(pool, "user"),
      tableExists(pool, "account"),
    ]);

    if (!hasUserTable || !hasAccountTable) {
      throw new Error("Better Auth tables are missing. Run npm run db:migration:apply first.");
    }

    await pool.query("begin");

    try {
      const now = new Date();
      const existingUser = await pool.query<{ id: string }>(
        `select id from "user" where lower(email) = lower($1) limit 1`,
        [email],
      );
      const userId = existingUser.rows[0]?.id || randomUUID();

      if (existingUser.rows[0]) {
        await pool.query(
          `
            update "user"
            set email = $1,
                name = $2,
                "emailVerified" = true,
                role = 'admin',
                banned = false,
                "banReason" = null,
                "banExpires" = null,
                "updatedAt" = $3
            where id = $4
          `,
          [email, name, now, userId],
        );
      } else {
        await pool.query(
          `
            insert into "user" (
              id,
              email,
              name,
              image,
              "emailVerified",
              role,
              banned,
              "banReason",
              "banExpires",
              "twoFactorEnabled",
              "createdAt",
              "updatedAt"
            )
            values ($1, $2, $3, null, true, 'admin', false, null, null, false, $4, $4)
          `,
          [userId, email, name, now],
        );
      }

      const existingAccount = await pool.query<{ id: string }>(
        `select id from account where "userId" = $1 and "providerId" = 'credential' limit 1`,
        [userId],
      );

      if (existingAccount.rows[0]) {
        await pool.query(
          `
            update account
            set "accountId" = $1,
                password = $2,
                "updatedAt" = $3
            where id = $4
          `,
          [userId, passwordHash, now, existingAccount.rows[0].id],
        );
      } else {
        await pool.query(
          `
            insert into account (
              id,
              "accountId",
              "providerId",
              "userId",
              password,
              "createdAt",
              "updatedAt"
            )
            values ($1, $2, 'credential', $2, $3, $4, $4)
          `,
          [randomUUID(), userId, passwordHash, now],
        );
      }

      await pool.query("commit");
      console.log(`First admin is ready: ${email}`);
    } catch (error) {
      await pool.query("rollback");
      throw error;
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
