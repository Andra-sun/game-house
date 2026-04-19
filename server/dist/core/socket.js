"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = setupSocket;
const rooms_1 = require("./rooms");
const chessClock_1 = require("../games/xadrezTimer/chessClock");
function setupSocket(io) {
    io.on("connection", (socket) => {
        socket.on("createRoom", () => {
            const room = (0, rooms_1.createRoom)();
            io.emit("roomsList", Object.values((0, rooms_1.getRooms)()));
            socket.emit("roomCreated", room.id);
        });
        socket.on("joinRoom", ({ roomId, name, color }) => {
            const room = (0, rooms_1.getRoom)(roomId);
            if (!room)
                return;
            socket.join(roomId);
            if (!room.players.find((p) => p.id === socket.id)) {
                (0, rooms_1.addPlayer)(roomId, {
                    id: socket.id,
                    name,
                    color,
                });
            }
            io.to(roomId).emit("roomUpdate", room);
            io.emit("roomsList", Object.values((0, rooms_1.getRooms)()));
        });
        socket.on("leaveRoom", ({ roomId }) => {
            const room = (0, rooms_1.getRoom)(roomId);
            if (!room)
                return;
            (0, rooms_1.removePlayer)(roomId, socket.id);
            socket.leave(roomId);
            io.to(roomId).emit("roomUpdate", room);
            io.emit("roomsList", Object.values((0, rooms_1.getRooms)()));
        });
        socket.on("getRooms", () => {
            socket.emit("roomsList", Object.values((0, rooms_1.getRooms)()));
        });
        socket.on("startChessClock", ({ roomId, time }) => {
            const room = (0, rooms_1.getRoom)(roomId);
            if (!room)
                return;
            (0, chessClock_1.initChessClock)(room, time);
            io.to(roomId).emit("stateUpdate", room.state);
            io.to(roomId).emit("roomUpdate", room);
        });
        socket.on("getState", ({ roomId }) => {
            const room = (0, rooms_1.getRoom)(roomId);
            if (!room)
                return;
            socket.emit("stateUpdate", room.state);
        });
        socket.on("action", ({ roomId, action }) => {
            const room = (0, rooms_1.getRoom)(roomId);
            if (!room)
                return;
            if (action.type === "MOVE") {
                action.playerId = socket.id;
            }
            (0, chessClock_1.handleChessClock)(room, action);
            io.to(roomId).emit("stateUpdate", room.state);
        });
        socket.on("kickPlayer", ({ roomId, playerId }) => {
            const room = (0, rooms_1.getRoom)(roomId);
            if (!room)
                return;
            const targetSocket = io.sockets.sockets.get(playerId);
            if (!targetSocket)
                return;
            (0, rooms_1.removePlayer)(roomId, playerId);
            targetSocket.leave(roomId);
            targetSocket.emit("kicked");
            io.to(roomId).emit("roomUpdate", room);
            io.emit("roomsList", Object.values((0, rooms_1.getRooms)()));
        });
        socket.on("disconnect", () => {
            const rooms = Object.values((0, rooms_1.getRooms)());
            for (const room of rooms) {
                (0, rooms_1.removePlayer)(room.id, socket.id);
                io.to(room.id).emit("roomUpdate", room);
            }
            io.emit("roomsList", rooms);
        });
    });
}
