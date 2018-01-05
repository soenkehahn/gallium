// @flow
import * as React from "react";
import * as LocalStorage from "./local_storage";
import styled from "styled-components";

type State = {
  loading: boolean,
  error: ?string,
  value: any
};

export class OutputSelector extends React.Component<
  { onChange: string => Promise<void> },
  State
> {
  options: Array<string> = [];

  state = { loading: true, error: undefined, value: undefined };

  constructor() {
    super();
  }

  componentDidMount() {
    this.loadOptions();
  }

  async loadOptions() {
    try {
      const access = await (navigator: any).requestMIDIAccess();
      for (const output of access.outputs.values()) {
        this.options.push(output.name);
        this.setState({ loading: false });
      }
      const lastPort = LocalStorage.loadOutputPort();
      if (this.options.includes(lastPort)) {
        this.setState({ value: lastPort });
        this.props.onChange(lastPort);
      }
    } catch (e) {
      this.setState({ error: e.toString() });
    }
  }

  onChange = (e: *) => {
    const outputPort = e.target.value;
    LocalStorage.saveOutputPort(outputPort);
    this.props.onChange(outputPort);
    this.setState({ value: outputPort });
  };

  render() {
    if (this.state.error) {
      return <div>Your browser does not seem to support WebMIDI</div>;
    }
    return (
      <Selector value={this.state.value} onChange={this.onChange}>
        {this.options.map(x => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </Selector>
    );
  }
}

const Selector = styled.select`
  background: none;
  border: none;
  font-family: monospace;
  box-shadow: -1px 0 0 0 #dfdfdf;
  outline: none;
  opacity: 0.5;
  &:active {
    opacity: 1;
  }
`;
