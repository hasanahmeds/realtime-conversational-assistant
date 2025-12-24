import { useState, useEffect, useRef } from "react"

const PERSONA_LIST = [
    {
        id: "tech_architect",
        name: "Ada",
        title: "Tech Architect",
        emoji: "💻",
        tag: "Principal Architect",
        desc: "Specializes in system design, security, code refactoring & high-scale performance.",
        gradient: "from-cyan-500 via-blue-500 to-indigo-600",
        accentColor: "cyan",
        borderGlow: "border-cyan-500/40 shadow-cyan-500/10",
        promptStarters: [
            "⚡ Design a high-scale real-time chat architecture",
            "🔒 Security audit best practices for REST & WebSockets",
            "🚀 How to optimize React component re-renders?"
        ]
    },
    {
        id: "storyteller",
        name: "Chronicler",
        title: "Storyteller",
        emoji: "🎭",
        tag: "Epic Narrator",
        desc: "Spins whimsical fantasy adventure logs and atmospheric descriptive tales.",
        gradient: "from-purple-500 via-pink-500 to-rose-600",
        accentColor: "purple",
        borderGlow: "border-purple-500/40 shadow-purple-500/10",
        promptStarters: [
            "⚔️ Start an interactive cyberpunk tavern RPG quest",
            "🌌 Describe a mysterious ancient floating sky-city",
            "📜 Tell a story about a wizard who forgot his spells"
        ]
    },
    {
        id: "professor",
        name: "Dr. Sage",
        title: "Professor",
        emoji: "🎓",
        tag: "Academic Scholar",
        desc: "Delivers deep academic reasoning, structural breakdowns, and clear citations.",
        gradient: "from-amber-500 via-orange-500 to-yellow-600",
        accentColor: "amber",
        borderGlow: "border-amber-500/40 shadow-amber-500/10",
        promptStarters: [
            "🎓 Explain Quantum Entanglement in plain English",
            "📊 Monolith vs Microservices: Deep architectural analysis",
            "🔬 How do modern Large Language Models actually process language?"
        ]
    },
    {
        id: "travel_guide",
        name: "Atlas",
        title: "Travel Guide",
        emoji: "🗺️",
        tag: "Local Explorer",
        desc: "Curates packing suggestions, custom 3-day itineraries, and local secret spots.",
        gradient: "from-emerald-500 via-teal-500 to-green-600",
        accentColor: "emerald",
        borderGlow: "border-emerald-500/40 shadow-emerald-500/10",
        promptStarters: [
            "⛩️ Plan a 3-day food & culture itinerary for Kyoto",
            "🎒 Packing checklist for 1 week Alpine mountain hiking",
            "🏖️ Hidden secret coastal towns in Southern Italy"
        ]
    }
]

const SYSTEM_PROMPT_PRESETS = [
    { label: "💻 Code Reviewer", prompt: "Act as a strict Senior Code Reviewer. Audit my code for security flaws, bugs, and performance bottlenecks." },
    { label: "🧠 Explain Like I'm 5", prompt: "Explain complex concepts using ultra-simple analogies, real-world examples, and ELI5 language." },
    { label: "🤖 Cyberpunk Hacker", prompt: "Speak like an elite underground cyberpunk hacker from 2077 using sci-fi jargon and edgy tone." },
    { label: "👔 Executive PM", prompt: "Act as a Silicon Valley Product Manager. Focus on business value, metrics, user impact, and roadmaps." }
]

const POPULAR_EMOJIS = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", 
    "😋", "😛", "😜", "😎", "🥳", "😏", "🥺", "😭", "🤯", "😳", "😱", "👍", "🙌", "👏", "🔥", "✨", "⚡", 
    "⭐", "🎉", "❤️", "💙", "💜", "🟢", "🎯", "🚀", "💡", "💻", "🧠", "🗺️", "🎭", "🎓"
]

function CodeBlock({ code, lang }) {
    const [copied, setCopied] = useState(false)

    function handleCopy() {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="my-3 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
                <span className="uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    {lang || "CODE"}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                    {copied ? (
                        <>
                            <span className="text-emerald-400">✓</span> Copied
                        </>
                    ) : (
                        <>
                            <span>📋</span> Copy
                        </>
                    )}
                </button>
            </div>
            <pre className="p-4 text-[13px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                <code>{code.trim()}</code>
            </pre>
        </div>
    )
}

function AIChatScreen({ username, onLeave }) {
    const [activePersona, setActivePersona] = useState("tech_architect")
    const [customPrompt, setCustomPrompt] = useState("")
    const [appliedCustomPrompt, setAppliedCustomPrompt] = useState("")
    const [isCustomMode, setIsCustomMode] = useState(false)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState(null)

    const ws = useRef(null)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // Reset chat history when persona changes
    useEffect(() => {
        setMessages([])
    }, [activePersona, isCustomMode, appliedCustomPrompt])

    // Scroll to bottom on new message or typing state change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isTyping])

    // Handle WebSocket life cycle
    useEffect(() => {
        const wsUrl = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000"
        
        let path = `${wsUrl}/ws/ai/`
        if (isCustomMode) {
            path += `custom/${username}?custom_instruction=${encodeURIComponent(appliedCustomPrompt || "A helpful AI assistant")}`
        } else {
            path += `${activePersona}/${username}`
        }

        const socket = new WebSocket(path)
        ws.current = socket

