"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRooms = getRooms;
exports.getRoom = getRoom;
exports.createRoom = createRoom;
exports.addPlayer = addPlayer;
exports.removePlayer = removePlayer;
const rooms = {};
function getRooms() {
    return rooms;
}
function getRoom(id) {
    return rooms[id];
}
function createRoom() {
    const id = Math.random().toString(36).substring(2, 8);
    rooms[id] = {
        id,
        players: [],
        state: {},
    };
    return rooms[id];
}
function addPlayer(roomId, player) {
    const room = rooms[roomId];
    if (!room)
        return;
    if (room.players.find((p) => p.id === player.id))
        return;
    room.players.push(player);
}
function removePlayer(roomId, playerId) {
    const room = rooms[roomId];
    if (!room)
        return;
    room.players = room.players.filter((p) => p.id !== playerId);
}
