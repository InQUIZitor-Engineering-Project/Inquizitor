import React from "react";
import { useTheme } from "styled-components";
import { Box, Flex, Heading, Stack, Text } from "../../design-system/primitives";
import Footer from "../../components/Footer/Footer";
import faqImg from "../../assets/faq_nobackground2.png";
import useDocumentTitle from "../../hooks/useDocumentTitle.ts";
import { categoriesOrder, faqItems } from "./faqData.ts";
import useFaq from "./hooks/useFaq";
import SearchBar from "./components/SearchBar";
import FAQCategoryColumn from "./components/FAQCategoryColumn";

const FAQPage: React.FC = () => {
  const theme = useTheme();
  const { search, setSearch, activeId, grouped, handleToggle } = useFaq([...faqItems]);

  useDocumentTitle("FAQ | Inquizitor");

  return (
    <Flex
      $direction="column"
      $bg={theme.colors.neutral.silver}
      style={{ minHeight: "calc(100vh - 40px)" }}
    >
      <Flex $flex={1} $width="100%" $justify="center">
        <Stack
          $gap="xl"
          style={{ width: "100%", maxWidth: 1280, padding: "40px 64px 32px" }}
        >
          <Box
            $p="lg"
            $radius="xl"
            $bg="#fff"
            $shadow="md"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 32,
              alignItems: "center",
            }}
          >
            <Stack $gap="md">
              <Heading $level="h2" as="h1">
                Najczęściej zadawane pytania
              </Heading>
              <Text $variant="body2" $tone="muted">
                Zebraliśmy w jednym miejscu odpowiedzi na pytania dotyczące generowania testów,
                edycji, bezpieczeństwa oraz planowanych funkcji. Jeśli czegoś brakuje,
                skontaktuj się z nami.
              </Text>
              <SearchBar value={search} onChange={setSearch} />
            </Stack>

            <Flex $justify="center">
              <Box
                as="img"
                src={faqImg}
                alt="Ilustracja FAQ Inquizitor"
                style={{ maxWidth: 360, width: "100%", objectFit: "contain" }}
              />
            </Flex>
          </Box>

          <Box
            $p="lg"
            $radius="xl"
            $bg="#fff"
            $shadow="md"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}
          >
            {categoriesOrder.map((category) => {
              const items = grouped[category];
              if (!items || items.length === 0) return null;
              return (
                <FAQCategoryColumn
                  key={category}
                  category={category}
                  items={items}
                  activeId={activeId}
                  onToggle={handleToggle}
                />
              );
            })}
          </Box>
        </Stack>
      </Flex>

      <Footer />
    </Flex>
  );
};

export default FAQPage;
