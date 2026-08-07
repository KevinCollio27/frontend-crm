import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

// Conexión única compartida por toda la app — no una por tabla/componente.
// El backend no exige auth para conectarse; el aislamiento por workspace
// ocurre al unirse a la sala (`join-workspace-room`), no en el connect.
export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
    })
  }
  return socket
}
