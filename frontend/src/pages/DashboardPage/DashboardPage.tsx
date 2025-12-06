import React from "react";
import { useNavigate } from "react-router-dom";
import { Flex, Stack } from "../../design-system/primitives";
import Footer from "../../components/Footer/Footer";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useDashboard from "./hooks/useDashboard";
import EmptyState from "./components/EmptyState";
import dashboardWelcome from "../../assets/dashboard_welcome.png";

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
      <EmptyState
        illustrationSrc={EMPTY_ILLUSTRATION}
        title="Stwórz swój pierwszy test, aby zacząć!"
        actionLabel="+ Utwórz nowy"
        onAction={handleCreate}
      />
    );
  }

  return (
    <Flex $direction="column" $bg="#f5f6f8" style={{ minHeight: "calc(100vh - 40px)" }}>
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

      <Footer />

      {testIdToDelete !== null && (
        <ConfirmationModal onCancel={closeDeleteModal} onConfirm={confirmDelete} />
      )}
    </Flex>
  );
};

export default DashboardPage;
