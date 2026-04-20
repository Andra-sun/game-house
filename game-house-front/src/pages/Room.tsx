import { useEffect, useState } from "react";
import { socket } from "../socket/socket";
import type { Room, Player } from "../types/room";
import Chess from "./Chess";

type RoomProps = {
    roomId: string;
    name: string;
};

type GameState = {
    game?: string;
    [key: string]: unknown;
};

export default function Room({ roomId }: RoomProps) {
    const [room, setRoom] = useState<Room | null>(null);
    const [state, setState] = useState<GameState>({});
    const [showChessSetup, setShowChessSetup] = useState(false);
    const [chessTime, setChessTime] = useState(300);

    const games = [
        { name: "Xadrez", icon: "♟️", maxPlayers: 2 },
        { name: "Batalha Naval", icon: "🛥️", maxPlayers: 2 },
        { name: "Poker", icon: "♦️", maxPlayers: 8 },
    ];

    useEffect(() => {
        const onRoomUpdate = (data: Room) => setRoom(data);
        const onStateUpdate = (data: GameState) => setState(data);

        socket.on("roomUpdate", onRoomUpdate);
        socket.on("stateUpdate", onStateUpdate);

        return () => {
            socket.off("roomUpdate", onRoomUpdate);
            socket.off("stateUpdate", onStateUpdate);
        };
    }, []);

    socket.emit("joinRoom", { roomId, name });
    function handleStartGame(gameName: string) {
        if (gameName === "Xadrez") {
            setShowChessSetup(true);
            return;
        }

        socket.emit("startGame", { roomId, game: gameName });
    }

    function startChess() {
        socket.emit("startChessClock", {
            roomId,
            time: chessTime,
        });

        setShowChessSetup(false);
    }

    if (state?.game === "chess-clock") {
        return <Chess roomId={roomId} />;
    }

    const isHost =
        room && room.players.length > 0 && room.players[0].id === socket.id;

    if (!room)
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
                        <p className="text-white text-lg font-semibold">
                            Entrando na sala...
                        </p>
                    </div>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen w-full bg-linear-to-br from-indigo-900 via-purple-900 to-pink-800 p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8 border border-white/20 mb-6 w-full">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-left text-white">
                                Sala de Jogo
                            </h1>
                            <div className="flex items-center gap-2 mt-2">
                                <code className="bg-black/30 px-3 py-1 rounded-lg text-yellow-400 font-mono text-sm">
                                    {roomId}
                                </code>
                                <button
                                    onClick={() =>
                                        navigator.clipboard.writeText(roomId)
                                    }
                                    className="text-white/40 hover:text-white/80 transition-colors text-sm"
                                    title="Copiar ID"
                                >
                                    📋
                                </button>

                                <button
                                    onClick={() => {}}
                                    className="text-white hover:text-gray-400 border rounded-full transition-colors text-sm px-2 py-1 ml-20"
                                    title="Sair da sala"
                                >
                                    Sair
                                </button>

                                {isHost && (
                                    <button
                                        onClick={() => {}}
                                        className="text-white border rounded-full hover:text-red-400 transition-colors text-sm px-2 py-1"
                                        title="Apagar sala"
                                    >
                                        Apagar Sala
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-white/80 text-sm">
                                    Conectado
                                </span>
                            </div>

                            {isHost && (
                                <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full">
                                    <span className="text-yellow-400">👑</span>
                                    <span className="text-yellow-400 text-sm font-semibold">
                                        Host
                                    </span>
                                </div>
                            )}

                            <div className="h-6 w-px bg-white/20"></div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20 sticky top-6">
                            <h2 className="text-white font-bold text-lg mb-4">
                                Jogadores
                            </h2>

                            <div className="space-y-2">
                                {room.players.map((p: Player, index) => (
                                    <div
                                        key={p.id}
                                        className="bg-white/5 rounded-xl p-3 border border-white/10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                                style={{
                                                    backgroundColor:
                                                        p.color || "#6366f1",
                                                }}
                                            >
                                                {p.name.charAt(0)}
                                            </div>

                                            <div className="flex-1">
                                                <p className="text-white font-semibold">
                                                    {p.name}
                                                    {index === 0 && (
                                                        <span className="ml-2 text-xs text-yellow-400">
                                                            👑 Host
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            {p.id === socket.id && (
                                                <span className="text-xs text-blue-300">
                                                    Você
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                            <h2 className="text-white font-bold mb-4">Jogos</h2>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {games.map((game, i) => (
                                    <button
                                        key={i}
                                        onClick={() =>
                                            handleStartGame(game.name)
                                        }
                                        className="bg-white/5 p-4 rounded-xl text-white"
                                    >
                                        <div className="text-3xl">
                                            {game.icon}
                                        </div>
                                        <div>{game.name}</div>
                                        <div className="text-xs opacity-60">
                                            {game.maxPlayers} jogadores
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {showChessSetup && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white border border-gray-400 rounded-2xl shadow-xl w-80 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">♟️</span>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Tempo do Xadrez
                                </h2>
                            </div>

                            <input
                                type="number"
                                value={chessTime}
                                onChange={(e) =>
                                    setChessTime(Number(e.target.value) * 60)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 text-black hidden"
                                placeholder="Segundos"
                            />

                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setChessTime(5 * 60)}
                                    className="flex-1 bg-gray-100 rounded-lg py-2 focus:border"
                                >
                                    5 min
                                </button>
                                <button
                                    onClick={() => setChessTime(10 * 60)}
                                    className="flex-1 bg-gray-100 rounded-lg py-2 focus:border"
                                >
                                    10 min
                                </button>
                                <button
                                    onClick={() => setChessTime(15 * 60)}
                                    className="flex-1 bg-gray-100 rounded-lg py-2 focus:border"
                                >
                                    15 min
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={startChess}
                                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg"
                                >
                                    Iniciar
                                </button>
                                <button
                                    onClick={() => setShowChessSetup(false)}
                                    className="flex-1 bg-gray-200 py-2 rounded-lg"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
