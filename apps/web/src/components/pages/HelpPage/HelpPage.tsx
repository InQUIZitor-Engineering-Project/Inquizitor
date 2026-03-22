"use client";
import React from "react";
import { HelpPage as SharedHelpPage } from "@inquizitor/ui";
import ContactForm from "./ContactForm";

const HelpPage: React.FC = () => {
  return (
    <SharedHelpPage
      faqImageSrc="/faq_nobackground2.webp"
      contactForm={<ContactForm />}
    />
  );
};

export default HelpPage;
