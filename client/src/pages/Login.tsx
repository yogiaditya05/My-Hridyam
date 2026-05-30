import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Heart, Mail, Lock, User, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    login,
    signup,
    guestLogin,
    isLoggingIn,
    isSigningUp,
    loginError,
    signupError,
    guestError,
  } = useAuth();

  const activeError = formError || loginError || signupError || guestError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password.trim()) {
      setFormError("Please fill in all credentials.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setFormError("Please enter your name.");
          return;
        }
        await signup(name, email, password);
      }
    } catch (err) {
      // Errors are caught and exposed via the hook
      console.error("[Login Form] Authentication error:", err);
    }
  };

  const handleGuestEntry = async () => {
    setFormError(null);
    try {
      await guestLogin();
    } catch (err) {
      console.error("[Login Form] Guest login error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#031525] to-[#001b1b] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 blur-3xl rounded-full -top-[100px] -left-[100px] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-cyan-500/5 blur-3xl rounded-full -bottom-[100px] -right-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Hridyam Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 relative">
          
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-emerald-500/20 p-4 rounded-full mb-4 relative group">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md group-hover:scale-110 transition-transform duration-500" />
              <Heart className="text-emerald-400 w-10 h-10 fill-emerald-400 animate-pulse relative z-10" />
            </div>

            <h1 className="text-4xl font-bold text-white tracking-tight">
              Hridyam
            </h1>

            <p className="text-emerald-300 mt-2 text-sm font-medium tracking-wide">
              always here • always listening
            </p>
          </div>

          {/* Form Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setFormError(null);
              }}
              className={`w-1/2 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                isLogin
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setFormError(null);
              }}
              className={`w-1/2 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                !isLogin
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Errors */}
          {activeError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2.5 text-red-300 text-sm mb-6 animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{activeError}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name field (Sign Up only) */}
            {!isLogin && (
              <div>
                <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
                  Name
                </label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-emerald-500/50 transition-all">
                  <User className="text-emerald-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent outline-none px-3 py-3.5 text-sm text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
                Email
              </label>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-emerald-500/50 transition-all">
                <Mail className="text-emerald-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none px-3 py-3.5 text-sm text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
                Password
              </label>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-emerald-500/50 transition-all">
                <Lock className="text-emerald-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none px-3 py-3.5 text-sm text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoggingIn || isSigningUp}
              className="w-full bg-emerald-600 hover:bg-emerald-500 transition-all text-white py-6 rounded-xl font-semibold shadow-lg shadow-emerald-500/10 text-sm mt-6 flex items-center justify-center gap-2 border-0"
            >
              {(isLoggingIn || isSigningUp) ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                "Login to Hridyam"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-gray-500 text-xs font-semibold tracking-wider">OR</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {/* Quick Guest / Google Entry */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGuestEntry}
              disabled={isLoggingIn}
              className="w-full bg-white/5 hover:bg-white/10 transition-all text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2.5 border border-white/10 text-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              Enter as Guest (Quick Chat)
            </button>

            <button
              type="button"
              onClick={handleGuestEntry}
              disabled={isLoggingIn}
              className="w-full bg-white/5 hover:bg-white/10 transition-all text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2.5 border border-white/10 text-sm opacity-80 hover:opacity-100"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continue with Google (Demo)
            </button>
          </div>

          {/* Footer branding */}
          <p className="text-center text-gray-500 text-xs mt-6 font-medium">
            Your safe emotional wellness companion 💚
          </p>
        </div>
      </div>
    </div>
  );
}