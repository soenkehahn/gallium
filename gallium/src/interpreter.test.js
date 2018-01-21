// @flow
import { parse } from "./parser";
import { resolve, type BindingContext } from "./resolver";
import { interpret, IContext } from "./interpreter";

type State = {
  counter: number
};

const bindingContext: BindingContext = {
  pureFunction: {
    value: (x: Array<number>) => (ctx: IContext): string => {
      return `pureFunction ${JSON.stringify(x)}`;
    }
  },
  statefulFunction: {
    value: (x: Array<number>) => (ctx: IContext): string => {
      ctx.state.counter += 1;
      return `statefulFunction ${JSON.stringify(x)}`;
    }
  },
  bar: {
    value: 100
  }
};

const makeInterpreterContext = (): IContext => {
  return new IContext({
    counter: 0
  });
};

describe("interpretation", () => {

  it("should be able to interpret 0's", () => {
    const ast = parse("0");
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe(0);
  });

  it("should be able to interpret decimals", () => {
    const ast = parse("0.5");
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe(0.5);
  });

  it("should be able to interpret horizontal application", () => {
    const ast = parse("(pureFunction bar 2 3)");
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe("pureFunction [100,2,3]");
  });

  it("should be able to interpret vertical application", () => {
    const ast = parse(`pureFunction
  bar
  2
  3`);
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe("pureFunction [100,2,3]");
  });

  it("should be able to execute stateful computations", () => {
    const ast = parse(`statefulFunction
  bar
  2
  3`);
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe("statefulFunction [100,2,3]");
    expect(ctx.state.counter).toBe(1);
  });

  it("should be able to execute single-level stateful computations", () => {
    const ast = parse(`statefulFunction
  bar
  2
  3`);
    const abt = resolve(bindingContext, ast);
    const ctx = makeInterpreterContext();
    expect(ctx.run(interpret(abt))).toBe("statefulFunction [100,2,3]");
    expect(ctx.state.counter).toBe(1);
  });
});
