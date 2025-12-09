const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const config = require('./configuration.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const DB_FILE = 'count.json';
let currentCount = 0;

function loadCount() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, JSON.stringify({ count: 0 }));
            return 0;
        }
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data).count || 0;
    } catch {
        return 0;
    }
}

function saveCount(newCount) {
    fs.writeFile(DB_FILE, JSON.stringify({ count: newCount }), (err) => {
        if (err) console.error(err);
    });
}

client.once('ready', () => {
    currentCount = loadCount();
    console.log(`Bot is Online: ${client.user.tag}`);
    console.log(`Current Count: ${currentCount}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.channel.id !== config.CountChannel) return;

    const userNumber = parseInt(message.content);

    if (isNaN(userNumber)) {
        setTimeout(() => message.delete().catch(() => {}), 1000);
        return;
    }

    const nextNumber = currentCount + 1;

    if (userNumber === nextNumber) {
        currentCount++;
        saveCount(currentCount);
        await message.react(config.CorrectEmojiID).catch(() => {});
    } else {
        await message.react(config.IncorrectEmojiID).catch(() => {});
        
        const reply = await message.reply({ 
            content: `${config.IncorrectMessage} **${nextNumber}**`, 
            allowedMentions: { repliedUser: false } 
        }).catch(() => {});

        setTimeout(async () => {
            if (reply) await reply.delete().catch(() => {});
            await message.delete().catch(() => {});
        }, 1000);
    }
});

client.login(config.BotToken);