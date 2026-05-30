import { router } from "./config/trpc";
import { authRouter } from "./routes/authRouter";
import { chatRouter } from "./routes/chatRouter";
import { systemRouter } from "./routes/systemRouter";
import { adminRouter } from "./routes/adminRouter";

/**
 * Root tRPC application router compiling all domain procedures.
 */
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  chat: chatRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
