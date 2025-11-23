// Telegram Bot API Integration
// File này được tạo để tránh lỗi 404 khi load script
// Có thể tích hợp code Telegram Bot vào đây sau

// Kiểm tra xem TelegramBot đã được định nghĩa chưa
if (typeof window.TelegramBot === 'undefined') {
    window.TelegramBot = {
        // Placeholder object để tránh lỗi
        isTelegramConfigured: function() {
            return false;
        },
        isTestMode: function() {
            return false;
        },
        autoSetupTelegram: function() {
            console.log('Telegram Bot chưa được cấu hình. Vui lòng cấu hình Telegram Bot API.');
        },
        sendTelegramMessage: function(message) {
            return Promise.resolve({ success: false, error: 'Telegram Bot chưa được cấu hình' });
        }
    };
}

console.log('✅ Telegram Bot API placeholder đã được load');


