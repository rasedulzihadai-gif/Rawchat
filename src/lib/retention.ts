import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { conversations } from "@/db/schema";

/** Conversations are kept for 7 days after the last message, then deleted. */
export const RETENTION_DAYS = 7;
export const RETENTION_MS = RETENTION_DAYS * 24 * 3600 * 1000;

export const retentionCutoff = () => new Date(Date.now() - RETENTION_MS);

/**
 * Delete conversations whose last activity is older than the retention window.
 * Messages are removed automatically via ON DELETE CASCADE.
 * Pass a userId to scope the cleanup to one user.
 */
export async function deleteExpiredConversations(userId?: string): Promise<number> {
  const condition = userId
    ? and(
        eq(conversations.userId, userId),
        lt(conversations.updatedAt, retentionCutoff()),
      )
    : lt(conversations.updatedAt, retentionCutoff());
  const deleted = await db
    .delete(conversations)
    .where(condition)
    .returning({ id: conversations.id });
  return deleted.length;
}
