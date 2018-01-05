// @flow
import * as React from "react";
import styled from "styled-components";
import { parseTopLevel } from "gallium/lib/parser";
import { type ABT, T, Term, resolve } from "gallium/lib/resolver";
import { globalContext } from "./context";
import { silence } from "gallium/lib/semantics";
import { OutputSelector } from "./OutputSelector";
import * as MIDI from "./midi";
import * as LocalStorage from "./local_storage";
import { connect, type Connect } from "./store";
import * as Playback from "./playback";

type OwnProps = {};

type ContainerProps = {
  text: string
};

type EditorState = {
  text: string,
  abt: ?ABT,
  error: ?string
};

export class Editor extends React.Component<
  Connect<OwnProps, ContainerProps>,
  EditorState
> {
  constructor(props: *) {
    super(props);
    this.state = {
      text: props.text,
      error: undefined,
      abt: undefined
    };
  }

  textarea: ?HTMLTextAreaElement;

  componentDidMount() {
    this.props.dispatch(Playback.start());
    this.updateABT(this.state.text);
  }

  componentWillUnmount() {
    this.props.dispatch(Playback.stop());
  }

  onChange = (e: *) => {
    this.setState({
      text: e.target.value
    });
    this.updateABT(e.target.value);
  };

  updateABT(text: string) {
    try {
      const abt = resolve(globalContext, parseTopLevel(text));
      this.setState({
        abt,
        error: undefined
      });
      this.props.dispatch(store => {
        store.state.pattern = (abt.payload.getValue(): any)(silence);
      });
      LocalStorage.saveText(text);
    } catch (e) {
      this.setState({
        error: e.toString()
      });
    }
  }

  onMIDIOutputChange = async (choice: string) => {
    const newOutput = await MIDI.connectToOutputPort(choice);
    this.props.dispatch(store => {
      store.state.output = newOutput;
    });
  };

  onKeyPress = (e: SyntheticKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const pos = e.currentTarget.selectionStart;
      const prefix = this.state.text.substr(0, pos);
      const suffix = this.state.text.substr(pos);

      const prePos = prefix.lastIndexOf("\n");
      const line = prefix.substring(prePos + 1);
      const spaceMatch = line.match(/^\ */g);
      if (!spaceMatch) {
        throw new Error("unexpected error: no match");
      }
      const indentation = spaceMatch[0];

      const extraText = "\n" + indentation;
      const newText = prefix + extraText + suffix;
      this.setState(
        {
          text: newText
        },
        () => {
          (this.textarea: any).focus();
          (this.textarea: any).setSelectionRange(
            pos + extraText.length,
            pos + extraText.length
          );
        }
      );
    }
  };

  render() {
    return (
      <div>
        <OutputSelector onChange={this.onMIDIOutputChange} />
        <div style={{ marginTop: "20px" }}>
          <Textarea
            onChange={this.onChange}
            onKeyPress={this.onKeyPress}
            value={this.state.text}
            rows="24"
            cols="60"
            innerRef={ref => {
              this.textarea = ref;
            }}
          />
        </div>
      </div>
    );
  }
}

export default connect(Editor, ({ text }) => ({ text }));

const Textarea = styled.textarea`
  border: 0;
  font-size: 24;
  margin: 0;
  padding: 0;
  width: 100%;
  font-family: monospace;
`;
