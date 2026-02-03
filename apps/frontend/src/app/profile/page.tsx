import Navbar from "@/components/layout/Navbar";

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <main style={styles.container}>
        <h1>Profile</h1>
        <p>Name: John Doe</p>
        <p>Email: john@example.com</p>
      </main>
    </>
  );
}

const styles = {
  container: { padding: "0 2rem" },
};
