import { Client, CommandInteraction } from "discord.js";
import { ROLES, UNVERIFIED_PRUNE_PERIOD_MS } from "../config/constants";
import { BotCommand } from "../types";
import { canKickMembers, logger, messages } from "../utils";

export const command: BotCommand = {
  name: "prune",
  description: "Kick unverified members who joined over 48 hours ago",

  async execute(
    interaction: CommandInteraction,
    client: Client,
  ): Promise<void> {
    logger.info("Prune command received!");

    try {
      await interaction.deferReply();

      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply(
          messages.pruneError("This command can only be used in a server."),
        );
        return;
      }

      const botMember = guild.members.me;
      if (!botMember || !canKickMembers(botMember)) {
        await interaction.editReply(
          messages.pruneError("I need Kick Members permission."),
        );
        return;
      }

      await guild.members.fetch();

      const targetRole = guild.roles.cache.get(ROLES.UNVERIFIED);
      if (!targetRole) {
        await interaction.editReply(
          messages.pruneError("Target role not found."),
        );
        return;
      }

      const cutoffTime = Date.now() - UNVERIFIED_PRUNE_PERIOD_MS;

      const membersToKick = [...guild.members.cache.values()].filter(
        (member) =>
          member.roles.cache.has(targetRole.id) &&
          member.joinedTimestamp &&
          member.joinedTimestamp <= cutoffTime,
      );

      logger.info(`Found ${membersToKick.length} members to kick`);

      if (membersToKick.length === 0) {
        await interaction.editReply(messages.pruneNoMembers(targetRole.name));
        return;
      }

      let kickedCount = 0;
      for (const member of membersToKick) {
        try {
          await member.kick(
            `Pruned by ${interaction.user.tag} - Unverified >48 hours`,
          );
          kickedCount++;
          logger.info(`Kicked ${member.user.tag}`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error(`Failed to kick ${member.user.tag}:`, error);
        }
      }

      await interaction.editReply(
        messages.pruneSuccess(
          kickedCount,
          membersToKick.length,
          targetRole.name,
        ),
      );
      logger.success(
        `Pruned ${kickedCount}/${membersToKick.length} unverified members`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await interaction
        .editReply(messages.pruneError(errorMessage))
        .catch(() => {});
      logger.error("Prune error:", error);
    }
  },
};
