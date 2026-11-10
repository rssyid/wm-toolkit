import "dotenv/config";
import { db } from "../src/server/db";

async function listUsers() {
  const users = await db.user.findMany({
    orderBy: { role: "asc" },
  });

  console.log(`\n📋 DAFTAR PENGGUNA TERDAFTAR DI DATABASE NEON (${users.length} Akun):`);
  console.log("-------------------------------------------------------------------------------------------------------------------");
  console.log("| No | Nama Lengkap                  | Email                           | Role     | Jabatan                         |");
  console.log("-------------------------------------------------------------------------------------------------------------------");
  users.forEach((u, i) => {
    const num = (i + 1).toString().padEnd(2, " ");
    const name = u.name.padEnd(29, " ");
    const email = u.email.padEnd(31, " ");
    const role = u.role.padEnd(8, " ");
    const jab = (u.jabatan || "-").padEnd(31, " ");
    console.log(`| ${num} | ${name} | ${email} | ${role} | ${jab} |`);
  });
  console.log("-------------------------------------------------------------------------------------------------------------------");
  console.log("🔑 Kata Sandi Default untuk SEMUA akun di atas: wmtoolkit2026\n");
  process.exit(0);
}

listUsers();
