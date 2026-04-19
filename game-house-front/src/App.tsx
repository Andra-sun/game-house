import { useState } from "react";
import Lobby from "./pages/Lobby";
import Room from "./pages/Room";

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [name, setName] = useState("");

  if (!roomId) {
    return <Lobby onEnter={setRoomId} setName={setName} />;
  }

  return <Room roomId={roomId} name={name} />;
}