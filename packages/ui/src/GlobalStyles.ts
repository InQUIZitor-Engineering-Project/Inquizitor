import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle(({ theme }) => `
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    font-family: 'Inter', sans-serif;
    background-color: ${theme.colors.neutral.silver};
    color: ${theme.colors.neutral.dGrey};
    scroll-behavior: smooth;
  }

  img, picture, video, canvas, svg {
    display: block;
    max-width: 100%;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  input, button, textarea, select {
    font: inherit;
  }

  ul[class], ol[class] {
    list-style: none;
  }

  button {
    cursor: pointer;
    background: none;
    border: none;
    outline: none;
  }
`);
