// @flow
import * as Relay from "./relay";
import * as TestUtils from "./test_utils";
import { connectToWebsocket, startMockOSCServer } from "./relay_test_utils";

function runMain(options: Relay.Options) {
  const { wsServer, udpSocket } = Relay.main(options);
  TestUtils.cleanupWith(() => {
    wsServer.close();
    udpSocket.close();
  });
}

describe("main", () => {
  const oscPort = 57110;
  const websocketPort = 58121;

  it("makes a websocket server that relays text", async () => {
    const oscServer = startMockOSCServer({ oscPort });
    runMain({ websocketPort, oscPort });
    const ws = await connectToWebsocket(`ws://localhost:${websocketPort}`);

    ws.send("note 60");
    const message = await oscServer.getOSCMessage();
    expect(message.address).toBe("/text");
    expect(message.args).toEqual(["note 60"]);
  });
});
