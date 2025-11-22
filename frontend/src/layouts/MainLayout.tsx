import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import styled from "styled-components";
import Sidebar from "../components/Sidebar/Sidebar";
import ConfirmationModal from "../components/ConfirmationModal/ConfirmationModal";
import { getMyTests, deleteTest } from "../services/test";
import type { TestOut } from "../services/test";
import { NAVBAR_HEIGHT } from "../components/Navbar/Navbar.styles";
export const LayoutWrapper = styled.div`
  display: flex;
  width: 100%;

  height: calc(100vh - ${NAVBAR_HEIGHT}px);
  min-height: calc(100vh - ${NAVBAR_HEIGHT}px);
  flex-shrink: 0;

  /* porządki */
  margin: 0;
  padding: 0;

  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.neutral.silver};
`;

export const ContentArea = styled.div`
  flex: 1;
  height: 100%;       /* Dziedziczy wysokość z LayoutWrapper */
  min-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
`;


const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestOut[]>([]);
  const [testIdToDelete, setTestIdToDelete] = useState<number | null>(null);

  const refreshSidebarTests = async () => {
    try {
      const data = await getMyTests();
      setTests(data);
    } catch (e) {
      console.error("Błąd pobierania testów do sidebara", e);
    }
  };

  useEffect(() => {
    refreshSidebarTests();
  }, []);

  const handleOpenDeleteModal = (testId: number) => {
    setTestIdToDelete(testId);
  };

  const handleCloseModal = () => {
    setTestIdToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (testIdToDelete === null) return;
    try {
      await deleteTest(testIdToDelete);
      await refreshSidebarTests();
      navigate('/dashboard');
    } catch (err: any) {
      alert("Nie udało się usunąć testu: " + err.message);
    } finally {
      handleCloseModal();
    }
  };

  return (
    <LayoutWrapper>
      <Sidebar
        tests={tests}
        onSelect={(testId) => navigate(`/tests/${testId}`)}
        onCreateNew={() => navigate(`/tests/new`)}
        onDelete={handleOpenDeleteModal}
      />

      <ContentArea>
        <Outlet context={{ refreshSidebarTests }} /> 
      </ContentArea>

      {testIdToDelete !== null && (
        <ConfirmationModal
          onCancel={handleCloseModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </LayoutWrapper>
  );
};

export default MainLayout;