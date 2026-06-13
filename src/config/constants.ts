import dotenv from "dotenv";

dotenv.config();

function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Invalid number for environment variable: ${key}`);
  }
  return num;
}

function getEnvArray(key: string): string[] {
  const value = process.env[key];
  if (!value) {
    return [];
  }
  return value.split(",").filter((item) => item.trim().length > 0);
}

// Role IDs
export const ROLES = {
  VERIFIED: getEnvVariable("VERIFIED_ROLE_ID"),
  UNVERIFIED: getEnvVariable("UNVERIFIED_ROLE_ID"),
} as const;

// Channel IDs
export const CHANNELS = {
  MONITOR: getEnvVariable("MONITOR_CHANNEL_ID"),
  CELEBRATION: getEnvVariable("CELEBRATION_CHANNEL_ID"),
  BOT: getEnvVariable("BOT_CHANNEL_ID"),
  INTRODUCTIONS: getEnvVariable("INTRODUCTIONS_CHANNEL_ID"),
} as const;

// Excluded users list
export const EXCLUDED_USERS: string[] = getEnvArray("EXCLUDED_USERS");

// Account age requirement in milliseconds
const ACCOUNT_AGE_REQUIREMENT_DAYS = getEnvNumber(
  "ACCOUNT_AGE_REQUIREMENT_DAYS",
  30,
);
export const ACCOUNT_AGE_REQUIREMENT_MS: number =
  ACCOUNT_AGE_REQUIREMENT_DAYS * 24 * 60 * 60 * 1000;

// Export types
export type RoleId = (typeof ROLES)[keyof typeof ROLES];
export type ChannelId = (typeof CHANNELS)[keyof typeof CHANNELS];

// Optional: Export validation function to check all required env vars are present
export function validateConfig(): void {
  const requiredVars = [
    "DISCORD_TOKEN",
    "VERIFIED_ROLE_ID",
    "UNVERIFIED_ROLE_ID",
    "MONITOR_CHANNEL_ID",
    "CELEBRATION_CHANNEL_ID",
    "BOT_CHANNEL_ID",
  ];

  const missingVars = requiredVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }

  console.log("✅ Configuration validated successfully");
}
