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
