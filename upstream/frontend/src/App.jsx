import { useState } from "react"
import UsernameScreen from "./components/UsernameScreen"
import RoomList from "./components/RoomList"
import ChatScreen from "./components/ChatScreen"
import AIChatScreen from "./components/AIChatScreen"

function App() {
  const [username, setUsername] = useState("")
  const [currentRoom, setCurrentRoom] = useState("")
  const [chatMode, setChatMode] = useState("rooms") // "rooms" or "ai"

  if (!username) {
    return <UsernameScreen onUsernameSet={setUsername} />
  }

  if (chatMode === "ai") {
    return (
      <AIChatScreen
        username={username}
        onLeave={() => setChatMode("rooms")}
      />
    )
  }

  if (!currentRoom) {
    return (
      <RoomList
        username={username}
        onJoinRoom={setCurrentRoom}
        onEnterAI={() => setChatMode("ai")}
      />
    )
  }

  return (
    <ChatScreen
      username={username}
      room={currentRoom}
      onLeaveRoom={() => setCurrentRoom("")}
    />
  )
}
export default App