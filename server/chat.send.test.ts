import { describe, expect, it, vi } from "vitest";

// Mock the database queries to run tests without requiring a live database connection
vi.mock("./db/queries", () => {
  return {
    createMessage: vi.fn().mockImplementation((userId, role, content, isCrisisDetected) => {
      return Promise.resolve({
        id: Math.floor(Math.random() * 1000),
        userId,
        role,
        content,
        isCrisisDetected: !!isCrisisDetected,
        createdAt: new Date(),
      });
    }),
    getUserMessages: vi.fn().mockResolvedValue([]),
    upsertUser: vi.fn().mockResolvedValue({}),
    getUserByOpenId: vi.fn().mockResolvedValue({}),
  };
});

// Mock LLM invocations to avoid API network calls in unit testing
vi.mock("./ai/llm", () => {
  return {
    invokeLLM: vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            role: "assistant",
            content: "Mocked LLM reply for wellness chat.",
          },
        },
      ],
    }),
  };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./config/trpc";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    passwordHash: null,
    loginMethod: "email",
    role: "user",
    userContext: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return ctx;
}

describe("chat.send - Crisis Detection", () => {
  it("detects suicide keyword and returns crisis response", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      message: "I want to kill myself",
    });

    expect(result.isCrisis).toBe(true);
    expect(result.reply).toContain("helpline");
  });

  it("detects self harm keyword and returns crisis response", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      message: "I'm thinking about self harm",
    });

    expect(result.isCrisis).toBe(true);
    expect(result.reply).toContain("support you");
  });

  it("detects want to die keyword and returns crisis response", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      message: "I just want to die",
    });

    expect(result.isCrisis).toBe(true);
    expect(result.reply).toContain("safe");
  });

  it("handles normal message without crisis detection", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      message: "I'm feeling a bit sad today",
    });

    expect(result.isCrisis).toBe(false);
    expect(result.reply).toBeTruthy();
    expect(typeof result.reply).toBe("string");
  });

  it("case-insensitive crisis detection", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      message: "SUICIDE is something I think about",
    });

    expect(result.isCrisis).toBe(true);
  });

  it("detects crisis keyword in longer text", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      message: "I've been struggling for weeks and I don't want to die, but I want to hurt myself",
    });

    expect(result.isCrisis).toBe(true);
  });
});

describe("chat.history", () => {
  it("returns conversation history for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.chat.history();

    expect(Array.isArray(history)).toBe(true);
  });
});
