import { Client, CommandInteraction } from "discord.js";

export interface BotCommand {
  name: string;
  description: string;
  execute: (interaction: CommandInteraction, client: Client) => Promise<void>;
}
