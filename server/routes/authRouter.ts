import { z } from "zod";
import { router, publicProcedure } from "../config/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../utils/cookies";
import { createSessionToken, hashPassword, verifyPassword } from "../auth/authService";
import { upsertUser, getUserByEmail } from "../db/queries";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

export const authRouter = router({
  // Returns the current logged-in user profile
  me: publicProcedure.query((opts) => opts.ctx.user),

  // Authenticates a user via email and password
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const isValid = verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Upsert to update sign-in timestamp
      await upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
        updatedAt: new Date(),
      });

      const token = await createSessionToken(user.openId, user.name || "User");
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return { success: true, user };
    }),

  // Registers a new user with email and password
  signup: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email format"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email is already registered",
        });
      }

      const openId = `email_user_${crypto.randomBytes(8).toString("hex")}`;
      const passwordHash = hashPassword(input.password);
      const isSystemAdmin = input.email.toLowerCase().trim() === "admin@hridyam.local";
      
      const user = await upsertUser({
        openId,
        name: input.name,
        email: input.email.toLowerCase().trim(),
        passwordHash,
        loginMethod: "email",
        role: isSystemAdmin ? "admin" : "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user account",
        });
      }

      const token = await createSessionToken(openId, input.name);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return { success: true, user };
    }),

  // Creates an anonymous guest profile immediately for testing
  guestLogin: publicProcedure.mutation(async ({ ctx }) => {
    const randomId = crypto.randomBytes(6).toString("hex");
    const openId = `guest_${randomId}`;
    const name = `Guest User ${randomId.slice(0, 4)}`;

    const user = await upsertUser({
      openId,
      name,
      email: `${openId}@hridyam.local`,
      loginMethod: "guest",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    if (!user) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to initialize guest session",
      });
    }

    const token = await createSessionToken(openId, name);
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    return { success: true, user };
  }),

  // Clears the session cookie
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),
});
