"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Stack, Heading, Text, Button } from "@inquizitor/ui";
import { verifyEmail } from "@/services/auth";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>(
    "Trwa weryfikacja adresu e-mail..."
  );
  const hasRun = useRef(false);

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
        // After verification success, redirect to login with success message
        router.replace("/login?verified=success");
      } catch (err: any) {
        router.replace(
          `/login?verified=error&msg=${encodeURIComponent(err?.message || "Nie udało się zweryfikować adresu e-mail.")}`
        );
      }
    };
    run();
  }, [router, searchParams]);

  const handleGoHome = () => {
    router.replace("/login");
  };

  return (
    <Stack
      $gap="md"
      $align="start"
      style={{ maxWidth: 560, margin: "48px auto", padding: "0 16px" }}
    >
      <Heading $level="h2">Weryfikacja adresu e-mail</Heading>
      <Text
        $variant="body1"
        $tone={status === "error" ? "danger" : "muted"}
      >
        {message}
      </Text>
      {status === "error" && (
        <Button $variant="primary" onClick={handleGoHome}>
          Wróć
        </Button>
      )}
    </Stack>
  );
}

const VerifyEmailPage: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
};

export default VerifyEmailPage;
