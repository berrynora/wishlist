"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    // Fake login
    if (email && password) {
      router.push("/home");
    }
  }

  return (
    <main style={styles.container}>
      <h1>Login</h1>

      <form onSubmit={handleLogin} style={styles.form}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <Button>Login</Button>
      </form>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "2rem" },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    maxWidth: 300,
  },
  input: {
    padding: "0.6rem",
    border: "1px solid var(--border)",
    borderRadius: "6px",
  },
};
