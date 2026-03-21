"use client";
import React, { useState } from "react";
import styled from "styled-components";
import {
  Stack,
  Heading,
  Text,
  Input,
  Button,
  Textarea,
  Box,
  Flex,
  AlertBar,
  CustomSelect,
  type SelectOption,
} from "@inquizitor/ui";
import { sendContactForm, type ContactFormData } from "@/services/support";

const ContactCard = styled(Box)`
  background: ${({ theme }) => theme.colors.neutral.white};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.elevation.md};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
`;

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    email: "",
    first_name: "",
    last_name: "",
    category: "general",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const categoryOptions: SelectOption[] = [
    { value: "general", label: "Pytanie ogólne", icon: "💬" },
    { value: "bug", label: "Błąd techniczny (Bug)", icon: "🐛" },
    { value: "feature_request", label: "Propozycja funkcji", icon: "💡" },
    { value: "account", label: "Problem z kontem", icon: "👤" },
    { value: "other", label: "Inne", icon: "❓" },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const submitContactForm = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendContactForm({ ...formData });
      setSubmittedEmail(formData.email);
      setSuccess(true);
      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        category: "general",
        subject: "",
        message: "",
      });
    } catch (err: any) {
      setError(err.message || "Wystąpił nieoczekiwany błąd.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    await submitContactForm();
  };

  if (success) {
    return (
      <ContactCard>
        <Stack $gap="lg" $align="center">
          <Heading $level="h3">Dziękujemy za wiadomość!</Heading>
          <Text
            $variant="body1"
            $tone="muted"
            style={{ textAlign: "center" }}
          >
            Otrzymaliśmy Twoje zgłoszenie. Nasz zespół zajmie się nim
            najszybciej jak to możliwe. Odpowiedź wyślemy na adres:{" "}
            <strong>{submittedEmail}</strong>.
          </Text>
          <Button onClick={() => setSuccess(false)}>
            Wyślij kolejną wiadomość
          </Button>
        </Stack>
      </ContactCard>
    );
  }

  return (
    <ContactCard as="form" onSubmit={handleSubmit}>
      <Stack $gap="xl">
        <Stack $gap="xs">
          <Heading $level="h3">Nadal potrzebujesz pomocy?</Heading>
          <Text $variant="body2" $tone="muted">
            Jeśli nie znalazłeś odpowiedzi w FAQ, napisz do nas. Chętnie
            pomożemy!
          </Text>
        </Stack>

        <Flex $gap="md" $wrap="wrap">
          <Stack $gap="xs" style={{ flex: "1 1 200px" }}>
            <Text
              as="label"
              htmlFor="first_name"
              $variant="body3"
              $tone="muted"
            >
              Imię
            </Text>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Jan"
              $fullWidth
            />
          </Stack>
          <Stack $gap="xs" style={{ flex: "1 1 200px" }}>
            <Text
              as="label"
              htmlFor="last_name"
              $variant="body3"
              $tone="muted"
            >
              Nazwisko
            </Text>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Kowalski"
              $fullWidth
            />
          </Stack>
        </Flex>

        <Stack $gap="xs">
          <Text as="label" htmlFor="email" $variant="body3" $tone="muted">
            Email *
          </Text>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="twoj@email.pl"
            $fullWidth
          />
        </Stack>

        <CustomSelect
          label="Kategoria zgłoszenia"
          options={categoryOptions}
          value={formData.category}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, category: val }))
          }
          $fullWidth
        />

        <Stack $gap="xs">
          <Text as="label" htmlFor="subject" $variant="body3" $tone="muted">
            Temat *
          </Text>
          <Input
            id="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            placeholder="W czym możemy pomóc?"
            $fullWidth
          />
        </Stack>

        <Stack $gap="xs">
          <Text as="label" htmlFor="message" $variant="body3" $tone="muted">
            Wiadomość *
          </Text>
          <Textarea
            id="message"
            required
            value={formData.message}
            onChange={handleChange}
            placeholder="Opisz swój problem lub propozycję..."
            $fullWidth
            style={{ minHeight: 120 }}
          />
        </Stack>

        {error && (
          <AlertBar variant="danger">
            <div style={{ whiteSpace: "pre-line" }}>{error}</div>
          </AlertBar>
        )}

        <Button type="submit" $fullWidth $size="lg" disabled={loading}>
          {loading ? "Wysyłanie..." : "Wyślij wiadomość →"}
        </Button>
      </Stack>
    </ContactCard>
  );
};

export default ContactForm;
