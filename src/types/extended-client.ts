import { Client } from "discord.js";
import { BotCommand } from "./bot-command";

export interface ExtendedClient extends Client {
  commands?: Map<string, BotCommand>;
}
