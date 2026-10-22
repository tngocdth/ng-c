const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');

const VOICE_CHANNEL_ID = "1543140705206276158";
const TOKEN_FILE = 'tokens.txt';

async function getTokens() {
    let tokens = [];
    if (process.env.DISCORD_TOKEN) {
        tokens = process.env.DISCORD_TOKEN.split(',').map(t => t.trim()).filter(t => t.length > 0);
    } else if (fs.existsSync(TOKEN_FILE)) {
        tokens = fs.readFileSync(TOKEN_FILE, 'utf-8').split('\n').map(t => t.trim()).filter(t => t.length > 0 && !t.startsWith('#'));
    }
    return tokens;
}

async function startBot(token, index) {
    const client = new Client({ checkUpdate: false });

    async function joinVoice() {
        try {
            const channel = await client.channels.fetch(VOICE_CHANNEL_ID);
            client.ws.broadcast({
                op: 4,
                d: {
                    guild_id: channel.guild.id,
                    channel_id: VOICE_CHANNEL_ID,
                    self_mute: true,
                    self_deaf: true,
                }
            });
            console.log(`[Acc ${index + 1}] -> Treo thành công vào: ${channel.name}`);
        } catch (err) {
            console.error(`[Acc ${index + 1}] Lỗi kết nối voice:`, err.message);
        }
    }

    client.on('ready', () => {
        console.log(`[Acc ${index + 1}] Đã đăng nhập: ${client.user.tag}`);
        joinVoice();
        setInterval(joinVoice, 15 * 60 * 1000);
    });

    client.on('shardDisconnect', () => {
        console.warn(`[Acc ${index + 1}] Mất kết nối! Đang thử vào lại sau 5s...`);
        setTimeout(joinVoice, 5000);
    });

    client.login(token).catch(() => {
        console.error(`[Acc ${index + 1}] Token không hợp lệ hoặc lỗi kết nối!`);
    });
}

(async () => {
    const tokens = await getTokens();
    if (tokens.length === 0) {
        console.error("Không tìm thấy token nào để chạy!");
        process.exit(1);
    }

    console.log(`\n>>> Bắt đầu chạy ${tokens.length} tài khoản...\n`);
    tokens.forEach((token, index) => {
        startBot(token, index);
    });
})();