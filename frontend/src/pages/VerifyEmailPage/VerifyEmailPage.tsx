import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Stack, Heading, Text, Button } from "../../design-system/primitives";
import { verifyEmail } from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Trwa weryfikacja adresu e-mail...");
  const hasRun = useRef(false); // prevent double-run in React StrictMode

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Brak tokenu weryfikacyjnego w adresie.");
      return;
    }

    const run = async () => {
      try {
        await verifyEmail(token, false);
        navigate("/login?verified=success", {
          replace: true,
          state: { verifiedMessage: "Konto zostało utworzone i potwierdzone. Możesz się zalogować." },
        });
      } catch (err: any) {
        navigate("/login?verified=error", {
          replace: true,
          state: { verifiedError: err?.message || "Nie udało się zweryfikować adresu e-mail." },
        });
      }
    };
    run();
  }, [navigate, searchParams]);

  const handleGoHome = () => {
    navigate(user ? "/dashboard" : "/login", { replace: true });
  };

  return (
    <Stack $gap="md" $align="start" style={{ maxWidth: 560, margin: "48px auto", padding: "0 16px" }}>
      <Heading $level="h2">Weryfikacja adresu e-mail</Heading>
      <Text $variant="body1" $tone={status === "error" ? "danger" : "muted"}>
        {message}
      </Text>
      {status === "error" && (
        <Button $variant="primary" onClick={handleGoHome}>
          Wróć
        </Button>
      )}
    </Stack>
  );
};

export default VerifyEmailPage;
