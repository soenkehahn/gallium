// @flow
import WebSocket from "ws";
import dgram from "dgram";
import OSC from "osc-js";
import * as TestUtils from "./test_utils";

export async function connectToWebsocket(destination: string) {
  const ws = new WebSocket(destination);
  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });
  return ws;
}

export function startMockOSCServer(options: { oscPort: number }) {
  const server = dgram.createSocket("udp4");

  const defaultResolvePacketPromise = (message: any) => {
    throw new Error("not inspecting packets");
  };

  let resolvePacketPromise = defaultResolvePacketPromise;

  server.on("message", message => {
    resolvePacketPromise(message);
  });
  server.bind(57110);
  TestUtils.cleanupWith(() => {
    server.close();
  });

  async function getOSCMessage() {
    let packetPromise = new Promise(resolve => {
      resolvePacketPromise = resolve;
    });
    const packet = await packetPromise;
    const message = new OSC.Message();
    message.unpack(new DataView(packet.buffer), 0);
    resolvePacketPromise = defaultResolvePacketPromise;
    return message;
  }

  return {
    server,
    getOSCMessage
  };
}
