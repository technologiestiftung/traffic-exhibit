import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";

const wsUrl = import.meta.env.VITE_WS_URL;

export const useWebSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [numbers, setNumbers] = useState<number[]>([]);

  useEffect(() => {
    const newSocket = io(wsUrl);
    setSocket(newSocket);
    newSocket.on("camera-data", (data: number[]) => {
      setNumbers(data);
    });
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const stopMotor = () => {
    socket?.emit("stop-motor");
  };

  return { numbers, stopMotor };
};
