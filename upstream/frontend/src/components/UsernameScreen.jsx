import { useState } from "react"

function UsernameScreen({ onUsernameSet }) {
    const [name, setName] = useState("")
    const [error, setError] = useState("")

    function handleSubmit() {
        if (name.trim() === "") {
            setError("Please Enter Your Name Then Try Again! 😅")
            return
        }
        onUsernameSet(name.trim())
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 p-4">
            {/* Modern Card */}
            <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-700">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4 shadow-lg inline-block rounded-full bg-gray-700 p-3">💬</div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">ChatApp</h1>
                    <p className="text-gray-400 mt-2 text-sm">Real-time anonymous messaging</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Enter Your Name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            maxLength={20}
                            className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-500"
                        />
                        {error && (
                            <p className="text-red-400 text-sm mt-2 font-medium">{error}</p>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25"
                    >
                        JOIN CHAT 🚀
                    </button>

                    <p className="text-gray-500 text-xs text-center mt-4">
                        No Account Required • Direct Login • No Data Stored
                    </p>
                </div>
            </div>
        </div>
    )
}

export default UsernameScreen