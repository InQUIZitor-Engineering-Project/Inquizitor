import React from "react";
import { Card, Stack, Heading, Text } from "../../../design-system/primitives";
import { CustomSelect } from "../../../design-system/patterns";
import { usePersonalization } from "../../../context/PersonalizationContext";

const PersonalizationCard: React.FC = () => {
  const { fontSize, colorTheme, setFontSize, setColorTheme } = usePersonalization();

  const fontSizeOptions = [
    { value: "small", label: "Mała", icon: "Aa" },
    { value: "medium", label: "Średnia", icon: "Aa" },
    { value: "large", label: "Duża", icon: "Aa" },
  ];

  const fontSizeToPx = (size: "small" | "medium" | "large") =>
    size === "small" ? "13px" : size === "large" ? "17px" : "15px";

  const getFontSizeOptionStyle = (option: { value: string; label: string; icon?: React.ReactNode }) => ({
    fontSize: fontSizeToPx(option.value as "small" | "medium" | "large"),
    lineHeight: 1.4,
  });

  const colorThemeOptions = [
    { value: "default", label: "Domyślny (Jasny)", icon: "☀️" },
    { value: "eye-friendly", label: "Przyjazny dla oczu (Sepia)", icon: "👓" },
    { value: "dark", label: "Ciemny", icon: "🌙" },
  ];

  return (
    <Card $p="lg" $shadow="md" $variant="elevated">
      <Stack $gap="md">
        <Stack $gap="4px">
          <Heading $level="h3">Personalizacja</Heading>
          <Text $variant="body3" $tone="muted">
            Dostosuj wygląd aplikacji do swoich potrzeb.
          </Text>
        </Stack>

        <Stack $gap="md">
          <CustomSelect
            label="Wielkość czcionki"
            options={fontSizeOptions}
            value={fontSize}
            onChange={(val) => setFontSize(val as any)}
            getOptionLabelStyle={getFontSizeOptionStyle}
            $fullWidth
          />

          <CustomSelect
            label="Motyw kolorystyczny"
            options={colorThemeOptions}
            value={colorTheme}
            onChange={(val) => setColorTheme(val as any)}
            $fullWidth
          />
        </Stack>
      </Stack>
    </Card>
  );
};

export default PersonalizationCard;
