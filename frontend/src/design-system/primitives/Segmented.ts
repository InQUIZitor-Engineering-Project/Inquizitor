import styled from "styled-components";

export const Segmented = styled.div`
  display: inline-flex;
  position: relative;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tint.t5};
  gap: 4px;
  isolation: isolate;

  ${({ theme }) => theme.media.down("sm")} {
    display: flex;
    width: 100%;
    padding: 3px;
    gap: 2px;
  }

  button {
    position: relative;
    z-index: 2;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: ${({ theme }) => theme.radii.pill};
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.neutral.dGrey};
    cursor: pointer;
    transition: color 0.2s ease-in-out;
    outline: none;
    white-space: nowrap;

    ${({ theme }) => theme.media.down("sm")} {
      flex: 1;
      font-size: 12px;
      padding: 8px 4px;
      text-align: center;
    }
  }

  /* Generic active state (brand) */
  button.is-active {
    color: ${({ theme }) => theme.colors.neutral.white};
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

export const SegmentedIndicator = styled.div`
  position: absolute;
  z-index: 1;
  top: 4px;
  bottom: 4px;
  left: 0;
  background: ${({ theme }) => theme.colors.brand.primary};
  border-radius: ${({ theme }) => theme.radii.pill};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  ${({ theme }) => theme.media.down("sm")} {
    top: 3px;
    bottom: 3px;
  }
`;

export default Segmented;
