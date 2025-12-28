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
