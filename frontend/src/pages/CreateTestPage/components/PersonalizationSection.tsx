import React from "react";
import { Box, Divider, Textarea } from "../../../design-system/primitives";
import { CollapsibleSection, FormField } from "../../../design-system/patterns";

export interface PersonalizationSectionProps {
  instructions: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const PersonalizationSection: React.FC<PersonalizationSectionProps> = ({
  instructions,
  onChange,
  isOpen,
  onToggle,
}) => {
  return (
    <CollapsibleSection
      title="Personalizacja testu (opcjonalne)"
      hint="Opcjonalne wytyczne dla AI (np. styl pytań, temat przewodni)."
      isOpen={isOpen}
      onToggle={onToggle}
      isActive={instructions.trim().length > 0}
      withCard
    >
      <Box $my="md">
        <Divider />
      </Box>
      <FormField
        label="Dodatkowe instrukcje"
        hint={`${instructions.trim().length} znaków`}
        fullWidth
      >
        <Textarea
          $fullWidth
          $minHeight="80px"
          value={instructions}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Np. 'Skup się na datach i nazwiskach', 'Pytania mają być podchwytliwe'..."
        />
      </FormField>
    </CollapsibleSection>
  );
};

export default PersonalizationSection;
