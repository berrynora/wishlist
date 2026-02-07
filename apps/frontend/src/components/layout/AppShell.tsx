"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TopNav } from "./TopNav";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  const pathname = usePathname();
  const hideTopNav = pathname === "/login";

  return (
    <>
      {!hideTopNav && <TopNav />}
      {children}
    </>
  );
}
