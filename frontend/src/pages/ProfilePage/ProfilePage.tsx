import React, { useEffect, useState } from "react";
import Footer from "../../components/Footer/Footer";
import { useLoader } from "../../components/Loader/GlobalLoader";

import {
  PageWrapper,
  ContentWrapper,
  HeaderRow,
  UserInfoBlock,
  Greeting,
  Subtext,
  UserMeta,
  MetaPill,
  IllustrationWrapper,
  ProfileIllustration,
  MainGrid,
  Card,
  CardHeaderRow,
  CardHint,
  StatsGrid,
  StatBox,
  StatLabel,
  StatValue,
  SecondaryValue,
  Divider,
  BarSection,
  BarRow,
  BarLabel,
  BarTrack,
  BarFill,
  PasswordCard,
  FormField,
  SaveButton,
  ErrorText,
  SuccessText,
} from "./ProfilePage.styles";
import useDocumentTitle from "../../components/GeneralComponents/Hooks/useDocumentTitle";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

// Dostosowane do tego, co REALNIE zwraca backend
interface UserStatistics {
  total_tests: number;
  total_questions: number;
  total_files: number;
  avg_questions_per_test: number;
  last_test_created_at: string | null;

  // opcjonalnie (na przyszłość, jeśli dodasz na backendzie)
  total_closed_questions?: number;
  total_open_questions?: number;
  total_easy_questions?: number;
  total_medium_questions?: number;
  total_hard_questions?: number;
}

const ProfilePage: React.FC = () => {
  const { withLoader } = useLoader();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Uzupełnij wszystkie pola.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Nowe hasła nie są zgodne.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Nowe hasło musi mieć co najmniej 8 znaków.");
      return;
    }

    try {
      await withLoader(async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("Brak autoryzacji. Zaloguj się ponownie.");
        }

        const res = await fetch(`${API_BASE}/users/me/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || "Nie udało się zmienić hasła.");
        }

        setPasswordSuccess("Hasło zostało pomyślnie zmienione.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      });
    } catch (err: any) {
      setPasswordError(err.message || "Wystąpił błąd podczas zmiany hasła.");
    }
  };

  // --- Helpery do statystyk ---

  const totalQuestions = stats?.total_questions ?? 0;
  const avgQuestions =
    stats && typeof stats.avg_questions_per_test === "number"
      ? stats.avg_questions_per_test
      : 0;

  // Breakdown będzie użyty tylko jeśli backend zwróci te pola
  const hasBreakdown =
    !!stats &&
    (stats.total_closed_questions !== undefined ||
      stats.total_open_questions !== undefined ||
      stats.total_easy_questions !== undefined ||
      stats.total_medium_questions !== undefined ||
      stats.total_hard_questions !== undefined);

  const pct = (value: number | undefined) => {
    if (!stats || !totalQuestions || !value) return 0;
    return Math.round((value / totalQuestions) * 100);
  };

  useDocumentTitle("Profil | Inquizitor");

  if (loading) {
    return (
      <PageWrapper>
        <ContentWrapper />
        <Footer />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <ContentWrapper>
        <HeaderRow>
          <UserInfoBlock>
            <Greeting>
              {profile
                ? `${profile.first_name} ${profile.last_name}`
                : "Twój profil"}
            </Greeting>
            <Subtext>
              Zarządzaj swoim kontem, przeglądaj statystyki quizów i
              personalizuj swoje doświadczenie w Inquizitor.
            </Subtext>

            {loadError && <ErrorText>{loadError}</ErrorText>}
          </UserInfoBlock>

          <IllustrationWrapper>
            <ProfileIllustration
              src="/src/assets/landing_main.png"
              alt="Profil użytkownika"
            />
          </IllustrationWrapper>
        </HeaderRow>

        <MainGrid>
          {/* LEWA KOLUMNA: Dane konta + Statystyki */}
          <div>
            {/* Dane konta */}
            <Card>
              <CardHeaderRow>
                <h3>Dane konta</h3>
              </CardHeaderRow>
              {profile && (
                <>
                  <CardHint>
                    To są podstawowe informacje powiązane z Twoim kontem.
                  </CardHint>
                  <StatsGrid>
                    <StatBox>
                      <StatLabel>Imię i nazwisko</StatLabel>
                      <StatValue>
                        {profile.first_name} {profile.last_name}
                      </StatValue>
                    </StatBox>
                    <StatBox>
                      <StatLabel>Adres e-mail</StatLabel>
                      <StatValue>{profile.email}</StatValue>
                    </StatBox>
                    <StatBox>
                      <StatLabel>ID użytkownika</StatLabel>
                      <StatValue>{profile.id}</StatValue>
                    </StatBox>
                  </StatsGrid>
                </>
              )}
            </Card>

            {/* Statystyki */}
            <Card style={{ marginTop: 16 }}>
              <CardHeaderRow>
                <h3>Twoje statystyki</h3>
                <CardHint>
                  Podsumowanie aktywności na podstawie wygenerowanych testów.
                </CardHint>
              </CardHeaderRow>

              <StatsGrid>
                <StatBox>
                  <StatLabel>Testy</StatLabel>
                  <StatValue>{stats?.total_tests ?? 0}</StatValue>
                  <SecondaryValue>łącznie wygenerowanych</SecondaryValue>
                </StatBox>

                <StatBox>
                  <StatLabel>Pytania</StatLabel>
                  <StatValue>{totalQuestions}</StatValue>
                  <SecondaryValue>we wszystkich testach</SecondaryValue>
                </StatBox>

                <StatBox>
                  <StatLabel>Śr. pytań / test</StatLabel>
                  <StatValue>{avgQuestions.toFixed(1)}</StatValue>
                  <SecondaryValue>efektywność generowania</SecondaryValue>
                </StatBox>

                <StatBox>
                  <StatLabel>Materiały</StatLabel>
                  <StatValue>{stats?.total_files ?? 0}</StatValue>
                  <SecondaryValue>wgrane pliki źródłowe</SecondaryValue>
                </StatBox>
              </StatsGrid>

              {/* Struktura pytań - tylko jeśli backend zwraca breakdown */}
              {hasBreakdown && totalQuestions > 0 ? (
                <>
                  <Divider />
                  <BarSection>
                    <CardHint>Struktura Twoich pytań</CardHint>

                    {stats?.total_closed_questions !== undefined && (
                      <BarRow>
                        <BarLabel>Zamknięte</BarLabel>
                        <BarTrack>
                          <BarFill
                            $color="rgba(33, 150, 243, 0.65)"
                            $width={pct(stats.total_closed_questions)}
                          />
                        </BarTrack>
                        <span>
                          {stats.total_closed_questions} (
                          {pct(stats.total_closed_questions)}%)
                        </span>
                      </BarRow>
                    )}

                    {stats?.total_open_questions !== undefined && (
                      <BarRow>
                        <BarLabel>Otwarte</BarLabel>
                        <BarTrack>
                          <BarFill
                            $color="rgba(156, 39, 176, 0.65)"
                            $width={pct(stats.total_open_questions)}
                          />
                        </BarTrack>
                        <span>
                          {stats.total_open_questions} (
                          {pct(stats.total_open_questions)}%)
                        </span>
                      </BarRow>
                    )}

                    {stats?.total_easy_questions !== undefined && (
                      <BarRow>
                        <BarLabel>Łatwe</BarLabel>
                        <BarTrack>
                          <BarFill
                            $color="rgba(76, 175, 80, 0.8)"
                            $width={pct(stats.total_easy_questions)}
                          />
                        </BarTrack>
                        <span>
                          {stats.total_easy_questions} (
                          {pct(stats.total_easy_questions)}%)
                        </span>
                      </BarRow>
                    )}

                    {stats?.total_medium_questions !== undefined && (
                      <BarRow>
                        <BarLabel>Średnie</BarLabel>
                        <BarTrack>
                          <BarFill
                            $color="rgba(255, 193, 7, 0.9)"
                            $width={pct(stats.total_medium_questions)}
                          />
                        </BarTrack>
                        <span>
                          {stats.total_medium_questions} (
                          {pct(stats.total_medium_questions)}%)
                        </span>
                      </BarRow>
                    )}

                    {stats?.total_hard_questions !== undefined && (
                      <BarRow>
                        <BarLabel>Trudne</BarLabel>
                        <BarTrack>
                          <BarFill
                            $color="rgba(244, 67, 54, 0.9)"
                            $width={pct(stats.total_hard_questions)}
                          />
                        </BarTrack>
                        <span>
                          {stats.total_hard_questions} (
                          {pct(stats.total_hard_questions)}%)
                        </span>
                      </BarRow>
                    )}
                  </BarSection>
                </>
              ) : (
                <>
                  <Divider />
                  <CardHint>
                    Szczegółowa struktura pytań będzie dostępna po dodaniu
                    dodatkowych statystyk w systemie.
                  </CardHint>
                </>
              )}

              {stats?.last_test_created_at && (
                <>
                  <Divider />
                  <CardHint>
                    Ostatni test wygenerowano:{" "}
                    {new Date(
                      stats.last_test_created_at,
                    ).toLocaleString("pl-PL")}
                  </CardHint>
                </>
              )}
            </Card>
          </div>

          {/* PRAWA KOLUMNA: Zmiana hasła */}
          <div>
            <PasswordCard as="form" onSubmit={handlePasswordChange}>
              <CardHeaderRow>
                <h3>Zmień hasło</h3>
                <CardHint>
                  Użyj silnego, unikalnego hasła, aby zabezpieczyć swoje konto.
                </CardHint>
              </CardHeaderRow>

              <FormField>
                <label>Aktualne hasło</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Wpisz aktualne hasło"
                />
              </FormField>

              <FormField>
                <label>Nowe hasło</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 znaków"
                />
              </FormField>

              <FormField>
                <label>Powtórz nowe hasło</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Powtórz nowe hasło"
                />
              </FormField>

              <SaveButton type="submit">Zapisz nowe hasło</SaveButton>

              {passwordError && <ErrorText>{passwordError}</ErrorText>}
              {passwordSuccess && <SuccessText>{passwordSuccess}</SuccessText>}
            </PasswordCard>
          </div>
        </MainGrid>
      </ContentWrapper>
      <Footer />
    </PageWrapper>
  );
};

export default ProfilePage;
