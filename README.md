# Entry Hall Bot

A Discord bot that automatically verifies users based on message content requirements, assigns roles, and provides real-time logging.

## How to run locally

**Prerequisites**

- Container management system (optional)
- Node.js
- Appropriate `.env` variables

**Steps**

1. Clone this repo
2. Create `.env` file with the appropriate variables
3. Set up dependencies and run

```shell
npm i
npm run build
```

### With Docker (Recommended)

1. Build and run container

```shell
docker build -t discord-bot .
docker run --env-file .env --name entry-hall-bot discord-bot
```

## Commands

### `/scan`

**Description**: Scans recent messages in the monitor channel and processes any unverified messages.

**Usage**: `/scan`

**What it does**:

1. Fetches the last 100 messages from the MONITOR channel
2. Checks each message against verification requirements
3. For passing messages:
   - Assigns VERIFIED role
   - Removes UNVERIFIED role
   - Deletes the message
   - Adds user to processed list
4. For failing messages:
   - Deletes the message
   - Adds user to failed list
5. Sends a summary reply to the command user:
   - Total processed and deleted count
   - Detailed list of passed users with their messages
   - Detailed list of failed users with reasons and messages
6. Sends batch welcome messages to CELEBRATION channel for passed users

**Output Example**:

```
📊 Summary:
• Processed: 2
• Deleted: 2

✅ Passed (1):
- **JohnDoe**
I'm a 25 year old woman from Texas, follow me on instagram @johndoe

❌ Failed (1):
- **BadUser** (missing terms (she/her, woman), missing source)
hello i like pizza
```

### `/prune`

**Description**: Kicks unverified members who have been in the server longer than 48 hours.

**Usage**: `/prune`

**What it does**:

1. Fetches all members in the server to ensure up-to-date data
2. Identifies members with the UNVERIFIED role
3. Checks each member's join date against the 48-hour threshold
4. Kicks all members who:
   - Have the UNVERIFIED role
   - Joined more than 48 hours ago
5. Sends a summary to the command user with:
   - Total members found
   - Successfully kicked count
   - Any errors encountered

**Output Example**:

```
✅ Pruned 5/5 unverified members.
```

Error Examples:

```
❌ Prune failed: I need Kick Members permission.
```

```
No unverified members found who joined over 48 hours ago.
```

**Important Notes**:

- Bot requires Kick Members permission
- Includes a 1-second delay between kicks to avoid rate limiting
- Kicked users receive a DM with the kick reason (if DMs are enabled)

## Events

### `ready`

**Trigger**: Once when the bot starts up

**What it does**:

- Logs that the bot has successfully logged in
- Registers the `/scan` slash command with Discord globally
- Confirms command registration in console

**Why it's needed**: Discord requires slash commands to be registered via API before they can be used. This event ensures the command is available when the bot is running.

### `interactionCreate`

**Trigger**: Every time any user interaction occurs (slash commands, button clicks, etc.)

**What it does**:

- Filters for only slash command interactions
- Checks if the command exists in the bot's command collection
- Executes the matching command if found
- Handles errors and replies with an error message if command fails

**Why it's needed**: This is the entry point for all slash command executions. Without it, users couldn't run `/scan`.

### `messageCreate`

**Trigger**: Every time a message is sent in any channel the bot can see

**What it does**:

- Filters for:
  - Non-bot messages
  - Messages in a server (not DMs)
  - Messages in the MONITOR channel only
  - Users not in the excluded list
- Checks the message against verification requirements
- **If message passes**:
  - Adds VERIFIED role
  - Removes UNVERIFIED role
  - Deletes the original message
  - Sends welcome message to CELEBRATION channel
  - Sends detailed pass log to BOT channel
- **If message fails**:
  - Deletes the original message
  - Sends detailed fail log to BOT channel
- Logs all actions to console

**Why it's needed**: This is the core real-time verification handler. It processes user messages instantly as they're posted.

## Message Flow by Event/Command

### Real-time Verification (`messageCreate` event)

| Scenario | CELEBRATION Channel | BOT Channel                                    |
| -------- | ------------------- | ---------------------------------------------- |
| **Pass** | `Hi @user... 👋`    | `✅ Passed: username\n  "message..."`          |
| **Fail** | Nothing             | `❌ Failed: username - reason\n  "message..."` |

### Batch Scan (`/scan` command)

| Scenario | CELEBRATION Channel              | Command Reply           |
| -------- | -------------------------------- | ----------------------- |
| **Pass** | `Hi @user(s)...` (batch welcome) | Summary + detailed list |
| **Fail** | Nothing                          | Summary + detailed list |

### Prune (`/prune` command)

| Scenario       | Command Reply                                             |
| -------------- | --------------------------------------------------------- |
| **Success**    | ✅ Pruned X/Y unverified members.                         |
| **No members** | No unverified members found who joined over 48 hours ago. |
| **Error**      | ❌ Prune failed: [error message]                          |

## Automatic Registration

The bot automatically registers events and commands on startup with zero manual configuration:

### Event Handler (`event-handler.ts`)

- Automatically scans the `/events` directory
- Loads every `.ts` and `.js` file found
- Attaches events to the Discord client:
  - `once: true` events (like `ready`) run once
  - `once: false` events (like `messageCreate`) run every time
- No manual event registration needed - just add files to the folder

### Command Handler (`command-handler.ts`)

- Automatically scans the `/commands` directory
- Loads every command file found
- Stores commands in `client.commands` Map for quick access
- Commands are automatically available to the `interactionCreate` event
- No manual command registration needed - just add files to the folder

### Slash Command Registration (`ready.ts`)

- Automatically registers the `/scan` command with Discord's API on startup
- Uses the Discord REST API to make commands available globally
- Commands appear in Discord within seconds of bot startup

**Why automatic?** This design means you never need to manually register events or commands. Just drop a new `.ts` file in the `commands/` or `events/` folder and restart the bot - everything loads automatically.
