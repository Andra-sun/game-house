/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { socket } from "../socket/socket";
import { useChessClock } from "../games/xadrez/useChessClock";

type Props = {
    roomId: string;
};

export default function Chess({ roomId }: Props) {
    const { state, update } = useChessClock();
    const playerId = socket.id;

    useEffect(() => {
        socket.on("stateUpdate", update);
        socket.emit("getState", { roomId });

        return () => {
            socket.off("stateUpdate", update);
        };
    }, [roomId, update]);

    function formatTime(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    function handleMove() {
        socket.emit("action", {
            roomId,
            action: {
                type: "MOVE",
                playerId: socket.id,
            },
        });
    }

    if (!state || state.game !== "chess-clock") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="bg-white/10 p-6 rounded-xl">
                    <p>Aguardando partida começar...</p>
                </div>
            </div>
        );
    }

    const players = (state as any).players as {
        id: string;
        name: string;
        color: string;
    }[];
    
    const myIndex = players?.findIndex((p) => p.id === playerId) ?? -1;
    const myTime = myIndex === 0 ? state.time1 : state.time2;
    const oppTime = myIndex === 0 ? state.time2 : state.time1;
    const myTurn = state.activePlayer === playerId;
    const myColor = players?.[myIndex]?.color ?? "#6366f1";

    const gameOver = state.time1 <= 0 || state.time2 <= 0;

    return (
        <div className=" bg-gray-900 flex flex-col">
            {gameOver && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <div className="text-5xl mb-4">🏆</div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {myTime <= 0 ? "Você perdeu!" : "Você venceu!"}
                        </h2>
                    </div>
                </div>
            )}

            <div className="flex h-1/5 flex-col items-center justify-center pt-10">
                <div className="text-center">
                    <div
                        className="text-8xl md:text-9xl font-mono font-bold tabular-nums mb-4"
                        style={{
                            color: myTurn ? myColor : "#6b7280",
                            textShadow: myTurn
                                ? `0 0 30px ${myColor}80`
                                : "none",
                        }}
                    >
                        {formatTime(myTime)}
                    </div>
                    <p className="text-gray-400 text-sm">
                        {!state.running
                            ? "Toque para começar"
                            : myTurn
                              ? "Sua vez"
                              : "Aguardando oponente"}
                    </p>
                </div>
            </div>

            <div className="flex-1 items-center justify-center px-4 py-8">
                <button
                    onClick={handleMove}
                    disabled={state.running && !myTurn}
                    className={`
                        w-5/6 aspect-square rounded-2xl font-bold text-4xl
                        transition-all duration-200 transform active:scale-95 text-white
                        ${
                            !state.running || myTurn
                                ? `hover:scale-105 cursor-pointer shadow-2xl`
                                : "bg-gray-700 cursor-not-allowed opacity-50"
                        }
                    `}
                    style={
                        myTurn || !state.running
                            ? { boxShadow: `0 0 40px ${myColor}800`, backgroundColor:myColor }
                            : {}
                    }
                >
                    {!state.running
                        ? "INICIAR"
                        : myTurn
                          ? "FAZER JOGADA"
                          : "AGUARDANDO..."}
                </button>
            </div>

            <div className="fixed bottom-4 right-4 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="text-xs text-gray-400 mb-1">OPONENTE</div>
                <div className="text-2xl font-mono font-bold text-gray-300 tabular-nums">
                    {formatTime(oppTime)}
                </div>
            </div>
        </div>
    );
}
