import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
