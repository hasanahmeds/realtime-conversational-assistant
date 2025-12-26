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
