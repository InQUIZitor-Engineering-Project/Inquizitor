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
import { PageContainer, PageSection } from "../../design-system/patterns";
import styled from "styled-components";

const CardsGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;

  ${({ theme }) => theme.media.down("md")} {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

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
        <PageSection $py="xl">
          <PageContainer>
            <Stack $gap="xl" style={{ width: "100%" }}>
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

              <CardsGrid $p="lg" $radius="xl" $bg="#fff" $shadow="md">
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
              </CardsGrid>
            </Stack>
          </PageContainer>
        </PageSection>
      </Flex>

      <Footer />
    </Flex>
  );
};

export default FAQPage;
