import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

/**
 * Authentication hook connecting frontend pages with tRPC auth procedures.
 */
export function useAuth() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Query to fetch the authenticated user profile
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Guest login mutation
  const guestLoginMutation = trpc.auth.guestLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/chat");
    },
  });

  // Regular email login mutation
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/chat");
    },
  });

  // Account registration mutation
  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/chat");
    },
  });

  // Logout mutation
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/");
    },
  });

  return {
    user: meQuery.data || null,
    loading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    
    // Mutation loaders and errors
    isLoggingIn: loginMutation.isPending || guestLoginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    loginError: loginMutation.error?.message || null,
    signupError: signupMutation.error?.message || null,
    guestError: guestLoginMutation.error?.message || null,

    // Operations
    guestLogin: async () => {
      await guestLoginMutation.mutateAsync();
    },
    login: async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    signup: async (name: string, email: string, password: string) => {
      await signupMutation.mutateAsync({ name, email, password });
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
  };
}
