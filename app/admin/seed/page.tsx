import { requireAdminUser } from "@/lib/auth/serverPageGuards";
import SeedClient from "./SeedClient";

export default async function AdminSeedPage() {
  await requireAdminUser();
  return <SeedClient />;
}
