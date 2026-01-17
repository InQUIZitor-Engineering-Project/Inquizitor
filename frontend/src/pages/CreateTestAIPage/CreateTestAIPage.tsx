import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Box, Flex, Stack, Heading, Text, Button } from "../../design-system/primitives";
import { AlertBar, Tooltip } from "../../design-system/patterns";
import useGenerateTestForm from "./hooks/useGenerateTestForm";
import SourceSection from "./components/SourceSection";
import PersonalizationSection from "./components/PersonalizationSection";
import StructureCard from "./components/StructureCard";
import DifficultyCard from "./components/DifficultyCard";
import { PageContainer, PageSection } from "../../design-system/patterns";

const ActionButton = styled(Button)`
  ${({ theme }) => theme.media.down("sm")} {
    padding: 6px 10px;
    font-size: 12px;
  }
`;

const CreateTestAIPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, derived, status, actions, refs } = useGenerateTestForm();

  return (
    <Flex $direction="column" $height="100%" $bg="#f5f6f8">
      <Box $flex={1} $width="100%">
        <PageSection $py="xl">
          <PageContainer>
            <Stack style={{ width: "100%", maxWidth: 960, margin: "0 auto" }} $gap="lg">
              <Stack $gap="xs">
                <Flex $justify="space-between" $align="flex-start">
                  <Stack $gap="xs">
                    <Heading as="h1" $level="h2" style={{ fontSize: "clamp(24px, 5vw, 32px)", lineHeight: "1.25" }}>
                      {status.isEditing ? "Dostosuj konfigurację i wygeneruj ponownie" : "Utwórz test dopasowany do swoich potrzeb"}
                    </Heading>
                    <Text
                      $variant="body2"
                      $tone="muted"
                      style={{ fontSize: "clamp(14px, 4vw, 16px)", lineHeight: "1.4" }}
                    >
                      {status.isEditing 
                        ? "Zmień parametry poniżej, aby wygenerować nową wersję testu. Oryginalny test pozostanie bez zmian."
                        : "Wgraj materiał lub wklej treść, wybierz typ pytań oraz poziom trudności, a my wygenerujemy gotowy test."
                      }
                    </Text>
                  </Stack>
                  {status.isEditing && (
                    <ActionButton $variant="ghost" onClick={() => navigate(`/tests/${status.editTestId}`)}>
                      Wróć do testu
                    </ActionButton>
                  )}
                </Flex>
              </Stack>

              <SourceSection
                sourceType={state.sourceType}
                onSourceTypeChange={actions.setSourceType}
                sourceContent={state.sourceContent}
                onSourceContentChange={actions.setSourceContent}
                materialUploading={state.materialUploading}
                materialAnalyzing={state.materialAnalyzing}
                materials={state.materials}
                totalMaterialPages={derived.totalMaterialPages}
                materialLimitExceeded={derived.materialLimitExceeded}
                uploadingMaterials={state.uploadingMaterials}
                fileInputRef={refs.fileInputRef}
                onMaterialChange={actions.handleMaterialChange}
                onFilesUpload={actions.handleFilesUpload}
                onMaterialButtonClick={actions.handleMaterialButtonClick}
                onRemoveMaterial={actions.handleRemoveMaterial}
                onRemoveUpload={actions.handleRemoveUpload}
              />

              <PersonalizationSection
                instructions={state.instructions}
                onChange={actions.setInstructions}
                isOpen={state.isPersonalizationOpen}
                onToggle={() => actions.setIsPersonalizationOpen(!state.isPersonalizationOpen)}
              />

              <StructureCard
                tfCount={state.tfCount}
                singleCount={state.singleCount}
                multiCount={state.multiCount}
                openCount={state.openCount}
                totalClosed={derived.totalClosed}
                totalAll={derived.totalAll}
                onChangeTf={actions.setTfCount}
                onChangeSingle={actions.setSingleCount}
                onChangeMulti={actions.setMultiCount}
                onChangeOpen={actions.setOpenCount}
              />

              <DifficultyCard
                easyCount={state.easyCount}
                mediumCount={state.mediumCount}
                hardCount={state.hardCount}
                totalAll={derived.totalAll}
                totalDifficulty={derived.totalDifficulty}
                easyPct={derived.easyPct}
                medPct={derived.medPct}
                hardPct={derived.hardPct}
                difficultyLocked={derived.difficultyLocked}
                difficultyMismatch={derived.difficultyMismatch}
                onChangeEasy={actions.setEasyCount}
                onChangeMedium={actions.setMediumCount}
                onChangeHard={actions.setHardCount}
              />

              <Flex $justify="center">
                <Tooltip content={derived.primaryValidationError}>
                  <Button
                    $size="lg"
                    onClick={actions.handleGenerate}
                    disabled={
                      status.genLoading || state.materialUploading || !derived.canGenerate
                    }
                  >
                    {status.genLoading 
                      ? "Generuję…" 
                      : status.isEditing 
                        ? "Wygeneruj ponownie" 
                        : "Generuj test"
                    }
                  </Button>
                </Tooltip>
              </Flex>

              {status.genError && <AlertBar variant="danger">{status.genError}</AlertBar>}

            </Stack>
          </PageContainer>
        </PageSection>
      </Box>
    </Flex>
  );
};

export default CreateTestAIPage;
