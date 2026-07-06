"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface User { _id: string; nom: string; prenom: string; photo: string }
interface Message {
  _id: string;
  expediteurId: User;
  destinataireId: User;
  contenu: string;
  dateEnvoi: string;
  lu: boolean;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [team, setTeam] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        const members = (Array.isArray(data) ? data : []).filter(
          (u: User) => u._id !== session?.user?.id
        );
        setTeam(members);
      });
  }, [session]);

  useEffect(() => {
    if (!selectedUser) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    if (!selectedUser) return;
    const res = await fetch(`/api/messages?with=${selectedUser._id}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: selectedUser._id, contenu: newMessage }),
    });
    setNewMessage("");
    await fetchMessages();
    setSending(false);
  }

  const myId = session?.user?.id;

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Contacts sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-slate-100">
        <div className="border-b border-slate-100 px-4 py-4">
          <h2 className="text-sm font-semibold text-slate-700">Conversations</h2>
        </div>
        <div className="overflow-y-auto">
          {team.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-slate-400">Aucun membre d&apos;équipe</p>
          ) : (
            team.map((user) => (
              <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  selectedUser?._id === user._id ? "bg-indigo-50 border-r-2 border-indigo-500" : ""
                }`}
              >
                {user.photo ? (
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                    <Image src={user.photo} alt={`${user.prenom} ${user.nom}`} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white">
                    {user.prenom?.[0]}{user.nom?.[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900">{user.prenom} {user.nom}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex flex-1 flex-col">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              {selectedUser.photo ? (
                <div className="relative h-9 w-9 overflow-hidden rounded-full">
                  <Image src={selectedUser.photo} alt="" fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white">
                  {selectedUser.prenom?.[0]}{selectedUser.nom?.[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedUser.prenom} {selectedUser.nom}</p>
                <p className="text-xs text-emerald-500">En ligne</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Commencez la conversation !
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.expediteurId._id === myId;
                  return (
                    <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          isMe
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none"
                            : "bg-slate-100 text-slate-800 rounded-bl-none"
                        }`}
                      >
                        <p>{msg.contenu}</p>
                        <p className={`mt-1 text-xs ${isMe ? "text-indigo-200" : "text-slate-400"}`}>
                          {new Date(msg.dateEnvoi).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="border-t border-slate-100 px-4 py-4 flex gap-3">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message à ${selectedUser.prenom}...`}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white disabled:opacity-50 hover:opacity-90 transition"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
            <MessageSquare size={48} className="mb-3 opacity-20" />
            <p className="text-sm">Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
