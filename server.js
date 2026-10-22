const http = require('http');
const { spawn } = require('child_process');

// 1. Tạo Server HTTP nhỏ để Render giữ ứng dụng luôn sống (Online)
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bot Server đang chạy 24/7!');
});

server.listen(PORT, () => {
    console.log(`[+] HTTP Server đã khởi chạy thành công trên cổng ${PORT}`);
});

// 2. Chỉ chạy tự động bot2.js và bot3.js
const scripts = [
    'bot2.js',
    'bot3.js'
];

console.log('>>> Bắt đầu kích hoạt bot2 và bot3 ngầm...\n');

scripts.forEach((file) => {
    const child = spawn('node', [file], { stdio: 'inherit', shell: true });

    child.on('error', (err) => {
        console.error(`[Lỗi] Không thể chạy file ${file}:`, err.message);
    });

    child.on('exit', (code) => {
        console.warn(`[Cảnh báo] File ${file} đã dừng hoạt động (Code: ${code}). Đang thử chạy lại...`);
        setTimeout(() => {
            spawn('node', [file], { stdio: 'inherit', shell: true });
        }, 5000);
    });
});
