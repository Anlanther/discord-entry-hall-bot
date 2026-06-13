import { Client, CommandInteraction, TextChannel } from "discord.js";
import { CHANNELS, EXCLUDED_USERS, ROLES } from "../config/constants";
import { BotCommand, FailedUser, ProcessedUser } from "../types";
import {
  canManageMessages,
  canManageRoles,
  checkMessageRequirements,
  getFailureReason,
  logger,
  messages,
} from "../utils";

export const command: BotCommand = {
  name: "scan",
  description: "Scan recent messages in this channel and update roles",

  async execute(
    interaction: CommandInteraction,
    client: Client,
  ): Promise<void> {
    logger.info("Scan command received!");

    try {
      await interaction.deferReply();

      const targetChannel = (await client.channels.fetch(
        CHANNELS.MONITOR,
      )) as TextChannel;
      if (!targetChannel) {
        await interaction.editReply("Could not find target channel.");
        return;
      }

      const messagesList = await targetChannel.messages.fetch({ limit: 100 });
      logger.info(`Found ${messagesList.size} messages`);

      let deletedCount = 0;
      const processedUsers: (ProcessedUser & { originalMessage: string })[] =
        [];
      const failedUsers: FailedUser[] = [];
      const botMember = interaction.guild?.members.me;
      const canDelete = botMember && canManageMessages(botMember);
      const canAssign = botMember && canManageRoles(botMember);

      for (const msg of messagesList.values()) {
        if (msg.author.bot || EXCLUDED_USERS.includes(msg.author.username))
          continue;

        const { meetsAllConditions } = checkMessageRequirements(
          msg.content,
          msg.author,
        );

        if (!meetsAllConditions) {
          failedUsers.push({
            username: msg.author.username,
            reason: getFailureReason(msg.content, msg.author),
            originalMessage: msg.content.substring(0, 100),
          });
          if (canDelete) {
            await msg
              .delete()
              .catch((e) => logger.error(`Failed to delete: ${e.message}`));
            deletedCount++;
          }
          continue;
        }

        const member = await interaction.guild?.members
          .fetch(msg.author.id)
          .catch(() => null);
        if (!member) {
          failedUsers.push({
            username: msg.author.username,
            reason: "could not fetch member",
            originalMessage: msg.content.substring(0, 100),
          });
          continue;
        }

        if (canAssign) {
          await member.roles.add(ROLES.VERIFIED);
          await member.roles.remove(ROLES.UNVERIFIED);
          processedUsers.push({
            id: msg.author.id,
            username: msg.author.username,
            originalMessage: msg.content.substring(0, 100),
          });
          if (canDelete) {
            await msg
              .delete()
              .catch((e) => logger.error(`Failed to delete: ${e.message}`));
            deletedCount++;
          }
        }
      }

      await interaction.editReply(
        `📊 **Summary:**\n• Processed: ${processedUsers.length}\n• Deleted: ${deletedCount}`,
      );

      if (processedUsers.length) {
        const passedList = messages.getPassSummary(processedUsers);
        await interaction.followUp(passedList.substring(0, 2000));

        const celebrationChannel = (await client.channels.fetch(
          CHANNELS.CELEBRATION,
        )) as TextChannel;
        const userMentions = processedUsers.map((u) => `<@${u.id}>`);
        await celebrationChannel.send(
          messages.getBatchSuccessMessage(userMentions),
        );
        logger.success(
          `Sent congratulations to ${processedUsers.length} user(s)`,
        );
      }

      if (failedUsers.length) {
        const failedList = messages.getFailSummary(failedUsers);
        await interaction.followUp(failedList.substring(0, 2000));
      }
    } catch (error) {
      logger.error("Scan error:", error);
      await interaction.editReply("Error scanning messages.").catch(() => {});
    }
  },
};
