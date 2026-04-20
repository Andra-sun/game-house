import {
    createRoom,
    getRoom,
    getRooms,
    addPlayer,
    removePlayer,
} from "./rooms";

import {
    initChessClock,
    handleChessClock,
} from "../games/xadrezTimer/chessClock";

import { initPoker, handlePoker } from "../games/poker/pokerGame";

export function setupSocket(io: any) {
    io.on("connection", (socket: any) => {
        socket.on("createRoom", () => {
            const room = createRoom();
            io.emit("roomsList", Object.values(getRooms()));
            socket.emit("roomCreated", room.id);
        });

        socket.on("joinRoom", ({ roomId, name, color }: any) => {
            const room = getRoom(roomId);
            if (!room) return;

            socket.join(roomId);

            if (!room.players.find((p: any) => p.id === socket.id)) {
                addPlayer(roomId, {
                    id: socket.id,
                    name,
                    color,
                });
            }

            io.to(roomId).emit("roomUpdate", room);
            io.emit("roomsList", Object.values(getRooms()));
        });

        socket.on("leaveRoom", ({ roomId }: any) => {
            const room = getRoom(roomId);
            if (!room) return;

            removePlayer(roomId, socket.id);
            socket.leave(roomId);

            io.to(roomId).emit("roomUpdate", room);
            io.emit("roomsList", Object.values(getRooms()));
        });

        socket.on("getRooms", () => {
            socket.emit("roomsList", Object.values(getRooms()));
        });

        socket.on("startChessClock", ({ roomId, time }: any) => {
            const room = getRoom(roomId);
            if (!room) return;

            initChessClock(room, time);

            io.to(roomId).emit("stateUpdate", room.state);
            io.to(roomId).emit("roomUpdate", room);
        });

        socket.on("getState", ({ roomId }: any) => {
            const room = getRoom(roomId);
            if (!room) return;

            socket.emit("stateUpdate", room.state);
        });

        socket.on("action", ({ roomId, action }: any) => {
            const room = getRoom(roomId);
            if (!room) return;

            if (action.type === "MOVE") {
                action.playerId = socket.id;
            }

            handleChessClock(room, action);

            io.to(roomId).emit("stateUpdate", room.state);
        });

        socket.on("kickPlayer", ({ roomId, playerId }: any) => {
            const room = getRoom(roomId);
            if (!room) return;

            const targetSocket = io.sockets.sockets.get(playerId);
            if (!targetSocket) return;

            removePlayer(roomId, playerId);
            targetSocket.leave(roomId);
            targetSocket.emit("kicked");

            io.to(roomId).emit("roomUpdate", room);
            io.emit("roomsList", Object.values(getRooms()));
        });

        socket.on("disconnect", () => {
            const rooms = Object.values(getRooms());

            for (const room of rooms) {
                removePlayer(room.id, socket.id);
                io.to(room.id).emit("roomUpdate", room);
            }

            io.emit("roomsList", rooms);
        });

        socket.on(
            "startPoker",
            ({ roomId, order, hasAdmin, adminId, startingChips }: any) => {
                const room = getRoom(roomId);
                if (!room) return;
                initPoker(room, { order, hasAdmin, adminId, startingChips });
                room.state.phase = "config";
                io.to(roomId).emit("stateUpdate", room.state);
                io.to(roomId).emit("roomUpdate", room);
            },
        );

        socket.on("pokerAction", ({ roomId, action }: any) => {
            const room = getRoom(roomId);
            if (!room) return;
            handlePoker(room, action, socket.id);
            io.to(roomId).emit("stateUpdate", room.state);
        });
    });
}
