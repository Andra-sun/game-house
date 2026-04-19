export function initChessClock(room: any, time: number) {
    const [p1, p2] = room.players;
    room.state = {
        game: "chess-clock",
        time1: time,
        time2: time,
        activePlayer: null,
        lastMoveBy: null,
        running: false,
        lastUpdate: Date.now(),
        players: [
            { id: p1?.id, name: p1?.name, color: p1?.color },
            { id: p2?.id, name: p2?.name, color: p2?.color },
        ],
    };
}

export function handleChessClock(room: any, action: any) {
    const state = room.state;
    if (!state) return;
    const now = Date.now();

    if (action.type === "MOVE") {
        const playerId = action.playerId;

        // Primeira jogada: só inicia o relógio, não desconta tempo
        if (!state.activePlayer) {
            state.running = true;
            state.lastUpdate = now;
            state.lastMoveBy = playerId;
            // Passa a vez pro oponente
            const next = state.players.find((p: any) => p.id !== playerId);
            state.activePlayer = next?.id ?? null;
            return;
        }

        // Só aceita jogada de quem é a vez
        if (state.activePlayer !== playerId) return;

        const diff = Math.floor((now - state.lastUpdate) / 1000);

        if (state.activePlayer === state.players[0]?.id) {
            state.time1 = Math.max(0, state.time1 - diff);
        } else if (state.activePlayer === state.players[1]?.id) {
            state.time2 = Math.max(0, state.time2 - diff);
        }

        // Passa a vez pro outro jogador
        const nextPlayer = state.players.find((p: any) => p.id !== playerId);
        state.activePlayer = nextPlayer?.id ?? null;
        state.lastMoveBy = playerId;
        state.lastUpdate = now;
    }

    if (state.time1 <= 0 || state.time2 <= 0) {
        state.running = false;
        state.activePlayer = null;
    }
}
