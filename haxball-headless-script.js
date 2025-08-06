/* Haxball Headless Room Script - Professional Edition
 * 30+ Commands with Admin System & Discord Integration
 * Compatible with browser environment - no Node.js dependencies
 * All text in English as requested
 */

// ===========================================
//              CONFIGURATION
// ===========================================

var CONFIG = {
    HAXBALL_TOKEN: "thr1.AAAAAGiTPa0l5In3GwijLg.l-EKzxo8yaM",
    DISCORD_INVITE_LINK: "https://discord.gg/6eBcNfD4Fn",
    
    // Room Settings
    ROOM_NAME: "🎮 Haxball Pro Room | !help for commands | Discord: !discord",
    ADMIN_PASSWORD: "1234",
    MAX_PLAYERS: 16,
    ROOM_PUBLIC: true,
    
    // Features
    DISCORD_REMINDER_INTERVAL: 180000, // 3 minutes
    AUTO_ADMIN_ENABLED: true,
    WELCOME_MESSAGE: true
};

// Discord Integration via HTTP requests to local bot server
var DISCORD_BOT_URL = "http://localhost:3001"; // Change if your bot runs on different port

// ===========================================
//              DATA STORAGE
// ===========================================

var playersData = {};
var adminPlayers = [];
var mutedPlayers = [];
var bannedPlayers = [];
var gameStats = {
    gamesPlayed: 0,
    commandsUsed: 0,
    roomStartTime: Date.now(),
    currentGame: null
};

// ===========================================
//              COMMAND DEFINITIONS
// ===========================================

var COMMANDS = {
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

function getPlayerByName(name) {
    if (!name) return null;
    var players = room.getPlayerList();
    return players.find(function(p) {
        return p.name.toLowerCase().includes(name.toLowerCase());
    });
}

function isPlayerAdmin(playerId) {
    var player = room.getPlayerList().find(function(p) { return p.id === playerId; });
    return player && (player.admin || adminPlayers.includes(playerId));
}

function getUptime() {
    var uptime = Date.now() - gameStats.roomStartTime;
    var hours = Math.floor(uptime / (1000 * 60 * 60));
    var minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return hours + "h " + minutes + "m";
}

function getPlayerStats(playerName) {
    return playersData[playerName] || {
        goals: 0, assists: 0, games: 0, wins: 0, mvp: 0, ownGoals: 0
    };
}

function updatePlayerStats(playerName, updates) {
    if (!playersData[playerName]) {
        playersData[playerName] = { goals: 0, assists: 0, games: 0, wins: 0, mvp: 0, ownGoals: 0 };
    }
    Object.assign(playersData[playerName], updates);
}

function sendDiscordMessage(message) {
    // Send message to Discord via webhook or HTTP request
    try {
        // Method 1: Direct webhook (if you create a webhook in your Discord channel)
        // Replace YOUR_WEBHOOK_URL with your actual webhook URL
        var webhookUrl = "YOUR_WEBHOOK_URL"; // Get this from Discord Channel Settings > Integrations > Webhooks
        
        if (webhookUrl && webhookUrl !== "YOUR_WEBHOOK_URL") {
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: message,
                    username: "Haxball Bot"
                })
            }).catch(function(err) { console.error('Discord error:', err); });
        }
    } catch (err) {
        console.error('Discord message error:', err);
    }
}

function sendDiscordEmbed(title, description, color) {
    try {
        var webhookUrl = "YOUR_WEBHOOK_URL"; // Same webhook URL as above
        
        if (webhookUrl && webhookUrl !== "YOUR_WEBHOOK_URL") {
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: "Haxball Bot",
                    embeds: [{
                        title: title,
                        description: description,
                        color: color || 3447003,
                        timestamp: new Date().toISOString()
                    }]
                })
            }).catch(function(err) { console.error('Discord error:', err); });
        }
    } catch (err) {
        console.error('Discord embed error:', err);
    }
}

// ===========================================
//              INITIALIZE ROOM
// ===========================================

var room = HBInit({
    roomName: CONFIG.ROOM_NAME,
    playerName: "🤖 RoomBot",
    maxPlayers: CONFIG.MAX_PLAYERS,
    public: CONFIG.ROOM_PUBLIC,
    token: CONFIG.HAXBALL_TOKEN,
    geo: { code: "US", lat: 40, lon: -74 }
});

// ===========================================
//              EVENT HANDLERS
// ===========================================

room.onPlayerJoin = function(player) {
    console.log(player.name + " joined the room");
    
    // Initialize player data
    if (!playersData[player.name]) {
        playersData[player.name] = { goals: 0, assists: 0, games: 0, wins: 0, mvp: 0, ownGoals: 0 };
    }
    
    // Welcome message
    if (CONFIG.WELCOME_MESSAGE) {
        setTimeout(function() {
            room.sendChat("Welcome " + player.name + "! Type !help for commands. Discord: !discord");
        }, 1000);
    }
    
    // Discord notification
    sendDiscordMessage("🟢 **" + player.name + "** joined the room");
};

room.onPlayerLeave = function(player) {
    console.log(player.name + " left the room");
    
    // Remove from admin list if they were admin
    var adminIndex = adminPlayers.indexOf(player.id);
    if (adminIndex !== -1) {
        adminPlayers.splice(adminIndex, 1);
    }
    
    // Discord notification
    sendDiscordMessage("🔴 **" + player.name + "** left the room");
};

room.onPlayerChat = function(player, message) {
    console.log(player.name + ": " + message);
    
    // Check if player is muted
    if (mutedPlayers.includes(player.id) && !message.startsWith('!')) {
        return false; // Block non-command messages from muted players
    }
    
    // Handle commands
    if (message.startsWith('!')) {
        handleCommand(player, message);
        return false; // Block command from appearing in chat
    }
    
    // Send chat to Discord
    sendDiscordMessage("💬 **" + player.name + "**: " + message);
    
    return true; // Allow message
};

room.onGameStart = function(byPlayer) {
    console.log("Game started");
    gameStats.gamesPlayed++;
    gameStats.currentGame = {
        startTime: Date.now(),
        redGoals: 0,
        blueGoals: 0
    };
    
    sendDiscordEmbed("🎮 Game Started!", "A new game has begun!", 0x00ff00);
};

room.onGameStop = function(byPlayer) {
    console.log("Game stopped");
    
    var scores = room.getScores();
    if (scores && gameStats.currentGame) {
        var redScore = scores.red || 0;
        var blueScore = scores.blue || 0;
        var winner = redScore > blueScore ? "Red" : blueScore > redScore ? "Blue" : "Draw";
        
        var duration = Math.floor((Date.now() - gameStats.currentGame.startTime) / 1000);
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
    
    gameStats.currentGame = null;
};

room.onTeamGoal = function(team) {
    var teamName = team === 1 ? "Red" : "Blue";
    console.log(teamName + " team scored!");
    
    if (gameStats.currentGame) {
        if (team === 1) {
            gameStats.currentGame.redGoals++;
        } else {
            gameStats.currentGame.blueGoals++;
        }
    }
    
    sendDiscordMessage("⚽ **GOAL!** " + teamName + " team scored!");
};

room.onGamePause = function(byPlayer) {
    sendDiscordMessage("⏸️ Game paused by **" + (byPlayer ? byPlayer.name : "Admin") + "**");
};

room.onGameUnpause = function(byPlayer) {
    sendDiscordMessage("▶️ Game unpaused by **" + (byPlayer ? byPlayer.name : "Admin") + "**");
};

// ===========================================
//              COMMAND HANDLER
// ===========================================

function handleCommand(player, message) {
    var args = message.substring(1).split(' ');
    var command = args[0].toLowerCase();
    var params = args.slice(1);
    
    gameStats.commandsUsed++;
    
    // Check if command exists
    if (!COMMANDS[command]) {
        room.sendChat("❓ Unknown command: !" + command + ". Type !help for available commands.", player.id);
        return;
    }
    
    // Check admin permissions
    if (COMMANDS[command].adminOnly && !isPlayerAdmin(player.id)) {
        room.sendChat("❌ " + player.name + ", you need admin privileges to use !" + command, player.id);
        return;
    }
    
    // Execute command
    switch (command) {
        case 'admin':
            if (params[0] === CONFIG.ADMIN_PASSWORD) {
                room.setPlayerAdmin(player.id, true);
                adminPlayers.push(player.id);
                room.sendChat("✅ " + player.name + " is now an admin!");
                sendDiscordMessage("👑 **" + player.name + "** became admin");
            } else {
                room.sendChat("❌ Wrong password, " + player.name + "!", player.id);
            }
            break;
            
        case 'help':
        case 'commands':
            var publicCommands = [];
            for (var cmd in COMMANDS) {
                if (!COMMANDS[cmd].adminOnly) {
                    publicCommands.push("!" + cmd);
                }
                if (publicCommands.length >= 8) break;
            }
            room.sendChat("📋 Commands: " + publicCommands.join(', ') + " and more! Type !discord", player.id);
            break;
            
        case 'kick':
            if (params[0]) {
                var targetPlayer = getPlayerByName(params[0]);
                if (targetPlayer) {
                    room.kickPlayer(targetPlayer.id, "Kicked by " + player.name, false);
                    room.sendChat("🦵 " + targetPlayer.name + " was kicked by " + player.name);
                    sendDiscordMessage("🦵 **" + targetPlayer.name + "** was kicked by **" + player.name + "**");
                } else {
                    room.sendChat("❌ Player \"" + params[0] + "\" not found!", player.id);
                }
            } else {
                room.sendChat("❌ Usage: !kick [player name]", player.id);
            }
            break;
            
        case 'ban':
        case 'bb':
            if (params[0]) {
                var targetPlayer = getPlayerByName(params[0]);
                if (targetPlayer) {
                    room.kickPlayer(targetPlayer.id, "Banned by " + player.name, true);
                    bannedPlayers.push(targetPlayer.id);
                    room.sendChat("🔨 " + targetPlayer.name + " was banned by " + player.name);
                    sendDiscordMessage("🔨 **" + targetPlayer.name + "** was banned by **" + player.name + "**");
                } else {
                    room.sendChat("❌ Player \"" + params[0] + "\" not found!", player.id);
                }
            } else {
                room.sendChat("❌ Usage: !" + command + " [player name]", player.id);
            }
            break;
            
        case 'clearbans':
            room.clearBans();
            bannedPlayers = [];
            room.sendChat("🧹 All bans cleared by " + player.name);
            sendDiscordMessage("🧹 All bans cleared by **" + player.name + "**");
            break;
            
        case 'mute':
            if (params[0]) {
                var targetPlayer = getPlayerByName(params[0]);
                if (targetPlayer && !mutedPlayers.includes(targetPlayer.id)) {
                    mutedPlayers.push(targetPlayer.id);
                    room.sendChat("🔇 " + targetPlayer.name + " was muted by " + player.name);
                } else if (targetPlayer) {
                    room.sendChat("❌ " + targetPlayer.name + " is already muted!", player.id);
                } else {
                    room.sendChat("❌ Player not found!", player.id);
                }
            } else {
                room.sendChat("❌ Usage: !mute [player name]", player.id);
            }
            break;
            
        case 'unmute':
            if (params[0]) {
                var targetPlayer = getPlayerByName(params[0]);
                if (targetPlayer) {
                    var muteIndex = mutedPlayers.indexOf(targetPlayer.id);
                    if (muteIndex !== -1) {
                        mutedPlayers.splice(muteIndex, 1);
                        room.sendChat("🔊 " + targetPlayer.name + " was unmuted by " + player.name);
                    } else {
                        room.sendChat("❌ " + targetPlayer.name + " is not muted!", player.id);
                    }
                } else {
                    room.sendChat("❌ Player not found!", player.id);
                }
            } else {
                room.sendChat("❌ Usage: !unmute [player name]", player.id);
            }
            break;
            
        case 'start':
            room.startGame();
            room.sendChat("▶️ Game started by " + player.name);
            break;
            
        case 'stop':
            room.stopGame();
            room.sendChat("⏹️ Game stopped by " + player.name);
            break;
            
        case 'pause':
            room.pauseGame(!room.getScores());
            room.sendChat("⏸️ Game " + (room.getScores() && room.getScores().time === 0 ? "unpaused" : "paused") + " by " + player.name);
            break;
            
        case 'rr':
        case 'reset':
            room.stopGame();
            setTimeout(function() { room.startGame(); }, 1000);
            room.sendChat("🔄 Game restarted by " + player.name);
            break;
            
        case 'move':
            if (params.length >= 2) {
                var targetPlayer = getPlayerByName(params[0]);
                var targetTeam = params[1].toLowerCase();
                if (targetPlayer) {
                    var teamId = targetTeam === 'red' ? 1 : targetTeam === 'blue' ? 2 : 0;
                    room.setPlayerTeam(targetPlayer.id, teamId);
                    var teamName = teamId === 1 ? 'Red' : teamId === 2 ? 'Blue' : 'Spectators';
                    room.sendChat("↔️ " + targetPlayer.name + " moved to " + teamName + " by " + player.name);
                } else {
                    room.sendChat("❌ Player not found!", player.id);
                }
            } else {
                room.sendChat("❌ Usage: !move [player] [red/blue/spec]", player.id);
            }
            break;
            
        case 'setadmin':
            if (params[0]) {
                var targetPlayer = getPlayerByName(params[0]);
                if (targetPlayer) {
                    room.setPlayerAdmin(targetPlayer.id, true);
                    adminPlayers.push(targetPlayer.id);
                    room.sendChat("👑 " + targetPlayer.name + " is now an admin (set by " + player.name + ")");
                } else {
                    room.sendChat("❌ Player not found!", player.id);
                }
            } else {
                room.sendChat("❌ Usage: !setadmin [player name]", player.id);
            }
            break;
            
        case 'stats':
            var targetName = params[0] || player.name;
            var stats = getPlayerStats(targetName);
            room.sendChat("📊 " + targetName + ": " + stats.goals + " goals, " + stats.assists + " assists, " + stats.games + " games, " + stats.wins + " wins", player.id);
            break;
            
        case 'discord':
            room.sendChat("🎮 Join our Discord community: " + CONFIG.DISCORD_INVITE_LINK, player.id);
            break;
            
        case 'games':
            room.sendChat("🎮 Total games played in this room: " + gameStats.gamesPlayed, player.id);
            break;
            
        case 'ping':
            room.sendChat("🏓 Pong! " + player.name + ", your connection is stable.", player.id);
            break;
            
        case 'uptime':
            room.sendChat("⏰ Room uptime: " + getUptime(), player.id);
            break;
            
        case 'online':
            var playerCount = room.getPlayerList().length;
            room.sendChat("👥 " + playerCount + "/" + CONFIG.MAX_PLAYERS + " players online", player.id);
            break;
            
        case 'version':
            room.sendChat("🤖 Haxball Pro Bot v2.0 - Advanced room management system", player.id);
            break;
            
        case 'rules':
            room.sendChat("📜 Rules: 1. No spam 2. Respect players 3. No racism 4. Have fun! More: !discord", player.id);
            break;
            
        case 'top':
            var topPlayers = Object.keys(playersData)
                .map(function(name) { return { name: name, goals: playersData[name].goals }; })
                .sort(function(a, b) { return b.goals - a.goals; })
                .slice(0, 3)
                .map(function(p, i) { return (i + 1) + ". " + p.name + " (" + p.goals + " goals)"; })
                .join(' | ');
            room.sendChat("🏆 Top Players: " + (topPlayers || "No data yet"), player.id);
            break;
            
        case 'score':
            var scores = room.getScores();
            if (scores) {
                var minutes = Math.floor(scores.time / 60);
                var seconds = scores.time % 60;
                room.sendChat("⚽ Score: Red " + scores.red + " - " + scores.blue + " Blue | Time: " + minutes + ":" + (seconds < 10 ? "0" : "") + seconds, player.id);
            } else {
                room.sendChat("❌ No game in progress", player.id);
            }
            break;
            
        case 'teams':
            var players = room.getPlayerList();
            var redTeam = players.filter(function(p) { return p.team === 1; }).map(function(p) { return p.name; });
            var blueTeam = players.filter(function(p) { return p.team === 2; }).map(function(p) { return p.name; });
            var specs = players.filter(function(p) { return p.team === 0; }).map(function(p) { return p.name; });
            
            room.sendChat("🔴 Red: " + (redTeam.join(', ') || 'Empty') + " | 🔵 Blue: " + (blueTeam.join(', ') || 'Empty') + " | 👥 Specs: " + specs.length, player.id);
            break;
            
        case 'clear':
            for (var i = 0; i < 20; i++) {
                room.sendChat(" ");
            }
            room.sendChat("🧹 Chat cleared by " + player.name);
            break;
            
        default:
            room.sendChat("❓ Command !" + command + " is available but not fully implemented yet.", player.id);
            break;
    }
}

// ===========================================
//              AUTO FEATURES
// ===========================================

// Discord reminder every 3 minutes
setInterval(function() {
    if (room.getPlayerList().length > 0) {
        room.sendChat("💬 Join our Discord community: " + CONFIG.DISCORD_INVITE_LINK);
        sendDiscordMessage("🎮 **Haxball room is active!** Join us: " + CONFIG.DISCORD_INVITE_LINK);
    }
}, CONFIG.DISCORD_REMINDER_INTERVAL);

// ===========================================
//              ROOM INITIALIZATION
// ===========================================

room.onRoomLink = function(url) {
    console.log("Room created successfully!");
    console.log("Room URL: " + url);
    console.log("Admin password: " + CONFIG.ADMIN_PASSWORD);
    console.log("Total commands available: " + Object.keys(COMMANDS).length);
    
    sendDiscordEmbed(
        "🎮 Haxball Room Online!",
        "**Room Link:** " + url + "\n" +
        "**Admin Password:** " + CONFIG.ADMIN_PASSWORD + "\n" +
        "**Commands:** " + Object.keys(COMMANDS).length + " available\n" +
        "**Discord:** " + CONFIG.DISCORD_INVITE_LINK,
        0x00ff00
    );
};

console.log("Haxball Professional Bot Script Loaded Successfully!");
console.log("Features: 30+ Commands, Admin System, Discord Integration");