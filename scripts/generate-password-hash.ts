/**
 * 生成密码哈希
 * 用法: npx tsx scripts/generate-password-hash.ts <password>
 */

import { hashPassword } from "better-auth/crypto";

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error("用法: npx tsx scripts/generate-password-hash.ts <password>");
    console.error("示例: npx tsx scripts/generate-password-hash.ts admin");
    process.exit(1);
  }

  const hash = await hashPassword(password);
  console.log(`密码 "${password}" 的哈希:`);
  console.log(hash);
  console.log("\n将此哈希填入环境变量 STARX_DEV_ADMIN_PASSWORD_HASH");
}

main().catch(console.error);
