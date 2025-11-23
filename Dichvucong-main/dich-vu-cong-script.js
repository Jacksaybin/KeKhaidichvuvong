// Hiển thị thông báo
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Xử lý hiển thị/ẩn trường "Dịch vụ khác"
document.addEventListener('DOMContentLoaded', function() {
    const serviceTypeSelect = document.getElementById('serviceType');
    const otherServiceGroup = document.getElementById('otherServiceGroup');
    const otherServiceInput = document.getElementById('otherService');
    
    if (serviceTypeSelect && otherServiceGroup) {
        serviceTypeSelect.addEventListener('change', function() {
            if (this.value === 'khac') {
                otherServiceGroup.style.display = 'block';
                if (otherServiceInput) {
                    otherServiceInput.setAttribute('required', 'required');
                }
            } else {
                otherServiceGroup.style.display = 'none';
                if (otherServiceInput) {
                    otherServiceInput.removeAttribute('required');
                    otherServiceInput.value = '';
                }
            }
        });
    }
    
    // Xử lý submit form
    const form = document.getElementById('dichVuCongForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Lấy dữ liệu form
            const formData = new FormData(form);
            const data = {
                fullName: formData.get('fullName'),
                idNumber: formData.get('idNumber'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                address: formData.get('address'),
                serviceType: formData.get('serviceType'),
                otherService: formData.get('otherService'),
                purpose: formData.get('purpose'),
                notes: formData.get('notes'),
                agreeTerms: formData.get('agreeTerms'),
                createdAt: new Date().toISOString()
            };
            
            // Kiểm tra checkbox đồng ý
            if (!data.agreeTerms) {
                showNotification('Vui lòng đồng ý với điều khoản sử dụng!', 'error');
                return;
            }
            
            // Lưu vào localStorage
            const registrations = JSON.parse(localStorage.getItem('dichVuCongRegistrations') || '[]');
            const newRegistration = {
                id: Date.now().toString(),
                ...data
            };
            registrations.push(newRegistration);
            localStorage.setItem('dichVuCongRegistrations', JSON.stringify(registrations));
            
            // Gửi thông báo qua Telegram Bot API
            if (window.TelegramBot) {
                if (!window.TelegramBot.isTelegramConfigured()) {
                    if (window.TelegramBot.autoSetupTelegram) {
                        window.TelegramBot.autoSetupTelegram();
                    }
                }
                
                if (window.TelegramBot.notifyNewDichVuCong) {
                    window.TelegramBot.notifyNewDichVuCong(newRegistration)
                        .then(result => {
                            if (result && result.success) {
                                console.log('✅ Đã gửi thông báo Telegram thành công');
                            }
                        })
                        .catch(err => console.error('❌ Lỗi Telegram:', err));
                } else {
                    // Fallback: sử dụng hàm thông báo chung
                    const message = `🔔 <b>ĐĂNG KÝ DỊCH VỤ CÔNG TRỰC TUYẾN</b>\n` +
                        `👤 <b>Họ tên:</b> ${data.fullName}\n` +
                        `📱 <b>SĐT:</b> ${data.phone}\n` +
                        `🆔 <b>CCCD:</b> ${data.idNumber}\n` +
                        `📧 <b>Email:</b> ${data.email}\n` +
                        `🏢 <b>Loại dịch vụ:</b> ${data.serviceType}\n` +
                        `📝 <b>Mục đích:</b> ${data.purpose}\n` +
                        `${data.notes ? `📌 <b>Ghi chú:</b> ${data.notes}` : ''}\n` +
                        `⏳ <i>Đăng ký lúc: ${new Date().toLocaleString('vi-VN')}</i>`;
                    
                    if (window.TelegramBot.sendTelegramMessage) {
                        window.TelegramBot.sendTelegramMessage(message)
                            .then(result => {
                                if (result && result.success) {
                                    console.log('✅ Đã gửi thông báo Telegram thành công');
                                }
                            })
                            .catch(err => console.error('❌ Lỗi Telegram:', err));
                    }
                }
            }
            
            // Hiển thị thông báo thành công
            let notificationMessage = 'Đăng ký dịch vụ công trực tuyến thành công!';
            
            if (window.TelegramBot && window.TelegramBot.isTelegramConfigured()) {
                const testMode = window.TelegramBot.isTestMode();
                if (testMode) {
                    notificationMessage += ' (Thông báo Telegram: Chế độ Test)';
                } else {
                    notificationMessage += ' (Đã gửi thông báo qua Telegram)';
                }
            }
            
            showNotification(notificationMessage, 'success');
            
            // Reset form sau 2 giây
            setTimeout(() => {
                form.reset();
                if (otherServiceGroup) {
                    otherServiceGroup.style.display = 'none';
                }
                // Cuộn lên đầu trang
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 2000);
        });
    }
});

