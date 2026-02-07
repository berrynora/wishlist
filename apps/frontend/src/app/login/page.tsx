"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./login.module.scss";
import { LoginHeader } from "./components/LoginHeader";
import { LoginTabs } from "./components/LoginTabs";
import { AuthForm } from "./components/AuthForm";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <LoginHeader />
        <LoginTabs active={tab} onChange={setTab} />
        <div className={styles.cardWrap}>
          <AuthForm
            mode={tab}
            onLoginSuccess={() => router.replace("/home")}
          />
        </div>
      </div>
    </main>
  );
}
