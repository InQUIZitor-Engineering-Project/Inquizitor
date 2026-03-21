"use client";
import React from "react";
import { Flex, Box } from "@inquizitor/ui";

const AuthLogos: React.FC = () => (
  <Flex $align="center" $gap="md" $wrap="wrap">
    <Box
      as="img"
      src="/logo_book.webp"
      alt="Logo Inquizitor - ikona książki"
      style={{ height: 48 }}
    />
    <Box
      as="img"
      src="/logo_text.webp"
      alt="Napis Inquizitor"
      style={{ height: 32 }}
    />
  </Flex>
);

export default AuthLogos;
