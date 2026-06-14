import { CHANNELS } from "../config/constants";
import { FailedUser, ProcessedUser } from "../types";

export const messages = {
  // For real-time BOT channel logging
  getRealtimePassMessage: (processedUser: ProcessedUser): string =>
    `✅ **Passed:** ${processedUser.username}\n  ${transformMessage(processedUser.originalMessage)}`,

  getRealtimeFailMessage: (failedUser: FailedUser): string =>
    `❌ **Failed:** ${failedUser.username} (${failedUser.reason})\n  ${transformMessage(failedUser.originalMessage)}`,

  // For celebration channel (public welcome)
  getSuccessMessage: (userId: string): string =>
    `Hi <@${userId}>! Feel free to tell us more about yourself in <#${CHANNELS.INTRODUCTIONS}> 👋 or if you just want to chat head on to <#${CHANNELS.CHAT}>`,

  // For batch command reply
  getBatchSuccessMessage: (userMentions: string[]): string =>
    userMentions.length === 1
      ? `Hi ${userMentions[0]}! Feel free to tell us more about yourself in <#${CHANNELS.INTRODUCTIONS}> 👋 or if you just want to chat head on to <#${CHANNELS.CHAT}>`
      : `Hi ${userMentions.join(", ")}! Feel free to tell us more about yourselves in <#${CHANNELS.INTRODUCTIONS}> ☺️ or if you just want to chat head on to <#${CHANNELS.CHAT}>`,

  // For command reply summaries
  getPassSummary: (processedUsers: ProcessedUser[]): string =>
    `✅ **Passed (${processedUsers.length}):**\n${processedUsers
      .map(
        (u) => `- **${u.username}**\n  ${transformMessage(u.originalMessage)}`,
      )
      .join("\n")}`,

  getFailSummary: (failedUsers: FailedUser[]): string =>
    `❌ **Failed (${failedUsers.length}):**\n${failedUsers
      .map(
        (u) =>
          `- **${u.username}** (${u.reason})\n  ${transformMessage(u.originalMessage)}`,
      )
      .join("\n")}`,

  pruneNoMembers: (roleName: string) =>
    `No members found with "${roleName}" who joined over 48 hours ago.`,

  pruneSuccess: (kicked: number, total: number, roleName: string) =>
    `✅ Pruned ${kicked}/${total} members with role ${roleName}`,

  pruneError: (error: string) => `❌ Prune failed: ${error}`,
};

function transformMessage(message: string): string {
  return message
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => line.trim())
    .join(", ");
}
