import React, { useState, useEffect, useRef } from "react";
import { Mic, Image, Smile, Send, MapPin, Loader2 } from "lucide-react";
import bot from "./assets/bot.jpg";
import user from "./assets/user.jpg";
import "./index.css"; // Ensure global styles like font are applied

export default function App() {
  const [messages, setMessages] = useState([
    {
      sender: "DreamBot",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      text: "Welcome! Tell me about your dream, and I’ll try to interpret it for you.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      sender: "You",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();
      const botMessage = {
        sender: "DreamBot",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: data.response || "Sorry, something went wrong.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "DreamBot",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          text: "Error interpreting your dream.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen font-[Karla] bg-white">
      {/* Header */}
      <div className="flex items-center justify-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-6">
          <div className=" bg-gray-300 rounded-full overflow-hidden">
            <img className="w-10 h-10 rounded-full" src={bot} alt="bot" />
          </div>
          <div className="text-gray-800 font-bold text-2xl tracking-tight">
            Dream Bot
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto px-6 py-6 bg-gradient-to-br from-white via-gray-50 to-gray-100 space-y-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 animate-fade-in-up`}
          >
            <div className="flex items-center w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
              <img
                className="rounded-full"
                src={msg.sender === "You" ? user : bot}
                alt={msg.sender}
              />
            </div>
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-gray-800">
                {msg.sender}
                <span className="ml-2 text-xs text-gray-400">{msg.time}</span>
              </div>
              <div
                className={`mt-1 text-sm px-5 py-3 rounded-2xl shadow-sm  ${
                  msg.sender === "You"
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-800"
                }`}
              >
                {msg.text.split(" ").map((word, i) =>
                  word.startsWith("@") ? (
                    <span key={i} className="text-blue-600 font-medium mr-1">
                      {word}
                    </span>
                  ) : word.startsWith("http") ? (
                    <a
                      key={i}
                      href={word}
                      className="text-blue-500 underline mr-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {word}
                    </a>
                  ) : (
                    <span key={i} className="mr-1">
                      {word}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-gray-500 text-sm flex items-center gap-2 px-4">
            <Loader2 className="animate-spin" size={18} /> DreamBot is
            thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center rounded-full bg-gray-100 px-4 py-4 shadow-sm">
          <button className="text-gray-500 hover:text-gray-700 mr-4 ml-2">
            <Mic size={20} />
          </button>
          <input
            type="text"
            className="flex-grow bg-transparent outline-none placeholder-gray-400 text-sm"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <div className="flex items-center gap-3 mr-2 text-gray-500">
            <button className="hover:text-gray-700">
              <Image size={20} />
            </button>
            <button className="hover:text-gray-700">
              <Smile size={20} />
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              className="hover:text-gray-700"
            >
              <Send size={20} />
            </button>
            <button className="hover:text-gray-700">
              <MapPin size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
