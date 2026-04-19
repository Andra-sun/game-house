import { useEffect, useState } from "react";
import { socket } from "../socket/socket";

type Room = {
  id: string;
  players: {
    id: string;
    name: string;
    color: string;
  }[];
};

type LobbyProps = {
  onEnter: (roomId: string) => void;
  setName: (name: string, color: string) => void;
};

export default function Lobby({ onEnter, setName }: LobbyProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [room, setRoom] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6366f1");

  useEffect(() => {
    socket.emit("getRooms");

    const handler = (data: Room[]) => {
      setRooms(data);
    };

    socket.on("roomsList", handler);

    return () => {
      socket.off("roomsList", handler);
    };
  }, []);

  const colors = [
    { name: "Roxo", value: "#8b5cf6", bg: "bg-purple-500" },
    { name: "Rosa", value: "#ec4899", bg: "bg-pink-500" },
    { name: "Vermelho", value: "#ef4444", bg: "bg-red-500" },
    { name: "Laranja", value: "#f97316", bg: "bg-orange-500" },
    { name: "Amarelo", value: "#eab308", bg: "bg-yellow-500" },
    { name: "Verde", value: "#22c55e", bg: "bg-green-500" },
    { name: "Azul", value: "#3b82f6", bg: "bg-blue-500" },
    { name: "Ciano", value: "#06b6d4", bg: "bg-cyan-500" },
  ];

  function handleEnter() {
    if (!room || !playerName) return;

    setName(playerName, selectedColor);

    socket.emit("joinRoom", {
      roomId: room,
      name: playerName,
      color: selectedColor,
    });

    onEnter(room);
  }

  function handleCreate() {
    if (!playerName) return;

    setName(playerName, selectedColor);

    socket.emit("createRoom");

    socket.once("roomCreated", (roomId: string) => {
      socket.emit("joinRoom", {
        roomId,
        name: playerName,
        color: selectedColor,
      });

      onEnter(roomId);
    });
  }

  return (
    <div className="min-h-screen min-w-screen bg-linear-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl">
        <div className="flex-1 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8 border border-white/20">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-8 bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
            Lobby
          </h1>

          <div className="mb-6">
            <label className="block text-white font-semibold mb-2 text-sm uppercase tracking-wide">
              Seu nome
            </label>
            <input
              placeholder="Digite seu nome"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
            />
          </div>

          <div className="mb-8">
            <label className="block text-white font-semibold mb-3 text-sm uppercase tracking-wide">
              Escolha sua cor
            </label>
            <div className="grid grid-cols-7 gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`
                    w-full aspect-square rounded-full transition-all duration-200
                    ${color.bg} scale-90
                    hover:scale-100 hover:shadow-lg
                    ${
                      selectedColor === color.value
                        ? "ring-4 ring-white ring-offset-2 ring-offset-white/20 scale-100"
                        : "ring-2 ring-white/30"
                    }
                  `}
                  title={color.name}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <div
                className="w-6 h-6 rounded-full shadow-md"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-white/80 text-sm">Cor selecionada</span>
            </div>
          </div>

          <hr className="border-white/20 mb-6" />

          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                placeholder="ID da sala"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
              />

              <button
                onClick={handleEnter}
                disabled={!room || !playerName}
                className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Entrar
              </button>
            </div>

            <hr className="border-white/20 mb-6" />

            <button
              onClick={handleCreate}
              disabled={!playerName}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Criar Nova Sala
            </button>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-3">🎯</div>
              <p className="text-white/60 text-sm">
                Nenhuma sala disponível
              </p>
              <p className="text-white/40 text-xs mt-2">
                Crie uma sala para começar!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRoom(r.id)}
                  className="text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
                >
                  Sala: {r.id} ({r.players.length} jogadores)
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}