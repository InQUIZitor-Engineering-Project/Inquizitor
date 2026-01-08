import React from "react";
import { useTheme } from "styled-components";
import { Box, Flex, Heading, Stack, Text } from "../../design-system/primitives";
import faqImg from "../../assets/faq_nobackground2.png";
import useDocumentTitle from "../../hooks/useDocumentTitle.ts";
import { faqItems } from "./faqData.ts";
import useFaq from "./hooks/useFaq";
import SearchBar from "./components/SearchBar";
import FAQItemCard from "./components/FAQItemCard";
import { PageContainer, PageSection } from "../../design-system/patterns";
import styled from "styled-components";


const CardsGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  align-items: start;

  ${({ theme }) => theme.media.down("md")} {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FAQPage: React.FC = () => {
  const theme = useTheme();
  const { search, setSearch, activeId, filteredFaq, handleToggle } = useFaq([...faqItems]);

  useDocumentTitle("FAQ | Inquizitor");

  return (
    <Flex
      $direction="column"
      $bg={theme.colors.neutral.silver}
      style={{ minHeight: "100%" }}
    >
      <Flex $flex={1} $width="100%" $justify="center">
        <PageSection $py="lg">
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
                    Masz pytania dotyczące generowania testów, edycji lub bezpieczeństwa? 
                    Wpisz frazę poniżej lub przejrzyj listę.
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
                {filteredFaq.length > 0 ? (
                  filteredFaq.map((item) => (
                    <FAQItemCard
                      key={item.id}
                      item={item}
                      active={item.id === activeId}
                      onToggle={() => handleToggle(item.id)}
                    />
                  ))
                ) : (
                  <Text $variant="body2" $tone="muted" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}>
                    Nie znaleziono pytań pasujących do wyszukiwania "{search}".
                  </Text>
                )}
              </CardsGrid>
            </Stack>
          </PageContainer>
        </PageSection>
      </Flex>
    </Flex>
  );
};

export default FAQPage;