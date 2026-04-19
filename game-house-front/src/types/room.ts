export type Player = {
  id: string;
  name: string;
  color: string;
};

export type Room = {
  id: string;
  players: Player[];
  game: string | null;
  state: unknown;
};