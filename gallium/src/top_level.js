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
import {
  type Term,
  type BindingContext,
  type ABT,
  resolve,
  pureFn,
  type Impure
} from "./resolver";
import { parseTopLevel } from "./parser";
import * as Interpreter from "./interpreter";
import { IContext } from "./interpreter";
import * as Types from "./types";
import * as TypeChecker from "./type_checker";

export function pitchMap(f: number => number): Transformer<Parameters> {
  return pattern => (start, end) => {
    const events = pattern(start, end);
    return events.map(event => ({
      ...event,
      value: {
        ...event.value,
        pitch: f(event.value.pitch)
      }
    }));
  };
}

function altWithNumLitInterpreter<A>(
  numLitInterpreter: number => IContext => A
): Term<(Array<Transformer<A>>) => Impure<Transformer<A>>> {
  return {
    type: Types.listProcessor(Types.transformer, Types.transformer),
    impureValue: (ctx: IContext) => {
      const { numLitInterpreter: oldNumLitInterpreter } = ctx.state;
      ctx.state = { ...ctx.state, numLitInterpreter };
      return transformers => ctx => {
        const ret = alt(transformers);
        ctx.state = { ...ctx.state, numLitInterpreter: oldNumLitInterpreter };
        return ret;
      };
    }
  };
}

function altWithPureNumLitInterpreter<A>(
  pureNumLitInterpreter: number => A
): Term<(Array<Transformer<A>>) => Impure<Transformer<A>>> {
  return altWithNumLitInterpreter(pureFn(pureNumLitInterpreter));
}

export type Parameters = {
  channel: number,
  pitch: number
};

const note = (pitch: number): Impure<Transformer<Parameters>> => {
  return ctx => {
    const value = {
      channel: ctx.state.channel,
      pitch
    };
    return () =>
      periodic({
        period: 1,
        duration: 1,
        phase: 0,
        value
      });
  };
};

const globalContext: BindingContext = {
  i: {
    type: Types.transformer,
    value: x => x
  },
  m: {
    type: Types.transformer,
    value: () => silence
  },
  do: {
    type: Types.listProcessor(Types.transformer, Types.transformer),
    value: pureFn(compose)
  },
  compose: {
    type: Types.listProcessor(Types.transformer, Types.transformer),
    value: pureFn(compose)
  },
  stack: {
    type: Types.listProcessor(Types.transformer, Types.transformer),
    value: pureFn(stack)
  },
  alt: {
    type: Types.listProcessor(Types.transformer, Types.transformer),
    value: pureFn(alt)
  },
  note: altWithNumLitInterpreter(note),
  slow: altWithPureNumLitInterpreter(x => slow(Math.max(x, 1 / 128))),
  fast: altWithPureNumLitInterpreter(x => fast(Math.min(x, 128))),
  add: altWithPureNumLitInterpreter(x => pitchMap(p => p + x)),
  sub: altWithPureNumLitInterpreter(x => pitchMap(p => p - x)),
  shift: altWithPureNumLitInterpreter(shift),
  channel: {
    type: Types.func(Types.number, Types.transformer),
    impureValue: ctx => {
      const state0 = ctx.state;
      ctx.state = { ...ctx.state, numLitInterpreter: x => () => x };
      return ([channel]) => ctx => {
        ctx.state = {
          ...ctx.state,
          channel: channel,
          numLitInterpreter: state0.numLitInterpreter
        };
        return x => x;
      };
    }
  }
};

const makeDefaultInterpreterContext = () =>
  new IContext({
    numLitInterpreter: note,
    channel: 0
  });

export function parseAndResolve(code: string): ABT {
  const node = resolve(globalContext, parseTopLevel(code));
  TypeChecker.check(node, { type: Types.transformer });
  return node;
}

export function interpret(node: ABT): Pattern<Parameters> {
  const ctx = makeDefaultInterpreterContext();
  const transform = ctx.run(Interpreter.interpret(node));
  const pattern = transform(silence);
  return pattern;
}
