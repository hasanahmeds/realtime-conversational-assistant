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
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Indicator & Controls */}
                <div className="flex items-center gap-3">
                    {messages.length > 0 && (
                        <button
                            onClick={handleClearChat}
                            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-800 transition-colors"
                            title="Clear current chat log"
                        >
                            <span>🗑️</span> Clear Chat
                        </button>
                    )}

                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full shadow-inner">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase">AI Studio Live</span>
                    </div>
                </div>
            </header>

            {/* Workspace Main Area */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Left Sidebar - Persona Picker & Custom Prompt */}
                <aside className={`
                    absolute md:static top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-2xl border-r border-slate-800/80 z-40 flex flex-col shrink-0 transition-transform duration-300
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}>
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                        <div className="flex items-center gap-2">
                            <span className="text-base">🎭</span>
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                                Studio Personas
                            </h3>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-1 text-slate-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar">
                        {PERSONA_LIST.map((p) => {
                            const isSelected = !isCustomMode && activePersona === p.id
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => handlePersonaSelect(p.id)}
                                    className={`
                                        w-full text-left p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden group active:scale-[0.98]
                                        ${isSelected 
                                            ? `bg-slate-800/90 border-slate-600 shadow-lg ${p.borderGlow}` 
                                            : "bg-slate-900/40 hover:bg-slate-800/60 border-slate-800/70 hover:border-slate-700"}
                                    `}
                                >
                                    {isSelected && (
                                        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${p.gradient}`}></div>
                                    )}
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${p.gradient} flex items-center justify-center text-xl shrink-0 shadow-md border border-white/10 group-hover:scale-105 transition-transform`}>
                                            {p.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-slate-100 text-sm truncate">{p.name}</h4>
                                                {isSelected && (
                                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                                        ACTIVE
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-semibold text-cyan-400 tracking-wide block mt-0.5">{p.tag}</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed line-clamp-2">
                                        {p.desc}
                                    </p>
                                </button>
                            )
                        })}

                        {/* Custom Instruction Section */}
                        <div className="pt-4 mt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between mb-2.5">
                                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                    <span>⚙️</span> Dynamic Persona
                                </h4>
                            </div>

                            {/* Quick Presets */}
                            {!isCustomMode && (
                                <div className="mb-3 space-y-1">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Quick Templates:</span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {SYSTEM_PROMPT_PRESETS.map((preset, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setCustomPrompt(preset.prompt)}
                                                className="text-[10px] bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white p-1.5 rounded-lg text-left truncate transition-colors"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isCustomMode ? (
                                <div className="space-y-2">
                                    <div className="w-full bg-slate-950/80 border border-indigo-500/40 rounded-xl p-3 text-xs text-indigo-300 leading-relaxed font-medium shadow-inner">
                                        <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Active Custom System Prompt:</div>
                                        "{appliedCustomPrompt}"
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClearCustomPrompt}
                                        className="w-full bg-slate-800 hover:bg-red-950/80 border border-slate-700 hover:border-red-600/50 text-slate-200 hover:text-red-300 text-xs font-bold py-2 rounded-xl transition-all active:scale-95"
                                    >
                                        ❌ Reset to Default Persona
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleApplyCustomPrompt} className="space-y-2">
                                    <textarea
                                        placeholder="e.g. Speak like a senior code reviewer or medieval knight..."
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        maxLength={250}
                                        rows={3}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500/60 transition-all placeholder-slate-600 text-slate-100 leading-relaxed resize-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!customPrompt.trim()}
                                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-95"
                                    >
                                        ✨ Apply Custom Persona
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Chat Conversation Workspace */}
                <main className="flex-1 flex flex-col bg-[#070a11] overflow-hidden relative select-text">
                    
                    {/* Message Stream */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                        
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-2xl mx-auto my-auto">
                                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${isCustomMode ? "from-indigo-500 to-purple-600" : currentPersonaObj?.gradient} flex items-center justify-center text-white text-4xl shadow-2xl shadow-cyan-950/50 mb-5 border border-white/20 animate-pulse`}>
                                    {isCustomMode ? "🤖" : currentPersonaObj?.emoji}
                                </div>
                                
                                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                                    {isCustomMode ? "Custom AI Persona Ready" : `${currentPersonaObj?.name} (${currentPersonaObj?.title})`}
                                </h3>
                                
                                <p className="text-slate-400 text-sm leading-relaxed max-w-lg mb-8">
                                    {isCustomMode 
                                        ? `Custom System Prompt active: "${appliedCustomPrompt}". Ask anything to test your custom AI configuration.` 
                                        : currentPersonaObj?.desc}
                                </p>

                                {/* Interactive Prompt Starter Chips */}
                                {!isCustomMode && currentPersonaObj?.promptStarters && (
                                    <div className="w-full max-w-xl space-y-2.5">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                                            💡 Try asking {currentPersonaObj.name}:
                                        </span>
                                        <div className="flex flex-col gap-2">
                                            {currentPersonaObj.promptStarters.map((starter, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => sendMessage(starter)}
                                                    className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-all shadow-sm flex items-center justify-between group active:scale-[0.99]"
                                                >
                                                    <span>{starter}</span>
                                                    <span className="text-slate-500 group-hover:text-cyan-400 transition-colors">→</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isMe = msg.username === username
                                const isAI = !isMe && msg.username !== "System"

                                return (
                                    <div key={msg.id || index} className={`flex gap-3 max-w-4xl ${isMe ? "ml-auto flex-row-reverse" : "mr-auto flex-row"}`}>
                                        
                                        {/* Avatar Icon */}
                                        <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-base shadow-md font-bold ${
                                            isMe 
                                                ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white" 
                                                : isCustomMode 
                                                    ? "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white" 
                                                    : `bg-gradient-to-tr ${currentPersonaObj?.gradient} text-white`
                                        }`}>
                                            {isMe ? username.charAt(0).toUpperCase() : (isCustomMode ? "🤖" : currentPersonaObj?.emoji)}
                                        </div>

                                        {/* Message Container */}
                                        <div className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                                            
                                            {/* Header Tag & Timestamp */}
                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {isMe ? "You" : (isCustomMode ? "Custom AI Persona" : currentPersonaObj?.name)}
                                                </span>
                                                <span className="text-[9px] text-slate-500 font-semibold">
                                                    {msg.time ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                                </span>
                                            </div>

                                            {/* Chat Bubble */}
                                            <div className={`
                                                px-4 py-3 rounded-2xl shadow-xl leading-relaxed text-[14px] md:text-[15px] relative group
                                                ${isMe
                                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs"
                                                    : "bg-slate-900/90 text-slate-100 rounded-tl-xs border border-slate-800 shadow-slate-950/50"}
                                            `}>
                                                {isMe ? (
                                                    <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                                                ) : (
                                                    <div className="space-y-1">
                                                        {renderMarkdown(msg.text)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Copy button for AI responses */}
                                            {isAI && (
                                                <div className="flex items-center gap-2 mt-1.5 px-1 opacity-75 hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleCopyMessage(msg.text, index)}
                                                        className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-900/60 border border-slate-800 px-2 py-0.5 rounded-md transition-colors"
                                                    >
                                                        {copiedIndex === index ? (
                                                            <span className="text-emerald-400">✓ Copied</span>
                                                        ) : (
                                                            <span>📋 Copy text</span>
                                                        )}
                                                    </button>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                )
                            })
                        )}

                        {/* Typing Animation Loader */}
                        {isTyping && (
                            <div className="flex gap-3 max-w-4xl mr-auto">
                                <div className={`w-9 h-9 rounded-xl shrink-0 bg-gradient-to-tr ${isCustomMode ? "from-indigo-500 to-purple-600" : currentPersonaObj?.gradient} flex items-center justify-center text-white text-base shadow-md`}>
                                    {isCustomMode ? "🤖" : currentPersonaObj?.emoji}
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                                        {isCustomMode ? "AI Thinking..." : `${currentPersonaObj?.name} is thinking...`}
                                    </span>
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 shadow-md flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Elevated SaaS Input Dock */}
                    <div className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/80 shrink-0 relative z-20">
                        
                        {/* Emoji Picker Popup */}
                        {showEmojiPicker && (
                            <div className="absolute bottom-20 left-4 z-50 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-2xl w-72 backdrop-blur-2xl">
                                <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Emoji</span>
                                    <button onClick={() => setShowEmojiPicker(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
                                </div>
                                <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                    {POPULAR_EMOJIS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => handleAddEmoji(emoji)}
                                            className="text-xl hover:scale-125 transition-transform p-1 rounded hover:bg-slate-800 active:scale-95"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Container */}
                        <div className="max-w-4xl mx-auto flex items-center gap-2.5 relative">
                            
                            {/* Emoji Toggle Button */}
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="h-12 w-12 shrink-0 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-2xl flex items-center justify-center text-xl transition-colors shadow-sm active:scale-95"
                                title="Add emoji"
                            >
                                😊
                            </button>

                            {/* Main Input Textfield */}
                            <div className="flex-1 relative rounded-2xl overflow-hidden p-[1px] bg-slate-800 focus-within:bg-gradient-to-r focus-within:from-cyan-500 focus-within:to-blue-600 transition-all duration-300">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                    placeholder={
                                        isCustomMode 
                                            ? "Send message to Custom AI Persona..." 
                                            : `Ask ${currentPersonaObj?.name} anything...`
                                    }
                                    maxLength={500}
                                    className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 px-4 py-3 rounded-[15px] focus:outline-none text-sm border-0 transition-all"
                                />
                            </div>

                            {/* Send Button */}
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim()}
                                className="h-12 w-12 shrink-0 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 group"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                </main>

            </div>
        </div>
    )
}

export default AIChatScreen
