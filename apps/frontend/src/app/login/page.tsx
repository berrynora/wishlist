"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { loginWithEmail } from "@/api/login";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      await loginWithEmail(email, password);
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
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
        {error && <p style={styles.error}>{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Login"}
        </Button>
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
  error: {
    color: "#d32f2f",
    margin: 0,
  },
};
