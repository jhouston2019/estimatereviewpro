import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const files = [
  "app/pricing/page.tsx",
  "app/api/create-checkout-session/route.ts",
  "app/success/page.tsx",
  "app/success/SuccessRedirect.tsx",
  "app/api/auth/create-session-from-stripe/route.ts",
  "app/app/page.tsx",
  "app/upload/page.tsx",
  "app/dashboard/page.tsx",
  "middleware.ts",
  "app/api/verify-payment/route.ts",
  "supabase/migrations/00_create_users_table.sql",
  "supabase/migrations/20260422_plan_type_premier.sql",
];

let out = `PAYMENT AND USER FLOW — FULL FILE DUMP\nGenerated: ${new Date().toISOString()}\n\n`;

for (const f of files) {
  const p = path.join(root, f);
  out += `\n\n==========\nFILE: ${f}\n==========\n\n`;
  out += fs.readFileSync(p, "utf8");
}

const outPath = path.join(root, "_PAYMENT_USER_FLOW_CODE_REPORT.txt");
fs.writeFileSync(outPath, out, "utf8");
console.log("Wrote", outPath, "bytes", Buffer.byteLength(out, "utf8"));
