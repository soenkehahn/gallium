// @flow
import { injectGlobal } from "styled-components";
import styledNormalize from 'styled-normalize';


export function applyGlobalStyles () {
  injectGlobal`
    ${styledNormalize}
    body {
    }
  `;
};
