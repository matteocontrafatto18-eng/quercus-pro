import "./globals.css";
import ClientLayout from "@/app/ui/ClientLayout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
