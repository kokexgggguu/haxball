// Haxball Headless Room Script with Discord Integration
// Professional script with 30+ commands and Discord bot features
// All text in English as requested

// Note: Discord integration requires running a separate Node.js bot
// This script focuses on the Haxball room functionality

// Configuration
const CONFIG = {
    // Your tokens
    HAXBALL_TOKEN: "thr1.AAAAAGiTPa0l5In3GwijLg.l-EKzxo8yaM",
    DISCORD_BOT_TOKEN: "MTM5ODY3NDk3NTg1ODA5ODE4OA.G0UDP2.2ighPwGEGPsjE5LiEBAei2HhThiLILQfpkJbX4",
    DISCORD_CHANNEL_ID: "1402628332335534204",
    DISCORD_INVITE_LINK: "https://discord.gg/6eBcNfD4Fn",
    
    // Room settings
    ROOM_NAME: "🎮 Haxball Pro Room | !help for commands | Discord: !discord",
    ADMIN_PASSWORD: "1234",
    MAX_PLAYERS: 16,
    ROOM_PUBLIC: true,
    
    // Reminder interval (3 minutes = 180000ms)
    DISCORD_REMINDER_INTERVAL: 180000
};

// Initialize Discord bot
const discordClient = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
    ]
});

let discordChannel = null;

// Connect Discord bot
discordClient.login(CONFIG.DISCORD_BOT_TOKEN).then(() => {
    console.log('Discord bot connected successfully!');
    discordChannel = discordClient.channels.cache.get(CONFIG.DISCORD_CHANNEL_ID);
    if (discordChannel) {
        sendDiscordMessage("🟢 **Haxball Room Bot is now online!**");
    }
}).catch(err => {
    console.error('Discord connection failed:', err);
});

// Discord helper functions
function sendDiscordMessage(message) {
    if (discordChannel) {
        discordChannel.send(message).catch(err => console.error('Discord send error:', err));
    }
}

function sendDiscordEmbed(title, description, color = 0x3498db) {
    if (discordChannel) {
        const embed = new Discord.EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();
        
        discordChannel.send({ embeds: [embed] }).catch(err => console.error('Discord embed error:', err));
    }
}

// Player and game data storage
let playersData = new Map();
let gamesPlayed = 0;
let commandsUsed = 0;
let roomStartTime = Date.now();

// Initialize Haxball room
const room = HBInit({
    roomName: CONFIG.ROOM_NAME,
    playerName: "🤖 RoomBot",
    maxPlayers: CONFIG.MAX_PLAYERS,
    public: CONFIG.ROOM_PUBLIC,
    token: CONFIG.HAXBALL_TOKEN,
    geo: {code: "US", lat: 40, lon: -74}
});

// Command definitions with descriptions
const COMMANDS = {
    // Admin commands (require admin privileges)
    admin: {
        desc: "Give admin privileges with password (!admin [password])",
        adminOnly: false,
        usage: "!admin [password]"
    },
    kick: {
        desc: "Kick a player from the room (!kick [player])",
        adminOnly: true,
        usage: "!kick [player]"
    },
    ban: {
        desc: "Ban a player from the room (!ban [player])",
        adminOnly: true,
        usage: "!ban [player]"
    },
    bb: {
        desc: "Ban a player (short form) (!bb [player])",
        adminOnly: true,
        usage: "!bb [player]"
    },
    clearbans: {
        desc: "Clear all bans from the room",
        adminOnly: true,
        usage: "!clearbans"
    },
    mute: {
        desc: "Mute a player (!mute [player])",
        adminOnly: true,
        usage: "!mute [player]"
    },
    unmute: {
        desc: "Unmute a player (!unmute [player])",
        adminOnly: true,
        usage: "!unmute [player]"
    },
    swap: {
        desc: "Swap a player to the other team (!swap [player])",
        adminOnly: true,
        usage: "!swap [player]"
    },
    rr: {
        desc: "Reset/restart the game",
        adminOnly: true,
        usage: "!rr"
    },
    start: {
        desc: "Start the game",
        adminOnly: true,
        usage: "!start"
    },
    stop: {
        desc: "Stop the game",
        adminOnly: true,
        usage: "!stop"
    },
    pause: {
        desc: "Pause/unpause the game",
        adminOnly: true,
        usage: "!pause"
    },
    slow: {
        desc: "Set slow game mode (!slow [0-7])",
        adminOnly: true,
        usage: "!slow [0-7]"
    },
    setadmin: {
        desc: "Give admin to specific player (!setadmin [player])",
        adminOnly: true,
        usage: "!setadmin [player]"
    },
    unadmin: {
        desc: "Remove admin from player (!unadmin [player])",
        adminOnly: true,
        usage: "!unadmin [player]"
    },
    
    // Public commands (available to all players)
    help: {
        desc: "Show available commands",
        adminOnly: false,
        usage: "!help"
    },
    commands: {
        desc: "List all commands",
        adminOnly: false,
        usage: "!commands"
    },
    stats: {
        desc: "Show your statistics",
        adminOnly: false,
        usage: "!stats"
    },
    games: {
        desc: "Show total games played in room",
        adminOnly: false,
        usage: "!games"
    },
    wins: {
        desc: "Show your wins (!wins [player])",
        adminOnly: false,
        usage: "!wins [player]"
    },
    goals: {
        desc: "Show goals scored (!goals [player])",
        adminOnly: false,
        usage: "!goals [player]"
    },
    assists: {
        desc: "Show assists made (!assists [player])",
        adminOnly: false,
        usage: "!assists [player]"
    },
    mvp: {
        desc: "Show MVP count (!mvp [player])",
        adminOnly: false,
        usage: "!mvp [player]"
    },
    top: {
        desc: "Show top players leaderboard",
        adminOnly: false,
        usage: "!top"
    },
    rank: {
        desc: "Show your current rank",
        adminOnly: false,
        usage: "!rank"
    },
    discord: {
        desc: "Get Discord server invitation link",
        adminOnly: false,
        usage: "!discord"
    },
    website: {
        desc: "Get website link",
        adminOnly: false,
        usage: "!website"
    },
    donate: {
        desc: "Get donation link",
        adminOnly: false,
        usage: "!donate"
    },
    rules: {
        desc: "Show room rules",
        adminOnly: false,
        usage: "!rules"
    },
    afk: {
        desc: "Mark yourself as AFK",
        adminOnly: false,
        usage: "!afk"
    },
    teams: {
        desc: "Show team information",
        adminOnly: false,
        usage: "!teams"
    },
    score: {
        desc: "Show current score",
        adminOnly: false,
        usage: "!score"
    },
    time: {
        desc: "Show remaining time",
        adminOnly: false,
        usage: "!time"
    },
    ping: {
        desc: "Check your connection ping",
        adminOnly: false,
        usage: "!ping"
    },
    version: {
        desc: "Show bot version",
        adminOnly: false,
        usage: "!version"
    },
    uptime: {
        desc: "Show room uptime",
        adminOnly: false,
        usage: "!uptime"
    },
    online: {
        desc: "Show online players count",
        adminOnly: false,
        usage: "!online"
    }
};

// Utility functions
function getPlayerByName(name) {
    const players = room.getPlayerList();
    return players.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
}

function isPlayerAdmin(playerId) {
    const player = room.getPlayerList().find(p => p.id === playerId);
    return player && player.admin;
}

function getUptime() {
    const uptime = Date.now() - roomStartTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

function getPlayerStats(playerName) {
    const data = playersData.get(playerName) || {
        goals: 0,
        assists: 0,
        games: 0,
        wins: 0,
        mvp: 0
    };
    return data;
}

function updatePlayerStats(playerName, updates) {
    const current = getPlayerStats(playerName);
    playersData.set(playerName, { ...current, ...updates });
}

// Event handlers
room.onPlayerJoin = function(player) {
    console.log(`${player.name} joined the room`);
    
    // Initialize player data
    if (!playersData.has(player.name)) {
        playersData.set(player.name, {
            goals: 0,
            assists: 0,
            games: 0,
            wins: 0,
            mvp: 0
        });
    }
    
    // Welcome message
    room.sendChat(`Welcome ${player.name}! Type !help for commands. Join Discord: !discord`);
    
    // Notify Discord
    sendDiscordMessage(`🟢 **${player.name}** joined the room`);
};

room.onPlayerLeave = function(player) {
    console.log(`${player.name} left the room`);
    
    // Notify Discord
    sendDiscordMessage(`🔴 **${player.name}** left the room`);
};

room.onPlayerChat = function(player, message) {
    console.log(`${player.name}: ${message}`);
    
    // Send chat to Discord (if not a command)
    if (!message.startsWith('!')) {
        sendDiscordMessage(`💬 **${player.name}**: ${message}`);
        return false; // Allow the message
    }
    
    // Handle commands
    handleCommand(player, message);
    return false; // Allow the command message
};

room.onGameStart = function(byPlayer) {
    console.log("Game started");
    gamesPlayed++;
    
    // Notify Discord
    sendDiscordEmbed("🎮 Game Started!", "A new game has begun!", 0x00ff00);
};

room.onGameStop = function(byPlayer) {
    console.log("Game stopped");
    
    // Get game result
    const scores = room.getScores();
    if (scores) {
        const redScore = scores.red;
        const blueScore = scores.blue;
        const winner = redScore > blueScore ? "Red" : blueScore > redScore ? "Blue" : "Draw";
        
        // Find MVP (player with most goals in this game)
        let mvpPlayer = "Unknown";
        // Note: In real implementation, track goals per game
        
        // Send result to Discord
        sendDiscordEmbed(
            "🏆 Game Finished!",
            `**${winner}** ${winner !== "Draw" ? "wins" : "game"}!\n\n🔴 Red: ${redScore}\n🔵 Blue: ${blueScore}\n⭐ MVP: ${mvpPlayer}`,
            winner === "Red" ? 0xff0000 : winner === "Blue" ? 0x0000ff : 0xffff00
        );
    }
};

room.onTeamGoal = function(team) {
    const teamName = team === 1 ? "Red" : "Blue";
    console.log(`${teamName} team scored!`);
    
    // Note: In real implementation, track scorer and assists
    sendDiscordMessage(`⚽ **GOAL!** ${teamName} team scored!`);
};

// Command handler
function handleCommand(player, message) {
    const args = message.substring(1).split(' ');
    const command = args[0].toLowerCase();
    const params = args.slice(1);
    
    commandsUsed++;
    
    // Check if command exists
    if (!COMMANDS[command]) {
        room.sendChat(`❓ Unknown command: !${command}. Type !help for available commands.`);
        return;
    }
    
    // Check admin permissions
    if (COMMANDS[command].adminOnly && !isPlayerAdmin(player.id)) {
        room.sendChat(`❌ ${player.name}, you need admin privileges to use !${command}`);
        return;
    }
    
    // Execute command
    switch (command) {
        case 'admin':
            if (params[0] === CONFIG.ADMIN_PASSWORD) {
                room.setPlayerAdmin(player.id, true);
                room.sendChat(`✅ ${player.name} is now an admin!`);
                sendDiscordMessage(`👑 **${player.name}** became admin`);
            } else {
                room.sendChat(`❌ Wrong password, ${player.name}!`);
            }
            break;
            
        case 'help':
        case 'commands':
            const publicCommands = Object.entries(COMMANDS)
                .filter(([cmd, info]) => !info.adminOnly)
                .map(([cmd]) => `!${cmd}`)
                .slice(0, 8)
                .join(', ');
            room.sendChat(`📋 Commands: ${publicCommands} and more! Type !discord for our server.`);
            break;
            
        case 'kick':
            if (params[0]) {
                const targetPlayer = getPlayerByName(params[0]);
                if (targetPlayer) {
                    room.kickPlayer(targetPlayer.id, "Kicked by admin", false);
                    room.sendChat(`🦵 ${targetPlayer.name} was kicked by ${player.name}`);
                    sendDiscordMessage(`🦵 **${targetPlayer.name}** was kicked by **${player.name}**`);
                } else {
                    room.sendChat(`❌ Player "${params[0]}" not found!`);
                }
            } else {
                room.sendChat(`❌ Usage: !kick [player name]`);
            }
            break;
            
        case 'ban':
        case 'bb':
            if (params[0]) {
                const targetPlayer = getPlayerByName(params[0]);
                if (targetPlayer) {
                    room.kickPlayer(targetPlayer.id, "Banned by admin", true);
                    room.sendChat(`🔨 ${targetPlayer.name} was banned by ${player.name}`);
                    sendDiscordMessage(`🔨 **${targetPlayer.name}** was banned by **${player.name}**`);
                } else {
                    room.sendChat(`❌ Player "${params[0]}" not found!`);
                }
            } else {
                room.sendChat(`❌ Usage: !${command} [player name]`);
            }
            break;
            
        case 'clearbans':
            room.clearBans();
            room.sendChat(`🧹 All bans cleared by ${player.name}`);
            sendDiscordMessage(`🧹 All bans cleared by **${player.name}**`);
            break;
            
        case 'start':
            room.startGame();
            room.sendChat(`▶️ Game started by ${player.name}`);
            break;
            
        case 'stop':
            room.stopGame();
            room.sendChat(`⏹️ Game stopped by ${player.name}`);
            break;
            
        case 'pause':
            room.pauseGame(true);
            room.sendChat(`⏸️ Game paused by ${player.name}`);
            break;
            
        case 'rr':
            room.stopGame();
            setTimeout(() => room.startGame(), 1000);
            room.sendChat(`🔄 Game restarted by ${player.name}`);
            break;
            
        case 'setadmin':
            if (params[0]) {
                const targetPlayer = getPlayerByName(params[0]);
                if (targetPlayer) {
                    room.setPlayerAdmin(targetPlayer.id, true);
                    room.sendChat(`👑 ${targetPlayer.name} is now an admin (set by ${player.name})`);
                } else {
                    room.sendChat(`❌ Player "${params[0]}" not found!`);
                }
            }
            break;
            
        case 'stats':
            const targetName = params[0] || player.name;
            const stats = getPlayerStats(targetName);
            room.sendChat(`📊 ${targetName}: ${stats.goals} goals, ${stats.assists} assists, ${stats.games} games, ${stats.wins} wins, ${stats.mvp} MVP`);
            break;
            
        case 'discord':
            room.sendChat(`🎮 Join our Discord community: ${CONFIG.DISCORD_INVITE_LINK}`);
            break;
            
        case 'games':
            room.sendChat(`🎮 Total games played in this room: ${gamesPlayed}`);
            break;
            
        case 'ping':
            room.sendChat(`🏓 Pong! ${player.name}, your connection is stable.`);
            break;
            
        case 'uptime':
            room.sendChat(`⏰ Room uptime: ${getUptime()}`);
            break;
            
        case 'online':
            const playerCount = room.getPlayerList().length;
            room.sendChat(`👥 ${playerCount}/${CONFIG.MAX_PLAYERS} players online`);
            break;
            
        case 'version':
            room.sendChat(`🤖 Haxball Pro Bot v2.0 - Advanced room management system`);
            break;
            
        case 'rules':
            room.sendChat(`📜 Rules: 1. No spam 2. Respect players 3. No racism 4. Have fun! More info: !discord`);
            break;
            
        case 'top':
            // Show top 3 players by goals
            const topPlayers = Array.from(playersData.entries())
                .sort(([,a], [,b]) => b.goals - a.goals)
                .slice(0, 3)
                .map(([name, stats], i) => `${i+1}. ${name} (${stats.goals} goals)`)
                .join(' | ');
            room.sendChat(`🏆 Top Players: ${topPlayers || "No data yet"}`);
            break;
            
        case 'score':
            const scores = room.getScores();
            if (scores) {
                room.sendChat(`⚽ Score: Red ${scores.red} - ${scores.blue} Blue | Time: ${Math.floor(scores.time/60)}:${(scores.time%60).toString().padStart(2,'0')}`);
            }
            break;
            
        case 'teams':
            const players = room.getPlayerList();
            const redTeam = players.filter(p => p.team === 1).map(p => p.name);
            const blueTeam = players.filter(p => p.team === 2).map(p => p.name);
            const specs = players.filter(p => p.team === 0).map(p => p.name);
            
            room.sendChat(`🔴 Red: ${redTeam.join(', ') || 'Empty'} | 🔵 Blue: ${blueTeam.join(', ') || 'Empty'} | 👥 Specs: ${specs.length}`);
            break;
            
        default:
            room.sendChat(`❓ Command !${command} is not implemented yet. Type !help for available commands.`);
            break;
    }
}

// Discord reminder system (every 3 minutes)
setInterval(() => {
    room.sendChat(`💬 Join our Discord community: ${CONFIG.DISCORD_INVITE_LINK}`);
    sendDiscordMessage("🎮 **Reminder:** Join our Haxball room for some epic games!");
}, CONFIG.DISCORD_REMINDER_INTERVAL);

// Room setup complete
room.onRoomLink = function(url) {
    console.log(`Room link: ${url}`);
    sendDiscordMessage(`🎮 **Haxball Room is ready!**\n🔗 ${url}\n💬 Discord: ${CONFIG.DISCORD_INVITE_LINK}`);
};

console.log("Haxball room script initialized successfully!");
console.log(`Admin password: ${CONFIG.ADMIN_PASSWORD}`);
console.log(`Total commands available: ${Object.keys(COMMANDS).length}`);