// chess
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

// poker
export type PokerPlayerState = {
    id: string;
    name: string;
    color: string;
    chips: number;
    bet: number;
    totalBetInRound: number;
    folded: boolean;
    isActive: boolean;
    isAdmin: boolean;
};

export type PokerPhase =
    | "waiting"
    | "config"
    | "betting"
    | "showdown"
    | "finished";

export type PokerState = {
    game: "poker";
    phase: PokerPhase;
    players: PokerPlayerState[];
    pot: number;
    currentBet: number;
    currentTurnId: string | null;
    roundOrder: string[];
    baseOrder: string[];
    rotationOffset: number;
    hasAdmin: boolean;
    adminId: string | null;
    winners: string[];
    startingChips: number;
};
