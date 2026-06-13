import { Client, Message, TextChannel } from "discord.js";
import { CHANNELS, EXCLUDED_USERS, ROLES } from "../config/constants";
import { BotEvent, FailedUser, ProcessedUser } from "../types";
import {
  canManageMessages,
  canManageRoles,
  checkMessageRequirements,
  getFailureReason,
  logger,
  messages,
} from "../utils";

export const event: BotEvent = {
  name: "messageCreate",
  once: false,

  async execute(message: Message, client: Client): Promise<void> {
    try {
      if (message.author.bot) return;
      if (!message.guild) return;
      if (message.channelId !== CHANNELS.MONITOR) return;
      if (EXCLUDED_USERS.includes(message.author.username)) return;

      const me = message.guild.members.me;
      if (!me) return;

      const canDelete = canManageMessages(me);
      const canAssign = canManageRoles(me);

      const { meetsAllConditions } = checkMessageRequirements(
        message.content,
        message.author,
      );

      if (!meetsAllConditions) {
        const failedUser: FailedUser = {
          username: message.author.username,
          reason: getFailureReason(message.content, message.author),
          originalMessage: message.content,
        };

        if (canDelete) await message.delete();

        // Send to BOT channel
        const botChannel = (await client.channels.fetch(
          CHANNELS.BOT,
        )) as TextChannel;
        await botChannel.send(messages.getRealtimeFailMessage(failedUser));
        return;
      }

      const member = await message.guild.members.fetch(message.author.id);
      if (!member) return;

      if (canAssign) {
        await member.roles.add(ROLES.VERIFIED);
        await member.roles.remove(ROLES.UNVERIFIED);

        const processedUser: ProcessedUser = {
          id: message.author.id,
          username: message.author.username,
          originalMessage: message.content,
        };

        if (canDelete) await message.delete();

        // Send to CELEBRATION channel (public welcome)
        const celebrationChannel = (await client.channels.fetch(
          CHANNELS.CELEBRATION,
        )) as TextChannel;
        await celebrationChannel.send(
          messages.getSuccessMessage(processedUser.id),
        );

        // Send detailed log to BOT channel
        const botChannel = (await client.channels.fetch(
          CHANNELS.BOT,
        )) as TextChannel;
        await botChannel.send(messages.getRealtimePassMessage(processedUser));

        logger.success(`Verified ${message.author.username}`);
      }
    } catch (error) {
      logger.error("Message create error:", error);
    }
  },
};
