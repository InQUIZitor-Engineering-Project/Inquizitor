import React from "react";
import Hero from "../components/Hero/Hero";
import HowItWorks from "../components/HowItWorks/HowItWorks";
import Footer from "../components/Footer/Footer";
import useDocumentTitle from "../components/GeneralComponents/Hooks/useDocumentTitle";

const HomePage: React.FC = () => {

  useDocumentTitle("Inquizitor");

  return (
    <>
      <Hero />
      <HowItWorks id="how-it-works"/>
      <Footer/>
    </>
  );
};

export default HomePage;
