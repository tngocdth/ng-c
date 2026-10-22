const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const cron = require('node-cron');

const CHANNEL_ID = "1532928117096579113";
const MIN_RANDOM_NUM = 1;
const MAX_RANDOM_NUM = 10000;
const MAX_MESSAGES = 1000; // Giới hạn 1000 tin nhắn mỗi acc

// Mảng lưu trữ các client đang chạy để có thể dọn dẹp khi cần
let activeClients = [];

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
    activeClients.push(client);

    client.on('ready', async () => {
        console.log(`[Acc ${index + 1}] Đã đăng nhập: ${client.user.tag}`);
        
        try {
            const channel = await client.channels.fetch(CHANNEL_ID);
            if (!channel) {
                console.error(`[Acc ${index + 1}] Không tìm thấy kênh với ID: ${CHANNEL_ID}`);
                return;
            }
            console.log(`[Acc ${index + 1}] Bắt đầu spam số ngẫu nhiên vào kênh: ${channel.name}`);

            let sentCount = 0;

            while (sentCount < MAX_MESSAGES) {
                // Nếu client đã bị hủy, dừng vòng lặp ngay lập tức
                if (!client.isReady()) break;

                const numToSend = getRandomInt(MIN_RANDOM_NUM, MAX_RANDOM_NUM);
                
                try {
                    await channel.send(String(numToSend));
                    sentCount++;
                    console.log(`[Acc ${index + 1}] Đã gửi số ngẫu nhiên: ${numToSend} (${sentCount}/${MAX_MESSAGES})`);
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

                // Khi đạt đủ 1000 tin nhắn
                if (sentCount >= MAX_MESSAGES) {
                    console.log(`[Acc ${index + 1}] Đã hoàn thành gửi đủ ${MAX_MESSAGES} tin nhắn. Dừng hoạt động tài khoản này!`);
                    await client.destroy(); // Đăng xuất và giải phóng tài nguyên của acc này
                    break;
                }

                // Thời gian delay ngẫu nhiên từ 15 đến 30 giây
                const delay = getRandomFloat(15, 30);
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }

        } catch (err) {
            console.error(`[Acc ${index + 1}] Lỗi kết nối kênh:`, err.message);
        }
    });

    client.on('shardDisconnect', () => {
        console.warn(`[Acc ${index + 1}] Mất kết nối!`);
    });

    client.login(token).catch(() => {
        console.error(`[Acc ${index + 1}] Token không hợp lệ hoặc lỗi đăng nhập!`);
    });
}

async function runAllBots() {
    console.log('[System] Đang khởi động tiến trình gửi tin nhắn...');
    const tokens = await getTokens();
    if (tokens.length === 0) {
        console.error("Không tìm thấy token nào!");
        return;
    }
    tokens.forEach((token, index) => {
        startBot(token, index);
    });
}

// Lên lịch chạy vào lúc 1:10 sáng giờ Việt Nam (18:10 UTC) mỗi ngày
cron.schedule('10 18 * * *', async () => {
    console.log('[System] Đến lịch 1:10 sáng giờ Việt Nam, làm mới và khởi động lại toàn bộ bot...');
    
    // Hủy các client cũ (nếu còn sót lại)
    for (let client of activeClients) {
        try {
            await client.destroy();
        } catch (e) {}
    }
    activeClients = [];

    // Chạy lại từ đầu cho ngày mới
    runAllBots();
});

// Chạy lần đầu tiên ngay khi khởi động script
runAllBots();
