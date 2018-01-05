// @flow
import { css, injectGlobal } from "styled-components";
import styledNormalize from "styled-normalize";

export function applyGlobalStyles() {
  injectGlobal`
    ${styledNormalize}
    body {
    }
  `;
}

export const transition = css`
  transition: all 100ms ease-in-out;
`;
