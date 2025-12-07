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

  min-height: calc(100vh - ${NAVBAR_HEIGHT}px);
  flex-shrink: 0;

  /* porządki */
  margin: 0;
  padding: 0;

  overflow-x: hidden;
  background-color: ${({ theme }) => theme.colors.neutral.silver};
`;

export const ContentArea = styled.div`
  flex: 1;
  min-height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const SidebarShell = styled.div<{ $open: boolean }>`
  width: 280px;
  height: 100%;
  min-height: 100%;
  flex-shrink: 0;

  ${({ theme }) => theme.media.down("lg")} {
    position: fixed;
    top: ${NAVBAR_HEIGHT}px;
    left: 0;
    height: calc(100vh - ${NAVBAR_HEIGHT}px);
    width: min(320px, 82vw);
    transform: translateX(${({ $open }) => ($open ? "0" : "-105%")});
    transition: transform 0.2s ease;
    z-index: 200;
  }
`;

const SidebarBackdrop = styled.div<{ $open: boolean }>`
  display: none;

  ${({ theme }) => theme.media.down("lg")} {
    display: ${({ $open }) => ($open ? "block" : "none")};
    position: fixed;
    top: ${NAVBAR_HEIGHT}px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 150;
  }
`;

const MobileSidebarToggle = styled.button`
  display: none;

  ${({ theme }) => theme.media.down("lg")} {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    margin: 12px 12px 0;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
    background: ${({ theme }) => theme.colors.neutral.white};
    box-shadow: ${({ theme }) => theme.shadows["2px"]};
    color: ${({ theme }) => theme.colors.brand.secondary};
    font-weight: 600;
    position: sticky;
    top: 12px;
    align-self: flex-start;
    z-index: 50;
  }
`;


const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestOut[]>([]);
  const [testIdToDelete, setTestIdToDelete] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    setIsSidebarOpen(false);
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
      <SidebarShell $open={isSidebarOpen}>
        <Sidebar
          tests={tests}
          onSelect={(testId) => {
            navigate(`/tests/${testId}`);
            setIsSidebarOpen(false);
          }}
          onCreateNew={() => {
            navigate(`/tests/new`);
            setIsSidebarOpen(false);
          }}
          onDelete={handleOpenDeleteModal}
        />
      </SidebarShell>

      <SidebarBackdrop $open={isSidebarOpen} onClick={() => setIsSidebarOpen(false)} />

      <ContentArea>
        <MobileSidebarToggle onClick={() => setIsSidebarOpen(true)}>Menu</MobileSidebarToggle>
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