import express from "express";
import http from "http";
import { Server } from "socket.io";
import { setupSocket } from "./core/socket";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods:["GET", "POST"]
  }
});

setupSocket(io);

server.listen(3000, "0.0.0.0", () => {
  console.log("🔥 Server rodando na porta 3000");
});