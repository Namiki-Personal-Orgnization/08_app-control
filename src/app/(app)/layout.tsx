import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppNav } from "@/components/layout/app-nav";
import { AppHeader } from "@/components/layout/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.role || !session.operator) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <AppHeader role={session.role} operator={session.operator} />
      <main className="container flex-1 pb-24 pt-4 sm:pb-8">{children}</main>
      <AppNav role={session.role} />
    </div>
  );
}
