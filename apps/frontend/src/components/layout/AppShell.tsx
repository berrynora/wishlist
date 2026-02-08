"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TopNav } from "./TopNav";
import { Providers } from "@/providers";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  const pathname = usePathname();
  const hideTopNav = pathname === "/login";

  return (
    <>
      {!hideTopNav && <TopNav />}
      <Providers>{children}</Providers>
    </>
  );
}
