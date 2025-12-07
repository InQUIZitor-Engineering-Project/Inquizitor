import styled from "styled-components";

export const LogosWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Logo = styled.img`
  height: 40px;
  width: auto;
  object-fit: contain;
`;

export const PageContainer = styled.div`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 64px 32px;

  ${({ theme }) => theme.media.down("md")} {
    padding: 32px 20px 24px;
  }

  ${({ theme }) => theme.media.down("sm")} {
    padding: 24px 16px 20px;
  }
`;