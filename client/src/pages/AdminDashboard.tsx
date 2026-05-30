import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Users,
  MessageCircle,
  Clock,
  KeyRound,
  Search,
  ArrowLeft,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";

type UserDetail = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: string;
  userContext: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Security gate: non-admins are sent home
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // Queries
  const { data: usersList, isLoading: loadingUsers } = trpc.admin.listUsers.useQuery(
    undefined,
    {
      enabled: !!user && user.role === "admin",
      refetchOnWindowFocus: false,
    }
  );

  const { data: chatHistory, isLoading: loadingChats } = trpc.admin.getUserChats.useQuery(
    { userId: selectedUserId as number },
    {
      enabled: !!selectedUserId && !!user && user.role === "admin",
      refetchOnWindowFocus: false,
    }
  );

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#031525] to-[#001b1b]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  // Filter users based on search
  const filteredUsers = (usersList || []).filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.loginMethod?.toLowerCase().includes(searchTerm.toLowerCase())
  ) as UserDetail[];

  const selectedUser = usersList?.find((u) => u.id === selectedUserId) as UserDetail | undefined;

  const getEmotionColor = (emotion?: string | null) => {
    switch (emotion?.toLowerCase()) {
      case "sadness":
        return "bg-blue-500/25 border-blue-500/40 text-blue-300";
      case "anxiety":
        return "bg-amber-500/25 border-amber-500/40 text-amber-300";
      case "anger":
        return "bg-red-500/25 border-red-500/40 text-red-300";
      case "happiness":
        return "bg-emerald-500/25 border-emerald-500/40 text-emerald-300";
      case "loneliness":
        return "bg-purple-500/25 border-purple-500/40 text-purple-300";
      default:
        return "bg-gray-500/20 border-gray-500/30 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#020617] via-[#041d1d] to-[#001212] text-white">
      {/* Navbar */}
      <nav className="bg-slate-900/60 border-b border-white/10 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="hover:bg-white/10 text-emerald-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              <span className="text-xl font-bold tracking-tight text-white">
                My Hridyam Admin Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-emerald-300/80 font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
              Logged in as Admin: {user.name}
            </span>
            <Button
              onClick={() => logout()}
              variant="outline"
              className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 h-[calc(100vh-73px)] overflow-hidden">
        {/* Left Side: Users list */}
        <div className="w-full md:w-5/12 bg-slate-900/40 border border-white/10 rounded-2xl p-4 flex flex-col backdrop-blur-sm h-full">
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Registered Users
              </h2>
              <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md text-emerald-300 border border-white/5 font-semibold">
                Total: {usersList?.length || 0}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-emerald-300/50" />
              <Input
                placeholder="Search by name, email, method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-950/60 border-white/10 focus:border-emerald-500/50 focus:ring-0 text-sm h-10 rounded-xl"
              />
            </div>
          </div>

          {/* User List Panel */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-12 text-emerald-300/50">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-sm">Fetching user profiles...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No users found matching query
              </div>
            ) : (
              filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                    selectedUserId === u.id
                      ? "bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-900/10"
                      : "bg-slate-950/40 border-white/5 hover:bg-slate-950/80 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        {u.name || "Anonymous Guest"}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium truncate max-w-[220px] mt-0.5">
                        {u.email || "No email registered"}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        u.loginMethod === "guest"
                          ? "bg-slate-800 border-white/10 text-gray-400"
                          : "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                      }`}
                    >
                      {u.loginMethod || "guest"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-1 border-t border-white/5 pt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Joined: {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Active: {new Date(u.lastSignedIn).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Conversations logs */}
        <div className="flex-1 bg-slate-900/40 border border-white/10 rounded-2xl p-4 flex flex-col backdrop-blur-sm h-full overflow-hidden">
          {selectedUserId === null ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <MessageCircle className="w-12 h-12 text-emerald-500/20 mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No User Selected</h3>
              <p className="text-xs max-w-xs">
                Select a user from the left panel to review their profiles, configurations, and chat message history logs.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* User Bio Information Header */}
              {selectedUser && (
                <div className="bg-slate-950/60 p-4 border border-white/5 rounded-xl mb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h2 className="text-base font-bold text-emerald-400">
                        {selectedUser.name || "Anonymous Guest"}
                      </h2>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        Session ID: <span className="font-mono text-emerald-300">{selectedUser.openId}</span>
                      </p>
                    </div>
                    {selectedUser.loginMethod === "email" && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                        <KeyRound className="w-3.5 h-3.5" />
                        Email Authenticated
                      </div>
                    )}
                  </div>
                  {selectedUser.userContext && (
                    <div className="mt-3 text-xs bg-emerald-950/15 border border-emerald-500/10 p-2.5 rounded-lg text-emerald-200">
                      <span className="font-bold block mb-0.5">Emotional Trends Context:</span>
                      {selectedUser.userContext}
                    </div>
                  )}
                </div>
              )}

              {/* Message Log Container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-2 custom-scrollbar">
                {loadingChats ? (
                  <div className="flex flex-col items-center justify-center py-20 text-emerald-300/50">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-sm">Retrieving conversation logs...</span>
                  </div>
                ) : !chatHistory || chatHistory.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 text-sm flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-gray-600 mb-2" />
                    <span>No messages found for this user yet</span>
                  </div>
                ) : (
                  chatHistory.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[85%] ${
                        m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      {/* Bubble content */}
                      <div
                        className={`p-4.5 rounded-2xl text-sm leading-relaxed border ${
                          m.role === "user"
                            ? "bg-slate-950/60 border-white/5 rounded-br-none text-emerald-100"
                            : "bg-emerald-950/10 border-emerald-500/10 rounded-bl-none text-emerald-50"
                        }`}
                      >
                        {m.content}
                      </div>

                      {/* Details row under bubble */}
                      <div className="flex items-center gap-2 mt-1.5 px-1">
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                        {m.emotion && (
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${getEmotionColor(
                              m.emotion
                            )}`}
                          >
                            {m.emotion}
                          </span>
                        )}
                        {m.isCrisisDetected && (
                          <span className="text-[9px] bg-red-500/20 border border-red-500/40 text-red-400 uppercase font-bold px-1.5 py-0.5 rounded-md animate-pulse">
                            CRISIS DETECTED
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
