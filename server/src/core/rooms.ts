type Player = {
  id: string;
  name: string;
  color: string;
};

type Room = {
  id: string;
  players: Player[];
  state: any;
};

const rooms: Record<string, Room> = {};

export function getRooms() {
  return rooms;
}

export function getRoom(id: string) {
  return rooms[id];
}

export function createRoom() {
  const id = Math.random().toString(36).substring(2, 8);

  rooms[id] = {
    id,
    players: [],
    state: {},
  };

  return rooms[id];
}

export function addPlayer(roomId: string, player: Player) {
  const room = rooms[roomId];
  if (!room) return;

  if (room.players.find((p) => p.id === player.id)) return;

  room.players.push(player);
}

export function removePlayer(roomId: string, playerId: string) {
  const room = rooms[roomId];
  if (!room) return;

  room.players = room.players.filter((p) => p.id !== playerId);
}