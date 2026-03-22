import React from "react";
import { HelpPage as SharedHelpPage } from "@inquizitor/ui";
import faqImg from "../../assets/faq_nobackground2.webp";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import ContactForm from "./components/ContactForm";

const HelpPage: React.FC = () => {
  useDocumentTitle("Pomoc | Inquizitor");

  return (
    <SharedHelpPage
      faqImageSrc={faqImg}
      contactForm={<ContactForm />}
    />
  );
};

export default HelpPage;
