import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Box, Flex, Stack, Heading, Text, Button, Input, Card } from "../../design-system/primitives";
import { PageContainer, PageSection } from "../../design-system/patterns";
import { createTest } from "../../services/test";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import styled from "styled-components";

type LayoutCtx = { refreshSidebarTests: () => Promise<void> };

const ResponsivePageSection = styled(PageSection)`
  padding-top: ${({ theme }) => theme.spacing["3xl"]};
  padding-bottom: ${({ theme }) => theme.spacing["3xl"]};

  ${({ theme }) => theme.media.down("md")} {
    padding-top: ${({ theme }) => theme.spacing.xl};
    padding-bottom: ${({ theme }) => theme.spacing.xl};
  }
`;

const CreateManualTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshSidebarTests } = useOutletContext<LayoutCtx>();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle("Nowy test | Inquizitor");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const newTest = await createTest(title.trim());
      await refreshSidebarTests();
      navigate(`/tests/${newTest.id}?isAdding=true`);
    } catch (err: any) {
      setError(err.message || "Nie udało się utworzyć testu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex $direction="column" $height="100%" $bg="#f5f6f8">
      <Box $flex={1} $width="100%">
        <ResponsivePageSection>
          <PageContainer>
            <Stack $gap="2xl" $align="center" style={{ width: "100%" }}>
              <Stack $gap="xs" $align="center">
                <Heading as="h1" $level="h2" style={{ textAlign: "center" }}>Utwórz test od zera</Heading>
                <Text $variant="body2" $tone="muted" style={{ textAlign: "center" }}>
                  Nadaj nazwę swojemu testowi, a następnie przejdź do dodawania pytań.
                </Text>
              </Stack>

              <Card style={{ width: "100%", maxWidth: 500 }} $p="xl">
                <form onSubmit={handleCreate}>
                  <Stack $gap="lg">
                    <Stack $gap="xs">
                      <Text $variant="body3" $weight="medium">Tytuł testu</Text>
                      <Input 
                        placeholder="np. Sprawdzian z biologii - Komórka" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                        $fullWidth
                      />
                    </Stack>

                    {error && (
                      <Text $variant="body4" style={{ color: "red", textAlign: "center" }}>{error}</Text>
                    )}

                    <Flex $gap="sm" $justify="center" $mt="sm">
                      <Button 
                        type="button" 
                        $variant="outline" 
                        onClick={() => navigate('/tests/new')}
                      >
                        Wróć
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={!title.trim() || loading}
                      >
                        {loading ? "Tworzenie..." : "Utwórz test"}
                      </Button>
                    </Flex>
                  </Stack>
                </form>
              </Card>
            </Stack>
          </PageContainer>
        </ResponsivePageSection>
      </Box>
    </Flex>
  );
};

export default CreateManualTestPage;
