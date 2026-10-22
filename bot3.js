const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');

const CHANNEL_ID = "1543140705206276158";
const MIN_RANDOM_NUM = 1;
const MAX_RANDOM_NUM = 10000;

async function getTokens() {
    let tokens = [];
    if (process.env.DISCORD_TOKEN) {
        tokens = process.env.DISCORD_TOKEN.split(',').map(t => t.trim()).filter(t => t.length > 0);
    } else if (fs.existsSync('tokens.txt')) {
        tokens = fs.readFileSync('tokens.txt', 'utf-8').split('\n').map(t => t.trim()).filter(t => t.length > 0);
    }
    return tokens;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

async function startBot(token, index) {
    const client = new Client({ checkUpdate: false });

    client.on('ready', async () => {
        console.log(`[Acc ${index + 1}] Đã đăng nhập: ${client.user.tag}`);
        
        try {
            const channel = await client.channels.fetch(CHANNEL_ID);
            if (!channel) {
                console.error(`[Acc ${index + 1}] Không tìm thấy kênh với ID: ${CHANNEL_ID}`);
                return;
            }
            console.log(`[Acc ${index + 1}] Bắt đầu spam số ngẫu nhiên vào kênh: ${channel.name}`);

            while (true) {
                const numToSend = getRandomInt(MIN_RANDOM_NUM, MAX_RANDOM_NUM);
                
                try {
                    await channel.send(String(numToSend));
                    console.log(`[Acc ${index + 1}] Đã gửi số ngẫu nhiên: ${numToSend}`);
                } catch (err) {
                    if (err.status === 429 || (err.message && err.message.includes('rate limit'))) {
                        const retryAfter = err.retryAfter ? err.retryAfter * 1000 : 5000;
                        console.warn(`[Acc ${index + 1}] Bị Rate Limit! Chờ ${(retryAfter / 1000).toFixed(1)}s...`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter));
                        continue;
                    } else if (err.status === 401) {
                        console.error(`[Acc ${index + 1}] Token không hợp lệ hoặc đã bị vô hiệu hóa!`);
                        break;
                    } else {
                        console.error(`[Acc ${index + 1}] Lỗi khi gửi tin nhắn:`, err.message);
                    }
                }

                // Tăng thời gian delay ngẫu nhiên an toàn hơn (15 đến 30 giây)
                const delay = getRandomFloat(15, 30);
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }

        } catch (err) {
            console.error(`[Acc ${index + 1}] Lỗi kết nối kênh:`, err.message);
        }
    });

    client.on('shardDisconnect', () => {
        console.warn(`[Acc ${index + 1}] Mất kết nối! Đang thử kết nối lại...`);
    });

    client.login(token).catch(() => {
        console.error(`[Acc ${index + 1}] Token không hợp lệ hoặc lỗi đăng nhập!`);
    });
}

(async () => {
    const tokens = await getTokens();
    if (tokens.length === 0) {
        console.error("Không tìm thấy token!");
        process.exit(1);
    }
    tokens.forEach((token, index) => {
        startBot(token, index);
    });
})();