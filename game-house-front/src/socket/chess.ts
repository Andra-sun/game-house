import { socket } from "./socket";

export function initChessClock(roomId: string, time: number) {
    socket.emit("startChessClock", { roomId, time });
}

export function chessMove(roomId: string) {
    socket.emit("action", {
        roomId,
        action: { type: "MOVE" },
    });
}