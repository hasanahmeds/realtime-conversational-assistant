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
