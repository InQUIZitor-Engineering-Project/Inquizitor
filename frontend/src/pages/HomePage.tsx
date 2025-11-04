import React from "react";
import Hero from "../components/Hero/Hero";
import HowItWorks from "../components/HowItWorks/HowItWorks";
import Footer from "../components/Footer/Footer";

const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <HowItWorks id="how-it-works"/>
      <Footer/>
    </>
  );
};

export default HomePage;
