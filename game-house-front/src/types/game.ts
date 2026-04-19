export type ChessClockState = {
    game: "chess-clock";
    time1: number;
    time2: number;
    activePlayer: string | null;
    lastMoveBy: string | null;
    running: boolean;
    lastUpdate: number;
    turn: string;
    white: string;
    black: string;

};

export type ChessClockInit = {
    roomId: string;
    time: number;
};