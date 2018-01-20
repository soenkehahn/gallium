// @flow
import { parse } from "./parser";
import { resolve, type BindingContext } from "./resolver";
import { interpret, IContext } from "./interpreter";

describe("interpretation", () => {
  const bindingContext: BindingContext = {
    foo: {
      value: (x: Array<number>) => {
        return `fooTransformer ${JSON.stringify(x)}`;
      }
    },
    bar: {
      value: 100
    }
  };

  const interpreterContext = new IContext({});

  it("should be able to interpret 0's", () => {
    const ast = parse("0");
    const abt = resolve(bindingContext, ast);
    expect(interpreterContext.run(interpret(abt))).toBe(0);
  });

  it("should be able to interpret decimals", () => {
    const ast = parse("0.5");
    const abt = resolve(bindingContext, ast);
    expect(interpreterContext.run(interpret(abt))).toBe(0.5);
  });

  it("should be able to interpret horizontal application", () => {
    const ast = parse("(foo bar 2 3)");
    const abt = resolve(bindingContext, ast);
    expect(interpreterContext.run(interpret(abt))).toBe("fooTransformer [100,2,3]");
  });

  it("should be able to interpret vertical application", () => {
    const ast = parse(`foo
  bar
  2
  3`);
    const abt = resolve(bindingContext, ast);
    expect(interpreterContext.run(interpret(abt))).toBe("fooTransformer [100,2,3]");
  });
});
