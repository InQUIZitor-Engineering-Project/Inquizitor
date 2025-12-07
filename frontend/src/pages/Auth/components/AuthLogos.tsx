import React from "react";
import styled from "styled-components";
import { Flex, Box } from "../../../design-system/primitives";
import logoBook from "../../../assets/logo_book.png";
import logoText from "../../../assets/logo_tekst.png";

const LogoRow = styled(Flex)`
  ${({ theme }) => theme.media.down("sm")} {
    display: none;
  }
`;

const AuthLogos: React.FC = () => (
  <LogoRow $align="center" $gap="md" $wrap="wrap">
    <Box as="img" src={logoBook} alt="Inquizitor logo" style={{ height: 48 }} />
    <Box as="img" src={logoText} alt="Inquizitor wordmark" style={{ height: 32 }} />
  </LogoRow>
);

export default AuthLogos;
