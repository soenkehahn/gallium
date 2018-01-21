// @flow

import type { ABT } from "./resolver";
import * as AST from "./AST";

type IState = {
  counter: number
}

export class IContext {
  state: IState;

  constructor(state: IState) {
    this.state = state;
  }

  run<B>(f: IContext => B): B {
    return f(this);
  }
}

type Interpreter = ABT => IContext => any;

export const interpret: Interpreter = (node: ABT): (IContext => any) => ctx => {
  if (node instanceof AST.Paren) {
    return ctx.run(interpret(node.children[0]));
  }

  if (node instanceof AST.NumLit || node instanceof AST.Name) {
    return node.data.value;
  }
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
