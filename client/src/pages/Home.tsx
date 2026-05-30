import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Shield, Sparkles, MessageCircle } from "lucide-react";
import { Link } from "wouter";

/**
 * Landing homepage for Hridyam companion
 */
export default function Home() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#031525] to-[#001b1b]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#020617] via-[#041d1d] to-[#001212] text-white overflow-hidden relative">
      {/* Background radial glows */}
      <div className="absolute w-[600px] h-[600px] bg-emerald-500/10 blur-3xl rounded-full -top-[200px] -left-[200px] pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/5 blur-3xl rounded-full -bottom-[200px] -right-[200px] pointer-events-none" />

      {/* Navigation */}
      <nav className="bg-white/5 border-b border-white/10 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-emerald-400 fill-emerald-400 animate-pulse" />
            <span className="text-xl font-bold tracking-tight text-white">
              Hridyam
            </span>
          </div>

          <div className="flex gap-4">
            <Link href="/about">
              <Button
                variant="outline"
                className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-sm"
              >
                About
              </Button>
            </Link>

            {isAuthenticated ? (
              <Link href="/chat">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm border-0">
                  Open Chat
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm border-0">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-1">
        <div className="max-w-3xl text-center space-y-8">
          
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide text-emerald-300 uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Empathetic Health Companion
            </div>
            
            <h1 className="text-5xl md:text-6.5 font-bold tracking-tight text-white leading-tight">
              A Safe Space for Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Emotional Wellness
              </span>
            </h1>

            <p className="text-lg md:text-xl text-emerald-100/70 max-w-xl mx-auto font-medium">
              Listen deeply. Speak warmly. Feel heard.
            </p>
          </div>

          <p className="text-base md:text-lg text-emerald-100/60 leading-relaxed max-w-2xl mx-auto">
            Hridyam is an emotionally intelligent companion designed to support your mental and emotional well-being. Share your thoughts, track your moods, and connect through warm, human-like voice and text conversations.
          </p>

          {/* Quick Info Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left backdrop-blur-sm">
              <MessageCircle className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="font-bold text-white text-sm mb-1.5">Empathetic Chat</h3>
              <p className="text-xs text-emerald-100/60 leading-relaxed">
                Reflects your feelings first and stays present with you, avoiding quick advice.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="font-bold text-white text-sm mb-1.5">Mood Tracking</h3>
              <p className="text-xs text-emerald-100/60 leading-relaxed">
                Recognizes emotional trends dynamically over time to personalize your care.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left backdrop-blur-sm">
              <Shield className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="font-bold text-white text-sm mb-1.5">Private & Secure</h3>
              <p className="text-xs text-emerald-100/60 leading-relaxed">
                Your data is stored locally in safe databases, giving you a completely confidential environment.
              </p>
            </div>
          </div>

          <div className="pt-6">
            {isAuthenticated ? (
              <Link href="/chat">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-6 text-base font-semibold shadow-lg shadow-emerald-500/10 border-0 rounded-2xl">
                  Continue Chatting with Hridyam
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-6 text-base font-semibold shadow-lg shadow-emerald-500/10 border-0 rounded-2xl">
                  Start Chatting with Hridyam
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950/40 border-t border-white/5 py-6">
        <div className="max-w-5xl mx-auto px-6 text-center text-emerald-100/30 text-xs">
          <p>
            Hridyam is an AI Health Companion designed for emotional wellness conversations. It is not a replacement for professional clinical therapy or crisis intervention.
          </p>
        </div>
      </footer>
    </div>
  );
}