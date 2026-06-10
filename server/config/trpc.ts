import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG, COOKIE_NAME } from "../../shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import { parse as parseCookie } from "cookie";
import type * as express from "express";
import superjson from "superjson";
import { verifySession } from "../auth/authService";
import { getUserByOpenId } from "../db/queries";

/**
 * Creates the tRPC context from request cookie headers.
 * Performs database user lookup for authenticated sessions.
 */
export async function createContext(opts: { req: express.Request; res: express.Response }) {
  const cookieHeader = opts.req.headers.cookie;
  let user = null;

  if (cookieHeader) {
    try {
      const cookies = parseCookie(cookieHeader);
      const sessionToken = cookies[COOKIE_NAME];
      if (sessionToken) {
        const payload = await verifySession(sessionToken);
        if (payload) {
          const dbUser = await getUserByOpenId(payload.openId);
          if (dbUser) {
            user = dbUser;
          }
        }
      }
    } catch (err) {
      console.error("[TRPC Context] Failed to parse session cookies:", err);
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

export type TrpcContext = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to enforce user authentication
const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// Middleware to enforce admin role
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);
