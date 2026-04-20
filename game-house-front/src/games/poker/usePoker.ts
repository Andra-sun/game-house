import { useCallback, useState } from "react";
import type { PokerState } from "../../types/game";

export function usePoker() {
    const [state, setState] = useState<PokerState | null>(null);

    const update = useCallback((newState: PokerState) => {
        setState(newState);
    }, []);

    return { state, update };
}