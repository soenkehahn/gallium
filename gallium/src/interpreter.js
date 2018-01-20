// @flow

import type { ABT } from "./resolver";
import * as AST from "./AST";

export class IContext<State> {
  state: State;

  befores: Array<IContext<State> => void> = [];
  afters: Array<IContext<State> => void> = [];

  constructor(state: State) {
    this.state = state;
  }

  before() {
    for (const before of this.befores) {
      before(this);
    }
  }

  after() {
    for (const after of this.afters) {
      after(this);
    }
  }
  /*
   *   forNextIteration(up: State => State, down: State => State) {
   *     befores.push(() => {
   *       up();
   *       befores.push(() => {
   *         down();
   *       });
   *     });
   *   }*/

  run<B>(f: IContext<State> => B): B {
    return f(this);
  }
}

export const interpret = <State>(node: ABT): (IContext<State> => any) => ctx => {
  if (node instanceof AST.Paren) {
    return ctx.run(interpret(node.children[0]));
  }

  // TODO: interpret literals
  if (node instanceof AST.NumLit || node instanceof AST.Name) {
    return node.data.value;
  }

  if (node instanceof AST.HApp || node instanceof AST.VApp) {
    const f = ctx.run(interpret(node.children[0]));
    let args = [];
    for (const child of node.children.slice(1)) {
      const result = ctx.run(interpret(child));
      args.push(result);
    }
    return ctx.run(f(args));
  }

  throw new Error("Interpreter Error");
};
