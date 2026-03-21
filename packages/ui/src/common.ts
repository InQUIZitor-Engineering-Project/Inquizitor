import styled from "styled-components";

export const LogosWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 420px) {
    gap: 6px;
  }
`;

export const Logo = styled.img`
  height: 40px;
  width: auto;
  object-fit: contain;

  @media (max-width: 480px) {
    height: 34px;
  }

  @media (max-width: 400px) {
    height: 30px;
  }
`;