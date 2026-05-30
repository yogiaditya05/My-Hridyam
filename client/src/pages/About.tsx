import { Link } from "wouter";
import { MessageSquare, Mic, Shield, Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#041a1a] to-[#001212] text-white overflow-y-auto">
      
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-emerald-400 fill-emerald-400 animate-pulse" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              About My Hridyam
            </h1>
          </div>

          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2 px-4 py-2 border-white/10 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
              Back Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Intro */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
          What is <span className="text-emerald-400">My Hridyam</span>?
        </h2>

        <p className="text-base md:text-lg text-emerald-100/70 leading-relaxed max-w-2xl mx-auto">
          My Hridyam, meaning **"from the heart"** in Sanskrit, is a premium, emotionally intelligent AI Health and Wellness Companion. It is built to create a safe, warm, and validation-first space for users to voice their thoughts, process feelings, and check in on their emotional wellness.
        </p>
      </section>

      {/* Capabilities */}
      <section className="max-w-5xl mx-auto px-6 py-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:translate-y-[-4px] hover:border-emerald-500/20 backdrop-blur-sm">
          <MessageSquare className="w-9 h-9 text-emerald-400 mb-4" />
          <h3 className="text-lg font-bold mb-2">Empathetic Mirroring</h3>
          <p className="text-xs text-emerald-100/60 leading-relaxed">
            My Hridyam uses validation-first communication, acknowledging your emotions first before replying.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:translate-y-[-4px] hover:border-emerald-500/20 backdrop-blur-sm">
          <Mic className="w-9 h-9 text-cyan-400 mb-4" />
          <h3 className="text-lg font-bold mb-2">Voice Companion</h3>
          <p className="text-xs text-emerald-100/60 leading-relaxed">
            Speak directly via browser microphone recording, which uploads and transcribes your audio seamlessly.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:translate-y-[-4px] hover:border-emerald-500/20 backdrop-blur-sm">
          <Heart className="w-9 h-9 text-emerald-400 mb-4" />
          <h3 className="text-lg font-bold mb-2">Emotional Memory</h3>
          <p className="text-xs text-emerald-100/60 leading-relaxed">
            Detects mood patterns over time and saves contextual snapshots to customize future chats.
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:translate-y-[-4px] hover:border-emerald-500/20 backdrop-blur-sm">
          <Shield className="w-9 h-9 text-cyan-400 mb-4" />
          <h3 className="text-lg font-bold mb-2">Crisis Guardian</h3>
          <p className="text-xs text-emerald-100/60 leading-relaxed">
            Includes direct keyword matching to intercept distress calls and immediately direct users to lifelines.
          </p>
        </div>
      </section>

      {/* Explanatory details */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm space-y-6">
          <h3 className="text-2xl font-bold text-emerald-300">
            Why We Built My Hridyam
          </h3>
          
          <p className="text-sm text-emerald-100/70 leading-relaxed">
            Wellness begins when we are heard. In a fast-paced digital world, finding a non-judgmental space to share emotional weight can be incredibly difficult. My Hridyam was created to serve as an instant, warm, and highly private wellness companion.
          </p>

          <p className="text-sm text-emerald-100/70 leading-relaxed">
            Rather than jumping straight to solutions or listing structured tips, My Hridyam acts as an active listener. It reflect feelings, remains concise, and lets you drive the conversation, creating a more grounding and self-reflective experience.
          </p>

          <p className="text-sm text-emerald-100/70 leading-relaxed">
            The platform is designed with a premium, nature-infused dark glassmorphic look to soothe visual fatigue and convey a calming sense of calm and clarity.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-emerald-100/30">
        My Hridyam AI Companion • Made from the heart 💚
      </footer>
    </div>
  );
}