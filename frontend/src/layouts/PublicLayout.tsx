import React from "react";
import { Outlet } from "react-router-dom";
import styled from "styled-components";
import Footer from "../components/Footer/Footer";
import { NAVBAR_HEIGHT } from "../components/Navbar/Navbar.styles";

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - ${NAVBAR_HEIGHT}px);
  background-color: ${({ theme }) => theme.colors.neutral.silver};
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const PublicLayout: React.FC = () => {
  return (
    <LayoutWrapper>
      <ContentArea>
        <Outlet />
      </ContentArea>
      <Footer />
    </LayoutWrapper>
  );
};

export default PublicLayout;

