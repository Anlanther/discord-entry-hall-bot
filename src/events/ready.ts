import { Client, REST, Routes } from "discord.js";
import { BotEvent } from "../types";
import { logger } from "../utils";

export const event: BotEvent = {
  name: "clientReady",
  once: true,

  async execute(client: Client): Promise<void> {
    logger.success(`Bot logged in as ${client.user?.tag}`);

    // Register slash command
    try {
      const token = process.env.DISCORD_TOKEN;
      if (!token) {
        throw new Error("DISCORD_TOKEN not found in environment");
      }

      const rest = new REST({ version: "10" }).setToken(token);
      await rest.put(Routes.applicationCommands(client.user!.id), {
        body: [
          {
            name: "scan",
            description:
              "Scan recent messages in this channel and update roles",
          },
        ],
      });
      logger.success("Slash command registered!");
    } catch (error) {
      logger.error("Failed to register slash command:", error);
    }
  },
};
