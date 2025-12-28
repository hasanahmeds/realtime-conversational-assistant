import { useState, useEffect } from "react"

function RoomList({ username, onJoinRoom, onEnterAI }) {
    const [rooms, setRooms] = useState({})
    const [newRoomName, setNewRoomName] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        fetchRooms()
        const interval = setInterval(fetchRooms, 2000)
        return () => clearInterval(interval)
    }, [])

    async function fetchRooms() {
        try {
            // Using logic that connects to environment variable OR locally fallback
            const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
            const res = await fetch(`${apiUrl}/rooms`)
            const data = await res.json()
            setRooms(data)
        } catch (err) {
            console.log("Server cannot reach")
        }
    }

    function handleCreateRoom() {
        if (newRoomName.trim() === "") {
            setError("Please Enter Room_Name! 😅")
            return
        }
        onJoinRoom(newRoomName.trim().toLowerCase())
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Hey, {username}! 👋</h2>
                        <p className="text-gray-400 text-sm mt-1">Which room do you want to join?</p>
                    </div>
                    {/* User Avatar Placeholder */}
                    <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        {username.charAt(0).toUpperCase()}
                    </div>
                </div>

                {/* AI Chatbot CTA Card */}
                <div className="p-4 pb-0">
                    <button
                        onClick={onEnterAI}
                        className="w-full relative overflow-hidden group bg-gradient-to-r from-blue-950/60 to-indigo-950/60 hover:from-blue-900/60 hover:to-indigo-900/60 border border-blue-500/30 hover:border-blue-500/50 rounded-2xl p-4 transition-all duration-300 text-left shadow-lg active:scale-[0.98]"
                    >
                        {/* Glow effect */}
                        <div className="absolute -inset-px bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                        
                        <div className="relative flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-md group-hover:scale-105 transition-transform duration-300">
                                🤖
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-white text-sm">AI Chatbot Studio</h3>
                                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                                        New
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Engage with highly realistic dynamic AI personas!
                                </p>
                            </div>
                            <div className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </button>
