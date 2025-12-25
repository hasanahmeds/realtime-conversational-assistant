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

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === "typing") {
                setIsTyping(data.status)
            } else if (data.type === "stream_start") {
                setIsTyping(false)
                setMessages((prev) => [
                    ...prev,
                    {
                        id: data.id,
                        username: data.username,
                        text: "",
                        time: data.time
                    }
                ])
            } else if (data.type === "stream_chunk") {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === data.id
                            ? { ...msg, text: msg.text + data.chunk }
                            : msg
                    )
                )
            } else if (data.type === "stream_end") {
                setIsTyping(false)
            } else {
                setMessages((prev) => [...prev, data])
            }
        }

        return () => socket.close()
    }, [activePersona, username, isCustomMode, appliedCustomPrompt])

    function sendMessage(textToSend) {
        const query = textToSend || input
        if (!query.trim()) return
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ text: query.trim(), time: new Date().toISOString() }))
            setInput("")
            setShowEmojiPicker(false)
        }
    }

    function handlePersonaSelect(id) {
        setIsCustomMode(false)
        setActivePersona(id)
        setSidebarOpen(false)
    }

    function handleApplyCustomPrompt(e) {
        if (e) e.preventDefault()
        if (!customPrompt.trim()) return
        setAppliedCustomPrompt(customPrompt)
        setIsCustomMode(true)
        setSidebarOpen(false)
    }

    function handleClearCustomPrompt() {
        setIsCustomMode(false)
        setCustomPrompt("")
        setAppliedCustomPrompt("")
        setActivePersona("tech_architect")
    }

    function handleAddEmoji(emoji) {
        setInput((prev) => prev + emoji)
        setShowEmojiPicker(false)
        inputRef.current?.focus()
    }

    function handleCopyMessage(text, index) {
        navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    function handleClearChat() {
        setMessages([])
    }

    // Modern Markdown Renderer
    function renderMarkdown(text) {
        if (!text) return null
        const parts = text.split(/(```[\s\S]*?```)/g)
        return parts.map((part, i) => {
            if (part.startsWith("```")) {
                const match = part.match(/```(\w*)\n([\s\S]*?)```/)
                const lang = match ? match[1] : ""
                const code = match ? match[2] : part.slice(3, -3)
                return <CodeBlock key={i} code={code} lang={lang} />
            }
            
            let rendered = part
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/`([^`]+)`/g, '<code class="bg-slate-950 text-pink-400 px-1.5 py-0.5 rounded-md font-mono text-xs border border-slate-800">$1</code>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em class="italic text-slate-200">$1</em>')
                .replace(/\n/g, '<br/>')
            
            return (
                <span
                    key={i}
                    dangerouslySetInnerHTML={{ __html: rendered }}
                    className="leading-relaxed break-words text-[14px] md:text-[15px] text-slate-200"
                />
            )
        })
    }

    const currentPersonaObj = PERSONA_LIST.find(p => p.id === activePersona)

    return (
        <div className="h-screen bg-[#070a11] flex flex-col font-sans text-slate-100 overflow-hidden relative select-none">
            
            {/* Ambient Background Gradient Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <header className="h-16 px-4 md:px-6 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 flex justify-between items-center shrink-0 z-30 shadow-lg">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onLeave}
                        className="px-3 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all text-slate-300 hover:text-white flex items-center gap-2 text-xs font-semibold group shadow-sm active:scale-95"
                        title="Return to Room List"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Exit Studio</span>
                    </button>

                    <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block"></div>

                    {/* Mobile Sidebar Drawer Toggle */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="md:hidden px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5"
                    >
                        <span>🎭</span> Personas
                    </button>

                    {/* Active Persona Header Banner */}
                    <div className="hidden sm:flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${isCustomMode ? "from-indigo-500 to-purple-600" : currentPersonaObj?.gradient} flex items-center justify-center text-lg shadow-md shadow-cyan-950/40 border border-white/10`}>
                            {isCustomMode ? "🤖" : currentPersonaObj?.emoji}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-white text-sm font-bold tracking-tight">
                                    {isCustomMode ? "Custom AI Persona" : currentPersonaObj?.name}
                                </h2>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                    {isCustomMode ? "Dynamic Prompt" : currentPersonaObj?.title}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xs">
                                {isCustomMode ? `"${appliedCustomPrompt}"` : currentPersonaObj?.tag}
