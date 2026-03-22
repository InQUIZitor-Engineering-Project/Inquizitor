import React from "react";
import { useTheme } from "styled-components";
import styled, { type DefaultTheme } from "styled-components";
import { Box, Flex, Heading, Stack, Text } from "../../primitives";
import { PageContainer, PageSection } from "../Container";
import { faqItems } from "./faqData";
import useFaq from "./useFaq";
import SearchBar from "./SearchBar";
import FAQItemCard from "./FAQItemCard";

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

interface HelpPageProps {
  faqImageSrc: string;
  contactForm?: React.ReactNode;
}

const HelpPage: React.FC<HelpPageProps> = ({ faqImageSrc, contactForm }) => {
  const theme = useTheme() as DefaultTheme;
  const { search, setSearch, activeId, filteredFaq, handleToggle } = useFaq([...faqItems]);

  return (
    <Flex $direction="column" $bg="transparent" style={{ minHeight: "100%" }}>
      <Flex $flex={1} $width="100%" $justify="center">
        <PageSection $py="lg">
          <PageContainer>
            <Stack $gap="xl" style={{ width: "100%" }}>
              <Box
                $p="lg"
                $radius="xl"
                $bg={theme.colors.neutral.white}
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
                    src={faqImageSrc}
                    alt="Ilustracja FAQ Inquizitor"
                    style={{ maxWidth: 360, width: "100%", objectFit: "contain" }}
                  />
                </Flex>
              </Box>

              <CardsGrid $p="lg" $radius="xl" $bg={theme.colors.neutral.white} $shadow="md">
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
                  <Text
                    $variant="body2"
                    $tone="muted"
                    style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}
                  >
                    Nie znaleziono pytań pasujących do wyszukiwania &quot;{search}&quot;.
                  </Text>
                )}
              </CardsGrid>

              {contactForm}
            </Stack>
          </PageContainer>
        </PageSection>
      </Flex>
    </Flex>
  );
};

export default HelpPage;
