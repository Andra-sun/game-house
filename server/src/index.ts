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

const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Server rodando na porta ${PORT}`);
});