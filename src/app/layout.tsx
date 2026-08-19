import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ജനശബ്ദം",
  description: "Kerala civic consultation objections",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ml">
      <body>{children}</body>
    </html>
  );
}
