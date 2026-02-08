import React, { useState } from "react";
import { Flex, Stack } from "../../design-system/primitives";
import { PageContainer, PageSection } from "../../design-system/patterns";
import { useAuth } from "../../hooks/useAuth";
import { useLoader } from "../../components/Loader/GlobalLoader";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import ProfileHeader from "../ProfilePage/components/ProfileHeader";
import PasswordCard from "../ProfilePage/components/PasswordCard";
import ConsentsCard from "./components/ConsentsCard";
import DeleteAccountCard from "./components/DeleteAccountCard";
import { apiRequest } from "../../services/api";
import { useNavigate } from "react-router-dom";
import settingsIllustration from "../../assets/profile.webp"; // Reusing profile illustration for now

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { withLoader } = useLoader();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [consentLoading, setConsentLoading] = useState(false);

  useDocumentTitle("Ustawienia | Inquizitor");

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
        const res = await apiRequest("/users/me/change-password", {
          method: "POST",
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

  const handleUpdateConsents = async (terms: boolean, marketing: boolean) => {
    setConsentLoading(true);
    try {
      await withLoader(async () => {
        const res = await apiRequest("/users/me/consents", {
          method: "PUT",
          body: JSON.stringify({
            terms_accepted: terms,
            marketing_accepted: marketing,
          }),
        });

        if (!res.ok) {
          throw new Error("Nie udało się zaktualizować zgód.");
        }
        
        // Refresh user data in context to reflect changes
        window.location.reload(); 
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConsentLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await withLoader(async () => {
        const res = await apiRequest("/users/me", {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Nie udało się usunąć konta.");
        }

        logout();
        navigate("/login");
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <PageSection $py="xl">
      <PageContainer>
        <Stack $gap="xl" style={{ width: "100%" }}>
          <ProfileHeader
            fullName="Ustawienia konta"
            subtitle="Zarządzaj swoim bezpieczeństwem, prywatnością i preferencjami konta."
            illustrationSrc={settingsIllustration}
          />

          <Flex $gap="lg" $wrap="wrap">
            <Stack $gap="lg" style={{ flex: "1 1 400px" }}>
              <ConsentsCard
                termsAccepted={user?.terms_accepted ?? false}
                marketingAccepted={user?.marketing_accepted ?? false}
                onUpdate={handleUpdateConsents}
                loading={consentLoading}
              />
              <DeleteAccountCard onDelete={handleDeleteAccount} />
            </Stack>

            <Stack $gap="lg" style={{ flex: "1 1 400px" }}>
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
            </Stack>
          </Flex>
        </Stack>
      </PageContainer>
    </PageSection>
  );
};

export default SettingsPage;
