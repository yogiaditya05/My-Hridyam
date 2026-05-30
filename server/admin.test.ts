import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./config/trpc";

// Mock the database queries
vi.mock("./db/queries", () => {
  return {
    getAllUsers: vi.fn().mockResolvedValue([
      {
        id: 1,
        openId: "test-user-1",
        name: "Normal User",
        email: "user@example.com",
        loginMethod: "email",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      {
        id: 2,
        openId: "test-admin",
        name: "Admin User",
        email: "admin@example.com",
        loginMethod: "email",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    ]),
    getUserMessagesForAdmin: vi.fn().mockResolvedValue([
      {
        id: 101,
        userId: 1,
        role: "user",
        content: "Hello",
        isCrisisDetected: false,
        emotion: "neutral",
        createdAt: new Date(),
      },
    ]),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(role: "user" | "admin" | null): TrpcContext {
  const user: AuthenticatedUser | null = role
    ? {
        id: role === "admin" ? 2 : 1,
        openId: role === "admin" ? "test-admin" : "test-user-1",
        email: `${role}@example.com`,
        name: `${role} User`,
        passwordHash: null,
        loginMethod: "email",
        role,
        userContext: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("Admin Router Authorization", () => {
  it("blocks unauthenticated users from listUsers", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.listUsers()).rejects.toThrow();
  });

  it("blocks normal users from listUsers", async () => {
    const ctx = createCtx("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.listUsers()).rejects.toThrow("You do not have the required permission (10002)");
  });

  it("allows admin users to call listUsers", async () => {
    const ctx = createCtx("admin");
    const caller = appRouter.createCaller(ctx);

    const users = await caller.admin.listUsers();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(2);
    // Password hash should be omitted
    expect(users[0]).not.toHaveProperty("passwordHash");
  });

  it("blocks normal users from getUserChats", async () => {
    const ctx = createCtx("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.getUserChats({ userId: 1 })).rejects.toThrow("You do not have the required permission (10002)");
  });

  it("allows admin users to call getUserChats", async () => {
    const ctx = createCtx("admin");
    const caller = appRouter.createCaller(ctx);

    const chats = await caller.admin.getUserChats({ userId: 1 });
    expect(Array.isArray(chats)).toBe(true);
    expect(chats.length).toBe(1);
    expect(chats[0].content).toBe("Hello");
  });
});
