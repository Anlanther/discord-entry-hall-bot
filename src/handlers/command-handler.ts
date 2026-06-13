import fs from "fs";
import path from "path";
import { BotCommand, ExtendedClient } from "../types";
import { logger } from "../utils";

export function commandHandler(client: ExtendedClient): void {
  client.commands = new Map<string, BotCommand>();
  const commandsPath = path.join(__dirname, "../commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file: string) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const { command } = require(filePath);

    if (command && "name" in command && "execute" in command) {
      client.commands.set(command.name, command);
      logger.info(`Loaded command: ${command.name}`);
    } else {
      logger.warning(`Invalid command file: ${file}`);
    }
  }
}
