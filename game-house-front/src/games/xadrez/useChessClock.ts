/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChessClockState } from "../../types/game";

export function useChessClock() {
    const [state, setState] = useState<ChessClockState | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startRef = useRef<{ time1: number; time2: number; at: number } | null>(null);

    useEffect(() => {
        if (tickRef.current) clearInterval(tickRef.current);
        if (!state?.running || !state.activePlayer) return;

        // Salva o snapshot do momento em que o turno começou
        startRef.current = {
            time1: state.time1,
            time2: state.time2,
            at: Date.now(),
        };

        tickRef.current = setInterval(() => {
            setState((prev) => {
                if (!prev?.running || !prev.activePlayer || !startRef.current) return prev;

                const players = (prev as any).players as { id: string }[];
                const isPlayer0 = prev.activePlayer === players?.[0]?.id;
                const elapsed = Math.floor((Date.now() - startRef.current.at) / 1000);

                return {
                    ...prev,
                    time1: isPlayer0
                        ? Math.max(0, startRef.current.time1 - elapsed)
                        : startRef.current.time1,
                    time2: !isPlayer0
                        ? Math.max(0, startRef.current.time2 - elapsed)
                        : startRef.current.time2,
                };
            });
        }, 200);

        return () => {
            if (tickRef.current) clearInterval(tickRef.current);
        };
    }, [state?.running, state?.activePlayer]);

    const update = useCallback((newState: ChessClockState) => {
        setState(newState);
    }, []);

    return { state, update };
}