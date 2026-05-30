import { eq, desc } from "drizzle-orm";
import { db } from "./connection";
import { users, messages, InsertUser, InsertMessage, User, Message } from "./schema";

export async function upsertUser(user: InsertUser): Promise<User | null> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.openId, user.openId))
      .limit(1);

    if (existing.length > 0) {
      // Update last signed in and metadata
      await db
        .update(users)
        .set({
          name: user.name ?? existing[0].name,
          email: user.email ?? existing[0].email,
          lastSignedIn: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.openId, user.openId));
      
      const updated = await db
        .select()
        .from(users)
        .where(eq(users.openId, user.openId))
        .limit(1);
      return updated[0] || null;
    } else {
      // Create new
      const now = new Date();
      await db.insert(users).values({
        ...user,
        role: user.role || "user",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      });

      const created = await db
        .select()
        .from(users)
        .where(eq(users.openId, user.openId))
        .limit(1);
      return created[0] || null;
    }
  } catch (error) {
    console.error("[Queries] Failed to upsert user:", error);
    return null;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.openId, openId))
      .limit(1);

    return result[0];
  } catch (error) {
    console.error("[Queries] Failed to get user by openId:", error);
    return undefined;
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    return result[0];
  } catch (error) {
    console.error("[Queries] Failed to get user by email:", error);
    return undefined;
  }
}

export async function getUserById(id: number): Promise<User | undefined> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0];
  } catch (error) {
    console.error("[Queries] Failed to get user by id:", error);
    return undefined;
  }
}

export async function updateUserContext(id: number, context: string): Promise<void> {
  try {
    await db
      .update(users)
      .set({ userContext: context, updatedAt: new Date() })
      .where(eq(users.id, id));
  } catch (error) {
    console.error("[Queries] Failed to update user context:", error);
  }
}

export async function getUserMessages(userId: number, limit: number = 15): Promise<Message[]> {
  try {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    // Drizzle fetches in descending order, we reverse to return chronological order
    return result.reverse();
  } catch (error) {
    console.error("[Queries] Failed to get user messages:", error);
    return [];
  }
}

export async function createMessage(
  userId: number,
  role: "user" | "assistant",
  content: string,
  isCrisisDetected: boolean = false,
  emotion?: string
): Promise<Message | null> {
  try {
    const now = new Date();
    await db.insert(messages).values({
      userId,
      role,
      content,
      isCrisisDetected,
      emotion: emotion || null,
      createdAt: now,
    });

    const created = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    return created[0] || null;
  } catch (error) {
    console.error("[Queries] Failed to create message:", error);
    return null;
  }
}

/**
 * Retrieves all registered users ordered by registration date.
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error("[Queries] Failed to get all users:", error);
    return [];
  }
}

/**
 * Retrieves all messages for a specific user without limit.
 */
export async function getUserMessagesForAdmin(userId: number): Promise<Message[]> {
  try {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.createdAt));
  } catch (error) {
    console.error("[Queries] Failed to get user messages for admin:", error);
    return [];
  }
}
