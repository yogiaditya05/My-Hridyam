import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, Send, AlertCircle, LogOut, ArrowLeft, Heart } from "lucide-react";
import { storagePut } from "@/lib/storage";
import { useAuth } from "../hooks/useAuth";
import { useLocation, Link } from "wouter";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [displayedContent, setDisplayedContent] = useState("");
  const [streamingMessageIdx, setStreamingMessageIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const chatSend = trpc.chat.send.useMutation();
  const chatHistory = trpc.chat.history.useQuery(undefined, {
    enabled: !!user,
  });
  const chatTranscribe = trpc.chat.transcribe.useMutation();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  // Load chat history on mount
  useEffect(() => {
    if (chatHistory.data) {
      setMessages(
        chatHistory.data.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))
      );
    }
  }, [chatHistory.data]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedContent, isLoading]);

  // Typewriter effect for Hridyam's response
  useEffect(() => {
    if (streamingMessageIdx !== null && streamingMessageIdx < messages.length) {
      const message = messages[streamingMessageIdx];
      if (message.role === "assistant") {
        let index = 0;
        const interval = setInterval(() => {
          if (index < message.content.length) {
            setDisplayedContent(message.content.slice(0, index + 1));
            index++;
          } else {
            clearInterval(interval);
            setStreamingMessageIdx(null);
          }
        }, 20);

        return () => clearInterval(interval);
      }
    }
  }, [streamingMessageIdx, messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setError(null);
    const userMessage: DisplayMessage = { role: "user", content: text };
    
    // Optimistically update list
    const currentMessagesCount = messages.length;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setDisplayedContent("");
    setIsLoading(true);

    try {
      const response = await chatSend.mutateAsync({ message: text });
      const assistantMessage: DisplayMessage = {
        role: "assistant",
        content: response.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingMessageIdx(currentMessagesCount + 1);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please check connection and try again.");
      const errorMessage: DisplayMessage = {
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Unable to access microphone. Please check permissions in your browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Upload audio to S3 / local static server
      const { url } = await storagePut(
        `audio/${Date.now()}.webm`,
        audioBlob,
        "audio/webm"
      );

      // 2. Transcribe audio to text
      const transcriptionResult = await chatTranscribe.mutateAsync({
        audioUrl: url,
      });

      // 3. Send text message to Hridyam
      if (transcriptionResult.text.trim()) {
        await handleSendMessage(transcriptionResult.text);
      } else {
        setError("Could not capture any speech. Try speaking closer to the microphone.");
      }
    } catch (err) {
      console.error("Failed to process audio:", err);
      setError("Failed to transcribe audio clip. Please try typing instead.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#020617] via-[#031525] to-[#001b1b]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#020617] via-[#091b1b] to-[#001212] text-white">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-white border-0 bg-transparent">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-emerald-400 flex items-center gap-1.5 leading-none">
                Hridyam 💚
              </h1>
              <p className="text-xs text-emerald-200/50 mt-1">
                always here • always listening
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-full font-medium">
              {user?.name || "Guest"}
            </span>
            <Button
              onClick={() => logout()}
              variant="outline"
              className="border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 p-0 rounded-lg flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
              <div className="bg-emerald-500/10 p-5 rounded-full mb-6">
                <Heart className="w-12 h-12 text-emerald-400 fill-emerald-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-300 mb-2">
                Welcome to Hridyam 💚
              </h2>
              <p className="text-emerald-100/60 max-w-md text-sm leading-relaxed mb-6">
                I am your emotional health companion. Tell me what's on your mind — your struggles, your victories, or just how your day went.
              </p>
              
              {/* Sample Prompts */}
              <div className="grid sm:grid-cols-2 gap-3 max-w-lg w-full">
                {[
                  "I've been feeling really overwhelmed today.",
                  "How do I deal with constant stress?",
                  "Can we do a short mindfulness reflection?",
                  "I had a really good day and wanted to share!"
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-left p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 text-xs text-emerald-100/80 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  } animate-fade-in`}
                >
                  <div
                    className={`max-w-lg px-4.5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-lg ${
                      msg.role === "user"
                        ? "bg-slate-800/80 border border-white/10 text-emerald-100 rounded-tr-sm"
                        : "bg-emerald-950/30 border border-emerald-500/10 text-emerald-50 rounded-tl-sm"
                    }`}
                  >
                    {streamingMessageIdx === idx && msg.role === "assistant" ? (
                      <p className="whitespace-pre-wrap">
                        {displayedContent}
                        <span className="inline-block w-1.5 h-4 bg-emerald-400 ml-1 animate-pulse" />
                      </p>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Waiting Reply Indicator */}
              {isLoading && streamingMessageIdx === null && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-emerald-950/20 border border-emerald-500/5 px-5 py-4 rounded-3xl rounded-tl-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400/60 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 bg-emerald-400/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-emerald-400/60 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Panel */}
      {error && (
        <div className="bg-red-950/30 border-t border-red-500/20 backdrop-blur-md">
          <div className="max-w-3xl mx-auto w-full px-4 py-3 flex items-center gap-2.5 text-red-300 text-xs">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white/5 border-t border-white/10 backdrop-blur-md sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto w-full px-4 py-4">
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(input);
                }
              }}
              placeholder="Share what is in your heart..."
              disabled={isLoading}
              className="resize-none bg-slate-900/60 border border-white/10 text-emerald-50 placeholder-emerald-300/20 focus:border-emerald-500/50 rounded-2xl px-4 py-3.5 flex-1 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 text-sm transition-all"
              rows={2}
            />

            <div className="flex gap-2">
              <Button
                onClick={() => handleSendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 transition-all text-white h-11 w-11 p-0 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10 border-0"
              >
                <Send className="w-4 h-4" />
              </Button>

              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`h-11 w-11 p-0 rounded-2xl flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/10 animate-pulse border-0"
                    : "bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10"
                }`}
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Voice Waveform Animation when Recording */}
          {isRecording && (
            <div className="flex items-center gap-2 mt-3 px-1 animate-fade-in">
              <div className="flex items-end gap-1 h-5 select-none">
                <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:0.1s] h-2.5" />
                <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:0.3s] h-4.5" />
                <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:0.5s] h-3.5" />
                <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s] h-5" />
                <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:0.4s] h-2" />
              </div>
              <p className="text-xs text-red-400 font-semibold tracking-wide">
                Listening... Click microphone again to send.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
