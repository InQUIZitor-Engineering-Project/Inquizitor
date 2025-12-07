import React from "react";
import { Box, Flex, Stack, Heading, Text, Button } from "../../design-system/primitives";
import { AlertBar } from "../../design-system/patterns";
import Footer from "../../components/Footer/Footer";
import useGenerateTestForm from "./hooks/useGenerateTestForm";
import SourceSection from "./components/SourceSection";
import PersonalizationSection from "./components/PersonalizationSection";
import StructureCard from "./components/StructureCard";
import DifficultyCard from "./components/DifficultyCard";
import { PageContainer } from "../../styles/common";

const CreateTestPage: React.FC = () => {
  const { state, derived, status, actions, refs } = useGenerateTestForm();

  return (
    <Flex $direction="column" $height="100%" $bg="#f5f6f8" $overflow="hidden">
      <Box $flex={1} $overflowY="auto" $p={40} $width="100%">
        <PageContainer as={Stack} $gap="lg" style={{ margin: "0 auto" }}>
          <Stack $gap="xs">
            <Heading as="h1" $level="h2">
              Utwórz test dopasowany do swoich potrzeb
            </Heading>
            <Text $variant="body2" $tone="muted">
              Wgraj materiał lub wklej treść, wybierz typ pytań oraz poziom trudności, a my wygenerujemy gotowy test.
            </Text>
          </Stack>

          <SourceSection
            sourceType={state.sourceType}
            onSourceTypeChange={actions.setSourceType}
            sourceContent={state.sourceContent}
            onSourceContentChange={actions.setSourceContent}
            materialUploading={state.materialUploading}
            materialData={state.materialData}
            materialError={state.materialError}
            fileInputRef={refs.fileInputRef}
            onMaterialChange={actions.handleMaterialChange}
            onMaterialButtonClick={actions.handleMaterialButtonClick}
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
            <Button
              $size="lg"
              onClick={actions.handleGenerate}
              disabled={status.genLoading || state.materialUploading}
            >
              {status.genLoading ? "Generuję…" : "Generuj test"}
            </Button>
          </Flex>

          {status.genError && <AlertBar variant="danger">{status.genError}</AlertBar>}

          <Footer />
        </PageContainer>
      </Box>
    </Flex>
  );
};

export default CreateTestPage;
