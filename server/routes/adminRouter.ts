import { z } from "zod";
import { router, adminProcedure } from "../config/trpc";
import { getAllUsers, getUserMessagesForAdmin } from "../db/queries";

/**
 * tRPC router containing queries restricted to admin users.
 * Allows listing all registered users and checking their chat histories.
 */
export const adminRouter = router({
  // Lists all users (excluding password hashes)
  listUsers: adminProcedure.query(async () => {
    const dbUsers = await getAllUsers();
    return dbUsers.map(({ passwordHash, ...rest }) => rest);
  }),

  // Fetches full message log for any specific user in chronological order
  getUserChats: adminProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const dbMessages = await getUserMessagesForAdmin(input.userId);
      return dbMessages.reverse();
    }),
});
