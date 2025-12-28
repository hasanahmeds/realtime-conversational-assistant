import { useState, useEffect, useRef } from "react"

function ChatScreen({ username, room, onLeaveRoom }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [onlineUsers, setOnlineUsers] = useState([])
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const ws = useRef(null)
    const messagesEndRef = useRef(null)

    const POPULAR_EMOJIS = [
        // Smilies & Emotions
        "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", 
        "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", 
        "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓",
        // Hand gestures
        "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", 
        "🖐️", "🖖", "👋", "🤙", "💪", "🦾", "🖕", "✍️", "🙏", "🤝",
        // Hearts, Stars & Celebrations
        "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
        "🔥", "✨", "⚡", "💥", "⭐", "🌟", "🎉", "🎊", "🎈", "🎁"
    ]

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    useEffect(() => {
        const wsUrl = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000"
        const socket = new WebSocket(
            `${wsUrl}/ws/${room}/${username}`
        )
        ws.current = socket

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === "users") {
                setOnlineUsers(data.users)
            } else {
                setMessages((prev) => [...prev, data])
            }
        }

        return () => socket.close()
    }, [room, username])

    function sendMessage() {
        if (input.trim() === "") return
        // Send UTC ISO timestamp — each user's browser converts to THEIR local time
        ws.current.send(JSON.stringify({ text: input, time: new Date().toISOString() }))
        setInput("")
    }

    function handleAddEmoji(emoji) {
        setInput((prev) => prev + emoji)
        setShowEmojiPicker(false)
    }

    return (
        <div className="h-screen bg-gray-900 flex flex-col font-sans text-gray-100">

            {/* Header */}
            <div className="h-16 px-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center shrink-0 shadow-md z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onLeaveRoom}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white flex items-center gap-2"
                        title="Leave Room"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="hidden sm:block text-sm font-medium">Leave Room</span>
                    </button>

                    <div className="h-8 w-px bg-gray-700 mx-1"></div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-blue-400 font-bold border border-gray-600">
                            #
                        </div>
                        <div>
                            <h2 className="text-white font-semibold leading-tight capitalize">{room}</h2>
                            <p className="text-xs text-green-400 font-medium">{onlineUsers.length} online</p>
                        </div>
                    </div>
                </div>

                {/* Online Indicator (Mobile/Desktop) */}
                <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-300 hidden sm:block">Live Connection</span>
                </div>
            </div>

            {/* Main Layout Area */}
            <div className="flex flex-1 overflow-hidden">

                {/* Chat Messages */}
                <div className="flex-1 flex flex-col bg-[#0b141a]"> {/* Dark theme WhatsApp-like background */}

                    {/* Scrollable Message List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="text-center my-4">
                            <span className="text-xs font-medium text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 shadow-sm">
                                Messages are end-to-end ephemeral.
                            </span>
                        </div>

                        {messages.map((msg, index) => {
                            const isMe = msg.username === username
                            return (
                                <div key={index} className="flex flex-col">
                                    {msg.type === "system" ? (
                                        <div className="flex justify-center my-2">
                                            <span className="text-xs font-medium text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 shadow-sm">
                                                {msg.text}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                                            {/* Username Label (Only for others) */}
                                            {!isMe && (
                                                <span className="text-xs font-semibold text-gray-400 mb-1 ml-1.5 capitalize">
                                                    {msg.username}
                                                </span>
                                            )}

                                            {/* Chat Bubble */}
                                            <div className={`relative px-4 py-2.5 shadow-sm text-[15px]
                                                ${isMe
                                                    ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                                                    : "bg-gray-800 text-gray-100 rounded-2xl rounded-tl-sm border border-gray-700"}`}
                                            >
                                                <p className="leading-relaxed break-words">{msg.text}</p>
                                            </div>

                                            {/* Timestamp — parsed from UTC into viewer's local time */}
                                            <span className={`text-[10px] text-gray-500 mt-1 font-medium ${isMe ? "mr-1.5" : "ml-1.5"}`}>
                                                {msg.time
                                                    ? new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                                    : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area (Sticky Bottom) */}
                    <div className="p-3 bg-gray-800 border-t border-gray-700 shrink-0 relative">
                        {showEmojiPicker && (
                            <div className="absolute bottom-20 left-4 z-50 bg-gray-900 border border-gray-700 p-3 rounded-2xl shadow-2xl w-64 backdrop-blur-md bg-opacity-95">
                                <div 
                                    className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1"
                                    style={{
                                        scrollbarWidth: "thin",
                                        scrollbarColor: "#374151 transparent"
                                    }}
                                >
                                    {POPULAR_EMOJIS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => handleAddEmoji(emoji)}
                                            className="text-2xl hover:scale-125 transition-transform p-1.5 focus:outline-none active:scale-90"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2 max-w-5xl mx-auto items-center relative">
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="h-12 w-12 shrink-0 bg-gray-700 hover:bg-gray-650 text-gray-300 hover:text-white rounded-full flex items-center justify-center text-xl transition-all active:scale-95"
                                title="Add Emoji"
                            >
                                😊
                            </button>
                            
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                placeholder={`Send Message in #${room}...`}
                                maxLength={500}
                                className="flex-1 bg-gray-700 text-white placeholder-gray-400 px-5 py-3.5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-[15px] border border-transparent focus:border-blue-600"
                            />

                            <button
                                onClick={sendMessage}
                                disabled={input.trim() === ""}
                                className="h-12 w-12 shrink-0 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-full flex items-center justify-center transition-all shadow-md active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Online Users (Desktop Only - Optional but makes it look pro) */}
                <div className="hidden md:flex flex-col w-64 bg-gray-800 border-l border-gray-700 shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.1)]">
                    <div className="p-5 border-b border-gray-700">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Participants ({onlineUsers.length})
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                        {onlineUsers.map((user, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-750 transition-colors cursor-default group">
                                <div className="relative">
                                    <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 font-semibold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        {user.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                                </div>
                                <span className={`text-[15px] font-medium truncate ${user === username ? "text-blue-400" : "text-gray-300"}`}>
                                    {user === username ? `${user} (You)` : user}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default ChatScreen