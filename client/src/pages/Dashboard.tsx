import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Heart,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Calendar,
  LogOut,
  Settings,
} from "lucide-react";
import { Link } from "wouter";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const EMOTION_COLORS: Record<string, string> = {
  SADNESS: "#3b82f6", // Blue
  ANXIETY: "#f59e0b", // Amber
  ANGER: "#ef4444",   // Red
  HAPPINESS: "#10b981", // Emerald
  LONELINESS: "#a855f7", // Purple
  NEUTRAL: "#6b7280",  // Gray
};

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  // Fetch chat history for stats
  const chatHistory = trpc.chat.history.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#031525] to-[#001b1b]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  // Calculate statistics from chat logs
  const messagesList = chatHistory.data || [];
  const totalUserMsgs = messagesList.filter((m) => m.role === "user").length;
  const totalAssistantMsgs = messagesList.filter((m) => m.role === "assistant").length;
  
  // Mood chart calculation
  const moodCounts: Record<string, number> = {};
  messagesList.forEach((m) => {
    if (m.role === "user" && m.emotion) {
      const emo = m.emotion.toUpperCase();
      moodCounts[emo] = (moodCounts[emo] || 0) + 1;
    }
  });

  const chartData = Object.entries(moodCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Has active crisis alerts in history
  const hasCrisisAlerts = messagesList.some((m) => m.isCrisisDetected);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#020617] via-[#041d1d] to-[#001212] text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute w-[600px] h-[600px] bg-emerald-500/5 blur-3xl rounded-full -top-[250px] -left-[250px] pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 blur-3xl rounded-full -bottom-[200px] -right-[200px] pointer-events-none" />

      {/* Header */}
      <nav className="bg-slate-900/40 border-b border-white/10 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-emerald-400 fill-emerald-400 animate-pulse" />
            <span className="text-xl font-bold tracking-tight text-white">
              My Hridyam
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user.role === "admin" && (
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-500/10 text-xs font-semibold rounded-xl"
                >
                  <Settings className="w-3.5 h-3.5 mr-1.5" />
                  Admin Panel
                </Button>
              </Link>
            )}

            <Button
              onClick={() => logout()}
              variant="outline"
              className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Dashboard Body */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 relative z-1 space-y-6 overflow-y-auto">
        {/* Welcome Section */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              Welcome back, <span className="text-emerald-400">{user.name || "Friend"}</span>!
            </h1>
            <p className="text-sm text-emerald-100/60 mt-1">
              Here is your personal emotional wellness overview.
            </p>
          </div>

          <Link href="/chat">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-5.5 rounded-2xl border-0 shadow-lg shadow-emerald-500/10 text-sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Open Chatroom
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Chat Activity */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div>
              <MessageSquare className="w-7 h-7 text-emerald-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Conversations</h3>
              <p className="text-xs text-emerald-100/50 mt-1">Total messages exchanged with My Hridyam</p>
            </div>
            <div className="text-3xl font-black text-white mt-2">
              {totalUserMsgs + totalAssistantMsgs}
            </div>
          </div>

          {/* Card 2: Guardian status */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div>
              {hasCrisisAlerts ? (
                <ShieldAlert className="w-7 h-7 text-amber-400 mb-2" />
              ) : (
                <ShieldCheck className="w-7 h-7 text-emerald-400 mb-2" />
              )}
              <h3 className="text-sm font-bold text-white">Guardian Status</h3>
              <p className="text-xs text-emerald-100/50 mt-1">Active crisis detection status</p>
            </div>
            <div className={`text-xl font-bold mt-2 flex items-center gap-1.5 ${hasCrisisAlerts ? "text-amber-400" : "text-emerald-400"}`}>
              {hasCrisisAlerts ? "Attention Advised" : "Secure & Protected"}
            </div>
          </div>

          {/* Card 3: Account info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div>
              <Calendar className="w-7 h-7 text-cyan-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Account Type</h3>
              <p className="text-xs text-emerald-100/50 mt-1">
                Joined via {user.loginMethod || "guest"} login
              </p>
            </div>
            <div className="text-xs text-emerald-300 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-md w-fit mt-2 capitalize">
              {user.role} Account
            </div>
          </div>
        </div>

        {/* Dynamic Context & Mood Chart row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left panel: Emotional trends context summary */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col justify-between h-[360px]">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Persistent Insights Context
              </h3>
              
              <div className="bg-slate-950/40 border border-white/5 p-4.5 rounded-2xl text-sm leading-relaxed text-emerald-100/80">
                {user.userContext ? (
                  <p>{user.userContext}</p>
                ) : (
                  <p className="text-gray-500 italic text-xs text-center py-4">
                    My Hridyam will summarize your emotional goals here after you have a few conversation exchanges in the chatroom.
                  </p>
                )}
              </div>
            </div>

            <div className="text-xs text-emerald-100/40 border-t border-white/5 pt-4">
              My Hridyam dynamically evaluates recent emotion counts to customize responses and help you build positive reflection habits.
            </div>
          </div>

          {/* Right panel: Recharts Mood Chart visualization */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col h-[360px] overflow-hidden">
            <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Emotion Breakdown Chart
            </h3>

            {chartData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 text-xs">
                <MessageSquare className="w-10 h-10 text-gray-600 mb-2" />
                <span>No conversation logs analyzed yet.</span>
                <span className="mt-1">Open the chatroom to start chatting!</span>
              </div>
            ) : (
              <div className="flex-1 w-full h-full relative" style={{ minHeight: "220px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={EMOTION_COLORS[entry.name] || "#6b7280"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span className="text-[11px] text-gray-400 font-semibold uppercase ml-1">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
