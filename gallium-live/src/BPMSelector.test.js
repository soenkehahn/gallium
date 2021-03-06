// @flow
import * as React from "react";
import * as TestUtils from "./test_utils";
import { getBPM, setBPM } from "./playback_test_utils";
import { BPMSelector } from "./BPMSelector";

it("allows maximum bpm of 800", () => {
  const { wrapper, store } = TestUtils.mountWithStore(<BPMSelector />);
  setBPM({ wrapper, value: 900 });
  expect(getBPM({ wrapper })).toBe(800);
});

it("allows minimum bpm of 40", () => {
  const { wrapper, store } = TestUtils.mountWithStore(<BPMSelector />);
  setBPM({ wrapper, value: 20 });
  expect(getBPM({ wrapper })).toBe(40);
});

it("changes bpm on Enter keypress", () => {
  const { wrapper, store } = TestUtils.mountWithStore(<BPMSelector />);
  wrapper
    .find(BPMSelector)
    .find("input")
    .simulate("change", { target: { value: 120 } });
  wrapper
    .find(BPMSelector)
    .find("input")
    .simulate("keyPress", { key: "Enter" });
  expect(store.state.bpm).toBe(120);
});
