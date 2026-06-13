// index.js
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  REST,
  Routes,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

const VERIFIED_ROLE_ID = "785020888298684477";
const UNVERIFIED_ROLE_ID = "1347577672674443355";
const MONITOR_CHANNEL_ID = "785481340316680202";
const EXCLUDED_USERS = ["anlanther"];

// Terms: woman, she, her, they, them
const TERMS_REGEX = /\b(woman|she|her|they|them)\b/i;

// Social media detection.
// Matches platform names/keywords and/or common social link/handle patterns.
const SOCIAL_REGEX =
  /(\b(?:twitter|x|insta|instagram|facebook|tiktok|youtube|reddit|snapchat|linkedin|pinterest|threads|discord)\b[\w-]*)(?::\/\/)?[\w.-]*|@[\w.-]{2,}/i;

function isVerifiedMessage(content) {
  const text = content || "";
  const lines = text.split("\n").length;
  return TERMS_REGEX.test(text) && SOCIAL_REGEX.test(text) && lines >= 4;
}

function isAccountOldEnough(user) {
  const accountAge = Date.now() - user.createdAt.getTime();
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
  return accountAge >= oneMonthMs;
}

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (message.channelId !== MONITOR_CHANNEL_ID) return;
    if (EXCLUDED_USERS.includes(message.author.username)) return;

    const me = message.guild.members.me;
    if (!me) return;

    // Only act when both conditions are met
    if (!isVerifiedMessage(message.content)) {
      // Delete message from unverified users
      if (me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        await message.delete().catch((error) => {
          console.error(
            `❌ Failed to delete message from ${message.author.username}:`,
            error.message,
          );
        });
      } else {
        console.warn(
          `⚠️ No ManageMessages permission for message from ${message.author.username}`,
        );
      }
      return;
    }

    // Check if account is old enough
    if (!isAccountOldEnough(message.author)) {
      // Delete message from accounts less than 1 month old
      if (me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        await message.delete().catch((error) => {
          console.error(
            `❌ Failed to delete message from ${message.author.username} (account too young):`,
            error.message,
          );
        });
      } else {
        console.warn(
          `⚠️ No ManageMessages permission for message from ${message.author.username} (account too young)`,
        );
      }
      return;
    }

    const member =
      message.guild.members.cache.get(message.author.id) ??
      (await message.guild.members.fetch(message.author.id).catch(() => null));
    if (!member) return;

    // Need ManageRoles to update roles
    if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) return;

    // Update roles
    try {
      await member.roles.add(VERIFIED_ROLE_ID);
      await member.roles.remove(UNVERIFIED_ROLE_ID);

      // Delete message only if roles were updated successfully
      if (me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        await message.delete().catch((error) => {
          console.error(
            `❌ Failed to delete verified message from ${message.author.username}:`,
            error.message,
          );
        });
      } else {
        console.warn(
          `⚠️ No ManageMessages permission for verified message from ${message.author.username}`,
        );
      }
    } catch (error) {
      // Role update failed, don't delete message
    }
  } catch {
    // Swallow errors to prevent the bot from crashing
  }
});

client.once("ready", async () => {
  console.log(`Bot logged in as ${client.user.tag}`);

  // Register slash command
  try {
    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN,
    );
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: [
        {
          name: "scan",
          description: "Scan recent messages in this channel and update roles",
        },
      ],
    });
    console.log("Slash command registered!");
  } catch (error) {
    console.error(error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName !== "scan") return;

  console.log("🔍 Scan command received!");

  try {
    await interaction.deferReply();
    console.log("📝 Fetching target channel...");

    const targetChannel = await client.channels.fetch(MONITOR_CHANNEL_ID);
    if (!targetChannel) {
      console.log("❌ Could not find target channel");
      return await interaction.editReply("Could not find target channel.");
    }

    console.log("📨 Fetching messages...");
    const messages = await targetChannel.messages.fetch({ limit: 100 });
    console.log(`📊 Found ${messages.size} messages`);

    let processed = 0;
    let deletedCount = 0;
    const processedUsers = [];
    const failedUsers = [];
    const CELEBRATION_CHANNEL_ID = "781081709029752873";

    for (const msg of messages.values()) {
      if (msg.author.bot) continue;
      if (EXCLUDED_USERS.includes(msg.author.username)) continue;

      console.log(
        `Checking message from ${msg.author.username}: "${msg.content.substring(0, 50)}..."`,
      );
      const termsMatch = TERMS_REGEX.test(msg.content);
      const socialMatch = SOCIAL_REGEX.test(msg.content);
      const matches = termsMatch && socialMatch;
      console.log(
        `  Terms match: ${termsMatch}, Social match: ${socialMatch}, Both: ${matches}`,
      );

      if (!matches) {
        let reason = [];
        if (!termsMatch) reason.push("missing terms (she/her, woman)");
        if (!socialMatch) reason.push("missing social media");
        failedUsers.push({
          username: msg.author.username,
          reason: reason.join(", "),
          originalMessage: msg.content.substring(0, 100),
        });

        // Delete message
        try {
          await msg.delete();
          deletedCount++;
        } catch (error) {
          console.error(
            `❌ Failed to delete message from ${msg.author.username}:`,
            error.message,
          );
        }
        continue;
      }

      // Check if account is old enough
      if (!isAccountOldEnough(msg.author)) {
        const accountAgeDays = Math.floor(
          (Date.now() - msg.author.createdAt.getTime()) / (24 * 60 * 60 * 1000),
        );
        console.log(`  ⏰ Account too young (${accountAgeDays} days old)`);
        failedUsers.push({
          username: msg.author.username,
          reason: `account too young (${accountAgeDays} days old)`,
          originalMessage: msg.content.substring(0, 100),
        });

        // Delete message
        try {
          await msg.delete();
          deletedCount++;
        } catch (error) {
          console.error(
            `❌ Failed to delete message from ${msg.author.username} (account too young):`,
            error.message,
          );
        }
        continue;
      }

      const member =
        interaction.guild.members.cache.get(msg.author.id) ??
        (await interaction.guild.members
          .fetch(msg.author.id)
          .catch(() => null));
      if (!member) {
        console.log(`  Could not fetch member for ${msg.author.tag}`);
        failedUsers.push({
          username: msg.author.username,
          reason: "could not fetch member",
          originalMessage: msg.content.substring(0, 100),
        });
        continue;
      }

      try {
        console.log(`  ✅ Updating roles for ${msg.author.username}`);
        await member.roles.add(VERIFIED_ROLE_ID);
        await member.roles.remove(UNVERIFIED_ROLE_ID);
        processed++;
        processedUsers.push({
          id: msg.author.id,
          username: msg.author.username,
        });

        // Delete message after successful role update
        try {
          await msg.delete();
          deletedCount++;
        } catch (error) {
          console.error(
            `❌ Failed to delete message from ${msg.author.username} (after role update):`,
            error.message,
          );
        }
      } catch (error) {
        console.error(
          `  Error updating roles for ${msg.author.tag}:`,
          error.message,
        );
        failedUsers.push({
          username: msg.author.username,
          reason: "role update error",
          originalMessage: msg.content.substring(0, 100),
        });
      }
    }

    const passedList =
      processedUsers.length > 0
        ? `✅ **Passed (${processedUsers.length}):**\n${processedUsers.map((u) => `• ${u.username}`).join("\n")}`
        : `✅ **Passed:** None`;

    const failedList =
      failedUsers.length > 0
        ? `❌ **Failed (${failedUsers.length}):**\n${failedUsers.map((u) => `• ${u.username} - ${u.reason}\n  Original message: "${u.originalMessage}..."`).join("\n")}`
        : `❌ **Failed:** None`;

    console.log(
      `✨ Scan complete. Processed ${processed} users, deleted ${deletedCount} messages`,
    );

    // Send summary message with deleted count (edits the deferred reply)
    const summary = `📊 **Summary:**\n• Processed: ${processed}\n• Deleted: ${deletedCount}`;
    await interaction.editReply(summary);

    // Send passed users message
    if (passedList.length > 2000) {
      await interaction.followUp(passedList.substring(0, 1997) + "...");
    } else {
      await interaction.followUp(passedList);
    }

    // Send failed users message
    if (failedList.length > 2000) {
      await interaction.followUp(failedList.substring(0, 1997) + "...");
    } else {
      await interaction.followUp(failedList);
    }

    // Send congratulations message in celebration channel for passed users
    if (processedUsers.length > 0) {
      try {
        const celebrationChannel = await client.channels.fetch(
          CELEBRATION_CHANNEL_ID,
        );
        const userMentions = processedUsers.map((u) => `<@${u.id}>`).join(", ");
        const isPlural = processedUsers.length > 1;
        const message = isPlural
          ? `Hi ${userMentions}! Feel free to tell us more about yourselves in <#${MONITOR_CHANNEL_ID}> ☺️`
          : `Hi ${userMentions}! Feel free to tell us more about yourself in <#${MONITOR_CHANNEL_ID}> 👋`;

        await celebrationChannel.send(message);
        console.log(
          `✉️ Sent congratulations message to ${processedUsers.length} user(s)`,
        );
      } catch (error) {
        console.error(
          "❌ Failed to send congratulations message:",
          error.message,
        );
      }
    }
  } catch (error) {
    console.error("🚨 Scan error:", error);
    await interaction.editReply("Error scanning messages.").catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);
