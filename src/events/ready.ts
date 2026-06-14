import { REST, Routes } from "discord.js";
import { BotEvent, ExtendedClient } from "../types";
import { logger } from "../utils";

export const event: BotEvent = {
  name: "clientReady",
  once: true,

  async execute(client: ExtendedClient): Promise<void> {
    logger.success(`Bot logged in as ${client.user?.tag}`);

    // Register slash command
    try {
      const token = process.env.DISCORD_TOKEN;
      if (!token) {
        throw new Error("DISCORD_TOKEN not found in environment");
      }
      const rest = new REST({ version: "10" }).setToken(token);

      const extendedClient = client.commands;
      if (!extendedClient) {
        throw new Error("Client commands not found");
      }

      const commands = Array.from(extendedClient.values()).map((cmd) => ({
        name: cmd.name,
        description: cmd.description,
      }));

      await rest.put(Routes.applicationCommands(client.user!.id), {
        body: commands,
      });
      logger.success("Slash command registered!");
    } catch (error) {
      logger.error("Failed to register slash command:", error);
    }
  },
};
