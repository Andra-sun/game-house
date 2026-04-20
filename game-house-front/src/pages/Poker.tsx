/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { socket } from "../socket/socket";
import { usePoker } from "../games/poker/usePoker";
import type { PokerPlayerState, PokerState } from "../types/game";

type Props = {
    roomId: string;
    roomPlayers: { id: string; name: string; color: string }[];
};

// ─── Tela de Configuração ───────────────────────────────────────────────────
function ConfigScreen({
    roomId,
    roomPlayers,
    myId,
}: {
    roomId: string;
    roomPlayers: { id: string; name: string; color: string }[];
    myId: string;
}) {
    const [order, setOrder] = useState<{ id: string; name: string; color: string }[]>(roomPlayers);
    const [hasAdmin, setHasAdmin] = useState(false);
    const [adminId, setAdminId] = useState<string | null>(null);
    const [startingChips, setStartingChips] = useState(1000);
    const dragItem = useRef<number | null>(null);
    const dragOver = useRef<number | null>(null);

    function handleDragStart(index: number) {
        dragItem.current = index;
    }
    function handleDragEnter(index: number) {
        dragOver.current = index;
    }
    function handleDragEnd() {
        if (dragItem.current === null || dragOver.current === null) return;
        const newOrder = [...order];
        const dragged = newOrder.splice(dragItem.current, 1)[0];
        newOrder.splice(dragOver.current, 0, dragged);
        setOrder(newOrder);
        dragItem.current = null;
        dragOver.current = null;
    }

    function handleConfirm() {
        const nonAdmins = hasAdmin && adminId
            ? order.filter((p) => p.id !== adminId)
            : order;

        socket.emit("startPoker", {
            roomId,
            order: nonAdmins.map((p) => p.id),
            hasAdmin,
            adminId: hasAdmin ? adminId : null,
            startingChips,
        });
    }

    const playersForOrder = hasAdmin && adminId
        ? order.filter((p) => p.id !== adminId)
        : order;

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-yellow-400 text-center mb-8 tracking-widest uppercase">
                    ♠ Configurar Mesa
                </h1>

                {/* Fichas iniciais */}
                <div className="bg-gray-900 rounded-xl p-5 mb-4 border border-gray-800">
                    <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">
                        Fichas iniciais por jogador
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {[500, 1000, 2000, 5000].map((v) => (
                            <button
                                key={v}
                                onClick={() => setStartingChips(v)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                                    startingChips === v
                                        ? "bg-yellow-400 text-gray-950"
                                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                }`}
                            >
                                {v.toLocaleString()}
                            </button>
                        ))}
                        <input
                            type="number"
                            value={startingChips}
                            onChange={(e) => setStartingChips(Number(e.target.value))}
                            className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm text-center"
                        />
                    </div>
                </div>

                {/* Admin */}
                <div className="bg-gray-900 rounded-xl p-5 mb-4 border border-gray-800">
                    <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <div
                            onClick={() => { setHasAdmin(!hasAdmin); setAdminId(null); }}
                            className={`w-10 h-6 rounded-full transition-all relative ${
                                hasAdmin ? "bg-yellow-400" : "bg-gray-700"
                            }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                                hasAdmin ? "left-5" : "left-1"
                            }`} />
                        </div>
                        <span className="text-gray-300 text-sm font-medium">Incluir administrador</span>
                    </label>

                    {hasAdmin && (
                        <div className="flex flex-col gap-2">
                            <p className="text-gray-500 text-xs">Selecione quem será o admin:</p>
                            {roomPlayers.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setAdminId(p.id)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                                        adminId === p.id
                                            ? "ring-2 ring-yellow-400 bg-gray-800"
                                            : "bg-gray-800 hover:bg-gray-750"
                                    }`}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: p.color }}
                                    />
                                    <span className="text-white">{p.name}</span>
                                    {p.id === myId && (
                                        <span className="ml-auto text-xs text-gray-500">(você)</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Ordem */}
                <div className="bg-gray-900 rounded-xl p-5 mb-6 border border-gray-800">
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">
                        Ordem de jogada (arraste para reordenar)
                    </p>
                    <div className="flex flex-col gap-2">
                        {playersForOrder.map((p, idx) => (
                            <div
                                key={p.id}
                                draggable
                                onDragStart={() => handleDragStart(idx)}
                                onDragEnter={() => handleDragEnter(idx)}
                                onDragEnd={handleDragEnd}
                                className="flex items-center gap-3 px-3 py-3 bg-gray-800 rounded-lg cursor-grab active:cursor-grabbing border border-gray-700 hover:border-gray-600 transition-all"
                            >
                                <span className="text-gray-600 font-mono text-sm w-5">{idx + 1}</span>
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: p.color }}
                                />
                                <span className="text-white text-sm flex-1">{p.name}</span>
                                <span className="text-gray-600 text-xs">⣿</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={hasAdmin && !adminId}
                    className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-lg tracking-wide"
                >
                    Confirmar Mesa
                </button>
            </div>
        </div>
    );
}

// ─── Card de Jogador ────────────────────────────────────────────────────────
function PlayerCard({
    player,
    isMyTurn,
    isMine,
    currentBet,
    isWinner,
    showWinnerSelect,
    selectedAsWinner,
    onToggleWinner,
}: {
    player: PokerPlayerState;
    isMyTurn: boolean;
    isMine: boolean;
    currentBet: number;
    isWinner: boolean;
    showWinnerSelect: boolean;
    selectedAsWinner: boolean;
    onToggleWinner: () => void;
}) {
    const needsToCall = player.totalBetInRound < currentBet && !player.folded && player.isActive;

    return (
        <div
            onClick={showWinnerSelect && !player.isAdmin && !player.folded ? onToggleWinner : undefined}
            className={`
                relative rounded-xl p-3 border transition-all duration-200
                ${player.folded ? "opacity-40 border-gray-800 bg-gray-900" : ""}
                ${isMyTurn && !player.folded ? "border-yellow-400 bg-gray-900 shadow-lg shadow-yellow-400/20" : ""}
                ${!isMyTurn && !player.folded ? "border-gray-800 bg-gray-900" : ""}
                ${showWinnerSelect && !player.isAdmin && !player.folded ? "cursor-pointer hover:border-yellow-400/60" : ""}
                ${selectedAsWinner ? "border-yellow-400 bg-yellow-400/10 ring-2 ring-yellow-400/40" : ""}
                ${isWinner ? "border-green-400 bg-green-400/10" : ""}
            `}
        >
            {/* Turn indicator */}
            {isMyTurn && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
            )}

            {/* Winner crown */}
            {isWinner && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">👑</div>
            )}

            {/* Admin badge */}
            {player.isAdmin && (
                <div className="absolute -top-2 -left-2 text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                    ADM
                </div>
            )}

            <div className="flex items-center gap-2 mb-2">
                <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: player.color }}
                />
                <span className="text-white text-sm font-semibold truncate">
                    {player.name}
                    {isMine && <span className="text-gray-500 text-xs ml-1">(você)</span>}
                </span>
            </div>

            {!player.isAdmin && (
                <>
                    <div className="text-yellow-400 font-mono font-bold text-base">
                        {player.chips.toLocaleString()}
                        <span className="text-gray-600 text-xs ml-1">fichas</span>
                    </div>

                    {player.totalBetInRound > 0 && (
                        <div className="text-orange-400 text-xs mt-1">
                            Apostou: {player.totalBetInRound.toLocaleString()}
                        </div>
                    )}

                    {player.folded && (
                        <div className="text-red-400 text-xs mt-1 font-semibold">DESISTIU</div>
                    )}

                    {needsToCall && (
                        <div className="text-blue-400 text-xs mt-1">
                            Falta pagar: {(currentBet - player.totalBetInRound).toLocaleString()}
                        </div>
                    )}

                    {showWinnerSelect && !player.folded && !player.isAdmin && (
                        <div className={`mt-2 w-5 h-5 rounded border-2 flex items-center justify-center ml-auto ${
                            selectedAsWinner ? "border-yellow-400 bg-yellow-400" : "border-gray-600"
                        }`}>
                            {selectedAsWinner && <span className="text-gray-950 text-xs font-bold">✓</span>}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Tela de Ação (betting) ─────────────────────────────────────────────────
function ActionBar({
    state,
    myId,
    roomId,
}: {
    state: PokerState;
    myId: string;
    roomId: string;
}) {
    const [betAmount, setBetAmount] = useState("");
    const [showBetInput, setShowBetInput] = useState(false);

    const me = state.players.find((p) => p.id === myId);
    const isMyTurn = state.currentTurnId === myId;

    if (!me || me.isAdmin || !isMyTurn || me.folded) return null;

    const canCheck = me.totalBetInRound >= state.currentBet;
    const callAmount = state.currentBet - me.totalBetInRound;
    const minBet = state.currentBet > 0 ? state.currentBet + 1 : 1;

    function emit(action: any) {
        socket.emit("pokerAction", { roomId, action });
        setShowBetInput(false);
        setBetAmount("");
    }

    function handleBet() {
        const total = Number(betAmount);
        if (isNaN(total) || total <= state.currentBet) return;
        emit({ type: "BET", amount: total });
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 p-4">
            <p className="text-gray-500 text-xs text-center mb-3 uppercase tracking-widest">
                Sua vez
            </p>

            {showBetInput && (
                <div className="flex gap-2 mb-3">
                    <input
                        type="number"
                        placeholder={`Mín: ${minBet}`}
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                        autoFocus
                    />
                    <button
                        onClick={handleBet}
                        disabled={Number(betAmount) <= state.currentBet || Number(betAmount) > me.chips + me.totalBetInRound}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold rounded-lg text-sm"
                    >
                        Confirmar
                    </button>
                    <button
                        onClick={() => setShowBetInput(false)}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="flex gap-2">
                {/* Fold */}
                <button
                    onClick={() => emit({ type: "FOLD" })}
                    className="flex-1 py-3 bg-red-900/60 hover:bg-red-800/80 border border-red-800 text-red-300 font-bold rounded-xl text-sm transition-all"
                >
                    Desistir
                </button>

                {/* Check ou Call */}
                {canCheck ? (
                    <button
                        onClick={() => emit({ type: "CHECK" })}
                        className="flex-1 py-3 bg-blue-900/60 hover:bg-blue-800/80 border border-blue-800 text-blue-300 font-bold rounded-xl text-sm transition-all"
                    >
                        Passar
                    </button>
                ) : (
                    <button
                        onClick={() => emit({ type: "CALL" })}
                        disabled={me.chips <= 0}
                        className="flex-1 py-3 bg-blue-900/60 hover:bg-blue-800/80 border border-blue-800 text-blue-300 font-bold rounded-xl text-sm transition-all disabled:opacity-40"
                    >
                        Pagar ({callAmount.toLocaleString()})
                    </button>
                )}

                {/* Bet / Raise */}
                <button
                    onClick={() => setShowBetInput(!showBetInput)}
                    disabled={me.chips <= 0}
                    className="flex-1 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-600 text-yellow-300 font-bold rounded-xl text-sm transition-all disabled:opacity-40"
                >
                    {state.currentBet > 0 ? "Aumentar" : "Apostar"}
                </button>
            </div>
        </div>
    );
}

// ─── Showdown (declarar vencedor) ───────────────────────────────────────────
function ShowdownScreen({
    state,
    myId,
    roomId,
}: {
    state: PokerState;
    myId: string;
    roomId: string;
}) {
    const [selected, setSelected] = useState<string[]>([]);

    const canDeclare = state.hasAdmin
        ? state.adminId === myId
        : true;

    function toggle(id: string) {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    function handleDeclare() {
        socket.emit("pokerAction", {
            roomId,
            action: { type: "DECLARE_WINNER", winnerIds: selected },
        });
    }

    const eligible = state.players.filter((p) => !p.isAdmin && !p.folded);

    if (!canDeclare) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center max-w-sm w-full">
                    <div className="text-5xl mb-4">⏳</div>
                    <h2 className="text-white text-xl font-bold mb-2">Aguardando resultado</h2>
                    <p className="text-gray-400 text-sm">
                        {state.hasAdmin
                            ? "O administrador está declarando o vencedor..."
                            : "Aguardando declaração do vencedor..."}
                    </p>
                    <div className="mt-4 text-yellow-400 font-mono text-2xl font-bold">
                        Pote: {state.pot.toLocaleString()}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
                <div className="text-center mb-5">
                    <div className="text-4xl mb-2">🏆</div>
                    <h2 className="text-white text-xl font-bold">Declarar vencedor</h2>
                    <div className="text-yellow-400 font-mono text-xl font-bold mt-1">
                        Pote: {state.pot.toLocaleString()}
                    </div>
                </div>

                <div className="flex flex-col gap-2 mb-5">
                    {eligible.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => toggle(p.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                                selected.includes(p.id)
                                    ? "border-yellow-400 bg-yellow-400/10"
                                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                            }`}
                        >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-white font-medium flex-1 text-left">{p.name}</span>
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selected.includes(p.id) ? "border-yellow-400 bg-yellow-400" : "border-gray-600"
                            }`}>
                                {selected.includes(p.id) && <span className="text-gray-950 text-xs font-bold">✓</span>}
                            </div>
                        </button>
                    ))}
                </div>

                {selected.length > 1 && (
                    <p className="text-gray-400 text-xs text-center mb-3">
                        Pote dividido: {Math.floor(state.pot / selected.length).toLocaleString()} fichas cada
                    </p>
                )}

                <button
                    onClick={handleDeclare}
                    disabled={selected.length === 0}
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-bold rounded-xl transition-all"
                >
                    Confirmar Vencedor{selected.length > 1 ? "es" : ""}
                </button>
            </div>
        </div>
    );
}

// ─── Componente Principal ────────────────────────────────────────────────────
export default function Poker({ roomId, roomPlayers }: Props) {
    const { state, update } = usePoker();
    const myId = socket.id ?? "";

    useEffect(() => {
        socket.on("stateUpdate", update);
        socket.emit("getState", { roomId });

        return () => {
            socket.off("stateUpdate", update);
        };
    }, [roomId, update]);

    // Sem estado ou jogo diferente → mostrar config
    if (!state || state.game !== "poker") {
        return (
            <ConfigScreen
                roomId={roomId}
                roomPlayers={roomPlayers}
                myId={myId}
            />
        );
    }

    const me = state.players.find((p) => p.id === myId);
    const isAdmin = me?.isAdmin ?? false;

    const canStartRound =
        state.phase === "waiting" || state.phase === "finished"
            ? state.hasAdmin ? isAdmin : true
            : false;

    return (
        <div className="min-h-screen bg-gray-950 text-white pb-32">
            {/* Header */}
            <div className="sticky top-0 bg-gray-950/95 backdrop-blur-sm border-b border-gray-900 px-4 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-xl">♠</span>
                    <span className="text-gray-400 text-sm font-mono uppercase tracking-widest">Poker</span>
                </div>

                {/* Pote */}
                <div className="text-center">
                    <div className="text-gray-500 text-xs uppercase tracking-widest">Pote</div>
                    <div className="text-yellow-400 font-mono font-bold text-lg">
                        {state.pot.toLocaleString()}
                    </div>
                </div>

                {/* Aposta atual */}
                <div className="text-right">
                    <div className="text-gray-500 text-xs uppercase tracking-widest">Aposta</div>
                    <div className="text-orange-400 font-mono font-bold text-lg">
                        {state.currentBet.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Phase indicator */}
            <div className="px-4 py-2 flex items-center justify-center gap-2">
                {state.phase === "betting" && (
                    <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/30 px-3 py-1 rounded-full">
                        Rodada em andamento
                    </span>
                )}
                {state.phase === "showdown" && (
                    <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full">
                        Showdown — aguardando vencedor
                    </span>
                )}
                {state.phase === "finished" && (
                    <span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/30 px-3 py-1 rounded-full">
                        Rodada encerrada
                    </span>
                )}
                {(state.phase === "waiting" || state.phase === "config") && (
                    <span className="text-xs text-gray-400 bg-gray-800 border border-gray-700 px-3 py-1 rounded-full">
                        Aguardando início
                    </span>
                )}
            </div>

            {/* Players grid */}
            <div className="px-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                    {state.players.map((player) => (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            isMyTurn={state.currentTurnId === player.id}
                            isMine={player.id === myId}
                            currentBet={state.currentBet}
                            isWinner={state.winners.includes(player.id)}
                            showWinnerSelect={false}
                            selectedAsWinner={false}
                            onToggleWinner={() => {}}
                        />
                    ))}
                </div>
            </div>

            {/* Turn indicator */}
            {state.phase === "betting" && state.currentTurnId && (
                <div className="px-4 mt-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                        {state.currentTurnId === myId ? (
                            <p className="text-yellow-400 font-semibold text-sm">
                                ✦ É a sua vez!
                            </p>
                        ) : (
                            <p className="text-gray-400 text-sm">
                                Vez de{" "}
                                <span className="text-white font-semibold">
                                    {state.players.find((p) => p.id === state.currentTurnId)?.name}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Resultado */}
            {state.phase === "finished" && state.winners.length > 0 && (
                <div className="px-4 mt-4">
                    <div className="bg-green-900/20 border border-green-700/40 rounded-xl p-4 text-center">
                        <div className="text-2xl mb-1">🏆</div>
                        <p className="text-green-400 font-bold">
                            {state.winners.length > 1 ? "Vencedores:" : "Vencedor:"}
                        </p>
                        <p className="text-white font-semibold">
                            {state.winners
                                .map((id) => state.players.find((p) => p.id === id)?.name)
                                .join(" & ")}
                        </p>
                    </div>
                </div>
            )}

            {/* Botão iniciar rodada */}
            {canStartRound && (
                <div className="px-4 mt-6">
                    <button
                        onClick={() =>
                            socket.emit("pokerAction", {
                                roomId,
                                action: { type: "START_ROUND" },
                            })
                        }
                        className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-bold rounded-xl text-lg tracking-wide transition-all active:scale-95"
                    >
                        {state.phase === "finished" ? "Nova Rodada" : "Iniciar Rodada"}
                    </button>
                </div>
            )}

            {/* Showdown overlay */}
            {state.phase === "showdown" && (
                <ShowdownScreen state={state} myId={myId} roomId={roomId} />
            )}

            {/* Action bar */}
            {state.phase === "betting" && (
                <ActionBar state={state} myId={myId} roomId={roomId} />
            )}
        </div>
    );
}