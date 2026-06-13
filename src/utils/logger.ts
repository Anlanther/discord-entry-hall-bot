type LogData = any;

const logWithEmoji = (emoji: string, message: string, data?: LogData): void => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} ${emoji} ${message}`;
  console.log(logMessage);
  if (data) console.log(data);
};

export const logger = {
  info: (message: string, data?: LogData): void =>
    logWithEmoji("ℹ️", message, data),
  success: (message: string, data?: LogData): void =>
    logWithEmoji("✅", message, data),
  warning: (message: string, data?: LogData): void =>
    logWithEmoji("⚠️", message, data),
  error: (message: string, data?: LogData): void =>
    logWithEmoji("❌", message, data),
  debug: (message: string, data?: LogData): void =>
    logWithEmoji("🐛", message, data),
};
