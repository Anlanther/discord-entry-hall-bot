import { Client } from "discord.js";
import fs from "fs";
import path from "path";
import { logger } from "../utils";

export function eventHandler(client: Client): void {
  const eventsPath = path.join(__dirname, "../events");
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file: string) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const { event } = require(filePath);

    if (event && "name" in event && "execute" in event) {
      if (event.once) {
        client.once(event.name, (...args: any[]) =>
          event.execute(...args, client),
        );
      } else {
        client.on(event.name, (...args: any[]) =>
          event.execute(...args, client),
        );
      }
      logger.info(`Loaded event: ${event.name}`);
    } else {
      logger.warning(`Invalid event file: ${file}`);
    }
  }
}
