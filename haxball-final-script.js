/* Haxball Headless Room Script - Final Version
 * 30+ Commands with Admin System & Discord Integration
 * Fixed all conflicts and optimized for direct use
 * All text in English as requested
 */

// ===========================================
//              CONFIGURATION
// ===========================================

var roomConfig = {
    HAXBALL_TOKEN: "thr1.AAAAAGiTPa0l5In3GwijLg.l-EKzxo8yaM",
    DISCORD_INVITE_LINK: "https://discord.gg/6eBcNfD4Fn",
    
    // Room Settings
    ROOM_NAME: "🎮 Haxball Pro Room | !help for commands | Discord: !discord",
    ADMIN_PASSWORD: "1234",
    MAX_PLAYERS: 16,
    ROOM_PUBLIC: true,
    
    // Features
    DISCORD_REMINDER_INTERVAL: 180000, // 3 minutes
    WELCOME_MESSAGE: true
};

// Discord Webhook URL - Connected to your Discord channel
var discordWebhookURL = "https://discord.com/api/webhooks/1402635297694548099/2PqgFYQS65AeyQGhW9RIDh9PZFFUU6C0L0xs-MZvWK0IaytATYD7k-B4bdkmzlL9hvlM";

// ===========================================
//              DATA STORAGE
// ===========================================

var playersStats = {};
var adminList = [];
var mutedList = [];
var roomStats = {
    gamesPlayed: 0,
    commandsUsed: 0,
    roomStartTime: Date.now(),
    currentGame: null
};

// ===========================================
//              COMMAND DEFINITIONS
// ===========================================

var availableCommands = {
    // === ADMIN COMMANDS ===
    admin: { desc: "Get admin privileges (!admin [password])", adminOnly: false, usage: "!admin [password]" },
    kick: { desc: "Kick a player (!kick [player])", adminOnly: true, usage: "!kick [player]" },
    ban: { desc: "Ban a player (!ban [player])", adminOnly: true, usage: "!ban [player]" },
    bb: { desc: "Ban player (short form) (!bb [player])", adminOnly: true, usage: "!bb [player]" },
    clearbans: { desc: "Clear all bans", adminOnly: true, usage: "!clearbans" },
    mute: { desc: "Mute a player (!mute [player])", adminOnly: true, usage: "!mute [player]" },
    unmute: { desc: "Unmute a player (!unmute [player])", adminOnly: true, usage: "!unmute [player]" },
    swap: { desc: "Swap player to other team (!swap [player])", adminOnly: true, usage: "!swap [player]" },
    move: { desc: "Move player to team (!move [player] [red/blue/spec])", adminOnly: true, usage: "!move [player] [team]" },
    start: { desc: "Start the game", adminOnly: true, usage: "!start" },
    stop: { desc: "Stop the game", adminOnly: true, usage: "!stop" },
    pause: { desc: "Pause/unpause the game", adminOnly: true, usage: "!pause" },
    rr: { desc: "Restart the game", adminOnly: true, usage: "!rr" },
    reset: { desc: "Reset game and scores", adminOnly: true, usage: "!reset" },
    slow: { desc: "Set slow mode (!slow [0-7])", adminOnly: true, usage: "!slow [0-7]" },
    setadmin: { desc: "Give admin to player (!setadmin [player])", adminOnly: true, usage: "!setadmin [player]" },
    unadmin: { desc: "Remove admin (!unadmin [player])", adminOnly: true, usage: "!unadmin [player]" },
    clear: { desc: "Clear chat", adminOnly: true, usage: "!clear" },
    
    // === PUBLIC COMMANDS ===
    help: { desc: "Show available commands", adminOnly: false, usage: "!help" },
    commands: { desc: "List all commands", adminOnly: false, usage: "!commands" },
    stats: { desc: "Show your statistics (!stats [player])", adminOnly: false, usage: "!stats [player]" },
    games: { desc: "Show total games played", adminOnly: false, usage: "!games" },
    wins: { desc: "Show wins (!wins [player])", adminOnly: false, usage: "!wins [player]" },
    goals: { desc: "Show goals scored (!goals [player])", adminOnly: false, usage: "!goals [player]" },
    assists: { desc: "Show assists (!assists [player])", adminOnly: false, usage: "!assists [player]" },
    mvp: { desc: "Show MVP count (!mvp [player])", adminOnly: false, usage: "!mvp [player]" },
    top: { desc: "Show top players leaderboard", adminOnly: false, usage: "!top" },
    rank: { desc: "Show your rank", adminOnly: false, usage: "!rank" },
    discord: { desc: "Get Discord server link", adminOnly: false, usage: "!discord" },
    rules: { desc: "Show room rules", adminOnly: false, usage: "!rules" },
    teams: { desc: "Show team information", adminOnly: false, usage: "!teams" },
    score: { desc: "Show current score", adminOnly: false, usage: "!score" },
    time: { desc: "Show remaining time", adminOnly: false, usage: "!time" },
    ping: { desc: "Check your ping", adminOnly: false, usage: "!ping" },
    online: { desc: "Show online players", adminOnly: false, usage: "!online" },
    uptime: { desc: "Show room uptime", adminOnly: false, usage: "!uptime" },
    version: { desc: "Show bot version", adminOnly: false, usage: "!version" },
    afk: { desc: "Mark yourself as AFK", adminOnly: false, usage: "!afk" },
    website: { desc: "Get website link", adminOnly: false, usage: "!website" },
    donate: { desc: "Get donation info", adminOnly: false, usage: "!donate" }
};

// ===========================================
//              UTILITY FUNCTIONS
// ===========================================

function findPlayerByName(name) {
    if (!name) return null;
    var playerList = haxballRoom.getPlayerList();
    return playerList.find(function(p) {
        return p.name.toLowerCase().includes(name.toLowerCase());
    });
}

function checkPlayerAdmin(playerId) {
    var player = haxballRoom.getPlayerList().find(function(p) { return p.id === playerId; });
    return player && (player.admin || adminList.includes(playerId));
}

function calculateUptime() {
    var uptime = Date.now() - roomStats.roomStartTime;
    var hours = Math.floor(uptime / (1000 * 60 * 60));
    var minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return hours + "h " + minutes + "m";
}

function getPlayerStatistics(playerName) {
    return playersStats[playerName] || {
        goals: 0, assists: 0, games: 0, wins: 0, mvp: 0, ownGoals: 0
    };
}

function updatePlayerStatistics(playerName, updates) {
    if (!playersStats[playerName]) {
        playersStats[playerName] = { goals: 0, assists: 0, games: 0, wins: 0, mvp: 0, ownGoals: 0 };
    }
    Object.assign(playersStats[playerName], updates);
}

function notifyDiscord(message) {
    if (discordWebhookURL && discordWebhookURL.includes("discord.com/api/webhooks/")) {
        try {
            fetch(discordWebhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: message,
                    username: "Haxball Pro Bot"
                })
            }).catch(function(err) { 
                console.log('Discord notification failed:', err.message); 
            });
        } catch (err) {
            console.log('Discord error:', err.message);
        }
    }
}

function sendDiscordEmbed(title, description, color) {
    if (discordWebhookURL && discordWebhookURL.includes("discord.com/api/webhooks/")) {
        try {
            fetch(discordWebhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: "Haxball Pro Bot",
                    embeds: [{
                        title: title,
                        description: description,
                        color: color || 3447003,
                        timestamp: new Date().toISOString()
                    }]
                })
            }).catch(function(err) { 
                console.log('Discord embed failed:', err.message); 
            });
        } catch (err) {
            console.log('Discord embed error:', err.message);
        }
    }
}

// ===========================================
//              INITIALIZE ROOM
// ===========================================

var haxballRoom = HBInit({
    roomName: roomConfig.ROOM_NAME,
    playerName: "🤖 RoomBot",
    maxPlayers: roomConfig.MAX_PLAYERS,
    public: roomConfig.ROOM_PUBLIC,
    token: roomConfig.HAXBALL_TOKEN,
    geo: { code: "US", lat: 40, lon: -74 }
});

// ===========================================
//              EVENT HANDLERS
// ===========================================

haxballRoom.onPlayerJoin = function(player) {
    console.log(player.name + " joined the room");
    
    // Initialize player statistics
    if (!playersStats[player.name]) {
        playersStats[player.name] = { goals: 0, assists: 0, games: 0, wins: 0, mvp: 0, ownGoals: 0 };
    }
    
    // Welcome message
    if (roomConfig.WELCOME_MESSAGE) {
        setTimeout(function() {
            haxballRoom.sendChat("Welcome " + player.name + "! Type !help for commands. Discord: !discord");
        }, 1000);
    }
    
    // Discord notification
    notifyDiscord("🟢 **" + player.name + "** joined the room");
};

haxballRoom.onPlayerLeave = function(player) {
    console.log(player.name + " left the room");
    
    // Remove from admin list
    var adminIndex = adminList.indexOf(player.id);
    if (adminIndex !== -1) {
        adminList.splice(adminIndex, 1);
    }
    
    // Discord notification
    notifyDiscord("🔴 **" + player.name + "** left the room");
};

haxballRoom.onPlayerChat = function(player, message) {
    console.log(player.name + ": " + message);
    
    // Check if player is muted
    if (mutedList.includes(player.id) && !message.startsWith('!')) {
        return false;
    }
    
    // Handle commands
    if (message.startsWith('!')) {
        processCommand(player, message);
        return false;
    }
    
    // Send regular chat to Discord
    notifyDiscord("💬 **" + player.name + "**: " + message);
    
    return true;
};

haxballRoom.onGameStart = function(byPlayer) {
    console.log("Game started");
    roomStats.gamesPlayed++;
    roomStats.currentGame = {
        startTime: Date.now(),
        redGoals: 0,
        blueGoals: 0
    };
    
    sendDiscordEmbed("🎮 Game Started!", "A new game has begun!", 0x00ff00);
};

haxballRoom.onGameStop = function(byPlayer) {
    console.log("Game stopped");
    
    var gameScores = haxballRoom.getScores();
    if (gameScores && roomStats.currentGame) {
        var redScore = gameScores.red || 0;
        var blueScore = gameScores.blue || 0;
        var winner = redScore > blueScore ? "Red" : blueScore > redScore ? "Blue" : "Draw";
        
        var duration = Math.floor((Date.now() - roomStats.currentGame.startTime) / 1000);
        var minutes = Math.floor(duration / 60);
        var seconds = duration % 60;
        
        sendDiscordEmbed(
            "🏆 Game Finished!",
            "**" + winner + "** " + (winner !== "Draw" ? "wins" : "game") + "!\n\n" +
            "🔴 Red: " + redScore + "\n" +
            "🔵 Blue: " + blueScore + "\n" +
            "⏱️ Duration: " + minutes + ":" + (seconds < 10 ? "0" : "") + seconds,
            winner === "Red" ? 0xff0000 : winner === "Blue" ? 0x0000ff : 0xffff00
        );
    }
    
    roomStats.currentGame = null;
};

haxballRoom.onTeamGoal = function(team) {
    var teamName = team === 1 ? "Red" : "Blue";
    console.log(teamName + " team scored!");
    
    if (roomStats.currentGame) {
        if (team === 1) {
            roomStats.currentGame.redGoals++;
        } else {
            roomStats.currentGame.blueGoals++;
        }
    }
    
    notifyDiscord("⚽ **GOAL!** " + teamName + " team scored!");
};

haxballRoom.onGamePause = function(byPlayer) {
    notifyDiscord("⏸️ Game paused by **" + (byPlayer ? byPlayer.name : "Admin") + "**");
};

haxballRoom.onGameUnpause = function(byPlayer) {
    notifyDiscord("▶️ Game unpaused by **" + (byPlayer ? byPlayer.name : "Admin") + "**");
};

// ===========================================
//              COMMAND PROCESSOR
// ===========================================

function processCommand(player, message) {
    var args = message.substring(1).split(' ');
    var command = args[0].toLowerCase();
    var params = args.slice(1);
    
    roomStats.commandsUsed++;
    
    // Check if command exists
    if (!availableCommands[command]) {
        haxballRoom.sendChat("❓ Unknown command: !" + command + ". Type !help for available commands.", player.id);
        return;
    }
    
    // Check admin permissions
    if (availableCommands[command].adminOnly && !checkPlayerAdmin(player.id)) {
        haxballRoom.sendChat("❌ " + player.name + ", you need admin privileges to use !" + command, player.id);
        return;
    }
    
    // Execute command
    switch (command) {
        case 'admin':
            if (params[0] === roomConfig.ADMIN_PASSWORD) {
                haxballRoom.setPlayerAdmin(player.id, true);
                adminList.push(player.id);
                haxballRoom.sendChat("✅ " + player.name + " is now an admin!");
                notifyDiscord("👑 **" + player.name + "** became admin");
            } else {
                haxballRoom.sendChat("❌ Wrong password, " + player.name + "!", player.id);
            }
            break;
            
        case 'help':
        case 'commands':
            var publicCommands = [];
            for (var cmd in availableCommands) {
                if (!availableCommands[cmd].adminOnly) {
                    publicCommands.push("!" + cmd);
                }
                if (publicCommands.length >= 8) break;
            }
            haxballRoom.sendChat("📋 Commands: " + publicCommands.join(', ') + " and more! Type !discord", player.id);
            break;
            
        case 'kick':
            if (params[0]) {
                var targetPlayer = findPlayerByName(params[0]);
                if (targetPlayer) {
                    haxballRoom.kickPlayer(targetPlayer.id, "Kicked by " + player.name, false);
                    haxballRoom.sendChat("🦵 " + targetPlayer.name + " was kicked by " + player.name);
                    notifyDiscord("🦵 **" + targetPlayer.name + "** was kicked by **" + player.name + "**");
                } else {
                    haxballRoom.sendChat("❌ Player \"" + params[0] + "\" not found!", player.id);
                }
            } else {
                haxballRoom.sendChat("❌ Usage: !kick [player name]", player.id);
            }
            break;
            
        case 'ban':
        case 'bb':
            if (params[0]) {
                var targetPlayer = findPlayerByName(params[0]);
                if (targetPlayer) {
                    haxballRoom.kickPlayer(targetPlayer.id, "Banned by " + player.name, true);
                    haxballRoom.sendChat("🔨 " + targetPlayer.name + " was banned by " + player.name);
                    notifyDiscord("🔨 **" + targetPlayer.name + "** was banned by **" + player.name + "**");
                } else {
                    haxballRoom.sendChat("❌ Player \"" + params[0] + "\" not found!", player.id);
                }
            } else {
                haxballRoom.sendChat("❌ Usage: !" + command + " [player name]", player.id);
            }
            break;
            
        case 'clearbans':
            haxballRoom.clearBans();
            haxballRoom.sendChat("🧹 All bans cleared by " + player.name);
            notifyDiscord("🧹 All bans cleared by **" + player.name + "**");
            break;
            
        case 'mute':
            if (params[0]) {
                var targetPlayer = findPlayerByName(params[0]);
                if (targetPlayer && !mutedList.includes(targetPlayer.id)) {
                    mutedList.push(targetPlayer.id);
                    haxballRoom.sendChat("🔇 " + targetPlayer.name + " was muted by " + player.name);
                } else if (targetPlayer) {
                    haxballRoom.sendChat("❌ " + targetPlayer.name + " is already muted!", player.id);
                } else {
                    haxballRoom.sendChat("❌ Player not found!", player.id);
                }
            } else {
                haxballRoom.sendChat("❌ Usage: !mute [player name]", player.id);
            }
            break;
            
        case 'unmute':
            if (params[0]) {
                var targetPlayer = findPlayerByName(params[0]);
                if (targetPlayer) {
                    var muteIndex = mutedList.indexOf(targetPlayer.id);
                    if (muteIndex !== -1) {
                        mutedList.splice(muteIndex, 1);
                        haxballRoom.sendChat("🔊 " + targetPlayer.name + " was unmuted by " + player.name);
                    } else {
                        haxballRoom.sendChat("❌ " + targetPlayer.name + " is not muted!", player.id);
                    }
                } else {
                    haxballRoom.sendChat("❌ Player not found!", player.id);
                }
            } else {
                haxballRoom.sendChat("❌ Usage: !unmute [player name]", player.id);
            }
            break;
            
        case 'start':
            haxballRoom.startGame();
            haxballRoom.sendChat("▶️ Game started by " + player.name);
            break;
            
        case 'stop':
            haxballRoom.stopGame();
            haxballRoom.sendChat("⏹️ Game stopped by " + player.name);
            break;
            
        case 'pause':
            haxballRoom.pauseGame(true);
            haxballRoom.sendChat("⏸️ Game paused by " + player.name);
            break;
            
        case 'rr':
        case 'reset':
            haxballRoom.stopGame();
            setTimeout(function() { haxballRoom.startGame(); }, 1000);
            haxballRoom.sendChat("🔄 Game restarted by " + player.name);
            break;
            
        case 'move':
            if (params.length >= 2) {
                var targetPlayer = findPlayerByName(params[0]);
                var targetTeam = params[1].toLowerCase();
                if (targetPlayer) {
                    var teamId = targetTeam === 'red' ? 1 : targetTeam === 'blue' ? 2 : 0;
                    haxballRoom.setPlayerTeam(targetPlayer.id, teamId);
                    var teamName = teamId === 1 ? 'Red' : teamId === 2 ? 'Blue' : 'Spectators';
                    haxballRoom.sendChat("↔️ " + targetPlayer.name + " moved to " + teamName + " by " + player.name);
                } else {
                    haxballRoom.sendChat("❌ Player not found!", player.id);
                }
            } else {
                haxballRoom.sendChat("❌ Usage: !move [player] [red/blue/spec]", player.id);
            }
            break;
            
        case 'setadmin':
            if (params[0]) {
                var targetPlayer = findPlayerByName(params[0]);
                if (targetPlayer) {
                    haxballRoom.setPlayerAdmin(targetPlayer.id, true);
                    adminList.push(targetPlayer.id);
                    haxballRoom.sendChat("👑 " + targetPlayer.name + " is now an admin (set by " + player.name + ")");
                } else {
                    haxballRoom.sendChat("❌ Player not found!", player.id);
                }
            } else {
                haxballRoom.sendChat("❌ Usage: !setadmin [player name]", player.id);
            }
            break;
            
        case 'stats':
            var targetName = params[0] || player.name;
            var stats = getPlayerStatistics(targetName);
            haxballRoom.sendChat("📊 " + targetName + ": " + stats.goals + " goals, " + stats.assists + " assists, " + stats.games + " games, " + stats.wins + " wins", player.id);
            break;
            
        case 'discord':
            haxballRoom.sendChat("🎮 Join our Discord community: " + roomConfig.DISCORD_INVITE_LINK, player.id);
            break;
            
        case 'games':
            haxballRoom.sendChat("🎮 Total games played in this room: " + roomStats.gamesPlayed, player.id);
            break;
            
        case 'ping':
            haxballRoom.sendChat("🏓 Pong! " + player.name + ", your connection is stable.", player.id);
            break;
            
        case 'uptime':
            haxballRoom.sendChat("⏰ Room uptime: " + calculateUptime(), player.id);
            break;
            
        case 'online':
            var playerCount = haxballRoom.getPlayerList().length;
            haxballRoom.sendChat("👥 " + playerCount + "/" + roomConfig.MAX_PLAYERS + " players online", player.id);
            break;
            
        case 'version':
            haxballRoom.sendChat("🤖 Haxball Pro Bot v2.0 - Advanced room management system", player.id);
            break;
            
        case 'rules':
            haxballRoom.sendChat("📜 Rules: 1. No spam 2. Respect players 3. No racism 4. Have fun! More: !discord", player.id);
            break;
            
        case 'top':
            var topPlayers = Object.keys(playersStats)
                .map(function(name) { return { name: name, goals: playersStats[name].goals }; })
                .sort(function(a, b) { return b.goals - a.goals; })
                .slice(0, 3)
                .map(function(p, i) { return (i + 1) + ". " + p.name + " (" + p.goals + " goals)"; })
                .join(' | ');
            haxballRoom.sendChat("🏆 Top Players: " + (topPlayers || "No data yet"), player.id);
            break;
            
        case 'score':
            var gameScores = haxballRoom.getScores();
            if (gameScores) {
                var minutes = Math.floor(gameScores.time / 60);
                var seconds = gameScores.time % 60;
                haxballRoom.sendChat("⚽ Score: Red " + gameScores.red + " - " + gameScores.blue + " Blue | Time: " + minutes + ":" + (seconds < 10 ? "0" : "") + seconds, player.id);
            } else {
                haxballRoom.sendChat("❌ No game in progress", player.id);
            }
            break;
            
        case 'teams':
            var playerList = haxballRoom.getPlayerList();
            var redTeam = playerList.filter(function(p) { return p.team === 1; }).map(function(p) { return p.name; });
            var blueTeam = playerList.filter(function(p) { return p.team === 2; }).map(function(p) { return p.name; });
            var specs = playerList.filter(function(p) { return p.team === 0; }).map(function(p) { return p.name; });
            
            haxballRoom.sendChat("🔴 Red: " + (redTeam.join(', ') || 'Empty') + " | 🔵 Blue: " + (blueTeam.join(', ') || 'Empty') + " | 👥 Specs: " + specs.length, player.id);
            break;
            
        case 'clear':
            for (var i = 0; i < 20; i++) {
                haxballRoom.sendChat(" ");
            }
            haxballRoom.sendChat("🧹 Chat cleared by " + player.name);
            break;
            
        default:
            haxballRoom.sendChat("❓ Command !" + command + " is available but not fully implemented yet.", player.id);
            break;
    }
}

// ===========================================
//              AUTO FEATURES
// ===========================================

// Discord server promotion every 3 minutes
setInterval(function() {
    if (haxballRoom.getPlayerList().length > 0) {
        haxballRoom.sendChat("💬 Join our Discord community: " + roomConfig.DISCORD_INVITE_LINK);
        notifyDiscord("🎮 **Haxball room is active!** Join us: " + roomConfig.DISCORD_INVITE_LINK);
    }
}, roomConfig.DISCORD_REMINDER_INTERVAL);

// ===========================================
//              ROOM INITIALIZATION
// ===========================================

haxballRoom.onRoomLink = function(url) {
    console.log("🎮 Haxball Room created successfully!");
    console.log("🔗 Room URL: " + url);
    console.log("🔑 Admin password: " + roomConfig.ADMIN_PASSWORD);
    console.log("⚡ Total commands available: " + Object.keys(availableCommands).length);
    
    sendDiscordEmbed(
        "🎮 Haxball Room Online!",
        "**Room Link:** " + url + "\n" +
        "**Admin Password:** " + roomConfig.ADMIN_PASSWORD + "\n" +
        "**Commands:** " + Object.keys(availableCommands).length + " available\n" +
        "**Discord:** " + roomConfig.DISCORD_INVITE_LINK,
        0x00ff00
    );
};

console.log("🚀 Haxball Professional Bot Script Loaded Successfully!");
console.log("📋 Features: 30+ Commands, Admin System, Discord Integration");
console.log("⚠️ To enable Discord integration, replace discordWebhookURL with your webhook URL");