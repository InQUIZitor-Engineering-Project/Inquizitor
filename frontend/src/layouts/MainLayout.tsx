import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import { Modal } from "../design-system/patterns";
import { getMyTests, deleteTest } from "../services/test";
import type { TestOut } from "../services/test";
import { NAVBAR_HEIGHT, NAVBAR_HEIGHT_MOBILE } from "../components/Navbar/Navbar.styles";

export const LayoutWrapper = styled.div`
  display: flex;
  width: 100%;
  height: calc(100dvh - ${NAVBAR_HEIGHT}px);
  min-height: calc(100dvh - ${NAVBAR_HEIGHT}px);
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.neutral.silver};
  position: relative;

  @media (max-width: 768px) {
    height: calc(100dvh - ${NAVBAR_HEIGHT_MOBILE}px);
    min-height: calc(100dvh - ${NAVBAR_HEIGHT_MOBILE}px);
  }
`;

export const ContentArea = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

export const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

export const PageContentWrapper = styled.div`
  flex: 1;
  width: 100%;
`;

const SidebarOverlay = styled.div<{ $open: boolean }>`
  display: none;
  position: fixed;
  left: 0;
  right: 0;
  top: ${NAVBAR_HEIGHT}px;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 105;

  @media (max-width: 1024px) {
    display: ${({ $open }) => ($open ? "block" : "none")};
  }

  @media (max-width: 768px) {
    top: ${NAVBAR_HEIGHT_MOBILE}px;
  }
`;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tests, setTests] = useState<TestOut[]>([]);
  const [testIdToDelete, setTestIdToDelete] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    const handleToggle = () => setSidebarOpen((prev) => !prev);
    window.addEventListener("inquizitor:toggle-sidebar", handleToggle as EventListener);
    return () => {
      window.removeEventListener("inquizitor:toggle-sidebar", handleToggle as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth > 1024 && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
        isDrawerOpen={sidebarOpen}
        onCloseDrawer={() => setSidebarOpen(false)}
        onSelect={(testId) => {
          navigate(`/tests/${testId}`);
          setSidebarOpen(false);
        }}
        onCreateNew={() => {
          navigate(`/tests/new`);
          setSidebarOpen(false);
        }}
        onDelete={handleOpenDeleteModal}
      />

      <ContentArea id="main-content-area">
        <ScrollableContent>
          <PageContentWrapper>
            <Outlet context={{ refreshSidebarTests }} /> 
          </PageContentWrapper>
          <Footer />
        </ScrollableContent>
      </ContentArea>

      <SidebarOverlay $open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      {testIdToDelete !== null && (
        <Modal
          isOpen={true}
          title="Usuń test"
          onClose={handleCloseModal}
          onConfirm={handleConfirmDelete}
          variant="danger"
          confirmLabel="Usuń"
          confirmLoading={false}
        >
          Tej operacji nie można cofnąć. Wszystkie pytania w tym teście również zostaną usunięte.
        </Modal>
      )}
    </LayoutWrapper>
  );
};

export default MainLayout;