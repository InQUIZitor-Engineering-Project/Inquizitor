import React from "react";
import { Flex, Box } from "../../../design-system/primitives";
import logoBook from "../../../assets/logo_book.webp";
import logoText from "../../../assets/logo_text.webp";

const AuthLogos: React.FC = () => (
  <Flex $align="center" $gap="md" $wrap="wrap">
    <Box as="img" src={logoBook} alt="Inquizitor logo" style={{ height: 48 }} />
    <Box as="img" src={logoText} alt="Inquizitor wordmark" style={{ height: 32 }} />
  </Flex>
);

export default AuthLogos;
