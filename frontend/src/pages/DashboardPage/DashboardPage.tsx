import React from "react";
import { useNavigate } from "react-router-dom";
import { Flex, Stack } from "../../design-system/primitives";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useDashboard from "./hooks/useDashboard";
import EmptyState from "./components/EmptyState";
import dashboardWelcome from "../../assets/dashboard_welcome.png";
import { PageContainer, PageSection, Modal } from "../../design-system/patterns";

const EMPTY_ILLUSTRATION = dashboardWelcome;
const HUB_ILLUSTRATION = dashboardWelcome;

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { tests, loading, testIdToDelete, closeDeleteModal, confirmDelete } = useDashboard();

  useDocumentTitle("Panel główny | Inquizitor");

  if (loading) return null; // could be spinner

  const handleCreate = () => navigate(`/tests/new`);

  if (tests.length === 0) {
    return (
      <PageSection $py="xl">
        <PageContainer>
          <EmptyState
            illustrationSrc={EMPTY_ILLUSTRATION}
            title="Stwórz swój pierwszy test, aby zacząć!"
            actionLabel="+ Utwórz nowy"
            onAction={handleCreate}
          />
        </PageContainer>
      </PageSection>
    );
  }

  return (
    <Flex $direction="column" $bg="#f5f6f8" style={{ minHeight: "100%" }}>
      <PageSection $py="xl">
        <PageContainer>
          <Flex $flex={1} $width="100%" $justify="center">
            <Stack style={{ width: "100%" }}>
              <EmptyState
                illustrationSrc={HUB_ILLUSTRATION}
                title="Witaj w panelu InQUIZitor!"
                description="Wybierz istniejący test z panelu bocznego, aby zobaczyć szczegóły, lub utwórz nowy."
                actionLabel="+ Utwórz nowy"
                onAction={handleCreate}
                isHub
              />
            </Stack>
          </Flex>
        </PageContainer>
      </PageSection>

      {testIdToDelete !== null && (
        <Modal
          isOpen={true}
          title="Usuń test"
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          variant="danger"
          confirmLabel="Usuń"
        >
          Tej operacji nie można cofnąć. Wszystkie pytania w tym teście również zostaną usunięte.
        </Modal>
      )}
    </Flex>
  );
};

export default DashboardPage;
