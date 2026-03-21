import React from "react";
import Hero from "../components/Hero/Hero";
import HowItWorks from "../components/HowItWorks/HowItWorks";
import useDocumentTitle from "../hooks/useDocumentTitle";

const HomePage: React.FC = () => {

  useDocumentTitle("Inquizitor");

  return (
    <>
      <Hero />
      <HowItWorks id="how-it-works"/>
    </>
  );
};

export default HomePage;
