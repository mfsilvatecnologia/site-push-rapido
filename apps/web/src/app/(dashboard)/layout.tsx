import DashboardLayout from "@/components/DashboardLayout";
import ProtectedGate from "@/components/ProtectedGate";
import { QueryProvider } from "@/components/QueryProvider";
import { SiteProvider } from "@/components/SiteProvider";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedGate>
      <QueryProvider>
        <SiteProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </SiteProvider>
      </QueryProvider>
    </ProtectedGate>
  );
}
