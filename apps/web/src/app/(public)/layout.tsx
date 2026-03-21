import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import styled from "styled-components";

// We need a styled wrapper — but since layout is a Server Component,
// we inline the style directly. The Navbar/Footer are client components.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
