import "./globals.scss";
import type { ReactNode } from "react";

export const metadata = {
  title: "My App",
  description: "Next.js Starter",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
