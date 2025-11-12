import React, { useState, useMemo } from "react";
import Footer from "../../components/Footer/Footer";
import faqImg from "../../assets/faq.png";

import {
  PageWrapper,
  ContentWrapper,
  Hero,
  HeroText,
  HeroTitle,
  HeroSubtitle,
  HeroImage,
  FAQLayout,
  FAQColumn,
  FAQCategoryTitle,
  FAQItem,
  QuestionRow,
  QuestionText,
  Answer,
  Tag,
  SearchBar,
  SearchIcon,
  SearchInput,
  Pill,
} from "./FAQPage.styles";
import useDocumentTitle from "../../components/GeneralComponents/Hooks/useDocumentTitle";

const faqItems = [
  {
    id: 1,
    category: "Konto i logowanie",
    question: "Jak założyć konto w Inquizitorze?",
    answer:
      "Wystarczy przejść do strony rejestracji, podać adres e-mail, hasło oraz podstawowe dane. Po potwierdzeniu adresu e-mail możesz od razu generować testy.",
    tag: "konto",
  },
  {
    id: 2,
    category: "Konto i logowanie",
    question: "Zapomniałem hasła – co zrobić?",
    answer:
      "Na ekranie logowania wybierz opcję resetu hasła. Otrzymasz na maila link do ustawienia nowego hasła.",
    tag: "hasło",
  },
  {
    id: 3,
    category: "Generowanie testów",
    question: "Na podstawie jakich materiałów mogę wygenerować test?",
    answer:
      "Możesz wkleić własny tekst lub wgrać plik z materiałem dydaktycznym (PDF, DOCX, TXT, MD). System automatycznie przetworzy treść i wygeneruje pytania.",
    tag: "materiały",
  },
  {
    id: 4,
    category: "Generowanie testów",
    question: "Czy mogę kontrolować poziom trudności pytań?",
    answer:
      "Tak. Podczas generowania testu wybierasz liczbę pytań łatwych, średnich i trudnych. Algorytm dostosuje pytania do tych proporcji.",
    tag: "trudność",
  },
  {
    id: 5,
    category: "Edycja i eksport",
    question: "Czy mogę edytować wygenerowane pytania?",
    answer:
      "Tak. Każde pytanie możesz modyfikować: zmienić treść, odpowiedzi, poprawne warianty, a także usuwać i dodawać własne pytania.",
    tag: "edycja",
  },
  {
    id: 6,
    category: "Edycja i eksport",
    question: "W jakich formatach mogę pobrać test?",
    answer:
      "Test możesz wyeksportować do PDF lub XML, np. do późniejszego wykorzystania w innych systemach.",
    tag: "eksport",
  },
  {
    id: 7,
    category: "Bezpieczeństwo",
    question: "Czy moje testy i materiały są bezpieczne?",
    answer:
      "Tak. Dane są powiązane z Twoim kontem i nie są udostępniane innym użytkownikom. Dostęp do testów wymaga uwierzytelnienia.",
    tag: "bezpieczeństwo",
  },
  {
    id: 8,
    category: "Bezpieczeństwo",
    question: "Czy moje hasło jest zabezpieczone?",
    answer:
      "Tak. Twoje dane logowania są zapisywane w bezpiecznym miejscu pod kluczem.",
    tag: "bezpieczeństwo",
  },
  {
    id: 9,
    category: "Plany rozwoju",
    question: "Jakie funkcje planujecie dodać w najbliższym czasie?",
    answer:
      "Pracujemy m.in. nad stroną profilu z statystykami, dodatkowymi stronami informacyjnymi (FAQ, O nas), automatycznym generowaniem tytułów testów oraz łatwym udostępnianiem.",
    tag: "rozwój",
  },
];

const categoriesOrder = [
  "Konto i logowanie",
  "Generowanie testów",
  "Edycja i eksport",
  "Bezpieczeństwo",
  "Plany rozwoju",
];

const FAQPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);

  const filteredFaq = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faqItems;
    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q),
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filteredFaq> = {};
    for (const item of filteredFaq) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [filteredFaq]);

  const handleToggle = (id: number) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  useDocumentTitle("FAQ | Inquizitor");

  return (
    <PageWrapper>
      <ContentWrapper>
        <Hero>
          <HeroText>
            <HeroTitle>Najczęściej zadawane pytania</HeroTitle>
            <HeroSubtitle>
              Zebraliśmy w jednym miejscu odpowiedzi na pytania dotyczące
              generowania testów, edycji, bezpieczeństwa oraz planowanych
              funkcji. Jeśli czegoś brakuje, skontaktuj się z nami.
            </HeroSubtitle>

            <SearchBar>
              <SearchIcon>🔍</SearchIcon>
              <SearchInput
                type="text"
                placeholder="Wpisz pytanie, np. „eksport do PDF”, „poziom trudności”..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </SearchBar>
          </HeroText>

          <HeroImage src={faqImg} alt="Ilustracja FAQ Inquizitor" />
        </Hero>

        <FAQLayout>
          {categoriesOrder.map((category) => {
            const items = grouped[category];
            if (!items || items.length === 0) return null;
            return (
              <FAQColumn key={category}>
                <FAQCategoryTitle>{category}</FAQCategoryTitle>
                {items.map((item) => {
                  const isActive = item.id === activeId;
                  return (
                    <FAQItem
                      key={item.id}
                      $active={isActive}
                      onClick={() => handleToggle(item.id)}
                    >
                      <QuestionRow>
                        <QuestionText>{item.question}</QuestionText>
                        <Tag>{item.tag}</Tag>
                      </QuestionRow>
                      {isActive && <Answer>{item.answer}</Answer>}
                    </FAQItem>
                  );
                })}
              </FAQColumn>
            );
          })}
        </FAQLayout>
      </ContentWrapper>

      <Footer />
    </PageWrapper>
  );
};

export default FAQPage;
