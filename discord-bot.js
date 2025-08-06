/* Discord Bot for Haxball Room Integration
 * Connects to Discord and sends notifications from Haxball room
 * Run this separately with Node.js alongside your Haxball script
 */

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// Configuration - Your provided tokens
const CONFIG = {
    DISCORD_BOT_TOKEN: "MTM5ODY3NDk3NTg1ODA5ODE4OA.G0UDP2.2ighPwGEGPsjE5LiEBAei2HhThiLILQfpkJbX4",
    DISCORD_CHANNEL_ID: "1402628332335534204",
    DISCORD_INVITE_LINK: "https://discord.gg/6eBcNfD4Fn",
    
    // Auto-promotion interval (3 minutes)
    PROMOTION_INTERVAL: 180000
};

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

let targetChannel = null;

// Bot ready event
client.once('ready', () => {
    console.log(`✅ Discord bot logged in as ${client.user.tag}!`);
    
    // Get the target channel
    targetChannel = client.channels.cache.get(CONFIG.DISCORD_CHANNEL_ID);
    if (targetChannel) {
        console.log(`📡 Connected to channel: ${targetChannel.name}`);
        
        // Send startup message
        sendMessage("🟢 **Haxball Discord Bot is now online!**");
        sendEmbed("🎮 Bot Status", "Discord integration activated for Haxball room monitoring", 0x00ff00);
    } else {
        console.error(`❌ Could not find channel with ID: ${CONFIG.DISCORD_CHANNEL_ID}`);
    }
});

// Functions for sending messages
function sendMessage(content) {
    if (targetChannel) {
        targetChannel.send(content).catch(err => {
            console.error('Error sending message:', err);
        });
    }
}

function sendEmbed(title, description, color = 0x3498db, fields = []) {
    if (targetChannel) {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();
        
        if (fields.length > 0) {
            embed.addFields(fields);
        }
        
        targetChannel.send({ embeds: [embed] }).catch(err => {
            console.error('Error sending embed:', err);
        });
    }
}

// Listen for messages in Discord (optional - for two-way communication)
client.on('messageCreate', message => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Only listen in the target channel
    if (message.channel.id !== CONFIG.DISCORD_CHANNEL_ID) return;
    
    // Log the message (you can extend this to send to Haxball room)
    console.log(`Discord message from ${message.author.username}: ${message.content}`);
});

// Auto-promotion every 3 minutes
setInterval(() => {
    if (targetChannel) {
        const promotionMessages = [
            `🎮 **Join our Haxball room!** | 🎯 Skilled players welcome | 💬 ${CONFIG.DISCORD_INVITE_LINK}`,
            `⚽ **Active Haxball room available!** | 🏆 Competitive gameplay | 🔗 ${CONFIG.DISCORD_INVITE_LINK}`,
            `🔥 **Haxball room is live!** | 👥 Join the action | 📲 ${CONFIG.DISCORD_INVITE_LINK}`,
            `🎪 **Fun Haxball matches ongoing!** | 🎊 Everyone welcome | 🎮 ${CONFIG.DISCORD_INVITE_LINK}`
        ];
        
        const randomMessage = promotionMessages[Math.floor(Math.random() * promotionMessages.length)];
        sendMessage(randomMessage);
    }
}, CONFIG.PROMOTION_INTERVAL);

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

// Login to Discord
client.login(CONFIG.DISCORD_BOT_TOKEN).catch(err => {
    console.error('Failed to login to Discord:', err);
});

// Export functions for external use (if needed)
module.exports = {
    sendMessage,
    sendEmbed,
    client
};

console.log("🤖 Discord bot starting...");
console.log("📡 Target channel ID:", CONFIG.DISCORD_CHANNEL_ID);
console.log("🔄 Auto-promotion every 3 minutes");