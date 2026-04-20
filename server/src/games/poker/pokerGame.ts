/* eslint-disable @typescript-eslint/no-explicit-any */

export type PokerPlayerState = {
    id: string;
    name: string;
    color: string;
    chips: number;
    bet: number; // aposta na rodada atual
    totalBetInRound: number; // total apostado na rodada (para calcular call)
    folded: boolean;
    isActive: boolean; // está participando da rodada
    isAdmin: boolean;
};

export type PokerPhase =
    | "waiting"    // aguardando início
    | "config"     // configurando ordem e admin
    | "betting"    // rodada em andamento
    | "showdown"   // aguardando declaração do vencedor
    | "finished";  // rodada encerrada, pronto para nova

export type PokerState = {
    game: "poker";
    phase: PokerPhase;
    players: PokerPlayerState[];
    pot: number;
    currentBet: number; // maior aposta atual da rodada
    currentTurnId: string | null;
    roundOrder: string[]; // ordem dos IDs nesta rodada
    baseOrder: string[];  // ordem base definida na config
    rotationOffset: number;
    hasAdmin: boolean;
    adminId: string | null;
    winners: string[];
    startingChips: number;
};

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
export function initPoker(room: any, config: {
    order: string[];       // IDs na ordem definida pelos jogadores
    hasAdmin: boolean;
    adminId: string | null;
    startingChips: number;
}) {
    const { order, hasAdmin, adminId, startingChips } = config;

    const playerStates: PokerPlayerState[] = room.players.map((p: any) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        chips: p.id === adminId ? 0 : startingChips,
        bet: 0,
        totalBetInRound: 0,
        folded: false,
        isActive: false,
        isAdmin: p.id === adminId,
    }));

    room.state = {
        game: "poker",
        phase: "waiting",
        players: playerStates,
        pot: 0,
        currentBet: 0,
        currentTurnId: null,
        roundOrder: [],
        baseOrder: order,
        rotationOffset: 0,
        hasAdmin,
        adminId: adminId ?? null,
        winners: [],
        startingChips,
    } satisfies PokerState;
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
function getPlayers(state: PokerState) {
    return state.players.filter((p) => !p.isAdmin);
}

function getActivePlayers(state: PokerState) {
    return state.players.filter((p) => !p.isAdmin && !p.folded && p.isActive);
}

function buildRoundOrder(state: PokerState): string[] {
    const nonAdmins = state.baseOrder.filter((id) =>
        state.players.find((p) => p.id === id && !p.isAdmin)
    );
    const len = nonAdmins.length;
    const offset = state.rotationOffset % len;
    return [...nonAdmins.slice(offset), ...nonAdmins.slice(0, offset)];
}

function nextTurn(state: PokerState) {
    const active = getActivePlayers(state);
    if (active.length <= 1) return null;

    const currentIdx = state.roundOrder.indexOf(state.currentTurnId!);
    for (let i = 1; i <= state.roundOrder.length; i++) {
        const nextId = state.roundOrder[(currentIdx + i) % state.roundOrder.length];
        const player = active.find((p) => p.id === nextId);
        if (player) return nextId;
    }
    return null;
}

function isRoundComplete(state: PokerState): boolean {
    const active = getActivePlayers(state);
    if (active.length <= 1) return true;

    // Todos os ativos igualaram a aposta atual
    return active.every((p) => p.totalBetInRound === state.currentBet);
}

// ──────────────────────────────────────────────
// HANDLE ACTIONS
// ──────────────────────────────────────────────
export function handlePoker(room: any, action: any, playerId: string) {
    const state: PokerState = room.state;
    if (!state || state.game !== "poker") return;

    switch (action.type) {

        // ── CONFIG ──────────────────────────────
        case "SET_CONFIG": {
            // Qualquer jogador pode enviar configuração (não admin)
            const { order, hasAdmin, adminId, startingChips } = action;
            initPoker(room, { order, hasAdmin, adminId, startingChips });
            room.state.phase = "config";
            break;
        }

        // ── START ROUND ─────────────────────────
        case "START_ROUND": {
            // Se tem admin, só admin pode iniciar; senão qualquer jogador
            if (state.hasAdmin && state.adminId !== playerId) return;
            if (state.phase !== "waiting" && state.phase !== "finished") return;

            const roundOrder = buildRoundOrder(state);

            // Reset individual
            state.players.forEach((p) => {
                if (!p.isAdmin) {
                    p.bet = 0;
                    p.totalBetInRound = 0;
                    p.folded = false;
                    p.isActive = true;
                }
            });

            state.pot = 0;
            state.currentBet = 0;
            state.roundOrder = roundOrder;
            state.currentTurnId = roundOrder[0];
            state.winners = [];
            state.phase = "betting";
            break;
        }

        // ── FOLD ─────────────────────────────────
        case "FOLD": {
            if (state.phase !== "betting") return;
            if (state.currentTurnId !== playerId) return;

            const folder = state.players.find((p) => p.id === playerId);
            if (!folder || folder.folded) return;

            folder.folded = true;
            folder.isActive = false;

            const active = getActivePlayers(state);
            if (active.length <= 1 || isRoundComplete(state)) {
                state.phase = "showdown";
                state.currentTurnId = null;
            } else {
                state.currentTurnId = nextTurn(state);
            }
            break;
        }

        // ── CALL (pagar aposta atual) ────────────
        case "CALL": {
            if (state.phase !== "betting") return;
            if (state.currentTurnId !== playerId) return;

            const caller = state.players.find((p) => p.id === playerId);
            if (!caller || caller.folded) return;

            const needed = state.currentBet - caller.totalBetInRound;
            const paid = Math.min(needed, caller.chips);

            caller.chips -= paid;
            caller.bet += paid;
            caller.totalBetInRound += paid;
            state.pot += paid;

            if (isRoundComplete(state)) {
                state.phase = "showdown";
                state.currentTurnId = null;
            } else {
                state.currentTurnId = nextTurn(state);
            }
            break;
        }

        // ── BET / RAISE ───────────────────────────
        case "BET": {
            if (state.phase !== "betting") return;
            if (state.currentTurnId !== playerId) return;

            const bettor = state.players.find((p) => p.id === playerId);
            if (!bettor || bettor.folded) return;

            const amount: number = action.amount;
            if (!amount || amount <= 0) return;

            // O amount é o valor TOTAL que o jogador quer ter apostado nesta rodada
            // (já inclui o call implícito)
            const additional = amount - bettor.totalBetInRound;
            if (additional <= 0) return;
            if (additional > bettor.chips) return;
            // Deve ser maior que a aposta atual
            if (amount <= state.currentBet) return;

            bettor.chips -= additional;
            bettor.bet += additional;
            bettor.totalBetInRound = amount;
            state.pot += additional;
            state.currentBet = amount;

            // Quando alguém aumenta, todos os outros ativos precisam igualar novamente
            // Reset do status "igualado" dos outros (exceto quem apostou)
            state.currentTurnId = nextTurn(state);
            break;
        }

        // ── CHECK (sem aposta atual) ───────────────
        case "CHECK": {
            if (state.phase !== "betting") return;
            if (state.currentTurnId !== playerId) return;

            const checker = state.players.find((p) => p.id === playerId);
            if (!checker || checker.folded) return;
            // Só pode dar check se já igualou
            if (checker.totalBetInRound < state.currentBet) return;

            if (isRoundComplete(state)) {
                state.phase = "showdown";
                state.currentTurnId = null;
            } else {
                state.currentTurnId = nextTurn(state);
            }
            break;
        }

        // ── DECLARE WINNER ────────────────────────
        case "DECLARE_WINNER": {
            if (state.phase !== "showdown") return;

            // Se tem admin, só admin; senão qualquer jogador
            if (state.hasAdmin && state.adminId !== playerId) return;

            const winnerIds: string[] = action.winnerIds;
            if (!winnerIds || winnerIds.length === 0) return;

            const share = Math.floor(state.pot / winnerIds.length);
            const remainder = state.pot - share * winnerIds.length;

            winnerIds.forEach((wId, i) => {
                const w = state.players.find((p) => p.id === wId);
                if (w) w.chips += share + (i === 0 ? remainder : 0);
            });

            state.winners = winnerIds;
            state.pot = 0;
            state.phase = "finished";

            // Incrementa rotação para próxima rodada
            state.rotationOffset += 1;
            break;
        }

        default:
            break;
    }
}