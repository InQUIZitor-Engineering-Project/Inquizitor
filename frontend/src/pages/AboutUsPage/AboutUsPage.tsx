import React from "react";
import {
  PageWrapper,
  ContentWrapper,
  HeroSection,
  HeroText,
  HeroTitle,
  HeroSubtitle,
  HeroImageWrapper,
  HeroImage,
  Section,
  SectionTitle,
  SectionText,
  Highlight,
  StatsRow,
  StatCard,
  StatNumber,
  StatLabel,
} from "./AboutUsPage.styles";

import Footer from "../../components/Footer/Footer";
import onasImg from "../../assets/onas.png";
import useDocumentTitle from "../../components/GeneralComponents/Hooks/useDocumentTitle";

const AboutUsPage: React.FC = () => {

  useDocumentTitle("O nas | Inquizitor");

  return (
    <PageWrapper>
      <ContentWrapper>
        <HeroSection>
          <HeroText>
            <HeroTitle>
              <Highlight>Inquizitor</Highlight> powstaje,
              aby ułatwić tworzenie nowoczesnych testów.
            </HeroTitle>

            <StatsRow>
              <StatCard>
                <StatNumber>3</StatNumber>
                <StatLabel>osoby w zespole</StatLabel>
              </StatCard>
              <StatCard>
                <StatNumber>AI</StatNumber>
                <StatLabel>w sercu aplikacji</StatLabel>
              </StatCard>
              <StatCard>
                <StatNumber>&infin;</StatNumber>
                <StatLabel>możliwości testów</StatLabel>
              </StatCard>
            </StatsRow>
          </HeroText>

          <HeroImageWrapper>
            <HeroImage src={onasImg} alt="Zespół Inquizitor" />
          </HeroImageWrapper>
        </HeroSection>

        <Section>
          <SectionTitle>Kim jesteśmy?</SectionTitle>
          <SectionText>
            Inquizitor powstał jako projekt inżynierski trójki studentów z Krakowa,
            którzy na co dzień obserwowali, ile czasu zajmuje tworzenie rzetelnych
            testów i kartkówek. Zamiast kolejnego „generatora pytań”, chcieliśmy
            zbudować narzędzie, które:
          </SectionText>
          <SectionText as="ul">
            <li> - rozumie materiał źródłowy, a nie tylko wycina losowe zdania,</li>
            <li> - pozwala łatwo edytować pytania i odpowiedzi,</li>
            <li> - umożliwia eksport do PDF i XML,</li>
            <li> - pracuje wygodnie również przy większej liczbie testów.</li>
          </SectionText>
        </Section>

        <Section>
          <SectionTitle>Dokąd zmierzamy?</SectionTitle>
          <SectionText>
            Naszym celem jest stworzenie kompletnej platformy do przygotowywania
            testów: z automatycznym generowaniem tytułów, statystykami profilu,
            rozbudowanym panelem użytkownika oraz łatwym wdrożeniem w szkołach,
            firmach i na uczelniach.
          </SectionText>
        </Section>

        <Footer />
      </ContentWrapper>
    </PageWrapper>
  );
};

export default AboutUsPage;
