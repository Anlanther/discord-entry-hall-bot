import { Client, Interaction } from "discord.js";
import { BotEvent, ExtendedClient } from "../types";
import { logger } from "../utils";

export const event: BotEvent = {
  name: "interactionCreate",
  once: false,

  async execute(interaction: Interaction, client: Client): Promise<void> {
    if (!interaction.isCommand()) return;

    const extendedClient = client as ExtendedClient;
    const command = extendedClient.commands?.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      logger.error(`Error executing ${interaction.commandName}:`, error);
      await interaction
        .reply({
          content: "There was an error executing this command!",
          ephemeral: true,
        })
        .catch(() => {});
    }
  },
};
