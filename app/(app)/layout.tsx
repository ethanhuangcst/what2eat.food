import { redirect } from "next/navigation";
import { readSession } from "@/src/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  if (!session) redirect("/login");
  return <>{children}</>;
}
