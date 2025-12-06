import React, { useEffect, useState } from "react";
import { Flex, Stack, Box } from "../../design-system/primitives";
import Footer from "../../components/Footer/Footer";
import { useLoader } from "../../components/Loader/GlobalLoader";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import ProfileHeader from "./components/ProfileHeader";
import AccountInfoCard from "./components/AccountInfoCard";
import StatsCard from "./components/StatsCard";
import PasswordCard from "./components/PasswordCard";
import profileIllustration from "../../assets/profile.png";

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

  useDocumentTitle("Profil | Inquizitor");

  const pageContent = (
    <Stack $gap="xl" style={{ width: "100%", maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
      <ProfileHeader
        fullName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
        subtitle="Zarządzaj swoim kontem, przeglądaj statystyki quizów i personalizuj swoje doświadczenie w Inquizitor."
        illustrationSrc={profileIllustration}
        error={loadError}
      />

      <Flex $gap="lg" $wrap="wrap">
        <Stack $gap="lg" style={{ flex: "2 1 520px", minWidth: 320 }}>
          <AccountInfoCard
            firstName={profile?.first_name}
            lastName={profile?.last_name}
            email={profile?.email}
            userId={profile?.id}
          />
          <StatsCard stats={stats} />
        </Stack>

        <Box style={{ flex: "1 1 320px", minWidth: 300 }}>
          <PasswordCard
            oldPassword={oldPassword}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            onOldChange={setOldPassword}
            onNewChange={setNewPassword}
            onConfirmChange={setConfirmPassword}
            onSubmit={handlePasswordChange}
            error={passwordError}
            success={passwordSuccess}
          />
        </Box>
      </Flex>
    </Stack>
  );

  if (loading) {
    return (
      <Flex $direction="column" $bg="#f5f6f8" style={{ minHeight: "100vh" }}>
        {pageContent}
        <Footer />
      </Flex>
    );
  }

  return (
    <Flex $direction="column" $bg="#f5f6f8" style={{ minHeight: "100vh" }}>
      {pageContent}
      <Footer />
    </Flex>
  );
};

export default ProfilePage;
