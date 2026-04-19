/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import type { ChessClockState } from "../../types/game";

export function useChessClock() {
    const [state, setState] = useState<ChessClockState | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    function update(newState: ChessClockState) {
        setState(newState);
    }

    useEffect(() => {
        if (tickRef.current) clearInterval(tickRef.current);
        if (!state?.running || !state.activePlayer) return;

        tickRef.current = setInterval(() => {
            setState((prev) => {
                if (!prev?.running || !prev.activePlayer) return prev;

                const players = (prev as any).players as { id: string }[];
                const isPlayer0 = prev.activePlayer === players?.[0]?.id;

                return {
                    ...prev,
                    time1: isPlayer0 ? Math.max(0, prev.time1 - 1) : prev.time1,
                    time2: !isPlayer0 ? Math.max(0, prev.time2 - 1) : prev.time2,
                };
            });
        }, 1000);

        return () => {
            if (tickRef.current) clearInterval(tickRef.current);
        };
    }, [state?.running, state?.activePlayer]);

    return { state, update };
}