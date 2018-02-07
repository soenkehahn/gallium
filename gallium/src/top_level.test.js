// @flow
import * as TopLevel from "./top_level";
import { silence, type Pattern } from "./semantics";
import * as MIDIUtils from "./midi_utils";

const parse = (code: string): Pattern<TopLevel.Parameters> => {
  return TopLevel.interpret(TopLevel.parseAndResolve(code));
};

it("allows arguments", () => {
  const pattern = parse(`note 60 72`);
  expect(pattern(0, 1)).toEqual([
    { start: 0, end: 1, value: { channel: 0, pitch: 60 } }
  ]);
  expect(pattern(1, 2)).toEqual([
    { start: 1, end: 2, value: { channel: 0, pitch: 72 } }
  ]);
});

it("throws a type error when given a list processor with no arguments", () => {
  const parsePattern = () => parse(`note`);
  expect(parsePattern).toThrow();
});

it("throws a type error when given an invalid parenthesized argument", () => {
  const parsePattern = () => parse(`do (shift) 0.5`);
  expect(parsePattern).toThrow();
});

it("allows changes in channel", () => {
  const pattern = parse(`do (channel 1) (note 0)`);
  expect(pattern(0, 1)).toEqual([
    { start: 0, end: 1, value: { channel: 1, pitch: 0 } }
  ]);
});

it("TODO: rename test", () => {
  const pattern = parse(`do (channel 1) (note 0) (channel 1)`);
  expect(pattern(0, 1)).toEqual([
    { start: 0, end: 1, value: { channel: 1, pitch: 0 } }
  ]);
});

test("i is a no-op", () => {
  expect(parse(`do (note 0) i`)(0, 1)).toEqual(parse(`do (note 0)`)(0, 1));
});

test("m mutes", () => {
  expect(parse(`do (note 0) m`)(0, 1)).toEqual([]);
});
