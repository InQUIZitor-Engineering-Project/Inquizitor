import React, { useEffect, useState } from "react";
import { Flex, Stack} from "../../design-system/primitives";
import { useLoader } from "../../components/Loader/GlobalLoader";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import ProfileHeader from "./components/ProfileHeader";
import AccountInfoCard from "./components/AccountInfoCard";
import StatsCard from "./components/StatsCard";
import NotificationsCard from "./components/NotificationsCard";
import { Card, Button, Heading, Text } from "../../design-system/primitives";
import { useNavigate } from "react-router-dom";
import profileIllustration from "../../assets/profile.webp";
import { PageContainer, PageSection } from "../../design-system/patterns";
import styled from "styled-components";

/* Empty wrapper — absolute children don't contribute to flex row height,
   so the row height is set only by the left column.
   align-items:stretch then stretches this wrapper to match. */
const RightColumnWrapper = styled.div`
  flex: 1 1 320px;
  min-width: min(320px, 100%);
  position: relative;

  @media (max-width: 900px) {
    position: static;
  }
`;

const RightColumnInner = styled(Stack)`
  position: absolute;
  inset: 0;
  overflow: hidden;

  @media (max-width: 900px) {
    position: static;
    overflow: visible;
  }
`;

const API_BASE = import.meta.env.VITE_API_URL || "";

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

interface UserStatistics {
  total_tests: number;
  total_questions: number;
  total_files: number;
  avg_questions_per_test: number;
  last_test_created_at: string | null;

  total_closed_questions?: number;
  total_open_questions?: number;
  total_easy_questions?: number;
  total_medium_questions?: number;
  total_hard_questions?: number;
}

const ProfilePage: React.FC = () => {
  const { withLoader } = useLoader();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoadError("Brak autoryzacji. Zaloguj się ponownie.");
        setLoading(false);
        return;
      }

      try {
        await withLoader(async () => {
          const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          };

          const [profileRes, statsRes] = await Promise.all([
            fetch(`${API_BASE}/users/me`, { headers }),
            fetch(`${API_BASE}/users/me/statistics`, { headers }),
          ]);

          if (!profileRes.ok) {
            throw new Error("Nie udało się pobrać danych profilu.");
          }
          if (!statsRes.ok) {
            throw new Error("Nie udało się pobrać statystyk użytkownika.");
          }

          const profileData: UserProfile = await profileRes.json();
          const statsData: UserStatistics = await statsRes.json();

          setProfile(profileData);
          setStats(statsData);
          setLoadError(null);
        });
      } catch (e: any) {
        setLoadError(
          e.message || "Wystąpił błąd podczas ładowania danych profilu.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [withLoader]);

  useDocumentTitle("Profil | Inquizitor");

  const pageContent = (
    <PageSection $py="xl">
      <PageContainer>
        <Stack $gap="xl" style={{ width: "100%" }}>
          <ProfileHeader
            fullName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
            subtitle="Zarządzaj swoim kontem, przeglądaj statystyki quizów i personalizuj swoje doświadczenie w Inquizitor."
            illustrationSrc={profileIllustration}
            illustrationAlt="Ilustracja profilu użytkownika"
            error={loadError}
          />

          <Flex $gap="lg" $wrap="wrap">
            <Stack $gap="lg" style={{ flex: "2 1 520px", minWidth: 320 }}>
              <AccountInfoCard
                firstName={profile?.first_name}
                lastName={profile?.last_name}
                email={profile?.email}
              />
              <StatsCard stats={stats} />
            </Stack>

            <RightColumnWrapper>
              <RightColumnInner $gap="lg">
                <NotificationsCard />
                <Card $p="lg" $shadow="md" $variant="elevated">
                  <Stack $gap="md">
                    <Stack $gap="4px">
                      <Heading $level="h3">Ustawienia konta</Heading>
                      <Text $variant="body3" $tone="muted">
                        Zmień hasło, zarządzaj zgodami lub usuń konto.
                      </Text>
                    </Stack>
                    <Button onClick={() => navigate("/settings")} $variant="outline" $fullWidth>
                      Przejdź do ustawień
                    </Button>
                  </Stack>
                </Card>
              </RightColumnInner>
            </RightColumnWrapper>
          </Flex>
        </Stack>
      </PageContainer>
    </PageSection>
  );

  if (loading) {
    return (
      <Flex $direction="column" $bg="transparent" style={{ minHeight: "100%" }}>
        {pageContent}
      </Flex>
    );
  }

  return (
    <Flex $direction="column" $bg="transparent" style={{ minHeight: "100%" }}>
      {pageContent}
    </Flex>
  );
};

export default ProfilePage;
