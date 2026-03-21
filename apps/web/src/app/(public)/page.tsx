import type { Metadata } from "next";
import Hero from "@/components/Hero/Hero";
import HowItWorks from "@/components/HowItWorks/HowItWorks";

export const metadata: Metadata = {
  title: "Inquizitor – stwórz quiz w mgnieniu oka",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks id="how-it-works" />
    </>
  );
}
