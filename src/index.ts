import { Client, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";
import { validateConfig } from "./config/constants";
import { commandHandler } from "./handlers/command-handler";
import { eventHandler } from "./handlers/event-handler";
import { ExtendedClient } from "./types";
import { logger } from "./utils";

dotenv.config();

// Validate configuration before starting
try {
  validateConfig();
} catch (error) {
  logger.error("Configuration error:", error);
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
}) as ExtendedClient;

// Load handlers
commandHandler(client);
eventHandler(client);

// Login
const token = process.env.DISCORD_TOKEN;
if (!token) {
  logger.error("DISCORD_TOKEN is not set in environment variables");
  process.exit(1);
}

client.login(token);

// Global error handlers
process.on("unhandledRejection", (error: Error) => {
  logger.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught exception:", error);
});
