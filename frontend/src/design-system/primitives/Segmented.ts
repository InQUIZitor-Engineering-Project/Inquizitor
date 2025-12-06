import styled from "styled-components";

export const Segmented = styled.div`
  display: inline-flex;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tint.t5};
  gap: 4px;

  button {
    font-size: 12px;
    padding: 6px 10px;
    border-radius: ${({ theme }) => theme.radii.pill};
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.neutral.dGrey};
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  /* Generic active state (brand) */
  .is-active {
    background: ${({ theme }) => theme.colors.brand.primary};
    color: ${({ theme }) => theme.colors.neutral.white};
    box-shadow: ${({ theme }) => theme.shadows["2px"] || "0 2px 8px rgba(0,0,0,0.12)"};
  }

  /* Legacy dual-color states kept for backwards compatibility */
  .is-active-closed {
    background: rgba(33, 150, 243, 0.12);
    color: #1565c0;
  }
  .is-active-open {
    background: rgba(156, 39, 176, 0.12);
    color: #6a1b9a;
  }
`;

export default Segmented;
