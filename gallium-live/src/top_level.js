// @flow
import {
  type Pattern,
  type Transformer,
  periodic,
  silence,
  alt,
  fast,
  slow,
  shift,
  stack,
  compose
} from "gallium/lib/semantics";
import { type ABT, resolve } from "gallium/lib/resolver";
import { parseTopLevel } from "gallium/lib/parser";
import { type Term, type BindingContext } from "gallium/lib/resolver";
import * as Interpreter from "gallium/lib/interpreter";

export function pitchMap(f: number => number): Transformer<Uint8Array> {
  return pattern => (start, end) => {
    const events = pattern(start, end);
    return events.map(event => ({
      ...event,
      value: new Uint8Array([event.value[0], f(event.value[1]), event.value[2]])
    }));
  };
}

function altWithNumLitInterpreter(numLitInterpreter: number => any): Term {
  return {
    impureValue: (ctx: Interpreter.IContext) => {
      ctx.state = { ...ctx.state, numLitInterpreter };
      return alt;
    }
  };
}

const note = (x: number): Transformer<Uint8Array> => {
  return () =>
    periodic({
      period: 1,
      duration: 1,
      phase: 0,
      value: new Uint8Array([0x90, x, 0x7f]) //note-on
    });
};

const globalContext: BindingContext = {
  i: {
    value: x => x
  },
  m: {
    value: () => silence
  },
  do: {
    value: compose
  },
  compose: {
    value: compose
  },
  stack: {
    value: stack
  },
  alt: {
    value: alt
  },
  note: altWithNumLitInterpreter(note),
  slow: altWithNumLitInterpreter(x => slow(Math.max(x, 1 / 128))),
  fast: altWithNumLitInterpreter(x => fast(Math.min(x, 128))),
  add: altWithNumLitInterpreter(x => pitchMap(p => p + x)),
  sub: altWithNumLitInterpreter(x => pitchMap(p => p - x)),
  shift: altWithNumLitInterpreter(shift)
};

const makeDefaultInterpreterContext = () =>
  new Interpreter.IContext({
    numLitInterpreter: note
  });

export function parseAndResolve(code: string): ABT {
  return resolve(globalContext, parseTopLevel(code));
}

export function interpret(node: ABT): Pattern<Uint8Array> {
  const ctx = makeDefaultInterpreterContext();
  const transform = ctx.run(Interpreter.interpret(node));
  const pattern = transform(silence);
  return pattern;
}
