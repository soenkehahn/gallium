const WebSocket = require("ws");
const http = require("http");
const OSC = require("osc-js");
const dgram = require('dgram')

// TODO: babelize, test, add to CI workflow

const wsServer = new WebSocket.Server({
  port: 58121
});

const udpSocket = dgram.createSocket('udp4');

wsServer.on("connection", ws => {
  console.log("connected!");
  ws.on("message", text => {
    sendText(text);
  });
  ws.on("error", () => {
    console.log("disconnected.");
  });
});

function sendText(text) {
  const message = new OSC.Message("/text", text);
  const binary = message.pack();
  udpSocket.send(new Buffer(binary), 0, binary.byteLength, 57110, "localhost");
}
