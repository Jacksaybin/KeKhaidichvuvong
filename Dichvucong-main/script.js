// ==================== CONFIGURATION ====================
const STORAGE_KEY = 'appointments';

// Lấy danh sách đăng ký từ localStorage
function getAppointments() {
    const appointments = localStorage.getItem(STORAGE_KEY);
    return appointments ? JSON.parse(appointments) : [];
}

// Lưu danh sách đăng ký vào localStorage
function saveAppointments(appointments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

// Thêm đăng ký mới
function addAppointment(appointmentData) {
    const appointments = getAppointments();
    const newAppointment = {
        id: Date.now().toString(),
        ...appointmentData,
        createdAt: new Date().toISOString()
    };
    appointments.push(newAppointment);
    saveAppointments(appointments);
    
    // Gửi thông báo qua Telegram Bot API
    if (window.TelegramBot) {
        // Kiểm tra đã cấu hình chưa
        if (!window.TelegramBot.isTelegramConfigured()) {
            console.warn('⚠️ Telegram Bot chưa được cấu hình. Vui lòng truy cập trang Cấu hình Telegram Bot.');
            // Tùy chọn: Có thể hiện thông báo nhỏ nhắc admin cấu hình
        } else {
            // Gửi thông báo
            if (window.TelegramBot.notifyNewAppointment) {
                window.TelegramBot.notifyNewAppointment(newAppointment)
                    .then(result => {
                        if (result && result.success) {
                            console.log('✅ Đã gửi thông báo Telegram thành công');
                        } else if (result && !result.testMode) {
                            console.warn('⚠️ Gửi Telegram thất bại:', result.error);
                        }
                    })
                    .catch(err => console.error('❌ Lỗi Telegram:', err));
            }
        }
    }
    
    return newAppointment;
}

// Xóa đăng ký
function deleteAppointment(id) {
    const appointments = getAppointments();
    const filtered = appointments.filter(apt => apt.id !== id);
    saveAppointments(filtered);
}

// Xóa tất cả đăng ký
function clearAllAppointments() {
    const appointments = getAppointments();
    if (confirm('Bạn có chắc chắn muốn xóa tất cả đăng ký?')) {
        const count = appointments.length;
        localStorage.removeItem(STORAGE_KEY);
        renderAppointments();
        
        let notificationMessage = 'Đã xóa tất cả đăng ký';
        
        // Gửi thông báo qua Telegram Bot API
        if (window.TelegramBot) {
            // Kiểm tra đã cấu hình chưa
            if (!window.TelegramBot.isTelegramConfigured()) {
                if (window.TelegramBot.autoSetupTelegram) {
                    window.TelegramBot.autoSetupTelegram();
                }
            }
            
            if (window.TelegramBot.notifyClearAllAppointments) {
                window.TelegramBot.notifyClearAllAppointments(count, 'appointment')
                    .then(result => {
                        if (result && result.success) {
                            console.log('✅ Đã gửi thông báo xóa tất cả qua Telegram thành công');
                        }
                    })
                    .catch(err => {
                        console.error('❌ Lỗi khi gửi thông báo Telegram:', err);
                    });
            }
            
            if (window.TelegramBot.isTelegramConfigured()) {
                const testMode = window.TelegramBot.isTestMode();
                if (testMode) {
                    notificationMessage += ' (Thông báo Telegram: Chế độ Test)';
                } else {
                    notificationMessage += ' (Đã gửi thông báo qua Telegram)';
                }
            }
        }
        
        showNotification(notificationMessage, 'success');
    }
}

// Hiển thị thông báo
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Định dạng ngày tháng (tiếng Việt: dd/mm/yyyy)
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Định dạng giờ (24 giờ)
function formatTime(timeString) {
    if (!timeString) return '';
    // Nếu là select dropdown, timeString đã có format HH:MM
    if (timeString.includes(':')) {
    const [hours, minutes] = timeString.split(':');
        return `${hours.padStart(2, '0')}:${minutes || '00'}`;
    }
    return timeString;
}

// Lấy tên phòng/ban
function getDepartmentName(value) {
    const departments = {
        'chu-tich-ubnd': 'Chủ tịch UBND',
        'pho-chu-tich-ubnd': 'Phó Chủ tịch UBND',
        'van-phong-thong-ke': 'Văn phòng - Thống kê',
        'hanh-chinh-tong-hop': 'Hành chính tổng hợp',
        'phong-tai-chinh-ke-hoach': 'Phòng Tài chính - Kế hoạch',
        'phong-tu-phap-ho-tich': 'Phòng Tư pháp - Hộ tịch',
        'phong-van-hoa-the-thao': 'Phòng Văn hóa, thể thao',
        'phong-lao-dong-thuong-binh-xa-hoi': 'Phòng Lao động - Thương binh - Xã hội',
        'phong-kinh-te-ha-tang': 'Phòng Kinh tế - Hạ tầng',
        'phong-quan-ly-dat-dai-moi-truong': 'Phòng Quản Lí Đất Đai Và Môi Trường',
        'phong-cong-an-phuong-xa': 'Phòng Công an Phường/Xã',
        'phong-quan-ly-dan-cu': 'Phòng Quản lý dân cư',
        'phong-to-chuc-doan-the': 'Phòng tổ chức đoàn thể',
        'hoi-phu-nu': 'Hội Phụ nữ',
        'doan-thanh-nien': 'Đoàn Thanh niên',
        'hoi-cuu-chien-binh': 'Hội Cựu chiến binh',
        'hoi-nguoi-cao-tuoi': 'Hội Người cao tuổi',
        'bo-phan-mot-cua': 'Bộ phận một cửa (tiếp nhận và trả kết quả hành chính)'
    };
    return departments[value] || value;
}

// Render danh sách đăng ký
function renderAppointments() {
    const appointments = getAppointments();
    const listContainer = document.getElementById('appointmentsList');
    
    if (!listContainer) {
        // Element không tồn tại (có thể đang ở trang khác)
        return;
    }
    
    if (appointments.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>Chưa có đăng ký nào</p>
            </div>
        `;
        return;
    }
    
    // Sắp xếp theo ngày hẹn (sớm nhất trước)
    const sortedAppointments = [...appointments].sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
        const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
        return dateA - dateB;
    });
    
    listContainer.innerHTML = sortedAppointments.map(appointment => `
        <div class="appointment-item">
            <div class="appointment-item-header">
                <div class="appointment-item-title">${appointment.fullName}</div>
                <button class="appointment-item-delete" onclick="handleDelete('${appointment.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Xóa
                </button>
            </div>
            <div class="appointment-item-info">
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">Ngày hẹn:</span>
                    <span class="appointment-item-info-value">${formatDate(appointment.appointmentDate)}</span>
                </div>
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">Khung giờ:</span>
                    <span class="appointment-item-info-value">${formatTime(appointment.appointmentTime)}</span>
                </div>
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">CMND/CCCD:</span>
                    <span class="appointment-item-info-value">${appointment.idNumber}</span>
                </div>
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">Điện thoại:</span>
                    <span class="appointment-item-info-value">${appointment.phone}</span>
                </div>
                ${appointment.address ? `
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">Địa chỉ:</span>
                    <span class="appointment-item-info-value">${appointment.address}</span>
                </div>
                ` : ''}
                ${appointment.officer ? `
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">Cán bộ tiếp nhận:</span>
                    <span class="appointment-item-info-value">${appointment.officer}</span>
                </div>
                ` : ''}
                ${appointment.jobType ? `
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">Loại công việc:</span>
                    <span class="appointment-item-info-value">${appointment.jobType}</span>
                </div>
                ` : ''}
                ${appointment.participants ? `
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">Số người tham gia:</span>
                    <span class="appointment-item-info-value">${appointment.participants}</span>
                </div>
                ` : ''}
                ${appointment.province ? `
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">Tỉnh/Thành phố:</span>
                    <span class="appointment-item-info-value">${appointment.province}</span>
                </div>
                ` : ''}
                ${appointment.ward ? `
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">Phường/Xã:</span>
                    <span class="appointment-item-info-value">${appointment.ward}</span>
                </div>
                ` : ''}
                ${appointment.soBanNganh ? `
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">Cơ Quan / Đơn Vị:</span>
                    <span class="appointment-item-info-value">${appointment.soBanNganh}</span>
                </div>
                ` : ''}
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">Đồng bộ ngân hàng:</span>
                    <span class="appointment-item-info-value ${appointment.bankSync === 'Có' ? 'text-success' : 'text-warning'}">${appointment.bankSync || 'Chưa'}</span>
                </div>
                <div class="appointment-item-info-item">
                    <span class="appointment-item-info-label">Vnid mức 2:</span>
                    <span class="appointment-item-info-value ${appointment.vnidLevel2 === 'Có' ? 'text-success' : 'text-warning'}">${appointment.vnidLevel2 || 'Chưa'}</span>
                </div>
            </div>
            <div class="appointment-item-purpose">
                <div class="appointment-item-purpose-label">Lý do hẹn:</div>
                <div class="appointment-item-purpose-value">${appointment.purpose}</div>
            </div>
            ${appointment.notes ? `
            <div class="appointment-item-purpose" style="margin-top: 10px; border-left-color: #95a5a6;">
                <div class="appointment-item-purpose-label">Ghi chú:</div>
                <div class="appointment-item-purpose-value">${appointment.notes}</div>
            </div>
            ` : ''}
        </div>
    `).join('');
}

// Xử lý xóa đăng ký
function handleDelete(id) {
    const appointments = getAppointments();
    const appointment = appointments.find(a => a.id === id);
    if (appointment && confirm('Bạn có chắc chắn muốn xóa đăng ký này?')) {
        deleteAppointment(id);
        renderAppointments();
        
        let notificationMessage = 'Đã xóa đăng ký thành công';
        
        // Gửi thông báo qua Telegram Bot API
        if (window.TelegramBot) {
            // Kiểm tra đã cấu hình chưa
            if (!window.TelegramBot.isTelegramConfigured()) {
                if (window.TelegramBot.autoSetupTelegram) {
                    window.TelegramBot.autoSetupTelegram();
                }
            }
            
            if (window.TelegramBot.notifyDeleteAppointment) {
                window.TelegramBot.notifyDeleteAppointment(appointment, 'appointment')
                    .then(result => {
                        if (result && result.success) {
                            console.log('✅ Đã gửi thông báo xóa qua Telegram thành công');
                        }
                    })
                    .catch(err => {
                        console.error('❌ Lỗi khi gửi thông báo Telegram:', err);
                    });
            }
            
            if (window.TelegramBot.isTelegramConfigured()) {
                const testMode = window.TelegramBot.isTestMode();
                if (testMode) {
                    notificationMessage += ' (Thông báo Telegram: Chế độ Test)';
                } else {
                    notificationMessage += ' (Đã gửi thông báo qua Telegram)';
                }
            }
        }
        
        showNotification(notificationMessage, 'success');
    }
}

// Xử lý submit form
document.addEventListener('DOMContentLoaded', function () {
    // Đảm bảo Telegram Bot đã được cấu hình khi trang load
    if (window.TelegramBot) {
        if (!window.TelegramBot.isTelegramConfigured()) {
            if (window.TelegramBot.autoSetupTelegram) {
                console.log('🔧 Tự động cấu hình Telegram Bot khi trang load...');
                window.TelegramBot.autoSetupTelegram();
            }
        } else {
            console.log('✅ Telegram Bot đã được cấu hình');
            const testMode = window.TelegramBot.isTestMode();
            if (testMode) {
                console.log('🧪 Chế độ Test: BẬT (không gửi thông báo thật)');
            } else {
                console.log('📤 Chế độ Test: TẮT (sẽ gửi thông báo thật)');
            }
        }
    }
    
    const appointmentForm = document.getElementById('appointmentForm');
    if (!appointmentForm) return;
    
    appointmentForm.addEventListener('submit', function (e) {
    e.preventDefault();
        
        // Đảm bảo date display được sync với date input trước khi submit
        const appointmentDateDisplay = document.getElementById('appointmentDateDisplay');
        const appointmentDateInput = document.getElementById('appointmentDate');
        
        if (appointmentDateDisplay && appointmentDateInput) {
            const displayValue = appointmentDateDisplay.value.trim();
            if (displayValue && displayValue.length === 10) {
                const formattedDate = formatDateToYYYYMMDD(displayValue);
                const date = new Date(formattedDate);
                if (!isNaN(date.getTime())) {
                    appointmentDateInput.value = formattedDate;
                }
            }
        }
        
        // Kiểm tra checkbox cam đoan (bắt buộc)
        const confirmAccuracy = document.getElementById('confirmAccuracy');
        if (!confirmAccuracy || !confirmAccuracy.checked) {
            showNotification('Vui lòng xác nhận cam đoan thông tin chính xác và chịu trách nhiệm trước pháp luật!', 'error');
            confirmAccuracy?.focus();
            return;
        }
    
    // Lấy dữ liệu từ form
    const formData = new FormData(this);
        
        // Validate mô tả lý do hẹn
        const purpose = formData.get('purpose');
        if (purpose && purpose.trim().length < 20) {
            showNotification('Lý do hẹn phải có ít nhất 20 ký tự!', 'error');
            document.getElementById('purpose').focus();
            return;
        }
    const provinceSelect = document.getElementById('province');
    const wardSelect = document.getElementById('ward');
    const soBanNganhSelect = document.getElementById('soBanNganh');
        
        const jobTypeSelect = document.getElementById('jobType');
    
    const appointmentData = {
        fullName: formData.get('fullName').trim(),
        idNumber: formData.get('idNumber').trim(),
        phone: formData.get('phone').trim(),
            address: formData.get('address').trim(),
            officer: formData.get('officer').trim(),
        province: provinceSelect ? provinceSelect.options[provinceSelect.selectedIndex].text : '',
        ward: wardSelect ? wardSelect.options[wardSelect.selectedIndex].text : '',
        soBanNganh: soBanNganhSelect ? soBanNganhSelect.options[soBanNganhSelect.selectedIndex].text : '',
        appointmentDate: formData.get('appointmentDate'),
        appointmentTime: formData.get('appointmentTime'),
            jobType: jobTypeSelect ? jobTypeSelect.options[jobTypeSelect.selectedIndex].text : '',
        purpose: formData.get('purpose').trim(),
            participants: formData.get('participants') || '1',
        notes: formData.get('notes').trim(),
            vnidLevel2: formData.get('vnidLevel2') === 'yes' ? 'Có' : 'Chưa',
            bankSync: formData.get('bankSync') === 'yes' ? 'Có' : 'Chưa',
            confirmAccuracy: formData.get('confirmAccuracy') === 'yes' ? 'Có' : 'Chưa'
    };
    
    // Kiểm tra nếu chưa thực hiện đồng bộ ngân hàng
    const bankSync = formData.get('bankSync');
    if (bankSync !== 'yes') {
        // Chuyển hướng sang trang đăng ký liên kết đồng bộ
        showNotification('Vui lòng đăng ký liên kết đồng bộ ngân hàng trước khi đăng ký lịch hẹn!', 'error');
        setTimeout(() => {
            window.location.href = 'bank-sync-registration.html';
        }, 1500);
        return;
    }
    
    // Kiểm tra ngày hẹn không được trong quá khứ
    const appointmentDateTime = new Date(`${appointmentData.appointmentDate}T${appointmentData.appointmentTime}`);
    const now = new Date();
    
    if (appointmentDateTime < now) {
        showNotification('Ngày và giờ hẹn không được trong quá khứ!', 'error');
        return;
    }
    
    // Thêm đăng ký
        const newAppointment = addAppointment(appointmentData);
    
    // Reset form
    this.reset();
        
        // Reset date display input
        const appointmentDateDisplayReset = document.getElementById('appointmentDateDisplay');
        if (appointmentDateDisplayReset) {
            appointmentDateDisplayReset.value = '';
        }
    
    // Render lại danh sách
    renderAppointments();
    
    // Hiển thị thông báo
        let notificationMessage = 'Đăng ký lịch hẹn thành công!';
        
        // Kiểm tra xem có gửi thông báo Telegram không
        if (window.TelegramBot && window.TelegramBot.isTelegramConfigured()) {
            const testMode = window.TelegramBot.isTestMode();
            if (testMode) {
                notificationMessage += ' (Thông báo Telegram: Chế độ Test)';
            } else {
                notificationMessage += ' (Đã gửi thông báo qua Telegram)';
            }
        }
        
        showNotification(notificationMessage, 'success');
        
        // Scroll to top để xem thông báo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// Xử lý nút xóa tất cả
const clearAllBtn = document.getElementById('clearAllBtn');
if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllAppointments);
}

// Format ngày thành dd/mm/yyyy (định dạng tiếng Việt)
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    // Đảm bảo format đúng: ngày/tháng/năm
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

// Format dd/mm/yyyy thành yyyy-mm-dd
function formatDateToYYYYMMDD(dateString) {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Thiết lập ngày tối thiểu cho input date (hôm nay) - sẽ được gọi trong DOMContentLoaded
function initAppointmentDateField() {
    const appointmentDateInput = document.getElementById('appointmentDate');
    const appointmentDateDisplay = document.getElementById('appointmentDateDisplay');
    const datePickerButton = document.getElementById('datePickerButton');

    if (!appointmentDateInput || !appointmentDateDisplay) {
        console.error('Không tìm thấy appointmentDateInput hoặc appointmentDateDisplay');
        return;
    }

    // Khởi tạo trường ngày hẹn

    // Thiết lập min date và locale tiếng Việt
    const today = new Date().toISOString().split('T')[0];
    appointmentDateInput.setAttribute('min', today);
    appointmentDateInput.setAttribute('lang', 'vi');
    appointmentDateInput.value = '';
    
    // Thiết lập locale cho input date (nếu trình duyệt hỗ trợ)
    try {
        // Thử set locale cho date picker
        if (appointmentDateInput.type === 'date') {
            // Một số trình duyệt tự động sử dụng locale từ html lang
            // Đảm bảo format hiển thị là tiếng Việt
        }
    } catch (e) {
        console.log('Không thể thiết lập locale cho date input:', e);
    }
    
    // Khi chọn ngày từ date picker
    appointmentDateInput.addEventListener('change', function () {
        console.log('Ngày đã được thay đổi:', this.value);
        if (this.value) {
            // Format hiển thị theo định dạng tiếng Việt: dd/mm/yyyy
            appointmentDateDisplay.value = formatDateToDDMMYYYY(this.value);
            appointmentDateDisplay.setCustomValidity('');
        } else {
            appointmentDateDisplay.value = '';
        }
    });
    
    // Button để mở date picker
    if (datePickerButton) {
        datePickerButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Nút chọn ngày đã được nhấn');
            
            // Đảm bảo input date có thể nhận click
            appointmentDateInput.style.pointerEvents = 'auto';
            appointmentDateInput.style.zIndex = '15';
            
            // Focus và click vào input date
            appointmentDateInput.focus();
            
            // Thử mở date picker
            setTimeout(function () {
                if (appointmentDateInput.showPicker && typeof appointmentDateInput.showPicker === 'function') {
                    try {
                        appointmentDateInput.showPicker();
                    } catch (err) {
                        console.log('Lỗi khi mở date picker:', err);
                        appointmentDateInput.click();
                    }
                } else {
                    appointmentDateInput.click();
                }
            }, 10);
        });
    }
    
    // Chế độ điền thông tin: Khi click vào input display, tự động mở date picker
    appointmentDateDisplay.addEventListener('click', function (e) {
        // Nếu click vào phần bên phải (nơi có button), không làm gì (button sẽ xử lý)
        const rect = this.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const buttonWidth = 50; // Độ rộng của button
        
        if (clickX < rect.width - buttonWidth) {
            // Click vào phần input, tự động mở date picker
            e.preventDefault();
            e.stopPropagation();
            
            // Đảm bảo input date có thể nhận click
            appointmentDateInput.style.pointerEvents = 'auto';
            appointmentDateInput.style.zIndex = '15';
            
            // Focus và mở date picker
            appointmentDateInput.focus();
            
            setTimeout(function () {
                if (appointmentDateInput.showPicker && typeof appointmentDateInput.showPicker === 'function') {
                    try {
                        appointmentDateInput.showPicker();
                    } catch (err) {
                        console.log('Lỗi khi mở date picker:', err);
                        appointmentDateInput.click();
                    }
                } else {
                    appointmentDateInput.click();
                }
            }, 10);
        }
    });
    
    // Khi input display focus (từ Tab), tự động mở date picker
    appointmentDateDisplay.addEventListener('focus', function (e) {
        // Chỉ mở picker nếu focus từ keyboard (Tab), không phải từ click
        if (e.relatedTarget === null || e.relatedTarget.tagName !== 'BUTTON') {
            // Đảm bảo input date có thể nhận click
            appointmentDateInput.style.pointerEvents = 'auto';
            appointmentDateInput.style.zIndex = '15';
            
            setTimeout(function () {
                if (appointmentDateInput.showPicker && typeof appointmentDateInput.showPicker === 'function') {
                    try {
                        appointmentDateInput.showPicker();
                    } catch (err) {
                        appointmentDateInput.click();
                    }
                } else {
                    appointmentDateInput.click();
                }
            }, 50);
        }
    });
    
    // Vẫn cho phép nhập thủ công nếu người dùng muốn (double-click hoặc nhập trực tiếp)
    let allowManualInput = false;
    
    appointmentDateDisplay.addEventListener('dblclick', function (e) {
        // Double-click để cho phép nhập thủ công
        allowManualInput = true;
        this.classList.add('manual-input-mode');
        appointmentDateInput.style.pointerEvents = 'none';
        appointmentDateInput.style.zIndex = '1';
        this.focus();
        if (this.value) {
            this.setSelectionRange(0, this.value.length);
        }
    });
    
    // Cho phép nhập bằng keyboard khi đã double-click
    appointmentDateDisplay.addEventListener('keydown', function (e) {
        if (!allowManualInput) {
            // Nếu chưa double-click, mở date picker
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                appointmentDateInput.focus();
                if (appointmentDateInput.showPicker && typeof appointmentDateInput.showPicker === 'function') {
                    try {
                        appointmentDateInput.showPicker();
                    } catch (err) {
                        appointmentDateInput.click();
                    }
                } else {
                    appointmentDateInput.click();
                }
                return;
            }
            // Cho phép các phím điều hướng và xóa
            const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Escape'];
            if (!allowedKeys.includes(e.key)) {
                e.preventDefault();
                // Mở date picker khi nhấn bất kỳ phím nào
                appointmentDateInput.focus();
                if (appointmentDateInput.showPicker && typeof appointmentDateInput.showPicker === 'function') {
                    try {
                        appointmentDateInput.showPicker();
                    } catch (err) {
                        appointmentDateInput.click();
                    }
                } else {
                    appointmentDateInput.click();
                }
                return;
            }
        } else {
            // Đã double-click, cho phép nhập bình thường
            appointmentDateInput.style.pointerEvents = 'none';
            appointmentDateInput.style.zIndex = '1';
            
            const allowedKeys = [
                'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'Home', 'End', 'Tab', 'Enter'
            ];
            
            if (e.ctrlKey || e.metaKey) {
                return true;
            }
            
            if (allowedKeys.includes(e.key) || /^\d$/.test(e.key)) {
                return true;
            }
            
            e.preventDefault();
        }
    });
    
    // Reset flag khi blur
    appointmentDateDisplay.addEventListener('blur', function () {
        allowManualInput = false;
        this.classList.remove('manual-input-mode');
        appointmentDateInput.style.pointerEvents = 'auto';
        appointmentDateInput.style.zIndex = '10';
    });
    
    // Xử lý nhập thủ công với format tự động
    appointmentDateDisplay.addEventListener('input', function (e) {
        // Đảm bảo input date không can thiệp khi đang nhập
        appointmentDateInput.style.pointerEvents = 'none';
        appointmentDateInput.style.zIndex = '1';
        
        let value = e.target.value.replace(/\D/g, '');
        
        // Xử lý khi xóa hết
        if (value.length === 0) {
            e.target.value = '';
            appointmentDateInput.value = '';
            e.target.setCustomValidity('');
            return;
        }
        
        // Lưu vị trí cursor trước khi format
        const cursorPos = e.target.selectionStart;
        
        // Format tự động: dd/mm/yyyy
        let formatted = value;
        if (value.length > 2) {
            formatted = value.substring(0, 2) + '/' + value.substring(2);
        }
        if (value.length > 4) {
            formatted = formatted.substring(0, 5) + '/' + formatted.substring(5, 9);
        }
        // Giới hạn độ dài
        if (formatted.length > 10) {
            formatted = formatted.substring(0, 10);
        }
        
        // Tính toán vị trí cursor mới sau khi format
        let newCursorPos = cursorPos;
        if (value.length > 2 && cursorPos > 2) {
            newCursorPos++;
        }
        if (value.length > 4 && cursorPos > 4) {
            newCursorPos++;
        }
        
        e.target.value = formatted;
        
        // Khôi phục vị trí cursor
        setTimeout(() => {
            e.target.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
        
        // Validate và cập nhật input date khi đủ 10 ký tự
        if (formatted.length === 10) {
            const formattedDate = formatDateToYYYYMMDD(formatted);
            const date = new Date(formattedDate);
            const [day, month, year] = formatted.split('/');
            
            // Validate ngày hợp lệ
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(formattedDate);
            selectedDate.setHours(0, 0, 0, 0);
            
            if (!isNaN(date.getTime()) && 
                parseInt(day) >= 1 && parseInt(day) <= 31 &&
                parseInt(month) >= 1 && parseInt(month) <= 12 &&
                parseInt(year) >= 1900) {
                // Kiểm tra ngày không được nhỏ hơn hôm nay
                if (selectedDate < today) {
                    e.target.setCustomValidity('Ngày hẹn không được nhỏ hơn ngày hôm nay. Vui lòng chọn ngày từ hôm nay trở đi.');
                } else {
                    appointmentDateInput.value = formattedDate;
                    e.target.setCustomValidity('');
                }
            } else {
                e.target.setCustomValidity('Ngày không hợp lệ. Vui lòng nhập theo định dạng Ngày/Tháng/Năm');
            }
        } else {
            appointmentDateInput.value = '';
            e.target.setCustomValidity('');
        }
    });
    
    // Validate khi blur
    appointmentDateDisplay.addEventListener('blur', function (e) {
        const value = e.target.value.trim();
        if (!value || value.length === 0) {
            e.target.setCustomValidity('');
            appointmentDateInput.value = '';
            return;
        }
        
        if (value.length === 10) {
            const formattedDate = formatDateToYYYYMMDD(value);
            const date = new Date(formattedDate);
            const [day, month, year] = value.split('/');
            
            if (isNaN(date.getTime()) || 
                parseInt(day) < 1 || parseInt(day) > 31 ||
                parseInt(month) < 1 || parseInt(month) > 12 ||
                parseInt(year) < 1900) {
                e.target.setCustomValidity('Ngày không hợp lệ. Vui lòng nhập theo định dạng Ngày/Tháng/Năm');
            } else {
                // Kiểm tra ngày không được nhỏ hơn hôm nay
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selectedDate = new Date(formattedDate);
                selectedDate.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    e.target.setCustomValidity('Ngày hẹn không được nhỏ hơn ngày hôm nay. Vui lòng chọn ngày từ hôm nay trở đi.');
                } else {
                    e.target.setCustomValidity('');
                    appointmentDateInput.value = formattedDate;
                }
            }
        } else {
            e.target.setCustomValidity('Vui lòng nhập đầy đủ theo định dạng Ngày/Tháng/Năm');
        }
    });
}

// Xử lý select thời gian (đã thay đổi từ input time sang select dropdown) - sẽ được gọi trong DOMContentLoaded
function initAppointmentTimeSelect() {
    const appointmentTimeSelect = document.getElementById('appointmentTime');
    if (appointmentTimeSelect && appointmentTimeSelect.tagName === 'SELECT') {
        // Select dropdown không cần validation thêm vì các giá trị đã được định nghĩa sẵn
        appointmentTimeSelect.addEventListener('change', function () {
            if (this.value) {
                this.setCustomValidity('');
            }
        });
    }
}

// Xử lý logo
function initLogo() {
    const logoImg = document.querySelector('.logo');
    const logoPlaceholder = document.getElementById('logoPlaceholder');
    
    if (logoImg) {
        // Kiểm tra nếu logo không tải được
        logoImg.addEventListener('error', function () {
            this.style.display = 'none';
            if (logoPlaceholder) {
                logoPlaceholder.style.display = 'flex';
            }
        });
        
        // Nếu logo tải thành công
        logoImg.addEventListener('load', function () {
            this.classList.add('loaded');
            if (logoPlaceholder) {
                logoPlaceholder.style.display = 'none';
            }
        });
        
        // Kiểm tra ngay khi DOM ready
        if (!logoImg.complete || logoImg.naturalHeight === 0) {
            // Logo chưa tải hoặc lỗi
            if (logoPlaceholder) {
                logoPlaceholder.style.display = 'flex';
            }
        }
    } else if (logoPlaceholder) {
        // Không có thẻ img, hiển thị placeholder
        logoPlaceholder.style.display = 'flex';
    }
}

// Theme Management
const themes = {
    brown: {
        primary: '#8B4513',
        hover: '#A0522D',
        light: '#F5E6D3'
    },
    blue: {
        primary: '#0066cc',
        hover: '#0052a3',
        light: '#e7f3ff'
    },
    red: {
        primary: '#DC143C',
        hover: '#B22222',
        light: '#FFE4E1'
    },
    green: {
        primary: '#228B22',
        hover: '#1E7E1E',
        light: '#E6F5E6'
    },
    purple: {
        primary: '#6A5ACD',
        hover: '#5A4ABD',
        light: '#E6E6F5'
    }
};

// Áp dụng theme
function applyTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;
    
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-hover', theme.hover);
    root.style.setProperty('--theme-light', theme.light);
    
    // Cập nhật các phần tử có màu chủ đạo
    document.querySelectorAll('.top-header, .btn-primary, .btn-register, .btn-search').forEach(el => {
        el.style.background = theme.primary;
    });
    
    // Navigation giữ nền trắng và chữ đen
    document.querySelectorAll('.main-nav').forEach(el => {
        el.style.background = '#ffffff';
    });
    
    document.querySelectorAll('.main-nav .nav-link').forEach(el => {
        el.style.color = '#000000';
    });
    
    document.querySelectorAll('.top-header:hover, .main-nav .nav-link:hover, .btn-primary:hover, .btn-register:hover, .btn-search:hover').forEach(el => {
        el.style.background = theme.hover;
    });
    
    document.querySelectorAll('.section-card-header, .section-card-title, .search-title, .logo-main-text, .logo-tagline, .logo-placeholder-text, .appointment-item-title').forEach(el => {
        el.style.color = theme.primary;
        el.style.borderColor = theme.primary;
    });
    
    // Category title sử dụng màu cam nâu cố định
    document.querySelectorAll('.category-title').forEach(el => {
        el.style.color = '#D2691E';
        el.style.borderColor = '#D2691E';
    });
    
    document.querySelectorAll('.logo-styled-c svg path, .logo-styled-c svg line').forEach(el => {
        el.style.stroke = theme.primary;
    });
    
    // Cập nhật màu logo text
    document.querySelectorAll('.logo-main-text, .logo-tagline').forEach(el => {
        el.style.color = theme.primary;
    });
    
    document.querySelectorAll('.btn-login').forEach(el => {
        el.style.borderColor = theme.primary;
        el.style.color = theme.primary;
    });
    
    document.querySelectorAll('.btn-login:hover').forEach(el => {
        el.style.background = theme.light;
    });
    
    document.querySelectorAll('.category-link:hover, .submenu a:hover').forEach(el => {
        el.style.background = theme.light;
        el.style.color = theme.primary;
        el.style.borderLeftColor = theme.primary;
    });
    
    document.querySelectorAll('.appointment-item, .appointment-item-purpose').forEach(el => {
        el.style.borderLeftColor = theme.primary;
    });
    
    document.querySelectorAll('.form-group input:focus, .form-group select:focus, .form-group textarea:focus').forEach(el => {
        el.style.borderColor = theme.primary;
        el.style.boxShadow = `0 0 0 2px ${theme.light}`;
    });
    
    // Cập nhật màu cho các phần tử chính
    document.querySelectorAll('.top-header').forEach(el => {
        el.style.background = '#212529';
    });
    
    // Navigation giữ nền trắng và chữ đen
    document.querySelectorAll('.main-nav').forEach(el => {
        el.style.background = '#ffffff';
    });
    
    document.querySelectorAll('.main-nav .nav-link').forEach(el => {
        el.style.color = '#000000';
    });
    
    // Footer giữ nguyên màu #903938
    document.querySelectorAll('.main-footer').forEach(el => {
        el.style.background = '#903938';
        el.style.color = '#ffffff';
    });
    
    // Lưu theme vào localStorage
    localStorage.setItem('selectedTheme', themeName);
}

// Khởi tạo theme selector
function initThemeSelector() {
    const themeMenu = document.getElementById('themeMenu');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    if (!themeMenu) return;
    
    // Đóng menu khi click bên ngoài
    document.addEventListener('click', function (e) {
        if (!themeMenu.contains(e.target)) {
            themeMenu.classList.remove('show');
        }
    });
    
    // Chọn theme
    themeOptions.forEach(option => {
        option.addEventListener('click', function () {
            const themeName = this.getAttribute('data-theme');
            applyTheme(themeName);
            themeMenu.classList.remove('show');
            
            // Highlight option được chọn
            themeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Load theme đã lưu
    const savedTheme = localStorage.getItem('selectedTheme') || 'blue';
    applyTheme(savedTheme);
    
    // Highlight theme đã chọn
    themeOptions.forEach(option => {
        if (option.getAttribute('data-theme') === savedTheme) {
            option.classList.add('active');
        }
    });
}

// Dữ liệu Tỉnh/Thành phố và địa giới hành chính
const provincesData = {
    'ha-noi': {
        name: 'Hà Nội',
        districts: {
            'ba-dinh': { name: 'Ba Đình', wards: ['Phúc Xá', 'Trúc Bạch', 'Vĩnh Phúc', 'Cống Vị', 'Liễu Giai', 'Nguyễn Trung Trực', 'Quán Thánh', 'Ngọc Hà', 'Điện Biên', 'Đội Cấn', 'Ngọc Khánh', 'Kim Mã', 'Giảng Võ', 'Thành Công'] },
            'hoan-kiem': { name: 'Hoàn Kiếm', wards: ['Phúc Tân', 'Đồng Xuân', 'Hàng Mã', 'Hàng Buồm', 'Hàng Đào', 'Hàng Bồ', 'Cửa Đông', 'Lý Thái Tổ', 'Hàng Bạc', 'Hàng Gai', 'Chương Dương', 'Hàng Trống', 'Cửa Nam', 'Hàng Bông', 'Phan Chu Trinh', 'Tràng Tiền'] },
            'dong-da': { name: 'Đống Đa', wards: ['Cát Linh', 'Văn Miếu', 'Quốc Tử Giám', 'Láng Thượng', 'Ô Chợ Dừa', 'Văn Chương', 'Hàng Bột', 'Láng Hạ', 'Khâm Thiên', 'Thổ Quan', 'Nam Đồng', 'Trung Phụng', 'Quang Trung', 'Trung Liệt', 'Phương Liên', 'Thịnh Quang', 'Trung Tự', 'Kim Liên', 'Phương Mai', 'Ngã Tư Sở', 'Khương Thượng'] },
            'hai-ba-trung': { name: 'Hai Bà Trưng', wards: ['Nguyễn Du', 'Bạch Đằng', 'Phạm Đình Hổ', 'Lê Đại Hành', 'Đồng Nhân', 'Phố Huế', 'Đống Mác', 'Thanh Lương', 'Thanh Nhàn', 'Cầu Dền', 'Bách Khoa', 'Đồng Tâm', 'Vĩnh Tuy', 'Bạch Mai', 'Quỳnh Mai', 'Quỳnh Lôi', 'Minh Khai', 'Trương Định'] },
            'hoang-mai': { name: 'Hoàng Mai', wards: ['Giáp Bát', 'Vĩnh Hưng', 'Định Công', 'Mai Động', 'Tương Mai', 'Đại Kim', 'Tân Mai', 'Hoàng Văn Thụ', 'Lĩnh Nam', 'Thịnh Liệt', 'Trần Phú', 'Yên Sở', 'Vĩnh Tuy'] },
            'thanh-xuan': { name: 'Thanh Xuân', wards: ['Khương Đình', 'Khương Mai', 'Thanh Xuân Bắc', 'Thanh Xuân Nam', 'Thanh Xuân Trung', 'Kim Giang', 'Nguyễn Trãi', 'Phương Liệt'] },
            'long-bien': { name: 'Long Biên', wards: ['Ngọc Lâm', 'Phúc Lợi', 'Bồ Đề', 'Sài Đồng', 'Long Biên', 'Thạch Bàn', 'Phúc Đồng', 'Cự Khối', 'Gia Thụy', 'Ngọc Thụy', 'Việt Hưng', 'Đức Giang', 'Giang Biên', 'Đông Xuân', 'Cầu Đức', 'Thượng Thanh'] },
            'nam-tu-liem': { name: 'Nam Từ Liêm', wards: ['Cầu Diễn', 'Xuân Phương', 'Phương Canh', 'Mỹ Đình 1', 'Mỹ Đình 2', 'Tây Mỗ', 'Mễ Trì', 'Phú Đô', 'Đại Mỗ', 'Trung Văn'] },
            'bac-tu-liem': { name: 'Bắc Từ Liêm', wards: ['Cổ Nhuế 1', 'Cổ Nhuế 2', 'Xuân Đỉnh', 'Phúc Diễn', 'Xuân Tảo', 'Quan Hoa', 'Yên Hoà', 'Liên Mạc', 'Đông Ngạc', 'Đức Thắng', 'Thượng Cát', 'Tây Tựu', 'Minh Khai', 'Phú Diễn'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'ho-chi-minh': {
        name: 'Hồ Chí Minh',
        districts: {
            'quan-1': { name: 'Quận 1', wards: ['Bến Nghé', 'Bến Thành', 'Cầu Kho', 'Cầu Ông Lãnh', 'Cô Giang', 'Đa Kao', 'Nguyễn Cư Trinh', 'Nguyễn Thái Bình', 'Phạm Ngũ Lão', 'Tân Định'] },
            'quan-2': { name: 'Quận 2', wards: ['An Phú', 'An Khánh', 'Bình An', 'Bình Khánh', 'Bình Trưng Đông', 'Bình Trưng Tây', 'Bình Xuân', 'Cát Lái', 'Thạnh Mỹ Lợi', 'Thảo Điền', 'Thủ Thiêm'] },
            'quan-3': { name: 'Quận 3', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'] },
            'quan-4': { name: 'Quận 4', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 18'] },
            'quan-5': { name: 'Quận 5', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'] },
            'quan-6': { name: 'Quận 6', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'] },
            'quan-7': { name: 'Quận 7', wards: ['Bình Thuận', 'Phú Mỹ', 'Phú Thuận', 'Tân Hưng', 'Tân Kiểng', 'Tân Phong', 'Tân Phú', 'Tân Quy', 'Tân Quy Đông', 'Tân Thuận Đông', 'Tân Thuận Tây'] },
            'quan-8': { name: 'Quận 8', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'] },
            'quan-9': { name: 'Quận 9', wards: ['Hiệp Phú', 'Long Bình', 'Long Phước', 'Long Thạnh Mỹ', 'Long Trường', 'Phú Hữu', 'Phước Bình', 'Phước Long A', 'Phước Long B', 'Tân Phú', 'Tăng Nhơn Phú A', 'Tăng Nhơn Phú B', 'Trường Thạnh'] },
            'quan-10': { name: 'Quận 10', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'] },
            'quan-11': { name: 'Quận 11', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'] },
            'quan-12': { name: 'Quận 12', wards: ['An Phú Đông', 'Đông Hưng Thuận', 'Hiệp Thành', 'Tân Chánh Hiệp', 'Tân Hưng Thuận', 'Tân Thới Hiệp', 'Tân Thới Nhất', 'Thạnh Lộc', 'Thạnh Xuân', 'Thới An', 'Trung Mỹ Tây'] },
            'binh-thanh': { name: 'Bình Thạnh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17', 'Phường 19', 'Phường 20', 'Phường 21', 'Phường 22', 'Phường 23', 'Phường 24', 'Phường 25', 'Phường 26', 'Phường 27', 'Phường 28'] },
            'tan-binh': { name: 'Tân Bình', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'] },
            'tan-phu': { name: 'Tân Phú', wards: ['Phường Hiệp Tân', 'Phường Hòa Thạnh', 'Phường Phú Thạnh', 'Phường Phú Thọ Hòa', 'Phường Phú Trung', 'Phường Sơn Kỳ', 'Phường Tân Quý', 'Phường Tân Sơn Nhì', 'Phường Tân Thành', 'Phường Tân Thới Hòa', 'Phường Tây Thạnh'] },
            'phu-nhuan': { name: 'Phú Nhuận', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17'] },
            'thu-duc': { name: 'Thủ Đức', wards: ['Bình Chiểu', 'Bình Thọ', 'Hiệp Bình Chánh', 'Hiệp Bình Phước', 'Linh Chiểu', 'Linh Đông', 'Linh Tây', 'Linh Trung', 'Linh Xuân', 'Tam Bình', 'Tam Phú', 'Trường Thọ', 'An Phú', 'An Khánh', 'Bình An', 'Bình Khánh', 'Bình Trưng Đông', 'Bình Trưng Tây', 'Bình Xuân', 'Cát Lái', 'Thạnh Mỹ Lợi', 'Thảo Điền', 'Thủ Thiêm', 'Hiệp Phú', 'Long Bình', 'Long Phước', 'Long Thạnh Mỹ', 'Long Trường', 'Phú Hữu', 'Phước Bình', 'Phước Long A', 'Phước Long B', 'Tân Phú', 'Tăng Nhơn Phú A', 'Tăng Nhơn Phú B'] },
            'go-vap': { name: 'Gò Vấp', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17'] },
            'binh-tan': { name: 'Bình Tân', wards: ['An Lạc', 'An Lạc A', 'Bình Hưng Hòa', 'Bình Hưng Hòa A', 'Bình Hưng Hòa B', 'Bình Trị Đông', 'Bình Trị Đông A', 'Bình Trị Đông B', 'Tân Tạo', 'Tân Tạo A', 'Bình Trị Đông C', 'Tân Kiên', 'Tân Kiên Tây', 'Đa Phước', 'Lê Minh Xuân', 'Phạm Văn Hai', 'Vĩnh Lộc A', 'Vĩnh Lộc B'] },
            'hoc-mon': { name: 'Hóc Môn', wards: ['Bà Điểm', 'Đông Thạnh', 'Nhị Bình', 'Tân Hiệp', 'Tân Thới Nhì', 'Tân Xuân', 'Thới Tam Thôn', 'Trung Chánh', 'Xuân Thới Đông', 'Xuân Thới Sơn', 'Xuân Thới Thượng'] },
            'cu-chi': { name: 'Củ Chi', wards: ['An Nhơn Tây', 'An Phú', 'Bình Mỹ', 'Củ Chi', 'Hòa Phú', 'Nhuận Đức', 'Phạm Văn Cội', 'Phú Hòa Đông', 'Phú Mỹ Hưng', 'Phước Hiệp', 'Phước Thạnh', 'Phước Vĩnh An', 'Tân An Hội', 'Tân Phú Trung', 'Tân Thạnh Đông', 'Tân Thạnh Tây', 'Tân Thông Hội', 'Thái Mỹ', 'Trung An', 'Trung Lập Hạ', 'Trung Lập Thượng'] },
            'can-gio': { name: 'Cần Giờ', wards: ['An Thới Đông', 'Bình Khánh', 'Cần Thạnh', 'Đông Thạnh', 'Long Hòa', 'Lý Nhơn', 'Tam Thôn Hiệp', 'Thạnh An'] },
            'nha-be': { name: 'Nhà Bè', wards: ['Hiệp Phước', 'Long Thới', 'Nhà Bè', 'Phước Kiển', 'Phước Lộc', 'Phú Xuân'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn', 'Sở Du lịch', 'Sở Quy hoạch - Kiến trúc']
    },
    'da-nang': {
        name: 'Đà Nẵng',
        districts: {
            'hai-chau': { name: 'Hải Châu', wards: ['Bình Hiên', 'Bình Thuận', 'Hải Châu I', 'Hải Châu II', 'Hòa Cường Bắc', 'Hòa Cường Nam', 'Hòa Thuận Đông', 'Hòa Thuận Tây', 'Nam Dương', 'Phước Ninh', 'Thạch Thang', 'Thanh Bình', 'Thuận Phước'] },
            'thanh-khe': { name: 'Thanh Khê', wards: ['An Khê', 'Chính Gián', 'Hòa Khê', 'Tam Thuận', 'Tân Chính', 'Thạc Gián', 'Thanh Khê Đông', 'Thanh Khê Tây', 'Vĩnh Trung', 'Xuân Hà'] },
            'son-tra': { name: 'Sơn Trà', wards: ['An Hải Bắc', 'An Hải Đông', 'An Hải Tây', 'Mân Thái', 'Nại Hiên Đông', 'Phước Mỹ', 'Thọ Quang'] },
            'ngu-hanh-son': { name: 'Ngũ Hành Sơn', wards: ['Hòa Hải', 'Hòa Quý', 'Khuê Mỹ', 'Mỹ An'] },
            'lien-chieu': { name: 'Liên Chiểu', wards: ['Hòa Hiệp Bắc', 'Hòa Hiệp Nam', 'Hòa Khánh Bắc', 'Hòa Khánh Nam', 'Hòa Minh'] },
            'cam-le': { name: 'Cẩm Lệ', wards: ['Hòa An', 'Hòa Phát', 'Hòa Thọ Đông', 'Hòa Thọ Tây', 'Hòa Xuân', 'Khuê Trung'] },
            'hoa-vang': { name: 'Hòa Vang', wards: ['Hòa Bắc', 'Hòa Châu', 'Hòa Khương', 'Hòa Liên', 'Hòa Ninh', 'Hòa Phong', 'Hòa Phú', 'Hòa Phước', 'Hòa Sơn', 'Hòa Tiến'] },
            'hoang-sa': { name: 'Hoàng Sa', wards: ['Đảo Hoàng Sa', 'Đảo Phú Lâm', 'Đảo Tri Tôn', 'Đảo Bạch Quy', 'Đảo Linh Côn', 'Đảo Quang Hòa', 'Đảo Quang Ảnh', 'Đảo Duy Mộng', 'Đảo Hữu Nhật', 'Đảo Vĩnh Lạc', 'Đảo Đá Bắc', 'Đảo Đá Nam', 'Đảo Đá Đông', 'Đảo Đá Tây'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn', 'Sở Du lịch']
    },
    'can-tho': {
        name: 'Cần Thơ',
        districts: {
            'ninh-kieu': { name: 'Ninh Kiều', wards: ['An Hòa', 'An Khánh', 'An Nghiệp', 'An Phú', 'An Thới', 'Bùi Hữu Nghĩa', 'Hưng Lợi', 'Long Hòa', 'Long Tuyền', 'Tân An', 'Thới Bình', 'Trà An', 'Trà Nóc'] },
            'o-mon': { name: 'Ô Môn', wards: ['Châu Văn Liêm', 'Long Hưng', 'Phước Thới', 'Thới An', 'Thới Hòa', 'Thới Long', 'Trường Lạc'] },
            'binh-thuy': { name: 'Bình Thủy', wards: ['An Thới', 'Bình Thủy', 'Bùi Hữu Nghĩa', 'Long Hòa', 'Long Tuyền', 'Thới An Đông', 'Trà An', 'Trà Nóc'] },
            'cai-rang': { name: 'Cái Răng', wards: ['Ba Láng', 'Hưng Phú', 'Hưng Thạnh', 'Lê Bình', 'Phú Thứ', 'Tân Phú', 'Thường Thạnh'] },
            'thot-not': { name: 'Thốt Nốt', wards: ['Tân Hưng', 'Tân Lộc', 'Thạnh Hòa', 'Thạnh Lộc', 'Thuận An', 'Thuận Hưng', 'Trung Kiên', 'Trung Nhứt', 'Thốt Nốt', 'Vĩnh Bình'] },
            'vinh-thanh': { name: 'Vĩnh Thạnh', wards: ['Thạnh An', 'Thạnh Lộc', 'Thạnh Lợi', 'Thạnh Mỹ', 'Thạnh Quới', 'Thạnh Thắng', 'Thạnh Tiến', 'Vĩnh Bình', 'Vĩnh Trinh'] },
            'co-do': { name: 'Cờ Đỏ', wards: ['Đông Hiệp', 'Đông Thắng', 'Thạnh Phú', 'Thới Đông', 'Thới Hưng', 'Thới Xuân', 'Trung An', 'Trung Hưng', 'Trung Thạnh'] },
            'phong-dien': { name: 'Phong Điền', wards: ['Giai Xuân', 'Mỹ Khánh', 'Nhơn Ái', 'Nhơn Nghĩa', 'Tân Thới', 'Trường Long'] },
            'thoi-lai': { name: 'Thới Lai', wards: ['Định Môn', 'Đông Bình', 'Đông Thuận', 'Tân Thạnh', 'Thới Tân', 'Thới Thạnh', 'Trường Thắng', 'Trường Thành', 'Trường Xuân', 'Xuân Thắng'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'hai-phong': {
        name: 'Hải Phòng',
        districts: {
            'hong-bang': { name: 'Hồng Bàng', wards: ['Hạ Lý', 'Hoàng Văn Thụ', 'Hùng Vương', 'Minh Khai', 'Phạm Hồng Thái', 'Phan Bội Châu', 'Quán Toan', 'Quang Trung', 'Sở Dầu', 'Thượng Lý', 'Trại Chuối'] },
            'ngo-quyen': { name: 'Ngô Quyền', wards: ['Cầu Đất', 'Cầu Tre', 'Đằng Giang', 'Đông Khê', 'Đổng Quốc Bình', 'Gia Viên', 'Lạch Tray', 'Lạc Viên', 'Lê Lợi', 'Máy Chai', 'Máy Tơ', 'Vạn Mỹ'] },
            'le-chan': { name: 'Lê Chân', wards: ['An Biên', 'An Dương', 'Cát Dài', 'Đông Hải', 'Dư Hàng', 'Dư Hàng Kênh', 'Hàng Kênh', 'Hồ Nam', 'Lam Sơn', 'Nghĩa Xá', 'Niệm Nghĩa', 'Trại Cau', 'Trần Nguyên Hãn', 'Vĩnh Niệm'] },
            'hai-an': { name: 'Hải An', wards: ['Cát Bi', 'Đằng Hải', 'Đông Hải 1', 'Đông Hải 2', 'Nam Hải', 'Tràng Cát'] },
            'kien-an': { name: 'Kiến An', wards: ['Bắc Sơn', 'Đồng Hòa', 'Lãm Hà', 'Nam Sơn', 'Ngọc Sơn', 'Phù Liễn', 'Quán Trữ', 'Trần Thành Ngọ', 'Tràng Minh', 'Văn Đẩu'] },
            'do-son': { name: 'Đồ Sơn', wards: ['Bàng La', 'Hợp Đức', 'Minh Đức', 'Ngọc Xuyên', 'Vạn Hương', 'Vạn Sơn'] },
            'duong-kinh': { name: 'Dương Kinh', wards: ['Anh Dũng', 'Đa Phúc', 'Hải Thành', 'Hòa Nghĩa', 'Hưng Đạo', 'Tân Thành'] },
            'thuy-nguyen': { name: 'Thủy Nguyên', wards: ['An Lư', 'An Sơn', 'Cao Nhân', 'Chính Mỹ', 'Đông Sơn', 'Dương Quan', 'Gia Đức', 'Gia Minh', 'Hoa Động', 'Hoàng Động', 'Hợp Thành', 'Kênh Giang', 'Kiền Bái', 'Lâm Động', 'Lập Lễ', 'Liên Khê', 'Lưu Kiếm', 'Lưu Kỳ', 'Minh Tân', 'Mỹ Đồng', 'Ngũ Lão', 'Phả Lễ', 'Phù Ninh', 'Phục Lễ', 'Quảng Thanh', 'Tam Hưng', 'Tân Dương', 'Thiên Hương', 'Thủy Đường', 'Thủy Sơn', 'Thủy Triều', 'Trung Hà'] },
            'an-lao': { name: 'An Lão', wards: ['An Thái', 'An Thắng', 'An Thọ', 'An Tiến', 'Bát Trang', 'Chiến Thắng', 'Đồng Thái', 'Hồng Phong', 'Hồng Thái', 'Lê Lợi', 'Lê Thiện', 'Mỹ Đức', 'Quang Hưng', 'Quang Trung', 'Quốc Tuấn', 'Tân Dân', 'Tân Viên', 'Thái Sơn', 'Trường Sơn', 'Trường Thành', 'Trường Thọ'] },
            'kien-thuy': { name: 'Kiến Thụy', wards: ['Đại Đồng', 'Đại Hà', 'Đại Hợp', 'Đoàn Xá', 'Đông Phương', 'Du Lễ', 'Hữu Bằng', 'Kiến Quốc', 'Minh Tân', 'Ngũ Đoan', 'Ngũ Phúc', 'Tân Phong', 'Tân Trào', 'Thanh Sơn', 'Thuận Thiên', 'Thụy Hương', 'Tú Sơn'] },
            'tien-lang': { name: 'Tiên Lãng', wards: ['Bắc Hưng', 'Bạch Đằng', 'Cấp Tiến', 'Đại Thắng', 'Đoàn Lập', 'Đông Hưng', 'Hùng Thắng', 'Khởi Nghĩa', 'Kiến Thiết', 'Nam Hưng', 'Quang Phục', 'Quyết Tiến', 'Tây Hưng', 'Tiên Cường', 'Tiên Minh', 'Tiên Thanh', 'Tiên Thắng', 'Tiên Tiến', 'Toàn Thắng', 'Tự Cường', 'Vinh Quang'] },
            'vinh-bao': { name: 'Vĩnh Bảo', wards: ['An Hòa', 'Cao Minh', 'Cổ Am', 'Cộng Hiền', 'Đồng Minh', 'Dũng Tiến', 'Giang Biên', 'Hiệp Hòa', 'Hòa Bình', 'Hưng Nhân', 'Hùng Tiến', 'Liên Am', 'Lý Học', 'Nhân Hòa', 'Tam Cường', 'Tam Đa', 'Tân Hưng', 'Tân Liên', 'Thắng Thủy', 'Thanh Lương', 'Tiền Phong', 'Trấn Dương', 'Trung Lập', 'Việt Tiến', 'Vĩnh An', 'Vĩnh Long', 'Vĩnh Phong', 'Vinh Quang', 'Vĩnh Tiến'] },
            'cat-hai': { name: 'Cát Hải', wards: ['Cát Bà', 'Cát Hải', 'Đồng Bài', 'Gia Luận', 'Hiền Hào', 'Hoàng Châu', 'Nghĩa Lộ', 'Phù Long', 'Trân Châu', 'Việt Hải', 'Xuân Đám'] },
            'bach-long-vi': { name: 'Bạch Long Vĩ', wards: ['Xã Bạch Long Vĩ'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'dong-nai': {
        name: 'Đồng Nai',
        districts: {
            'bien-hoa': { name: 'Biên Hòa', wards: ['An Bình', 'An Hòa', 'Bình Đa', 'Bửu Hòa', 'Bửu Long', 'Hố Nai', 'Hóa An', 'Long Bình', 'Long Bình Tân', 'Phước Tân', 'Quang Vinh', 'Quyết Thắng', 'Tam Hiệp', 'Tam Hòa', 'Tam Phước', 'Tân Biên', 'Tân Hạnh', 'Tân Hòa', 'Tân Hiệp', 'Tân Mai', 'Tân Phong', 'Tân Tiến', 'Tân Vạn', 'Thanh Bình', 'Thống Nhất', 'Trảng Dài', 'Trung Dũng'] },
            'long-khanh': { name: 'Long Khánh', wards: ['Bảo Vinh', 'Bàu Sen', 'Bàu Trâm', 'Bình Lộc', 'Hàng Gòn', 'Phú Bình', 'Suối Tre', 'Xuân An', 'Xuân Bình', 'Xuân Hòa', 'Xuân Lập', 'Xuân Tân', 'Xuân Thanh', 'Xuân Trung'] },
            'tan-phu': { name: 'Tân Phú', wards: ['Dak Lua', 'Nam Cát Tiên', 'Núi Tượng', 'Phú An', 'Phú Bình', 'Phú Điền', 'Phú Lâm', 'Phú Lập', 'Phú Lộc', 'Phú Sơn', 'Phú Thanh', 'Phú Thịnh', 'Phú Trung', 'Phú Xuân', 'Tà Lài', 'Thanh Sơn', 'Trà Cổ'] },
            'vinh-cu': { name: 'Vĩnh Cửu', wards: ['Bình Lợi', 'Đại Phước', 'Hiếu Liêm', 'Mã Đà', 'Phú Lý', 'Tân An', 'Tân Bình', 'Thạnh Phú', 'Thiện Tân', 'Vĩnh Tân'] },
            'dinh-quan': { name: 'Định Quán', wards: ['Định Quán', 'Gia Canh', 'La Ngà', 'Ngọc Định', 'Phú Cường', 'Phú Hòa', 'Phú Lợi', 'Phú Ngọc', 'Phú Tân', 'Phú Túc', 'Phú Vinh', 'Suối Nho', 'Túc Trưng'] },
            'thong-nhat': { name: 'Thống Nhất', wards: ['Bàu Hàm 2', 'Gia Kiệm', 'Gia Tân 1', 'Gia Tân 2', 'Gia Tân 3', 'Kiệm Tân', 'Quang Trung', 'Xuân Đông', 'Xuân Thiện'] },
            'cam-my': { name: 'Cẩm Mỹ', wards: ['Bảo Bình', 'Lâm San', 'Long Giao', 'Nhân Nghĩa', 'Sông Nhạn', 'Sông Ray', 'Thừa Đức', 'Xuân Bảo', 'Xuân Đông', 'Xuân Đường', 'Xuân Mỹ', 'Xuân Quế', 'Xuân Tây'] },
            'long-thanh': { name: 'Long Thành', wards: ['An Phước', 'Bàu Cạn', 'Bình An', 'Bình Sơn', 'Cẩm Đường', 'Lộc An', 'Long An', 'Long Đức', 'Long Phước', 'Phước Bình', 'Phước Thái', 'Suối Trầu', 'Tam An', 'Tân Hiệp'] },
            'xuan-loc': { name: 'Xuân Lộc', wards: ['Bảo Hòa', 'Gia Ray', 'Suối Cao', 'Suối Cát', 'Xuân Bắc', 'Xuân Định', 'Xuân Hiệp', 'Xuân Hòa', 'Xuân Hưng', 'Xuân Phú', 'Xuân Tâm', 'Xuân Thành', 'Xuân Thọ', 'Xuân Trường'] },
            'nhon-trach': { name: 'Nhơn Trạch', wards: ['Đại Phước', 'Hiệp Phước', 'Long Tân', 'Long Thọ', 'Phú Đông', 'Phú Hội', 'Phú Hữu', 'Phú Thạnh', 'Phước An', 'Phước Khánh', 'Phước Thiền', 'Vĩnh Thanh'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'binh-duong': {
        name: 'Bình Dương',
        districts: {
            'thu-dau-mot': { name: 'Thủ Dầu Một', wards: ['Chánh Mỹ', 'Chánh Nghĩa', 'Định Hòa', 'Hiệp An', 'Hiệp Thành', 'Hòa Phú', 'Phú Cường', 'Phú Hòa', 'Phú Lợi', 'Phú Mỹ', 'Phú Tân', 'Phú Thọ', 'Tân An', 'Tương Bình Hiệp'] },
            'dau-tieng': { name: 'Dầu Tiếng', wards: ['An Lập', 'Định An', 'Định Hiệp', 'Định Thành', 'Long Hòa', 'Long Tân', 'Minh Hòa', 'Minh Tân', 'Minh Thạnh', 'Thanh An', 'Thanh Tuyền'] },
            'ben-cat': { name: 'Bến Cát', wards: ['An Điền', 'An Tây', 'Chánh Phú Hòa', 'Hòa Lợi', 'Mỹ Phước', 'Phú An', 'Tân Định', 'Thới Hòa'] },
            'tan-uyen': { name: 'Tân Uyên', wards: ['Bạch Đằng', 'Bình Mỹ', 'Đất Cuốc', 'Hiếu Liêm', 'Lạc An', 'Tân Bình', 'Tân Định', 'Tân Lập', 'Tân Mỹ', 'Tân Phước Khánh', 'Thường Tân', 'Uyên Hưng', 'Vĩnh Tân'] },
            'di-an': { name: 'Dĩ An', wards: ['An Bình', 'An Thạnh', 'Bình An', 'Bình Thắng', 'Dĩ An', 'Đông Hòa', 'Tân Bình', 'Tân Đông Hiệp'] },
            'thuan-an': { name: 'Thuận An', wards: ['An Phú', 'An Sơn', 'An Thạnh', 'Bình Chuẩn', 'Bình Hòa', 'Bình Nhâm', 'Đông Hòa', 'Lái Thiêu', 'Tân Đông Hiệp', 'Vĩnh Phú'] },
            'bau-bang': { name: 'Bàu Bàng', wards: ['Cây Trường', 'Hưng Hòa', 'Lai Hưng', 'Lai Uyên', 'Long Nguyên', 'Tân Hưng', 'Trừ Văn Thố'] },
            'bac-tan-uyen': { name: 'Bắc Tân Uyên', wards: ['Bình Mỹ', 'Đất Cuốc', 'Hiếu Liêm', 'Lạc An', 'Tân Bình', 'Tân Định', 'Tân Lập', 'Tân Mỹ', 'Tân Phước Khánh', 'Thường Tân', 'Uyên Hưng', 'Vĩnh Tân'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'an-giang': {
        name: 'An Giang',
        districts: {
            'long-xuyen': { name: 'Long Xuyên', wards: ['Bình Đức', 'Bình Khánh', 'Đông Xuyên', 'Mỹ Bình', 'Mỹ Hòa', 'Mỹ Hòa Hưng', 'Mỹ Long', 'Mỹ Phước', 'Mỹ Quý', 'Mỹ Thạnh', 'Mỹ Thới', 'Mỹ Xuyên', 'Tân An', 'Tân Mỹ'] },
            'chau-doc': { name: 'Châu Đốc', wards: ['Châu Phú A', 'Châu Phú B', 'Núi Sam', 'Vĩnh Mỹ', 'Vĩnh Ngươn', 'Vĩnh Tế'] },
            'an-phu': { name: 'An Phú', wards: ['Đa Phước', 'Khánh An', 'Khánh Bình', 'Nhơn Hội', 'Phú Hội', 'Phú Hữu', 'Phước Hưng', 'Quốc Thái', 'Vĩnh Hậu', 'Vĩnh Hội Đông', 'Vĩnh Lộc', 'Vĩnh Trường'] },
            'chau-phu': { name: 'Châu Phú', wards: ['Bình Chánh', 'Bình Long', 'Bình Mỹ', 'Bình Thủy', 'Cần Đăng', 'Hòa Bình Thạnh', 'Núi Voi', 'Tân Phú', 'Vĩnh Thạnh Trung'] },
            'chau-thanh': { name: 'Châu Thành', wards: ['An Châu', 'Bình Hòa', 'Bình Thạnh', 'Cần Đăng', 'Hòa Bình Thạnh', 'Hội An', 'Long Hưng A', 'Long Hưng B', 'Long Kiến', 'Long Thuận', 'Phú Thuận', 'Tân Hội', 'Tân Phú', 'Vĩnh Hòa', 'Vĩnh Phú'] },
            'cho-moi': { name: 'Chợ Mới', wards: ['Bình Phước Xuân', 'Hòa An', 'Hòa Bình', 'Hội An', 'Kiến An', 'Kiến Thành', 'Long Điền A', 'Long Điền B', 'Long Giang', 'Long Kiến', 'Long Mỹ', 'Mỹ An', 'Mỹ Hiệp', 'Mỹ Hội Đông', 'Nhơn Mỹ', 'Tấn Mỹ'] },
            'phu-tan': { name: 'Phú Tân', wards: ['Bình Thạnh Đông', 'Chợ Vàm', 'Hiệp Xương', 'Hòa Lạc', 'Long Hòa', 'Phú An', 'Phú Bình', 'Phú Hiệp', 'Phú Hưng', 'Phú Long', 'Phú Lâm', 'Phú Thạnh', 'Phú Thành', 'Phú Thọ', 'Phú Thuận', 'Phú Xuân', 'Tân Hòa', 'Tân Trung'] },
            'thoai-son': { name: 'Thoại Sơn', wards: ['An Bình', 'Bình Thành', 'Định Mỹ', 'Định Thành', 'Mỹ Phú Đông', 'Phú Thuận', 'Tây Phú', 'Thoại Giang', 'Vĩnh Phú', 'Vĩnh Trạch', 'Vọng Đông', 'Vọng Thê'] },
            'tri-ton': { name: 'Tri Tôn', wards: ['An Tức', 'Ba Chúc', 'Châu Lăng', 'Cô Tô', 'Lạc Quới', 'Lê Trì', 'Lương An Trà', 'Lương Phi', 'Núi Tô', 'Ô Lâm', 'Tà Đảnh', 'Tân Tuyến', 'Vĩnh Gia', 'Vĩnh Phước'] },
            'tinh-bien': { name: 'Tịnh Biên', wards: ['An Cư', 'An Hảo', 'An Nông', 'An Phú', 'Chi Lăng', 'Nhơn Hưng', 'Núi Voi', 'Tân Lập', 'Tân Lợi', 'Tân Lộc', 'Thới Sơn', 'Văn Giáo', 'Vĩnh Trung'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'khanh-hoa': {
        name: 'Khánh Hòa',
        districts: {
            'nha-trang': { name: 'Nha Trang', wards: ['Lộc Thọ', 'Ngọc Hiệp', 'Phước Hải', 'Phước Hòa', 'Phước Long', 'Phước Tân', 'Phước Tiến', 'Phương Sài', 'Phương Sơn', 'Tân Lập', 'Vạn Thắng', 'Vạn Thạnh', 'Vĩnh Hải', 'Vĩnh Hòa', 'Vĩnh Nguyên', 'Vĩnh Phước', 'Vĩnh Thọ', 'Vĩnh Trường', 'Xương Huân'] },
            'cam-ranh': { name: 'Cam Ranh', wards: ['Ba Ngòi', 'Cam An Bắc', 'Cam An Nam', 'Cam Bình', 'Cam Đức', 'Cam Hải Đông', 'Cam Hải Tây', 'Cam Hòa', 'Cam Lập', 'Cam Linh', 'Cam Nghĩa', 'Cam Phú', 'Cam Phước Đông', 'Cam Phước Tây', 'Cam Phúc Bắc', 'Cam Phúc Nam', 'Cam Ranh', 'Cam Thành Bắc', 'Cam Thành Nam', 'Cam Thịnh Đông', 'Cam Thịnh Tây', 'Cam Xuân Bắc', 'Cam Xuân Nam', 'Suối Tân', 'Suối Cát'] },
            'ninh-hoa': { name: 'Ninh Hòa', wards: ['Ninh Đa', 'Ninh Diêm', 'Ninh Đông', 'Ninh Giang', 'Ninh Hà', 'Ninh Hải', 'Ninh Hiệp', 'Ninh Ích', 'Ninh Lộc', 'Ninh Phú', 'Ninh Phước', 'Ninh Quang', 'Ninh Sim', 'Ninh Sơn', 'Ninh Tân', 'Ninh Tây', 'Ninh Thân', 'Ninh Thọ', 'Ninh Thượng', 'Ninh Trung', 'Ninh Vân', 'Ninh Xuân'] },
            'van-ninh': { name: 'Vạn Ninh', wards: ['Đại Lãnh', 'Vạn Bình', 'Vạn Giã', 'Vạn Hưng', 'Vạn Khánh', 'Vạn Long', 'Vạn Lương', 'Vạn Ninh', 'Vạn Phú', 'Vạn Phước', 'Vạn Thạnh', 'Vạn Thọ', 'Xuân Sơn'] },
            'khanh-vinh': { name: 'Khánh Vĩnh', wards: ['Cầu Bà', 'Khánh Bình', 'Khánh Đông', 'Khánh Hiệp', 'Khánh Nam', 'Khánh Phú', 'Khánh Thành', 'Khánh Thượng', 'Khánh Trung', 'Khánh Vĩnh', 'Liên Sang', 'Sơn Thái', 'Sông Cầu'] },
            'dien-khanh': { name: 'Diên Khánh', wards: ['Bình Lộc', 'Diên An', 'Diên Điền', 'Diên Đồng', 'Diên Hòa', 'Diên Khánh', 'Diên Lạc', 'Diên Lâm', 'Diên Phú', 'Diên Phước', 'Diên Sơn', 'Diên Tân', 'Diên Thạnh', 'Diên Thọ', 'Diên Toàn', 'Diên Xuân', 'Suối Hiệp', 'Suối Tiên'] },
            'khanh-son': { name: 'Khánh Sơn', wards: ['Ba Cụm Bắc', 'Ba Cụm Nam', 'Sơn Bình', 'Sơn Hiệp', 'Sơn Lâm', 'Sơn Trung', 'Thành Sơn', 'Tô Hạp'] },
            'truong-sa': { name: 'Trường Sa', wards: ['Đảo Trường Sa', 'Đảo Song Tử Tây', 'Đảo Song Tử Đông', 'Đảo Sinh Tồn', 'Đảo Nam Yết', 'Đảo Sơn Ca', 'Đảo An Bang', 'Đảo Trường Sa Đông', 'Đảo Trường Sa Tây', 'Đảo Thuyền Chài', 'Đảo Đá Tây', 'Đảo Đá Lát', 'Đảo Đá Đông', 'Đảo Đá Châu Viên', 'Đảo Đá Tiên Nữ', 'Đảo Đá Tốc Tan', 'Đảo Đá Núi Le', 'Đảo Đá Len Đao', 'Đảo Đá Cô Lin', 'Đảo Đá Gạc Ma', 'Đảo Đá Subi', 'Đảo Đá Vành Khăn'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn', 'Sở Du lịch']
    },
    'quang-ninh': {
        name: 'Quảng Ninh',
        districts: {
            'ha-long': { name: 'Hạ Long', wards: ['Bạch Đằng', 'Bãi Cháy', 'Cao Thắng', 'Cao Xanh', 'Đại Yên', 'Giếng Đáy', 'Hà Khánh', 'Hà Khẩu', 'Hà Lầm', 'Hà Phong', 'Hà Trung', 'Hà Tu', 'Hồng Gai', 'Hồng Hà', 'Hồng Hải', 'Hùng Thắng', 'Trần Hưng Đạo', 'Tuần Châu', 'Việt Hưng', 'Yết Kiêu'] },
            'mong-cai': { name: 'Móng Cái', wards: ['Bình Ngọc', 'Hải Hòa', 'Hải Yên', 'Hòa Lạc', 'Ka Long', 'Ninh Dương', 'Trà Cổ', 'Trần Phú'] },
            'cam-pha': { name: 'Cẩm Phả', wards: ['Cẩm Bình', 'Cẩm Đông', 'Cẩm Phú', 'Cẩm Sơn', 'Cẩm Tây', 'Cẩm Thạch', 'Cẩm Thành', 'Cẩm Thịnh', 'Cẩm Thuỷ', 'Cẩm Trung', 'Cửa Ông', 'Mông Dương', 'Quang Hanh'] },
            'uong-bi': { name: 'Uông Bí', wards: ['Bắc Sơn', 'Nam Khê', 'Phương Đông', 'Phương Nam', 'Quang Trung', 'Thanh Sơn', 'Thượng Yên Công', 'Trưng Vương', 'Vàng Danh', 'Yên Thanh'] },
            'binh-lieu': { name: 'Bình Liêu', wards: ['Đồng Tâm', 'Đồng Văn', 'Hoành Mô', 'Húc Động', 'Lục Hồn', 'Tình Húc', 'Vô Ngại'] },
            'tien-yen': { name: 'Tiên Yên', wards: ['Đại Dực', 'Đại Thành', 'Điền Xá', 'Đông Hải', 'Đông Ngũ', 'Đồng Rui', 'Hà Lâu', 'Hải Lạng', 'Phong Dụ', 'Tiên Lãng', 'Yên Than'] },
            'dam-ha': { name: 'Đầm Hà', wards: ['Đại Bình', 'Đầm Hà', 'Đồng Rui', 'Đông Hải', 'Quảng Lâm', 'Quảng Lợi', 'Quảng Tân', 'Tân Bình', 'Tân Lập'] },
            'hai-ha': { name: 'Hải Hà', wards: ['Cái Chiên', 'Đảo Cái Chiên', 'Đường Hoa', 'Quảng Chính', 'Quảng Điền', 'Quảng Đức', 'Quảng Hà', 'Quảng Long', 'Quảng Minh', 'Quảng Phong', 'Quảng Sơn', 'Quảng Thắng', 'Quảng Thành', 'Quảng Thịnh', 'Quảng Trung'] },
            'quang-yen': { name: 'Quảng Yên', wards: ['Cộng Hòa', 'Đông Mai', 'Hà An', 'Minh Thành', 'Nam Hòa', 'Phong Cốc', 'Phong Hải', 'Quảng Yên', 'Tân An', 'Yên Giang', 'Yên Hải'] },
            'co-to': { name: 'Cô Tô', wards: ['Cô Tô', 'Đồng Tiến', 'Thanh Lân'] },
            'van-don': { name: 'Vân Đồn', wards: ['Bản Sen', 'Bình Dân', 'Cái Rồng', 'Đài Xuyên', 'Đoàn Kết', 'Đông Xá', 'Hạ Long', 'Minh Châu', 'Ngọc Vừng', 'Quan Lạn', 'Thắng Lợi', 'Vạn Yên'] },
            'dong-tri': { name: 'Đông Triều', wards: ['An Sinh', 'Bình Dương', 'Bình Khê', 'Đông Triều', 'Đức Chính', 'Hoàng Quế', 'Hồng Phong', 'Hồng Thái Đông', 'Hồng Thái Tây', 'Hưng Đạo', 'Kim Sơn', 'Mạo Khê', 'Nguyễn Huệ', 'Tân Việt', 'Thủy An', 'Tràng An', 'Tràng Lương', 'Việt Dân', 'Xuân Sơn', 'Yên Đức', 'Yên Thọ'] },
            'quang-ha': { name: 'Quảng Hà', wards: ['Cẩm La', 'Đông Hải', 'Hải Đông', 'Hải Sơn', 'Hải Tân', 'Hải Tiến', 'Hải Xuân', 'Quảng Đức', 'Quảng Hà', 'Quảng Long', 'Quảng Minh', 'Quảng Phong', 'Quảng Sơn', 'Quảng Thắng', 'Quảng Thành', 'Quảng Thịnh', 'Quảng Trung', 'Tiến Tới', 'Trà Cổ'] },
            'hoanh-bo': { name: 'Hoành Bồ', wards: ['Bằng Cả', 'Dân Chủ', 'Đồng Lâm', 'Đồng Sơn', 'Hòa Bình', 'Kỳ Thượng', 'Lê Lợi', 'Quảng La', 'Sơn Dương', 'Tân Dân', 'Thống Nhất', 'Vũ Oai'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn', 'Sở Du lịch']
    },
    'thanh-hoa': {
        name: 'Thanh Hóa',
        districts: {
            'thanh-hoa': { name: 'Thanh Hóa', wards: ['An Hưng', 'Ba Đình', 'Điện Biên', 'Đông Cương', 'Đông Hải', 'Đông Hương', 'Đông Lĩnh', 'Đông Sơn', 'Đông Tân', 'Đông Thọ', 'Đông Vệ', 'Hàm Rồng', 'Lam Sơn', 'Nam Ngạn', 'Ngọc Trạo', 'Phú Sơn', 'Quảng Cát', 'Quảng Đông', 'Quảng Hưng', 'Quảng Phú', 'Quảng Tâm', 'Quảng Thắng', 'Quảng Thành', 'Quảng Thịnh', 'Tào Xuyên', 'Tân Sơn', 'Tây Hồ', 'Thiệu Dương', 'Thiệu Khánh', 'Thiệu Phú', 'Trường Thi'] },
            'bim-son': { name: 'Bỉm Sơn', wards: ['Ba Đình', 'Bắc Sơn', 'Đông Sơn', 'Lam Sơn', 'Ngọc Trạo', 'Phú Sơn', 'Quang Trung'] },
            'sam-son': { name: 'Sầm Sơn', wards: ['Bắc Sơn', 'Quảng Châu', 'Quảng Cư', 'Quảng Đại', 'Quảng Hùng', 'Quảng Minh', 'Quảng Thọ', 'Quảng Tiến', 'Quảng Vinh', 'Trung Sơn', 'Trường Lâm'] },
            'muong-lat': { name: 'Mường Lát', wards: ['Mường Chanh', 'Mường Lý', 'Nhi Sơn', 'Pù Nhi', 'Quang Chiểu', 'Tam Chung', 'Tén Tằn', 'Trung Lý'] },
            'quan-hoa': { name: 'Quan Hóa', wards: ['Hiền Chung', 'Hiền Kiệt', 'Hồi Xuân', 'Nam Động', 'Nam Tiến', 'Nam Xuân', 'Phú Lệ', 'Phú Nghiêm', 'Phú Sơn', 'Phú Thanh', 'Phú Xuân', 'Thành Sơn', 'Thiên Phủ', 'Trung Sơn', 'Trung Thành', 'Xuân Phú'] },
            'quan-son': { name: 'Quan Sơn', wards: ['Mường Mìn', 'Na Mèo', 'Sơn Điện', 'Sơn Hà', 'Sơn Lư', 'Sơn Thủy', 'Tam Lư', 'Tam Thanh', 'Trung Hạ', 'Trung Thượng', 'Trung Tiến', 'Trung Xuân'] },
            'muong-te': { name: 'Mường Tè', wards: ['Bum Nưa', 'Bum Tở', 'Ka Lăng', 'Kan Hồ', 'Mù Cả', 'Mường Tè', 'Nậm Khao', 'Nậm Manh', 'Nậm Nhùn', 'Nậm Pì', 'Pa Ủ', 'Pa Vệ Sử', 'Tá Bạ', 'Tà Tổng', 'Tủa Chùa', 'Vàng San'] },
            'ba-thuoc': { name: 'Bá Thước', wards: ['Ái Thượng', 'Ban Công', 'Cổ Lũng', 'Điền Hạ', 'Điền Hương', 'Điền Lư', 'Điền Quang', 'Điền Thượng', 'Điền Trung', 'Hạ Trung', 'Kỳ Tân', 'Lũng Cao', 'Lũng Niêm', 'Lương Điền', 'Lương Ngoại', 'Lương Nội', 'Lương Trung', 'Tân Lập', 'Thành Lâm', 'Thành Sơn', 'Thiết Kế', 'Thiết Ống', 'Văn Nho'] },
            'thuong-xuan': { name: 'Thường Xuân', wards: ['Bát Mọt', 'Luận Khê', 'Luận Thành', 'Lương Sơn', 'Ngọc Phụng', 'Tân Thành', 'Thọ Thanh', 'Thường Xuân', 'Vạn Xuân', 'Xuân Cao', 'Xuân Chinh', 'Xuân Dương', 'Xuân Lẹ', 'Xuân Lộc', 'Xuân Thắng'] },
            'nhu-xuan': { name: 'Như Xuân', wards: ['Bình Lương', 'Cát Văn', 'Hóa Quỳ', 'Tân Bình', 'Thanh Hòa', 'Thanh Lâm', 'Thanh Phong', 'Thanh Quân', 'Thanh Sơn', 'Thanh Xuân', 'Thượng Ninh', 'Xuân Bình', 'Xuân Hòa', 'Xuân Phú', 'Xuân Quang', 'Xuân Thái', 'Yên Cát', 'Yên Lễ'] },
            'nhu-thanh': { name: 'Như Thanh', wards: ['Bến Sung', 'Cán Khê', 'Hải Long', 'Hải Vân', 'Mậu Lâm', 'Phú Nhuận', 'Phúc Đường', 'Phượng Nghi', 'Thanh Kỳ', 'Thanh Tân', 'Xuân Du', 'Xuân Khang', 'Xuân Phúc', 'Xuân Thái', 'Xuân Vinh', 'Yên Lạc', 'Yên Thọ'] },
            'nong-cong': { name: 'Nông Cống', wards: ['Công Bình', 'Công Chính', 'Công Liêm', 'Hoàng Giang', 'Hoàng Sơn', 'Minh Khôi', 'Minh Nghĩa', 'Minh Tâm', 'Nông Cống', 'Tân Khang', 'Tân Phúc', 'Tân Thọ', 'Tế Lợi', 'Tế Nông', 'Tế Tân', 'Tế Thắng', 'Thăng Bình', 'Thăng Long', 'Thăng Thọ', 'Trung Chính', 'Trung Thành', 'Trung Ý', 'Trường Giang', 'Trường Minh', 'Trường Sơn', 'Trường Trung', 'Tượng Lĩnh', 'Tượng Sơn', 'Tượng Văn', 'Vạn Hòa', 'Vạn Thiện', 'Vạn Thắng', 'Yên Mỹ'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'nghe-an': {
        name: 'Nghệ An',
        districts: {
            'vinh': { name: 'Vinh', wards: ['Bến Thủy', 'Cửa Nam', 'Đội Cung', 'Đông Vĩnh', 'Hà Huy Tập', 'Hồng Sơn', 'Lê Lợi', 'Lê Mao', 'Nghi Phú', 'Nghi Thuỷ', 'Quang Trung', 'Quán Bàu', 'Trung Đô', 'Trường Thi', 'Vinh Tân'] },
            'cua-lo': { name: 'Cửa Lò', wards: ['Nghi Hải', 'Nghi Hòa', 'Nghi Hương', 'Nghi Tân', 'Nghi Thu', 'Nghi Thuận', 'Thu Thủy'] },
            'thai-hoa': { name: 'Thái Hòa', wards: ['Đông Hiếu', 'Hòa Hiếu', 'Long Sơn', 'Nghĩa Đức', 'Nghĩa Hưng', 'Nghĩa Hội', 'Nghĩa Hồng', 'Nghĩa Hưng', 'Nghĩa Lộc', 'Nghĩa Mỹ', 'Nghĩa Phúc', 'Nghĩa Sơn', 'Nghĩa Thành', 'Nghĩa Thịnh', 'Nghĩa Thuận', 'Nghĩa Tiến', 'Nghĩa Trung', 'Quang Phong', 'Quang Tiến', 'Tây Hiếu'] },
            'hoang-mai': { name: 'Hoàng Mai', wards: ['Mai Hùng', 'Quỳnh Diễn', 'Quỳnh Lập', 'Quỳnh Lộc', 'Quỳnh Phương', 'Quỳnh Thuận', 'Quỳnh Vinh', 'Quỳnh Xuân'] },
            'quy-hop': { name: 'Quỳ Hợp', wards: ['Châu Cường', 'Châu Đình', 'Châu Hạnh', 'Châu Hội', 'Châu Lộc', 'Châu Lý', 'Châu Nga', 'Châu Phong', 'Châu Quang', 'Châu Thái', 'Châu Thành', 'Châu Thịnh', 'Châu Tiến', 'Châu Yên', 'Đồng Hợp', 'Hạnh Phúc', 'Liên Hợp', 'Minh Hợp', 'Nam Sơn', 'Nghĩa Xuân', 'Quỳ Hợp', 'Tam Hợp', 'Thọ Hợp', 'Văn Lợi', 'Yên Hợp'] },
            'quynh-luu': { name: 'Quỳnh Lưu', wards: ['An Hòa', 'Cầu Giát', 'Quỳnh Bá', 'Quỳnh Bảng', 'Quỳnh Châu', 'Quỳnh Diễn', 'Quỳnh Đôi', 'Quỳnh Giang', 'Quỳnh Hậu', 'Quỳnh Hoa', 'Quỳnh Hồng', 'Quỳnh Hưng', 'Quỳnh Lâm', 'Quỳnh Long', 'Quỳnh Lương', 'Quỳnh Minh', 'Quỳnh Mỹ', 'Quỳnh Nghĩa', 'Quỳnh Ngọc', 'Quỳnh Tam', 'Quỳnh Tân', 'Quỳnh Thạch', 'Quỳnh Thanh', 'Quỳnh Thắng', 'Quỳnh Thuận', 'Quỳnh Văn', 'Quỳnh Yên', 'Sơn Hải', 'Tân Sơn', 'Tân Thắng', 'Tiến Thủy'] },
            'ky-son': { name: 'Kỳ Sơn', wards: ['Bảo Nam', 'Bảo Thắng', 'Bắc Lý', 'Chiêu Lưu', 'Mường Ải', 'Mường Lống', 'Mường Típ', 'Mỹ Lý', 'Na Loi', 'Na Ngoi', 'Nậm Cắn', 'Nậm Càn', 'Nậm Hu', 'Phà Đánh', 'Tà Cạ', 'Tây Sơn'] },
            'tuong-duong': { name: 'Tương Dương', wards: ['Bình Chuẩn', 'Lưu Kiền', 'Mai Sơn', 'Nga My', 'Nhôn Mai', 'Tam Đình', 'Tam Hợp', 'Tam Quang', 'Tam Thái', 'Thạch Giám', 'Xá Lượng', 'Xiêng My', 'Yên Hòa', 'Yên Na', 'Yên Thắng'] },
            'con-cuong': { name: 'Con Cuông', wards: ['Bình Chuẩn', 'Châu Khê', 'Chi Khê', 'Đôn Phục', 'Lạng Khê', 'Lục Dạ', 'Môn Sơn', 'Mậu Đức', 'Thạch Ngàn', 'Yên Khê'] },
            'tan-ky': { name: 'Tân Kỳ', wards: ['Đồng Văn', 'Giai Xuân', 'Hương Sơn', 'Kỳ Sơn', 'Kỳ Tân', 'Nghĩa Bình', 'Nghĩa Đồng', 'Nghĩa Dũng', 'Nghĩa Hành', 'Nghĩa Hoàn', 'Nghĩa Hợp', 'Nghĩa Phúc', 'Nghĩa Thái', 'Phúc Sơn', 'Tân An', 'Tân Hợp', 'Tân Hương', 'Tân Long', 'Tân Phú', 'Tân Xuân', 'Tiên Kỳ', 'Tường Sơn'] },
            'yen-thanh': { name: 'Yên Thành', wards: ['Bắc Thành', 'Công Thành', 'Đại Thành', 'Đô Thành', 'Đồng Thành', 'Hậu Thành', 'Hoa Thành', 'Hồng Thành', 'Hợp Thành', 'Kim Thành', 'Lăng Thành', 'Long Thành', 'Lý Thành', 'Mã Thành', 'Minh Thành', 'Mỹ Thành', 'Nam Thành', 'Nhân Thành', 'Phú Thành', 'Phúc Thành', 'Quang Thành', 'Sơn Thành', 'Tân Thành', 'Tây Thành', 'Thịnh Thành', 'Thọ Thành', 'Tiến Thành', 'Trung Thành', 'Văn Thành', 'Viên Thành', 'Vĩnh Thành', 'Xuân Thành'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'thua-thien-hue': {
        name: 'Thừa Thiên Huế',
        districts: {
            'hue': { name: 'Huế', wards: ['An Cựu', 'An Đông', 'An Hòa', 'An Tây', 'Hương Long', 'Hương Sơ', 'Kim Long', 'Phú Bình', 'Phú Cát', 'Phú Hậu', 'Phú Hiệp', 'Phú Hòa', 'Phú Hội', 'Phú Nhuận', 'Phú Thượng', 'Phước Vĩnh', 'Tây Lộc', 'Thuận Hòa', 'Thuận Lộc', 'Thuận Thành', 'Trường An', 'Vĩ Dạ', 'Vĩnh Ninh', 'Xuân Phú'] },
            'huong-thuy': { name: 'Hương Thủy', wards: ['Dương Hòa', 'Phú Bài', 'Phú Dương', 'Phú Gia', 'Phú Lương', 'Phú Mậu', 'Phú Thanh', 'Thủy Bằng', 'Thủy Châu', 'Thủy Dương', 'Thủy Lương', 'Thủy Phù', 'Thủy Phương', 'Thủy Tân', 'Thủy Thanh', 'Thủy Vân'] },
            'huong-tra': { name: 'Hương Trà', wards: ['Bình Điền', 'Bình Thành', 'Hải Dương', 'Hồng Tiến', 'Hương An', 'Hương Bình', 'Hương Chữ', 'Hương Hồ', 'Hương Phong', 'Hương Thọ', 'Hương Toàn', 'Hương Vân', 'Hương Vinh', 'Tứ Hạ'] },
            'phu-vang': { name: 'Phú Vang', wards: ['Phú An', 'Phú Diên', 'Phú Đa', 'Phú Hải', 'Phú Hồ', 'Phú Lương', 'Phú Mỹ', 'Phú Thanh', 'Phú Thuận', 'Phú Thượng', 'Phú Xuân', 'Vinh An', 'Vinh Hà', 'Vinh Thanh', 'Vinh Xuân'] },
            'quang-dien': { name: 'Quảng Điền', wards: ['Quảng An', 'Quảng Công', 'Quảng Lợi', 'Quảng Ngạn', 'Quảng Phú', 'Quảng Phước', 'Quảng Thành', 'Quảng Thọ', 'Quảng Vinh'] },
            'phong-dien': { name: 'Phong Điền', wards: ['Điền Hải', 'Điền Hòa', 'Điền Hương', 'Điền Lộc', 'Điền Môn', 'Phong An', 'Phong Bình', 'Phong Chương', 'Phong Hiền', 'Phong Hòa', 'Phong Mỹ', 'Phong Sơn', 'Phong Thu'] },
            'a-luoi': { name: 'A Lưới', wards: ['A Đớt', 'A Ngo', 'A Roàng', 'Bồng Sơn', 'Hồng Bắc', 'Hồng Hạ', 'Hồng Kim', 'Hồng Quảng', 'Hồng Thái', 'Hồng Thượng', 'Hồng Thủy', 'Hồng Vân', 'Lâm Đớt', 'Phú Vinh', 'Sơn Thủy', 'Tư Hạ'] },
            'nam-dong': { name: 'Nam Đông', wards: ['Hương Giang', 'Hương Hòa', 'Hương Hữu', 'Hương Lộc', 'Hương Phú', 'Hương Sơn', 'Khe Tre', 'Thượng Lộ', 'Thượng Long', 'Thượng Nhật', 'Thượng Quảng'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn', 'Sở Du lịch']
    },
    'lam-dong': {
        name: 'Lâm Đồng',
        districts: {
            'da-lat': { name: 'Đà Lạt', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Xuân Thọ', 'Xuân Trường', 'Tà Nung', 'Trạm Hành'] },
            'bao-loc': { name: 'Bảo Lộc', wards: ['B\'Lao', 'Lộc Phát', 'Lộc Sơn', 'Lộc Tiến', 'Lộc Nga', 'Lộc Châu', 'Đại Lào', 'Đạm Bri', 'Đạ Tông', 'Đạ K\'Nàng', 'Đạ Ploa', 'Đạ M\'ri', 'Đạ Oai', 'Đạ Pal'] },
            'da-teh': { name: 'Đạ Tẻh', wards: ['Đạ Tẻh', 'An Nhơn', 'Đạ Kho', 'Đạ Lây', 'Đạ Oai', 'Đạ Pal', 'Đạ Ploa', 'Đạ Tông', 'Hà Lâm', 'Mỹ Đức', 'Quảng Trị', 'Quốc Oai', 'Triệu Hải'] },
            'cat-tien': { name: 'Cát Tiên', wards: ['Cát Tiên', 'Đồng Nai Thượng', 'Đức Phổ', 'Gia Viễn', 'Mỹ Lâm', 'Nam Ninh', 'Phước Cát', 'Phước Cát 1', 'Phước Cát 2', 'Quảng Ngãi', 'Tiên Hiệp', 'Tiên Phước'] },
            'da-hoai': { name: 'Đạ Huoai', wards: ['Đạ M\'ri', 'Đạ Oai', 'Đạ Ploa', 'Đạ Tông', 'Đạ Tẻh', 'Đạ Kho', 'Đạ Lây', 'Hà Lâm', 'Mỹ Đức', 'Quảng Trị', 'Quốc Oai', 'Triệu Hải'] },
            'da-rang': { name: 'Đạ Rằng', wards: ['Đạ Rằng', 'Đạ M\'ri', 'Đạ Oai', 'Đạ Ploa', 'Đạ Tông', 'Đạ Tẻh', 'Đạ Kho', 'Đạ Lây', 'Hà Lâm', 'Mỹ Đức', 'Quảng Trị', 'Quốc Oai', 'Triệu Hải'] },
            'don-duong': { name: 'Đơn Dương', wards: ['Đơn Dương', 'Đạ Ròn', 'Đạ Tông', 'Đạ Tẻh', 'Đạ Kho', 'Đạ Lây', 'Hà Lâm', 'Mỹ Đức', 'Quảng Trị', 'Quốc Oai', 'Triệu Hải', 'Ka Đơn', 'Suối Thông'] },
            'duc-trong': { name: 'Đức Trọng', wards: ['Liên Nghĩa', 'Hiệp An', 'Hiệp Thạnh', 'Bình Thạnh', 'N\'Thol Hạ', 'Tân Hội', 'Tân Thành', 'Phú Hội', 'Tà Năng', 'Đa Quyn', 'Tà Hine', 'Đà Loan', 'Ninh Gia', 'Tà Nung'] },
            'lam-ha': { name: 'Lâm Hà', wards: ['Đinh Văn', 'Liên Hà', 'Tân Hà', 'Tân Thanh', 'Tân Văn', 'Tân An', 'Đạ Đờn', 'Nam Ban', 'Đạ Kho', 'Đạ Lây', 'Hà Lâm', 'Mỹ Đức', 'Quảng Trị', 'Quốc Oai', 'Triệu Hải'] },
            'bao-lam': { name: 'Bảo Lâm', wards: ['Lộc Thắng', 'Lộc Bảo', 'Lộc Lâm', 'Lộc Phú', 'Lộc Thành', 'Lộc Thạnh', 'Lộc Bắc', 'Lộc Nam', 'Lộc Quảng', 'Lộc Tân', 'Lộc Hưng', 'Lộc An', 'Lộc Đức'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn', 'Sở Du lịch']
    },
    'ba-ria-vung-tau': {
        name: 'Bà Rịa - Vũng Tàu',
        districts: {
            'vung-tau': { name: 'Vũng Tàu', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Nguyễn An Ninh', 'Rạch Dừa', 'Thắng Nhất', 'Thắng Nhì', 'Thắng Tam'] },
            'ba-ria': { name: 'Bà Rịa', wards: ['Long Hương', 'Kim Dinh', 'Tân Hưng', 'Long Tâm', 'Phước Hưng', 'Long Toàn', 'Hòa Long', 'Long Phước', 'Bàu Sen', 'Bàu Trâm', 'Hắc Dịch', 'Tân Thành', 'Phước Hòa', 'Long Tân', 'Phước Tân'] },
            'chau-duc': { name: 'Châu Đức', wards: ['Ngãi Giao', 'Bình Ba', 'Suối Nghệ', 'Xuân Sơn', 'Sơn Bình', 'Bình Giã', 'Bàu Chinh', 'Nghĩa Thành', 'Quảng Thành', 'Kim Long', 'Suối Rao', 'Đá Bạc', 'Bình Trung', 'Bình Châu', 'Xà Bang', 'Láng Lớn', 'Cù Bị'] },
            'xuyen-moc': { name: 'Xuyên Mộc', wards: ['Phước Bửu', 'Xuyên Mộc', 'Bông Trang', 'Bàu Lâm', 'Bưng Riềng', 'Bình Châu', 'Hòa Bình', 'Hòa Hưng', 'Hòa Hiệp', 'Hòa Hội', 'Tân Lâm', 'Tân Lập', 'Tân Thành', 'Tân Hưng'] },
            'long-dien': { name: 'Long Điền', wards: ['Long Điền', 'Long Hải', 'An Ngãi', 'Tam Phước', 'An Nhứt', 'Phước Hưng', 'Phước Tỉnh', 'Phước Hải', 'An Ngãi Trung', 'An Ngãi Tây', 'An Ngãi Đông'] },
            'dat-do': { name: 'Đất Đỏ', wards: ['Đất Đỏ', 'Phước Hải', 'Phước Long Thọ', 'Long Mỹ', 'Long Tân', 'Láng Dài', 'Lộc An', 'Phước Hội', 'An Ngãi', 'An Nhứt', 'Phước Tỉnh', 'Lộc Thành', 'Long Phước', 'Phước Thạnh'] },
            'con-dao': { name: 'Côn Đảo', wards: ['Côn Đảo', 'An Hải', 'An Hội'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn', 'Sở Du lịch']
    },
    'kien-giang': {
        name: 'Kiên Giang',
        districts: {
            'rach-gia': { name: 'Rạch Giá', wards: ['Vĩnh Bảo', 'Vĩnh Hiệp', 'Vĩnh Lạc', 'Vĩnh Lợi', 'Vĩnh Quang', 'Vĩnh Thanh', 'Vĩnh Thanh Vân', 'An Hòa', 'An Thới', 'Rạch Sỏi', 'Phi Thông', 'Vĩnh Thông', 'Vĩnh Thạnh', 'Vĩnh Trung', 'Vĩnh Hòa', 'Vĩnh Hòa Hiệp', 'Vĩnh Hòa Phú', 'Vĩnh Hòa Quy', 'Vĩnh Hòa Thạnh', 'Vĩnh Hòa Trung'] },
            'ha-tien': { name: 'Hà Tiên', wards: ['Đông Hồ', 'Bình San', 'Pháo Đài', 'Mỹ Đức', 'Tiên Hải', 'Thuận Yên', 'Tô Châu'] },
            'kien-luong': { name: 'Kiên Lương', wards: ['Kiên Lương', 'Hòn Đất', 'Sơn Hải', 'Mỹ Thái', 'Mỹ Thuận', 'Mỹ Thạnh', 'Mỹ Đức', 'Mỹ Phước', 'Mỹ Hòa', 'Mỹ Lợi', 'Mỹ Thành', 'Mỹ Hiệp', 'Mỹ Trinh', 'Mỹ Thạnh Đông', 'Mỹ Thạnh Tây', 'Mỹ Thạnh Trung'] },
            'hon-dat': { name: 'Hòn Đất', wards: ['Hòn Đất', 'Sơn Hải', 'Mỹ Thái', 'Mỹ Thuận', 'Mỹ Thạnh', 'Mỹ Đức', 'Mỹ Phước', 'Mỹ Hòa', 'Mỹ Lợi', 'Mỹ Thành', 'Mỹ Hiệp', 'Mỹ Trinh', 'Mỹ Thạnh Đông', 'Mỹ Thạnh Tây', 'Mỹ Thạnh Trung', 'Sóc Sơn', 'Nam Thái Sơn', 'Mỹ Lâm', 'Mỹ Phú'] },
            'tan-hiep': { name: 'Tân Hiệp', wards: ['Tân Hiệp', 'Tân Hiệp A', 'Tân Hiệp B', 'Tân Thành', 'Tân Thạnh', 'Tân Lợi', 'Tân Lập', 'Tân Hưng', 'Tân Hòa', 'Tân An', 'Tân Bình', 'Tân Đông', 'Tân Đông Hiệp', 'Tân Đông Hòa', 'Tân Đông Thạnh', 'Tân Phú', 'Tân Phước', 'Tân Quy', 'Tân Quy Đông', 'Tân Quy Tây', 'Tân Thuận', 'Tân Trung'] },
            'chau-thanh': { name: 'Châu Thành', wards: ['Châu Thành', 'An Hòa', 'An Hòa Hải', 'An Hòa Tây', 'An Hòa Đông', 'An Hòa Nam', 'An Hòa Bắc', 'An Hòa Trung', 'An Hòa Thạnh', 'An Hòa Thành', 'An Hòa Thới', 'An Hòa Thuận', 'An Hòa Vĩnh', 'An Hòa Xuân', 'An Hòa Yên', 'An Hòa Lợi', 'An Hòa Phú', 'An Hòa Quy', 'An Hòa Tân'] },
            'giang-thanh': { name: 'Giang Thành', wards: ['Giang Thành', 'Phú Mỹ', 'Phú Quốc', 'Tân Hội', 'Tân Hưng', 'Tân Lập', 'Tân Thành', 'Tân Thạnh', 'Tân Thuận', 'Vĩnh Phú', 'Vĩnh Thạnh', 'Vĩnh Thuận'] },
            'go-quao': { name: 'Gò Quao', wards: ['Gò Quao', 'Vĩnh Hòa', 'Vĩnh Hòa Hưng', 'Vĩnh Hòa Hiệp', 'Vĩnh Phước A', 'Vĩnh Phước B', 'Vĩnh Thạnh', 'Vĩnh Thuận', 'Vĩnh Bình', 'Vĩnh Lợi', 'Vĩnh Lợi A', 'Vĩnh Lợi B', 'Vĩnh Thạnh A', 'Vĩnh Thạnh B', 'Vĩnh Thạnh Đông', 'Vĩnh Thạnh Tây', 'Vĩnh Thạnh Trung', 'Vĩnh Thạnh Nam', 'Vĩnh Thạnh Bắc'] },
            'an-bien': { name: 'An Biên', wards: ['An Biên', 'An Biên A', 'An Biên B', 'An Hòa', 'An Hòa A', 'An Hòa B', 'An Minh', 'An Minh A', 'An Minh B', 'An Thạnh', 'An Thạnh A', 'An Thạnh B', 'An Thạnh Đông', 'An Thạnh Tây', 'An Thạnh Trung', 'An Thạnh Nam', 'An Thạnh Bắc', 'An Thạnh Thượng', 'An Thạnh Hạ', 'An Thạnh Thới'] },
            'an-minh': { name: 'An Minh', wards: ['An Minh', 'An Minh A', 'An Minh B', 'An Thạnh', 'An Thạnh A', 'An Thạnh B', 'An Thạnh Đông', 'An Thạnh Tây', 'An Thạnh Trung', 'An Thạnh Nam', 'An Thạnh Bắc', 'An Thạnh Thượng', 'An Thạnh Hạ', 'An Thạnh Thới', 'Vĩnh Hòa', 'Vĩnh Hòa A', 'Vĩnh Hòa B', 'Vĩnh Phước', 'Vĩnh Phước A', 'Vĩnh Phước B'] },
            'phu-quoc': { name: 'Phú Quốc', wards: ['Dương Đông', 'An Thới', 'Hàm Ninh', 'Cửa Cạn', 'Gành Dầu', 'Bãi Thơm', 'Cửa Dương', 'Dương Tơ', 'Hòn Thơm', 'Thổ Châu', 'Hòn Tre', 'Hòn Một', 'Hòn Nghệ', 'Hòn Đất', 'Hòn Rỏi', 'Hòn Dừa', 'Hòn Ông', 'Hòn Bà', 'Hòn Ông Đốc', 'Bãi Dài', 'Cửa Lấp', 'Gành Gió', 'Hòn Móng Tay', 'Hòn Nồm', 'Hòn Ông Căn'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn', 'Sở Du lịch']
    },
    'bac-lieu': {
        name: 'Bạc Liêu',
        districts: {
            'bac-lieu': { name: 'Bạc Liêu', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 7', 'Phường 8', 'Nhà Mát', 'Vĩnh Trạch', 'Vĩnh Trạch Đông', 'Hiệp Thành', 'Vĩnh Lợi'] },
            'hong-dan': { name: 'Hồng Dân', wards: ['Ngan Dừa', 'Ninh Thạnh Lợi', 'Ninh Thạnh Lợi A', 'Ninh Quới', 'Ninh Quới A', 'Ninh Hòa', 'Lộc Ninh', 'Vĩnh Lộc', 'Vĩnh Lộc A', 'Vĩnh Lộc B'] },
            'phuoc-long': { name: 'Phước Long', wards: ['Phước Long', 'Vĩnh Phú Đông', 'Vĩnh Phú Tây', 'Phước Long', 'Hưng Phú', 'Vĩnh Thanh', 'Phong Thạnh Tây A', 'Phong Thạnh Tây B', 'Vĩnh Hưng', 'Vĩnh Hưng A'] },
            'gia-rai': { name: 'Giá Rai', wards: ['Giá Rai', 'Hộ Phòng', 'Láng Tròn', 'Phong Tân', 'Phong Thạnh', 'Phong Thạnh A', 'Phong Thạnh Đông', 'Phong Thạnh Tây', 'Tân Phong', 'Tân Thạnh'] },
            'dong-hai': { name: 'Đông Hải', wards: ['Gành Hào', 'An Phúc', 'An Trạch', 'An Trạch A', 'An Xuyên', 'Định Thành', 'Định Thành A', 'Hòa Tân', 'Hòa Thành', 'Tân Hưng', 'Tân Hưng A', 'Tân Thành', 'Tân Thành A'] },
            'hoa-binh': { name: 'Hòa Bình', wards: ['Hòa Bình', 'Minh Diệu', 'Vĩnh Bình', 'Vĩnh Mỹ A', 'Vĩnh Mỹ B', 'Vĩnh Thịnh', 'Vĩnh Hậu', 'Vĩnh Hậu A', 'Vĩnh Hưng A', 'Vĩnh Hưng'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'bac-giang': {
        name: 'Bắc Giang',
        districts: {
            'bac-giang': { name: 'Bắc Giang', wards: ['Trần Nguyên Hãn', 'Ngô Quyền', 'Hoàng Văn Thụ', 'Trần Phú', 'Mỹ Độ', 'Lê Lợi', 'Song Mai', 'Dĩnh Kế', 'Đồng Sơn', 'Song Khê', 'Tân Mỹ', 'Xương Giang', 'Đa Mai', 'Dĩnh Trì', 'Tân Tiến'] },
            'yen-the': { name: 'Yên Thế', wards: ['Bố Hạ', 'Cầu Gồ', 'Đồng Vương', 'Đồng Tiến', 'Canh Nậu', 'Hương Vĩ', 'Đồng Kỳ', 'Đồng Hưu', 'Tân Hiệp', 'Đồng Tâm', 'Đồng Lạc', 'An Thượng', 'Phồn Xương', 'Tân Sỏi', 'Bố Hạ', 'Hương Vĩ', 'Đồng Vương'] },
            'tan-yen': { name: 'Tân Yên', wards: ['Cao Thượng', 'Nhã Nam', 'Quế Nham', 'Việt Lập', 'Liên Chung', 'Cao Xá', 'Lam Cốt', 'Việt Ngọc', 'Song Vân', 'Ngọc Châu', 'Ngọc Lý', 'Ngọc Thiện', 'Ngọc Vân', 'Ngọc Liên', 'Quang Tiến', 'Phúc Hòa', 'Phúc Sơn', 'Tân Trung', 'An Dương', 'Lan Giới', 'Đại Hóa', 'Quang Nham', 'Hợp Đức', 'Lam Cốt', 'Cao Thượng'] },
            'lang-giang': { name: 'Lạng Giang', wards: ['Vôi', 'Nghĩa Hưng', 'Yên Mỹ', 'Mỹ Thái', 'Tân Dĩnh', 'Xương Lâm', 'Tân Hưng', 'Hương Sơn', 'Xuân Hương', 'Mỹ Hà', 'Tân Thanh', 'Đào Mỹ', 'Tiên Lục', 'An Hà', 'Kép', 'Vôi', 'Nghĩa Hưng', 'Yên Mỹ', 'Mỹ Thái', 'Tân Dĩnh', 'Xương Lâm', 'Tân Hưng', 'Hương Sơn', 'Xuân Hương', 'Mỹ Hà', 'Tân Thanh', 'Đào Mỹ', 'Tiên Lục', 'An Hà', 'Kép'] },
            'luong-giang': { name: 'Lục Ngạn', wards: ['Chũ', 'Cấm Sơn', 'Tân Sơn', 'Phì Điền', 'Nghĩa Hồ', 'Tân Quang', 'Đồng Cốc', 'Tân Lập', 'Bồng Am', 'Sơn Hải', 'Hồng Giang', 'Kiên Lao', 'Kiên Thành', 'Kim Sơn', 'Mỹ An', 'Nam Dương', 'Phong Minh', 'Phong Vân', 'Phú Nhuận', 'Phượng Sơn', 'Quý Sơn', 'Sơn Hải', 'Tân Hoa', 'Tân Lập', 'Tân Mộc', 'Tân Sơn', 'Thanh Hải', 'Trù Hựu'] },
            'son-dong': { name: 'Sơn Động', wards: ['An Châu', 'Tây Yên Tử', 'Vân Sơn', 'Hữu Sản', 'An Lạc', 'Vân Đồn', 'Yên Định', 'Lệ Viễn', 'An Bá', 'An Lập', 'Dương Hưu', 'Long Sơn', 'Thanh Luận', 'Nham Sơn', 'Yên Sơn', 'Cẩm Đàn', 'Giáo Liêm', 'Vĩnh An', 'Bồng Am', 'Đồng Việt', 'Đức Giang', 'Lục Sơn', 'Mỹ Sơn', 'Nghĩa Phương', 'Vượng Lộc'] },
            'yen-dung': { name: 'Yên Dũng', wards: ['Nham Biền', 'Tân An', 'Đồng Phúc', 'Tân Liễu', 'Đồng Việt', 'Đức Giang', 'Tiền Phong', 'Yên Lư', 'Tân Mỹ', 'Tân Dân', 'Hương Gián', 'Quỳnh Sơn', 'Nội Hoàng', 'Yên Thế', 'Song Khê', 'Nham Sơn', 'Xuân Phú', 'Tân Tiến', 'Đức Thắng', 'Đồng Tâm', 'Tân An', 'An Thượng', 'Phồn Xương', 'Tân Sỏi', 'Bố Hạ'] },
            'viet-yen': { name: 'Việt Yên', wards: ['Bích Động', 'Nếnh', 'Quang Châu', 'Ninh Sơn', 'Tiên Sơn', 'Trung Sơn', 'Nghĩa Trung', 'Hồng Thái', 'Tăng Tiến', 'Quảng Minh', 'Vân Hà', 'Vân Trung', 'Việt Tiến', 'Nghĩa Hưng', 'Thượng Lan', 'Minh Đức', 'Hương Mai', 'Tự Lạn', 'Bích Sơn', 'Hoàng Ninh', 'Hương Mai', 'Nếnh', 'Quang Châu', 'Ninh Sơn', 'Tiên Sơn', 'Trung Sơn', 'Nghĩa Trung', 'Hồng Thái', 'Tăng Tiến', 'Quảng Minh', 'Vân Hà', 'Vân Trung', 'Việt Tiến', 'Nghĩa Hưng', 'Thượng Lan', 'Minh Đức', 'Hương Mai', 'Tự Lạn', 'Bích Sơn', 'Hoàng Ninh'] },
            'hiep-hoa': { name: 'Hiệp Hòa', wards: ['Thắng', 'Đồng Tân', 'Thanh Vân', 'Hoàng Lương', 'Hoàng Vân', 'Hoàng Thanh', 'Hoàng An', 'Ngọc Sơn', 'Thái Sơn', 'Hòa Sơn', 'Minh Sơn', 'Lương Phong', 'Hùng Sơn', 'Đại Thành', 'Thường Thắng', 'Hợp Thịnh', 'Danh Thắng', 'Mai Trung', 'Đoan Bái', 'Bắc Lý', 'Xuân Cẩm', 'Hương Lâm', 'Đông Lỗ', 'Châu Minh', 'Mai Đình', 'Đức Thắng'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'bac-ninh': {
        name: 'Bắc Ninh',
        districts: {
            'bac-ninh': { name: 'Bắc Ninh', wards: ['Võ Cường', 'Hòa Long', 'Vạn An', 'Kinh Bắc', 'Đại Phúc', 'Ninh Xá', 'Suối Hoa', 'Vũ Ninh', 'Đáp Cầu', 'Thị Cầu', 'Kinh Bắc', 'Vệ An', 'Tiền An', 'Đại Xuân', 'Kim Chân', 'Nam Sơn', 'Khắc Niệm', 'Hạp Lý', 'Châu Khê', 'Phong Khê', 'Đình Bảng', 'Đông Ngàn', 'Tân Hồng', 'Đình Tổ', 'Hồ', 'Song Hồ', 'An Bình', 'Gia Đông', 'Lạc Vệ', 'Liên Bão', 'Lim', 'Phật Tích', 'Phú Lâm', 'Tân Chi', 'Tri Phương', 'Việt Đoàn'] },
            'yen-phong': { name: 'Yên Phong', wards: ['Chờ', 'Dũng Liệt', 'Đông Thọ', 'Đông Tiến', 'Hòa Tiến', 'Long Châu', 'Tam Đa', 'Tam Giang', 'Thụy Hòa', 'Trung Nghĩa', 'Văn Môn', 'Yên Phụ', 'Yên Trung', 'Yên Viên'] },
            'que-vo': { name: 'Quế Võ', wards: ['Phố Mới', 'Bằng An', 'Bồng Lai', 'Cách Bi', 'Châu Phong', 'Chi Lăng', 'Đại Xuân', 'Đào Viên', 'Đức Long', 'Hán Quảng', 'Mộ Đạo', 'Ngọc Xá', 'Nhân Hòa', 'Phượng Mao', 'Phương Liễu', 'Phụng Công', 'Quế Tân', 'Tân Hòa', 'Việt Hùng', 'Việt Thống', 'Yên Giả'] },
            'tien-du': { name: 'Tiên Du', wards: ['Lim', 'Phật Tích', 'Tri Phương', 'Việt Đoàn', 'Đại Đồng', 'Hoàn Sơn', 'Lạc Vệ', 'Liên Bão', 'Minh Đạo', 'Nội Duệ', 'Phú Lâm', 'Quảng Phú', 'Song Hồ', 'Tân Chi', 'Tân Hưng', 'Thiên Đức', 'Tương Giang', 'Vân Tương'] },
            'tu-son': { name: 'Từ Sơn', wards: ['Đình Bảng', 'Đông Ngàn', 'Tân Hồng', 'Đình Tổ', 'Hồ', 'Song Hồ', 'An Bình', 'Gia Đông', 'Lạc Vệ', 'Liên Bão', 'Lim', 'Phật Tích', 'Phú Lâm', 'Tân Chi', 'Tri Phương', 'Việt Đoàn', 'Đồng Kỵ', 'Đồng Nguyên', 'Hương Mạc', 'Phù Chẩn', 'Phù Khê', 'Tam Sơn', 'Tân Hồng', 'Trang Hạ'] },
            'tien-son': { name: 'Tiên Sơn', wards: ['Đại Đồng', 'Hoàn Sơn', 'Lạc Vệ', 'Liên Bão', 'Minh Đạo', 'Nội Duệ', 'Phú Lâm', 'Quảng Phú', 'Song Hồ', 'Tân Chi', 'Tân Hưng', 'Thiên Đức', 'Tương Giang', 'Vân Tương'] },
            'gia-binh': { name: 'Gia Bình', wards: ['Gia Bình', 'Bình Dương', 'Cao Đức', 'Đại Bái', 'Đại Lai', 'Đông Cứu', 'Giang Sơn', 'Lãng Ngâm', 'Nhân Thắng', 'Quỳnh Phú', 'Song Giang', 'Thái Bảo', 'Vạn Ninh', 'Xuân Lai'] },
            'luong-tai': { name: 'Lương Tài', wards: ['Thứa', 'An Thịnh', 'Bình Định', 'Lai Hạ', 'Lâm Thao', 'Minh Tân', 'Mỹ Hương', 'Phú Hòa', 'Phú Lương', 'Quảng Phú', 'Tân Lãng', 'Trung Chính', 'Trung Kênh', 'Trừng Xá'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'ben-tre': {
        name: 'Bến Tre',
        districts: {
            'ben-tre': { name: 'Bến Tre', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Bình Phú', 'Mỹ Thạnh An', 'Nhơn Thạnh', 'Phú Hưng', 'Phú Nhuận', 'Sơn Đông'] },
            'chau-thanh': { name: 'Châu Thành', wards: ['Châu Thành', 'An Hiệp', 'An Hóa', 'An Khánh', 'An Phước', 'Giao Long', 'Hữu Định', 'Phú An Hòa', 'Phú Đức', 'Phú Túc', 'Phước Thạnh', 'Qưới Sơn', 'Sơn Hòa', 'Tam Phước', 'Tân Phú', 'Tân Thạch', 'Thành Triệu', 'Tiên Long', 'Tiên Thủy', 'Tường Đa'] },
            'cho-lach': { name: 'Chợ Lách', wards: ['Chợ Lách', 'Hòa Nghĩa', 'Hưng Khánh Trung B', 'Long Thới', 'Phú Phụng', 'Phú Sơn', 'Sơn Định', 'Tân Thiềng', 'Vĩnh Bình', 'Vĩnh Hòa', 'Vĩnh Thành'] },
            'mo-cay-bac': { name: 'Mỏ Cày Bắc', wards: ['Mỏ Cày', 'An Định', 'An Thạnh', 'An Thới', 'Bình Khánh', 'Cẩm Sơn', 'Đa Phước Hội', 'Định Thủy', 'Hương Mỹ', 'Minh Đức', 'Ngãi Đăng', 'Phước Hiệp', 'Tân Hội', 'Tân Trung', 'Thành Thới A', 'Thành Thới B'] },
            'mo-cay-nam': { name: 'Mỏ Cày Nam', wards: ['Mỏ Cày', 'An Định', 'An Thạnh', 'An Thới', 'Bình Khánh', 'Cẩm Sơn', 'Đa Phước Hội', 'Định Thủy', 'Hương Mỹ', 'Minh Đức', 'Ngãi Đăng', 'Phước Hiệp', 'Tân Hội', 'Tân Trung', 'Thành Thới A', 'Thành Thới B'] },
            'gioi-hanh': { name: 'Giồng Trôm', wards: ['Giồng Trôm', 'Bình Hòa', 'Bình Thành', 'Châu Bình', 'Châu Hòa', 'Hưng Lễ', 'Hưng Nhượng', 'Hưng Phong', 'Long Mỹ', 'Lương Hòa', 'Lương Phú', 'Lương Quới', 'Mỹ Thạnh', 'Phong Nẫm', 'Phước Long', 'Sơn Phú', 'Tân Hào', 'Tân Lợi Thạnh', 'Tân Thanh', 'Thạnh Phú Đông', 'Thuận Điền'] },
            'binh-dai': { name: 'Bình Đại', wards: ['Bình Đại', 'Bình Thắng', 'Bình Thới', 'Châu Hưng', 'Đại Hòa Lộc', 'Định Trung', 'Lộc Thuận', 'Long Định', 'Long Hòa', 'Phú Long', 'Phú Thuận', 'Phú Vang', 'Tam Hiệp', 'Thạnh Phước', 'Thạnh Trị', 'Thới Lai', 'Thới Thuận', 'Vang Quới Đông', 'Vang Quới Tây'] },
            'ba-tri': { name: 'Ba Tri', wards: ['Ba Tri', 'An Bình Tây', 'An Đức', 'An Hiệp', 'An Hòa Tây', 'An Ngãi Tây', 'An Ngãi Trung', 'An Phú Trung', 'An Thủy', 'Bảo Thạnh', 'Bảo Thuận', 'Mỹ Chánh', 'Mỹ Hòa', 'Mỹ Nhơn', 'Mỹ Thạnh', 'Phú Lễ', 'Phú Ngãi', 'Phước Tuy', 'Tân Hưng', 'Tân Mỹ', 'Tân Thủy', 'Tân Xuân', 'Thạnh Phước'] },
            'thanh-phu': { name: 'Thạnh Phú', wards: ['Thạnh Phú', 'An Điền', 'An Nhơn', 'An Quy', 'An Thạnh', 'An Thuận', 'Bình Thạnh', 'Đại Điền', 'Giao Thạnh', 'Hòa Lợi', 'Mỹ An', 'Mỹ Hưng', 'Phú Khánh', 'Quới Điền', 'Tân Phong', 'Thạnh Hải', 'Thạnh Phong', 'Thới Thạnh'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'binh-dinh': {
        name: 'Bình Định',
        districts: {
            'quy-nhon': { name: 'Quy Nhon', wards: ['Bùi Thị Xuân', 'Đống Đa', 'Ghềnh Ráng', 'Hải Cảng', 'Lê Hồng Phong', 'Lê Lợi', 'Lý Thường Kiệt', 'Ngô Mây', 'Nguyễn Văn Cừ', 'Nhơn Bình', 'Nhơn Phú', 'Trần Hưng Đạo', 'Trần Phú', 'Thị Nại', 'Trần Quang Diệu'] },
            'an-lao': { name: 'An Lão', wards: ['An Lão', 'An Dũng', 'An Hòa', 'An Hưng', 'An Nghĩa', 'An Quang', 'An Tân', 'An Toàn', 'An Trung', 'An Vinh'] },
            'hoai-an': { name: 'Hoài Ân', wards: ['Tăng Bạt Hổ', 'Ân Đức', 'Ân Hảo Đông', 'Ân Hảo Tây', 'Ân Hữu', 'Ân Mỹ', 'Ân Nghĩa', 'Ân Phong', 'Ân Sơn', 'Ân Thạnh', 'Ân Tín', 'Ân Tường Đông', 'Ân Tường Tây', 'Bok Tới', 'Đak Mang', 'Tăng Bạt Hổ'] },
            'hoai-nhon': { name: 'Hoài Nhơn', wards: ['Bồng Sơn', 'Hoài Châu', 'Hoài Châu Bắc', 'Hoài Đức', 'Hoài Hải', 'Hoài Hảo', 'Hoài Hương', 'Hoài Mỹ', 'Hoài Phú', 'Hoài Sơn', 'Hoài Tân', 'Hoài Thanh', 'Hoài Thanh Tây', 'Hoài Xuân', 'Tam Quan', 'Tam Quan Bắc', 'Tam Quan Nam'] },
            'phu-cat': { name: 'Phù Cát', wards: ['Ngô Mây', 'Cát Chánh', 'Cát Hải', 'Cát Hanh', 'Cát Hiệp', 'Cát Hưng', 'Cát Khánh', 'Cát Lâm', 'Cát Minh', 'Cát Nhơn', 'Cát Sơn', 'Cát Tài', 'Cát Tân', 'Cát Thắng', 'Cát Thành', 'Cát Tiến', 'Cát Trinh', 'Cát Tường'] },
            'phu-my': { name: 'Phù Mỹ', wards: ['Phù Mỹ', 'Mỹ An', 'Mỹ Cát', 'Mỹ Chánh', 'Mỹ Chánh Tây', 'Mỹ Châu', 'Mỹ Đức', 'Mỹ Hiệp', 'Mỹ Hòa', 'Mỹ Lộc', 'Mỹ Lợi', 'Mỹ Phong', 'Mỹ Quang', 'Mỹ Tài', 'Mỹ Thắng', 'Mỹ Thành', 'Mỹ Thọ', 'Mỹ Trinh'] },
            'tay-son': { name: 'Tây Sơn', wards: ['Phú Phong', 'Bình Hòa', 'Bình Nghi', 'Bình Tân', 'Bình Thành', 'Bình Thuận', 'Bình Tường', 'Tây An', 'Tây Bình', 'Tây Giang', 'Tây Phú', 'Tây Thuận', 'Tây Vinh', 'Tây Xuân', 'Vĩnh An'] },
            'tuy-phuoc': { name: 'Tuy Phước', wards: ['Tuy Phước', 'Diêu Trì', 'Phước An', 'Phước Hiệp', 'Phước Hòa', 'Phước Hưng', 'Phước Lộc', 'Phước Nghĩa', 'Phước Quang', 'Phước Sơn', 'Phước Thắng', 'Phước Thành', 'Phước Thuận'] },
            'vinh-thanh': { name: 'Vĩnh Thạnh', wards: ['Vĩnh Thạnh', 'Vĩnh An', 'Vĩnh Hảo', 'Vĩnh Hiệp', 'Vĩnh Hòa', 'Vĩnh Kim', 'Vĩnh Quang', 'Vĩnh Sơn', 'Vĩnh Thịnh', 'Vĩnh Thuận'] },
            'van-canh': { name: 'Vân Canh', wards: ['Vân Canh', 'Canh Hiển', 'Canh Hiệp', 'Canh Hòa', 'Canh Liên', 'Canh Thuận', 'Canh Vinh'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'binh-phuoc': {
        name: 'Bình Phước',
        districts: {
            'dong-xoai': { name: 'Đồng Xoài', wards: ['Tân Phú', 'Tân Đồng', 'Tân Bình', 'Tân Xuân', 'Tân Thiện', 'Tân Thành', 'Tiến Thành', 'Tiến Hưng', 'Đồng Tiến', 'Đồng Tâm'] },
            'binh-long': { name: 'Bình Long', wards: ['An Lộc', 'An Phú', 'Hưng Chiến', 'Phú Đức', 'Phú Thịnh', 'Thanh Lương', 'Thanh Phú'] },
            'bu-dop': { name: 'Bù Đốp', wards: ['Thanh Bình', 'Bù Gia Mập', 'Đak Ơ', 'Đức Hạnh', 'Đa Kia', 'Phú Văn', 'Phước Minh', 'Bình Thắng'] },
            'bu-dang': { name: 'Bù Đăng', wards: ['Đức Phong', 'Bình Minh', 'Bom Bo', 'Đak Nhơ', 'Đăng Hà', 'Đoàn Kết', 'Đồng Nai', 'Đức Liễu', 'Đường 10', 'Minh Hưng', 'Nghĩa Trung', 'Nghĩa Bình', 'Phú Sơn', 'Phước Sơn', 'Thọ Sơn', 'Thống Nhất'] },
            'chon-thanh': { name: 'Chơn Thành', wards: ['Chơn Thành', 'Minh Hưng', 'Minh Long', 'Minh Thành', 'Nha Bích', 'Nha Bích', 'Minh Thắng', 'Minh Tâm', 'Minh Lập'] },
            'dong-phu': { name: 'Đồng Phú', wards: ['Tân Phú', 'Tân Lợi', 'Tân Lập', 'Tân Hòa', 'Tân Hiệp', 'Tân Hưng', 'Tân Thành', 'Tân Tiến', 'Thuận Lợi', 'Thuận Phú'] },
            'hon-quan': { name: 'Hớn Quản', wards: ['Tân Khai', 'Tân Hiệp', 'Tân Quan', 'Tân Lợi', 'Tân Lập', 'Tân Hưng', 'An Khương', 'An Phú', 'Đồng Nơ', 'Minh Đức', 'Minh Tâm', 'Phước An'] },
            'loc-ninh': { name: 'Lộc Ninh', wards: ['Lộc Ninh', 'Lộc An', 'Lộc Điền', 'Lộc Hiệp', 'Lộc Hòa', 'Lộc Hưng', 'Lộc Khánh', 'Lộc Phú', 'Lộc Quang', 'Lộc Tấn', 'Lộc Thái', 'Lộc Thạnh', 'Lộc Thiện', 'Lộc Thịnh', 'Lộc Thuận'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'binh-thuan': {
        name: 'Bình Thuận',
        districts: {
            'phan-thiet': { name: 'Phan Thiết', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Mũi Né', 'Hàm Tiến', 'Phú Hài', 'Phú Tài', 'Phú Thủy', 'Phú Trinh', 'Thanh Hải', 'Xuân An', 'Đức Long', 'Đức Nghĩa', 'Đức Thắng', 'Hưng Long', 'Lạc Đạo', 'Phong Nẫm', 'Tiến Lợi', 'Tiến Thành'] },
            'la-gi': { name: 'La Gi', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Tân An', 'Tân Bình', 'Tân Đức', 'Tân Hải', 'Tân Hội', 'Tân Phước', 'Tân Thiện', 'Tân Thuận', 'Bình Tân', 'Đức Long', 'Đức Nghĩa', 'Đức Thắng', 'Hưng Long', 'Lạc Đạo'] },
            'tuy-phong': { name: 'Tuy Phong', wards: ['Liên Hương', 'Phan Dũng', 'Phan Rí Cửa', 'Bình Thạnh', 'Chí Công', 'Hòa Minh', 'Hòa Phú', 'Phan Hòa', 'Phan Hiệp', 'Phan Lâm', 'Phan Rí Thành', 'Phan Sơn', 'Phan Thanh', 'Phan Tiến', 'Sông Lũy'] },
            'bac-binh': { name: 'Bắc Bình', wards: ['Chợ Lầu', 'Bình An', 'Bình Tân', 'Hải Ninh', 'Hòa Thắng', 'Hồng Phong', 'Hồng Thái', 'Lương Sơn', 'Phan Điền', 'Phan Hiệp', 'Phan Hòa', 'Phan Lâm', 'Phan Rí Cửa', 'Phan Sơn', 'Phan Thanh', 'Phan Tiến', 'Sông Bình', 'Sông Lũy'] },
            'ham-thuan-bac': { name: 'Hàm Thuận Bắc', wards: ['Ma Lâm', 'Ma Dương', 'Đông Giang', 'Đông Tiến', 'Hàm Cần', 'Hàm Cường', 'Hàm Đức', 'Hàm Hiệp', 'Hàm Liêm', 'Hàm Minh', 'Hàm Mỹ', 'Hàm Phú', 'Hàm Thắng', 'Hàm Thạnh', 'Hàm Trí', 'Hồng Liêm', 'Hồng Sơn', 'La Dạ', 'Thuận Hòa', 'Thuận Minh'] },
            'ham-thuan-nam': { name: 'Hàm Thuận Nam', wards: ['Thuận Nam', 'Hàm Cần', 'Hàm Cường', 'Hàm Kiệm', 'Hàm Minh', 'Hàm Mỹ', 'Hàm Phú', 'Hàm Thạnh', 'Hàm Trí', 'Mương Mán', 'Mỹ Thạnh', 'Tân Lập', 'Tân Thuận', 'Tân Thành', 'Thuận Quý'] },
            'tanh-linh': { name: 'Tánh Linh', wards: ['Lạc Tánh', 'Bắc Ruộng', 'Đồng Kho', 'Đức Bình', 'Đức Phú', 'Đức Tân', 'Đức Thuận', 'Gia An', 'Gia Huynh', 'Huy Khiêm', 'La Ngâu', 'Nghị Đức', 'Suối Kiết'] },
            'duc-linh': { name: 'Đức Linh', wards: ['Võ Xu', 'Đa Kai', 'Đắk O', 'Đức Bình', 'Đức Chính', 'Đức Hạnh', 'Đức Hòa', 'Đức Lập', 'Đức Tài', 'Đức Tân', 'Đức Tín', 'Mê Pu', 'Nam Chính', 'Sùng Nhơn', 'Tân Hà', 'Trà Tân', 'Vũ Hòa'] },
            'ham-tan': { name: 'Hàm Tân', wards: ['Tân Minh', 'Tân Nghĩa', 'Tân Phúc', 'Tân Thắng', 'Tân Thành', 'Tân Đức', 'Sơn Mỹ', 'Sông Phan', 'Thắng Hải', 'Tân Hải', 'Tân Hà', 'Tân Xuân'] },
            'phu-qui': { name: 'Phú Quí', wards: ['Ngũ Phụng', 'Long Hải', 'Tam Thanh'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn', 'Sở Du lịch']
    },
    'ca-mau': {
        name: 'Cà Mau',
        districts: {
            'ca-mau': { name: 'Cà Mau', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'An Xuyên', 'Định Bình', 'Hòa Tân', 'Hòa Thành', 'Lý Văn Lâm', 'Tắc Vân', 'Tân Thành', 'Tân Xuyên', 'Hưng Lợi', 'Hưng Thành'] },
            'u-minh': { name: 'U Minh', wards: ['U Minh', 'Khánh An', 'Khánh Hòa', 'Khánh Hội', 'Khánh Lâm', 'Khánh Thuận', 'Khánh Tiến', 'Nguyễn Phích', 'Khánh Bình', 'Khánh Bình Đông', 'Khánh Bình Tây', 'Khánh Hải', 'Khánh Hưng', 'Khánh Lâm', 'Khánh Tân'] },
            'thoi-binh': { name: 'Thới Bình', wards: ['Thới Bình', 'Biển Bạch', 'Biển Bạch Đông', 'Hồ Thị Kỷ', 'Tân Bằng', 'Tân Lộc', 'Tân Lộc Bắc', 'Tân Lộc Đông', 'Tân Phú', 'Trí Phải', 'Trí Lực'] },
            'tran-van-thoi': { name: 'Trần Văn Thời', wards: ['Trần Văn Thời', 'Sông Đốc', 'Khánh Bình', 'Khánh Bình Đông', 'Khánh Bình Tây', 'Khánh Hải', 'Khánh Hưng', 'Khánh Lâm', 'Khánh Tân', 'Lợi An', 'Phong Điền', 'Phong Lạc', 'Tân Bằng', 'Tân Lộc', 'Tân Lộc Bắc', 'Tân Lộc Đông', 'Tân Phú'] },
            'cai-nuoc': { name: 'Cái Nước', wards: ['Cái Nước', 'Đông Hưng', 'Đông Thới', 'Hòa Mỹ', 'Hưng Mỹ', 'Lương Thế Trân', 'Phú Hưng', 'Tân Hưng', 'Tân Hưng Đông', 'Tân Hưng Tây', 'Thạnh Phú', 'Trần Thới'] },
            'dam-doi': { name: 'Đầm Dơi', wards: ['Đầm Dơi', 'Tạ An Khương', 'Tạ An Khương Đông', 'Tạ An Khương Nam', 'Trần Phán', 'Thanh Tùng', 'Quách Phẩm', 'Quách Phẩm Bắc', 'Nguyễn Huân', 'Ngọc Chánh', 'Nguyễn Phích', 'Tân Duyệt', 'Tân Dân', 'Tân Trung', 'Tân Đức', 'Tân Thuận', 'Tân Tiến'] },
            'nam-can': { name: 'Năm Căn', wards: ['Năm Căn', 'Đất Mới', 'Hàm Rồng', 'Hàng Vịnh', 'Hiệp Tùng', 'Lâm Hải', 'Tam Giang', 'Tam Giang Đông', 'Đất Mũi'] },
            'phu-tan': { name: 'Phú Tân', wards: ['Cái Đôi Vàm', 'Phú Thuận', 'Phú Mỹ', 'Phú Tân', 'Tân Hải', 'Tân Hưng Tây', 'Việt Thắng', 'Rạch Chèo', 'Nguyễn Việt Khái'] },
            'ngoc-hien': { name: 'Ngọc Hiển', wards: ['Rạch Gốc', 'Tam Giang Tây', 'Tân Ân', 'Tân Ân Tây', 'Đất Mũi', 'Lâm Hải', 'Hàm Rồng', 'Tam Giang', 'Viên An', 'Viên An Đông'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'hai-duong': {
        name: 'Hải Dương',
        districts: {
            'hai-duong': { name: 'Hải Dương', wards: ['Bình Hàn', 'Cẩm Thượng', 'Hải Tân', 'Lê Thanh Nghị', 'Nam Đồng', 'Ngọc Châu', 'Nhị Châu', 'Phạm Ngũ Lão', 'Quang Trung', 'Tân Bình', 'Thạch Khôi', 'Thanh Bình', 'Trần Hưng Đạo', 'Trần Phú', 'Tứ Minh', 'Việt Hòa', 'Ái Quốc', 'An Châu', 'Bình Dân', 'Cẩm Vũ', 'Đức Chính', 'Kim Liên', 'Lương Điền', 'Minh Tân', 'Nam Sách', 'Nam Tân', 'Phúc Thành', 'Quang Trung', 'Tân Trường', 'Thái Tân', 'Thanh Hồng', 'Thanh Quang', 'Thượng Đạt', 'Trần Hưng Đạo', 'Trần Phú', 'Tứ Kỳ', 'Vĩnh Lại'] },
            'chi-linh': { name: 'Chí Linh', wards: ['Phường Sao Đỏ', 'Phường Bến Tắm', 'Phường Hoàng Tân', 'Phường Cổ Thành', 'Phường Văn An', 'Phường Chí Minh', 'Phường Văn Đức', 'Phường Thái Học', 'Cộng Hòa', 'Đồng Lạc', 'Hoàng Hoa Thám', 'Hoàng Tiến', 'Hưng Đạo', 'Kênh Giang', 'Lê Lợi', 'Nhân Huệ', 'Tân Dân', 'Văn An', 'An Lạc', 'Bắc An', 'Cổ Thành', 'Đức Chính', 'Hoàng Tân', 'Hoàng Tiến', 'Hưng Đạo', 'Kênh Giang', 'Lê Lợi', 'Nhân Huệ', 'Tân Dân', 'Văn An'] },
            'nam-sach': { name: 'Nam Sách', wards: ['Nam Sách', 'An Bình', 'An Lạc', 'An Sơn', 'Cộng Hòa', 'Đồng Lạc', 'Hiệp Cát', 'Hồng Phong', 'Hợp Tiến', 'Minh Tân', 'Nam Chính', 'Nam Hồng', 'Nam Hưng', 'Nam Tân', 'Nam Trung', 'Phú Điền', 'Quốc Tuấn', 'Thanh Quang', 'Thái Tân', 'Thượng Đạt', 'Trần Hưng Đạo', 'Trần Phú', 'Tứ Kỳ', 'Vĩnh Lại'] },
            'kinh-mon': { name: 'Kinh Môn', wards: ['Kinh Môn', 'An Phụ', 'An Sinh', 'Bạch Đằng', 'Duy Tân', 'Hiệp An', 'Hiệp Sơn', 'Hoành Sơn', 'Lạc Long', 'Lê Ninh', 'Long Xuyên', 'Minh Hòa', 'Phạm Mệnh', 'Phú Thứ', 'Phúc Thành', 'Quang Trung', 'Tân Dân', 'Thái Thịnh', 'Thăng Long', 'Thất Hùng', 'Thượng Quận', 'Thượng Vũ', 'Trạm Hương', 'Trần Hưng Đạo', 'Trần Phú', 'Tứ Kỳ', 'Vĩnh Lại'] },
            'kim-thanh': { name: 'Kim Thành', wards: ['Lai Cách', 'Cẩm La', 'Đại Sơn', 'Đồng Gia', 'Kim Anh', 'Kim Đính', 'Kim Khê', 'Kim Lương', 'Kim Tân', 'Kim Xuyên', 'Lai Cách', 'Lưu Kiếm', 'Ngũ Phúc', 'Phú Thái', 'Tân Dân', 'Thượng Vũ', 'Tuấn Hưng', 'Tuấn Việt'] },
            'thanh-ha': { name: 'Thanh Hà', wards: ['Thanh Hà', 'An Phượng', 'Cẩm Chế', 'Hồng Lạc', 'Liên Mạc', 'Tân An', 'Tân Việt', 'Thanh An', 'Thanh Cường', 'Thanh Hải', 'Thanh Hồng', 'Thanh Khê', 'Thanh Lang', 'Thanh Quang', 'Thanh Sơn', 'Thanh Thủy', 'Thanh Xá', 'Thanh Xuân', 'Việt Hồng', 'Vĩnh Lập'] },
            'cam-giang': { name: 'Cẩm Giàng', wards: ['Lai Cách', 'Cẩm Điền', 'Cẩm Định', 'Cẩm Đoài', 'Cẩm Đông', 'Cẩm Giang', 'Cẩm Hoàng', 'Cẩm Hưng', 'Cẩm Phúc', 'Cẩm Sơn', 'Cẩm Văn', 'Cẩm Vũ', 'Đức Chính', 'Lương Điền', 'Ngọc Liên', 'Thạch Lỗi', 'Thượng Đạt'] },
            'binh-giang': { name: 'Bình Giang', wards: ['Kẻ Sặt', 'Bình Minh', 'Bình Xuyên', 'Cổ Bì', 'Đại Đức', 'Hùng Thắng', 'Hưng Thịnh', 'Lương Điền', 'Minh Hòa', 'Nghĩa An', 'Nhân Quyền', 'Tân Hồng', 'Tân Việt', 'Thái Học', 'Thái Sơn', 'Thanh Hồng', 'Thanh Tùng', 'Vĩnh Hồng', 'Vĩnh Tuy'] },
            'gia-loc': { name: 'Gia Lộc', wards: ['Gia Lộc', 'Đoàn Thượng', 'Đồng Quang', 'Đức Xương', 'Gia Khánh', 'Gia Tân', 'Hoàng Diệu', 'Hồng Hưng', 'Lương Điền', 'Nhân Mỹ', 'Phạm Trấn', 'Quang Minh', 'Tân Hưng', 'Thống Kênh', 'Thống Nhất', 'Toàn Thắng', 'Trùng Khánh'] },
            'tu-ky': { name: 'Tứ Kỳ', wards: ['Tứ Kỳ', 'An Thanh', 'Bình Lăng', 'Cộng Lạc', 'Đại Đồng', 'Đại Hợp', 'Đông Kỳ', 'Hà Kỳ', 'Hà Thanh', 'Hưng Đạo', 'Kỳ Sơn', 'Minh Đức', 'Ngọc Kỳ', 'Ngọc Sơn', 'Phượng Kỳ', 'Quang Khải', 'Quảng Nghiệp', 'Tân Kỳ', 'Tây Kỳ', 'Tiên Động', 'Văn Tố', 'Vĩnh Hưng'] },
            'ninh-giang': { name: 'Ninh Giang', wards: ['Ninh Giang', 'An Đức', 'Đồng Tâm', 'Đông Xuyên', 'Hiệp Lực', 'Hồng Dụ', 'Hồng Đức', 'Hồng Phong', 'Hồng Phúc', 'Hưng Long', 'Ứng Hoè', 'Kiến Quốc', 'Nghĩa An', 'Ninh Hòa', 'Phạm Trấn', 'Quang Hưng', 'Quyết Thắng', 'Tân Hương', 'Tân Phong', 'Tân Quang', 'Thanh Tùng', 'Văn Hội', 'Vạn Phúc', 'Vĩnh Hòa'] },
            'thanh-mien': { name: 'Thanh Miện', wards: ['Thanh Miện', 'Cao Thắng', 'Chi Lăng Bắc', 'Chi Lăng Nam', 'Đoàn Kết', 'Đoàn Tùng', 'Hồng Quang', 'Hùng Sơn', 'Lam Sơn', 'Lê Hồng', 'Ngô Quyền', 'Ngũ Hùng', 'Phạm Kha', 'Tân Trào', 'Thanh Giang', 'Thanh Tùng', 'Tiền Phong', 'Tứ Cường', 'Vĩnh Hưng'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    // Thêm dữ liệu cho các tỉnh còn thiếu - sẽ được mở rộng đầy đủ
    'bac-kan': {
        name: 'Bắc Kạn',
        districts: {
            'bac-kan': { name: 'Bắc Kạn', wards: ['Nguyễn Thái Học', 'Đức Xuân', 'Phùng Chí Kiên', 'Huyền Tụng', 'Dương Quang', 'Nông Thượng', 'Xuất Hóa', 'Yên Thịnh', 'Yên Thượng'] },
            'pac-nam': { name: 'Pác Nặm', wards: ['Bằng Lũng', 'Bản Thi', 'Bằng Phúc', 'Bằng Lãng', 'Công Bằng', 'Giáo Hiệu', 'Nghiên Loan', 'Nhạn Môn', 'Xuân La'] },
            'ba-be': { name: 'Ba Bể', wards: ['Chợ Rã', 'Bành Trạch', 'Cao Thượng', 'Chu Hương', 'Địa Linh', 'Đồng Phúc', 'Hà Hiệu', 'Hoàng Trĩ', 'Khang Ninh', 'Mỹ Phương', 'Nam Mẫu', 'Phúc Lộc', 'Quảng Khê', 'Thượng Giáo', 'Yến Dương'] },
            'ngan-son': { name: 'Ngân Sơn', wards: ['Nà Phặc', 'Bằng Vân', 'Cốc Đán', 'Đức Vân', 'Hương Nê', 'Lãng Ngâm', 'Thuần Mang', 'Thượng Quan', 'Trung Hòa', 'Vân Tùng'] },
            'bach-thong': { name: 'Bạch Thông', wards: ['Phủ Thông', 'Cao Sơn', 'Cẩm Giàng', 'Dương Phong', 'Đôn Phong', 'Lục Bình', 'Mỹ Thanh', 'Nguyên Phúc', 'Quang Thuận', 'Quân Hà', 'Sĩ Bình', 'Tân Tú', 'Vi Hương', 'Vũ Muộn', 'Yên Đĩnh'] },
            'cho-don': { name: 'Chợ Đồn', wards: ['Bằng Lũng', 'Bản Thi', 'Bằng Phúc', 'Bằng Lãng', 'Công Bằng', 'Đại Sảo', 'Đồng Thắng', 'Lương Bằng', 'Nghĩa Tá', 'Ngọc Phái', 'Phương Viên', 'Quảng Bạch', 'Tân Lập', 'Xuân Lạc', 'Yên Mỹ', 'Yên Phong', 'Yên Thịnh', 'Yên Thượng'] },
            'cho-moi': { name: 'Chợ Mới', wards: ['Yên Cư', 'Nông Hạ', 'Cư Lễ', 'Dương Sơn', 'Yên Định', 'Yên Hân', 'Yên Thịnh', 'Yên Thượng', 'Yên Thạch', 'Yên Mỹ', 'Yên Phú', 'Yên Quang', 'Yên Sơn', 'Yên Thành', 'Yên Vinh'] },
            'na-ri': { name: 'Na Rì', wards: ['Yến Lạc', 'Côn Minh', 'Cư Lễ', 'Dương Sơn', 'Liên Thành', 'Lương Thượng', 'Minh Dương', 'Minh Sơn', 'Nghĩa Đức', 'Quang Minh', 'Tân Lập', 'Tân Thành', 'Thượng Giáo', 'Văn Lang', 'Văn Minh'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'cao-bang': {
        name: 'Cao Bằng',
        districts: {
            'cao-bang': { name: 'Cao Bằng', wards: ['Sông Bằng', 'Hợp Giang', 'Tân Giang', 'Ngọc Xuân', 'Đề Thám', 'Hoà Chung', 'Duyệt Chung', 'Hưng Đạo', 'Chu Trinh', 'Vĩnh Quang', 'Hạ Lang', 'Quảng Uyên', 'Phục Hoà', 'Trùng Khánh', 'Trà Lĩnh', 'Quảng Hòa', 'Hà Quảng', 'Thông Nông', 'Hà Lang', 'Nguyên Bình', 'Bảo Lạc', 'Bảo Lâm', 'Thạch An'] },
            'bao-lac': { name: 'Bảo Lạc', wards: ['Bảo Lạc', 'Bảo Toàn', 'Cô Ba', 'Cốc Pàng', 'Đức Hạnh', 'Kim Cúc', 'Phan Thanh', 'Thượng Hà', 'Xuân Trường', 'Hồng Trị', 'Hưng Đạo', 'Minh Tâm', 'Nam Cao', 'Vĩnh Phong', 'Vĩnh Quang', 'Vĩnh Thông'] },
            'bao-lam': { name: 'Bảo Lâm', wards: ['Pác Miầu', 'Đức Hạnh', 'Lý Bôn', 'Nam Cao', 'Nam Quang', 'Quảng Lâm', 'Tân Việt', 'Thạch Lâm', 'Thái Học', 'Thái Sơn', 'Vĩnh Phong', 'Vĩnh Quang', 'Vĩnh Tuy', 'Yên Thổ'] },
            'ha-quang': { name: 'Hà Quảng', wards: ['Xuân Hoà', 'Lũng Nặm', 'Trường Hà', 'Cải Viên', 'Đào Ngạn', 'Hạ Thôn', 'Hồng Sỹ', 'Kéo Yên', 'Lũng Thẩu', 'Nà Sác', 'Nội Thôn', 'Phù Ngọc', 'Quý Quân', 'Sóc Hà', 'Thanh Long', 'Thượng Thôn', 'Tổng Cọt', 'Trường Hà', 'Vân An', 'Vần Dính', 'Xuân Nội'] },
            'ha-lang': { name: 'Hà Lang', wards: ['Vinh Quang', 'Minh Long', 'Lý Quốc', 'Thắng Lợi', 'Đồng Loan', 'Đức Quang', 'Kim Loan', 'Lương Can', 'Thái Đức', 'Thái Học', 'Xuân Dương'] },
            'nguyen-binh': { name: 'Nguyên Bình', wards: ['Nguyên Bình', 'Ca Thành', 'Vũ Nông', 'Minh Tâm', 'Thể Dục', 'Mai Long', 'Yên Lạc', 'Thành Công', 'Thịnh Vượng', 'Hưng Đạo', 'Tam Kim', 'Hoa Thám', 'Quang Thành', 'Tân Thành', 'Lang Môn', 'Phan Thanh', 'Minh Thanh'] },
            'thach-an': { name: 'Thạch An', wards: ['Đông Khê', 'Canh Tân', 'Chi Việt', 'Đức Long', 'Đức Xuân', 'Đức Thông', 'Kim Đồng', 'Lê Lai', 'Lê Lợi', 'Minh Khai', 'Quang Trung', 'Thái Cường', 'Thị Ngân', 'Vân Trình', 'Vũ Thắng', 'Thái Học', 'Thái Sơn', 'Yên Lạc'] },
            'hoa-an': { name: 'Hòa An', wards: ['Nước Hai', 'Bạch Đằng', 'Bế Triều', 'Bình Dương', 'Công Trừng', 'Đại Tiến', 'Dân Chủ', 'Đức Long', 'Đức Xuân', 'Hoàng Tung', 'Hồng Việt', 'Hưng Đạo', 'Lê Chung', 'Nam Tuấn', 'Ngũ Lão', 'Nguyễn Huệ', 'Quang Trung', 'Trưng Vương', 'Trương Lương', 'Bình Long'] },
            'quang-uyen': { name: 'Quảng Uyên', wards: ['Quảng Uyên', 'Bế Văn Đàn', 'Cách Linh', 'Cai Bộ', 'Chí Thảo', 'Độc Lập', 'Hạnh Phúc', 'Hoàng Hồ', 'Hồng Định', 'Hồng Quang', 'Lê Lợi', 'Mỹ Hưng', 'Nam Cao', 'Nam Quang', 'Quốc Dân', 'Quốc Phong', 'Tự Do'] },
            'tra-linh': { name: 'Trà Lĩnh', wards: ['Trà Lĩnh', 'Cô Mười', 'Hùng Quốc', 'Lưu Ngọc', 'Quang Hán', 'Quang Trung', 'Quang Vinh', 'Quốc Toản', 'Tri Phương', 'Xuân Nội', 'Cao Chương'] },
            'trung-khanh': { name: 'Trùng Khánh', wards: ['Trùng Khánh', 'Cảnh Tiên', 'Cao Thăng', 'Chí Viễn', 'Đàm Thủy', 'Đình Minh', 'Đình Phong', 'Đoài Dương', 'Đức Hồng', 'Khâm Thành', 'Lăng Hiếu', 'Lăng Yên', 'Ngọc Côn', 'Ngọc Khê', 'Phong Châu', 'Phong Nậm', 'Quang Hán', 'Quang Trung', 'Quang Vinh', 'Tam Á', 'Thân Giáp', 'Thông Hoà', 'Tốc Tát', 'Trung Phúc', 'Xuân Nội'] },
            'thong-nong': { name: 'Thông Nông', wards: ['Thông Nông', 'Bình Lãng', 'Cần Nông', 'Cần Yên', 'Đa Thông', 'Lương Can', 'Lương Thông', 'Ngọc Động', 'Thanh Long', 'Vân Trình', 'Yên Sơn'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'dong-thap': {
        name: 'Đồng Tháp',
        districts: {
            'cao-lanh': { name: 'Cao Lãnh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Mỹ Phú', 'Tân Thuận Đông', 'Tân Thuận Tây', 'Tịnh Thới', 'Hòa An', 'Tân Hội Trung', 'Bình Thạnh', 'Mỹ Trà', 'Mỹ Tân', 'Mỹ Phong', 'Mỹ Quý', 'Mỹ Đông', 'Mỹ Hạnh', 'Mỹ Thạnh', 'Mỹ Thành', 'Mỹ Thọ', 'Mỹ Hưng', 'Mỹ Thuận', 'Mỹ Thịnh', 'Mỹ Khánh', 'Mỹ Hòa', 'Mỹ Lợi', 'Mỹ An', 'Mỹ Phước', 'Mỹ Long', 'Mỹ Hiệp', 'Mỹ Tân', 'Mỹ Phú', 'Mỹ Thạnh', 'Mỹ Thành', 'Mỹ Thọ', 'Mỹ Hưng', 'Mỹ Thuận', 'Mỹ Thịnh', 'Mỹ Khánh', 'Mỹ Hòa', 'Mỹ Lợi', 'Mỹ An', 'Mỹ Phước', 'Mỹ Long', 'Mỹ Hiệp'] },
            'sa-dec': { name: 'Sa Đéc', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'An Hòa', 'Tân Quy Đông', 'Tân Khánh Đông', 'Tân Phú Đông', 'Tân Quy Tây', 'An Hòa', 'Tân Quy Đông', 'Tân Khánh Đông', 'Tân Phú Đông', 'Tân Quy Tây', 'An Hòa', 'Tân Quy Đông', 'Tân Khánh Đông', 'Tân Phú Đông', 'Tân Quy Tây'] },
            'tan-hong': { name: 'Tân Hồng', wards: ['Tân Hồng', 'Tân Thành', 'Tân Phước', 'Tân Lập', 'Tân Bình', 'Tân Đông', 'Tân Đông A', 'Tân Đông B', 'Tân Thạnh', 'Tân Thạnh A', 'Tân Thạnh B', 'Tân Thạnh Đông', 'Tân Thạnh Tây', 'Tân Thạnh Trung', 'Tân Thạnh Nam', 'Tân Thạnh Bắc', 'Tân Thạnh Thượng', 'Tân Thạnh Hạ', 'Tân Thạnh Thới', 'Tân Thạnh Hòa', 'Tân Thạnh Phú', 'Tân Thạnh Quý', 'Tân Thạnh Tân', 'Tân Thạnh Mỹ', 'Tân Thạnh Đức', 'Tân Thạnh Lợi', 'Tân Thạnh An', 'Tân Thạnh Bình', 'Tân Thạnh Trị', 'Tân Thạnh Hưng', 'Tân Thạnh Phước', 'Tân Thạnh Long', 'Tân Thạnh Xuân', 'Tân Thạnh Hậu', 'Tân Thạnh Tiến', 'Tân Thạnh Thắng', 'Tân Thạnh Thành', 'Tân Thạnh Thọ', 'Tân Thạnh Thới', 'Tân Thạnh Hòa', 'Tân Thạnh Phú', 'Tân Thạnh Quý', 'Tân Thạnh Tân', 'Mỹ An', 'Mỹ Bình', 'Mỹ Đông', 'Mỹ Hòa', 'Mỹ Hưng', 'Mỹ Lợi', 'Mỹ Phú', 'Mỹ Phước', 'Mỹ Quý', 'Mỹ Tân', 'Mỹ Thạnh', 'Mỹ Thành', 'Mỹ Thọ', 'Mỹ Thuận', 'Mỹ Thịnh', 'Mỹ Trà', 'Mỹ Xương', 'Tân Hội Trung', 'Tân Thuận Đông', 'Tân Thuận Tây', 'Tịnh Thới'] },
            'hong-ngu': { name: 'Hồng Ngự', wards: ['Phường An Lạc', 'Phường An Lộc', 'Phường An Thạnh', 'Phường Bình Thạnh', 'Phường Tân Hộ Cơ', 'Phường Thạnh Hưng', 'Phường Thạnh Lợi', 'Phường Thạnh Mỹ', 'Phường Thạnh Phú', 'Phường Thạnh Thới', 'Phường Thạnh Trị', 'Phường Thạnh Xuân', 'Xã An Bình A', 'Xã An Bình B', 'Xã An Hòa', 'Xã An Hưng', 'Xã An Khánh', 'Xã An Lạc', 'Xã An Lộc', 'Xã An Phú', 'Xã An Thạnh', 'Xã An Thới', 'Xã Bình Thạnh', 'Xã Long Khánh A', 'Xã Long Khánh B', 'Xã Long Thuận', 'Xã Phú Thuận A', 'Xã Phú Thuận B', 'Xã Tân Hộ Cơ', 'Xã Tân Hưng', 'Xã Tân Long', 'Xã Tân Phú', 'Xã Tân Thành', 'Xã Thạnh Hưng', 'Xã Thạnh Lợi', 'Xã Thạnh Mỹ', 'Xã Thạnh Phú', 'Xã Thạnh Thới', 'Xã Thạnh Trị', 'Xã Thạnh Xuân'] },
            'tam-nong': { name: 'Tam Nông', wards: ['Phú Cường', 'Phú Hiệp', 'Phú Ninh', 'Phú Thành A', 'Phú Thành B', 'Phú Thọ', 'Tân Công Sính', 'An Hòa', 'An Long', 'An Phú', 'Phú Đức', 'Phú Thành', 'Phú Thọ', 'Tân Công Sính', 'Tân Hộ Cơ', 'Tân Phú', 'Tân Thành', 'Thạnh Mỹ', 'Thạnh Phú', 'Thạnh Thới', 'Thạnh Trị', 'Thạnh Xuân'] },
            'thanh-binh': { name: 'Thanh Bình', wards: ['Thanh Bình', 'Tân Quới', 'Tân Hòa', 'Tân Hội', 'Tân Hưng', 'Tân Lập', 'Tân Long', 'Tân Phú', 'Tân Phước', 'Tân Thạnh', 'Tân Thành', 'Tân Thuận', 'Tân Trung', 'An Phong', 'Bình Thành', 'Tân Bình', 'Tân Đông', 'Tân Hưng', 'Tân Lập', 'Tân Long', 'Tân Phú', 'Tân Phước', 'Tân Thạnh', 'Tân Thành', 'Tân Thuận', 'Tân Trung'] },
            'tan-hung': { name: 'Tân Hưng', wards: ['Tân Hưng', 'Hưng Điền A', 'Hưng Điền B', 'Hưng Hà', 'Hưng Điền', 'Hưng Thạnh', 'Thạnh Hưng', 'Vĩnh Bình', 'Vĩnh Châu A', 'Vĩnh Châu B', 'Vĩnh Đại', 'Vĩnh Lợi', 'Vĩnh Thạnh', 'Vĩnh Thành', 'Vĩnh Thuận', 'Vĩnh Trung', 'Vĩnh Tường', 'Vĩnh Xương'] },
            'lap-vo': { name: 'Lấp Vò', wards: ['Lấp Vò', 'Bình Thành', 'Bình Thạnh Trung', 'Bình Thạnh Đông', 'Bình Thạnh Tây', 'Định An', 'Định Yên', 'Hội An Đông', 'Long Hưng A', 'Long Hưng B', 'Mỹ An Hưng A', 'Mỹ An Hưng B', 'Mỹ Hội Đông', 'Mỹ Luông', 'Tân Mỹ', 'Tân Mỹ Chánh', 'Vĩnh Thạnh Trung', 'An Bình', 'An Long', 'An Phú', 'Định An', 'Định Yên', 'Hội An Đông', 'Long Hưng', 'Mỹ An Hưng', 'Mỹ Hội Đông', 'Mỹ Luông', 'Tân Mỹ', 'Tân Mỹ Chánh', 'Vĩnh Thạnh Trung'] },
            'lai-vung': { name: 'Lai Vung', wards: ['Lai Vung', 'Định Hòa', 'Hòa Long', 'Hòa Thành', 'Long Hậu', 'Long Thắng', 'Phong Hòa', 'Tân Dương', 'Tân Hòa', 'Tân Phú', 'Tân Quới', 'Tân Thành', 'Vĩnh Thới', 'Vĩnh Thuận', 'Định Hòa', 'Hòa Long', 'Hòa Thành', 'Long Hậu', 'Long Thắng', 'Phong Hòa', 'Tân Dương', 'Tân Hòa', 'Tân Phú', 'Tân Quới', 'Tân Thành', 'Vĩnh Thới', 'Vĩnh Thuận'] },
            'chau-thanh': { name: 'Châu Thành', wards: ['An Hiệp', 'An Khánh', 'An Nhơn', 'An Phú', 'An Thạnh', 'Bình Thạnh', 'Đông Thạnh', 'Hòa Tân', 'Hòa Thạnh', 'Long Hưng', 'Phú Hựu', 'Phú Tân', 'Phú Thành', 'Tân Bình', 'Tân Nhuận Đông', 'Tân Phú', 'Tân Phú Trung', 'Tân Thạnh', 'Tân Thành', 'Vĩnh Bình', 'Vĩnh Lợi', 'Vĩnh Phú', 'Vĩnh Thạnh', 'Vĩnh Thành', 'Vĩnh Thuận'] },
            'cao-lanh': { name: 'Cao Lãnh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Mỹ Phú', 'Tân Thuận Đông', 'Tân Thuận Tây', 'Tịnh Thới', 'Hòa An', 'Tân Hội Trung', 'Bình Thạnh', 'Mỹ Trà', 'Mỹ Tân', 'Mỹ Phong', 'Mỹ Quý', 'Mỹ Đông', 'Mỹ Hạnh', 'Mỹ Thạnh', 'Mỹ Thành', 'Mỹ Thọ', 'Mỹ Hưng', 'Mỹ Thuận', 'Mỹ Thịnh', 'Mỹ Khánh', 'Mỹ Hòa', 'Mỹ Lợi', 'Mỹ An', 'Mỹ Phước', 'Mỹ Long', 'Mỹ Hiệp'] },
            'thap-muoi': { name: 'Tháp Mười', wards: ['Mỹ An', 'Đốc Bình Kiều', 'Hưng Thạnh', 'Láng Biển', 'Mỹ An', 'Mỹ Đông', 'Mỹ Hòa', 'Mỹ Quý', 'Mỹ Thạnh', 'Mỹ Thọ', 'Phú Điền', 'Tân Kiều', 'Thạnh Lợi', 'Thanh Mỹ', 'Trường Xuân'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'gia-lai': {
        name: 'Gia Lai',
        districts: {
            'pleiku': { name: 'Pleiku', wards: ['Phường Chi Lăng', 'Phường Diên Hồng', 'Phường Đống Đa', 'Phường Hoa Lư', 'Phường Hội Phú', 'Phường Hội Thương', 'Phường Ia Kring', 'Phường Phù Đổng', 'Phường Tây Sơn', 'Phường Thắng Lợi', 'Phường Yên Đỗ', 'Xã An Phú', 'Xã Biển Hồ', 'Xã Chư Á', 'Xã Diên Phú', 'Xã Gào', 'Xã Ia Kênh', 'Xã Tân Sơn'] },
            'an-khe': { name: 'An Khê', wards: ['Phường An Bình', 'Phường An Phú', 'Phường An Phước', 'Phường An Tân', 'Phường Cheo Reo', 'Phường Đoàn Kết', 'Phường Hòa Bình', 'Phường Sông Bờ', 'Xã Cư An', 'Xã Cư Né', 'Xã Cư Pơng', 'Xã Ea Bar', 'Xã Ea Drông', 'Xã Ea Hleo', 'Xã Ea Hning', 'Xã Ea Ktur', 'Xã Ea Nuôl', 'Xã Ea Sol', 'Xã Ea Tir', 'Xã Ea Tul', 'Xã Ea Uy', 'Xã Ea Yiêng', 'Xã Krông Búk', 'Xã Krông Năng', 'Xã Tân Tiến'] },
            'ayun-pa': { name: 'Ayun Pa', wards: ['Phường Cheo Reo', 'Phường Đoàn Kết', 'Phường Hòa Bình', 'Phường Sông Bờ', 'Xã Chư Băh', 'Xã Cư Né', 'Xã Cư Pơng', 'Xã Ea Bar', 'Xã Ea Drông', 'Xã Ea Hleo', 'Xã Ea Hning', 'Xã Ea Ktur', 'Xã Ea Nuôl', 'Xã Ea Sol', 'Xã Ea Tir', 'Xã Ea Tul', 'Xã Ea Uy', 'Xã Ea Yiêng', 'Xã Ia Ake', 'Xã Ia Dom', 'Xã Ia Dreh', 'Xã Ia Hla', 'Xã Ia Hrú', 'Xã Ia Le', 'Xã Ia Phang', 'Xã Ia Rong', 'Xã Ia Rsai', 'Xã Ia Rsươm', 'Xã Ia Sao', 'Xã Ia Tôr', 'Xã Ia Tul', 'Xã Kông Chro', 'Xã Kông Htok', 'Xã Kông Klang', 'Xã Kông Lơng Khơng', 'Xã Kông Pắc', 'Xã Kông Yang', 'Xã Krông Búk', 'Xã Krông Năng', 'Xã Tân Tiến'] },
            'kbang': { name: 'KBang', wards: ['Thị trấn KBang', 'Xã Đăk Đoa', 'Xã Đăk Krong', 'Xã Đăk Sơmei', 'Xã Đăk Sơr', 'Xã Đăk Tơ Pang', 'Xã Đăk Trăm', 'Xã Đăk Yă', 'Xã Đăk Yang', 'Xã Đăk Yên', 'Xã Đăk Đrông', 'Xã Đăk Hà', 'Xã Đăk Hring', 'Xã Đăk Kơ Nia', 'Xã Đăk Long', 'Xã Đăk Mar', 'Xã Đăk Năng', 'Xã Đăk Nên', 'Xã Đăk Pék', 'Xã Đăk Pơ', 'Xã Đăk Rong', 'Xã Đăk Sơmei', 'Xã Đăk Sơr', 'Xã Đăk Tơ Pang', 'Xã Đăk Trăm', 'Xã Đăk Yă', 'Xã Đăk Yang', 'Xã Đăk Yên', 'Xã Đăk Đrông', 'Xã Đăk Hà', 'Xã Đăk Hring', 'Xã Đăk Kơ Nia', 'Xã Đăk Long', 'Xã Đăk Mar', 'Xã Đăk Năng', 'Xã Đăk Nên', 'Xã Đăk Pék', 'Xã Đăk Pơ', 'Xã Đăk Rong'] },
            'dak-do': { name: 'Đăk Đoa', wards: ['Thị trấn Đăk Đoa', 'Xã A Dơk', 'Xã A Yun', 'Xã Đăk Đoa', 'Xã Đăk Krong', 'Xã Đăk Sơmei', 'Xã Đăk Sơr', 'Xã Đăk Tơ Pang', 'Xã Đăk Trăm', 'Xã Đăk Yă', 'Xã Đăk Yang', 'Xã Đăk Yên', 'Xã Đăk Đrông', 'Xã Đăk Hà', 'Xã Đăk Hring', 'Xã Đăk Kơ Nia', 'Xã Đăk Long', 'Xã Đăk Mar', 'Xã Đăk Năng', 'Xã Đăk Nên', 'Xã Đăk Pék', 'Xã Đăk Pơ', 'Xã Đăk Rong', 'Xã Glar', 'Xã Hà Bầu', 'Xã Hà Đông', 'Xã Hà Tây', 'Xã Hà Tân', 'Xã Hà Tĩnh', 'Xã Hà Trung', 'Xã Hà Vinh', 'Xã Ia Băng', 'Xã Ia Blang', 'Xã Ia Bol', 'Xã Ia Der', 'Xã Ia Din', 'Xã Ia Dom', 'Xã Ia Drang', 'Xã Ia Glai', 'Xã Ia Hla', 'Xã Ia Hrú', 'Xã Ia Ka', 'Xã Ia Kênh', 'Xã Ia Khai', 'Xã Ia Ko', 'Xã Ia Kreng', 'Xã Ia Le', 'Xã Ia Mơ', 'Xã Ia Mơ Nông', 'Xã Ia Mơr', 'Xã Ia Nhin', 'Xã Ia O', 'Xã Ia Pa', 'Xã Ia Phang', 'Xã Ia Rong', 'Xã Ia Rsai', 'Xã Ia Rsươm', 'Xã Ia Sao', 'Xã Ia Tôr', 'Xã Ia Tul', 'Xã Ia Yiêng', 'Xã Kông Chro', 'Xã Kông Htok', 'Xã Kông Klang', 'Xã Kông Lơng Khơng', 'Xã Kông Pắc', 'Xã Kông Yang', 'Xã Krông Búk', 'Xã Krông Năng', 'Xã Tân Tiến'] },
            'chu-pah': { name: 'Chư Păh', wards: ['Thị trấn Chư Ty', 'Xã Chư A Thai', 'Xã Chư Băh', 'Xã Chư Đăng Ya', 'Xã Chư Jôr', 'Xã Chư Kpă', 'Xã Chư Mố', 'Xã Chư Păh', 'Xã Chư Răng', 'Xã Chư Sê', 'Xã Chư Tơng', 'Xã Ia Ake', 'Xã Ia Blang', 'Xã Ia Bol', 'Xã Ia Der', 'Xã Ia Din', 'Xã Ia Dom', 'Xã Ia Drang', 'Xã Ia Glai', 'Xã Ia Hla', 'Xã Ia Hrú', 'Xã Ia Ka', 'Xã Ia Kênh', 'Xã Ia Khai', 'Xã Ia Ko', 'Xã Ia Kreng', 'Xã Ia Le', 'Xã Ia Mơ', 'Xã Ia Mơ Nông', 'Xã Ia Mơr', 'Xã Ia Nhin', 'Xã Ia O', 'Xã Ia Pa', 'Xã Ia Phang', 'Xã Ia Rong', 'Xã Ia Rsai', 'Xã Ia Rsươm', 'Xã Ia Sao', 'Xã Ia Tôr', 'Xã Ia Tul', 'Xã Ia Yiêng', 'Xã Kông Chro', 'Xã Kông Htok', 'Xã Kông Klang', 'Xã Kông Lơng Khơng', 'Xã Kông Pắc', 'Xã Kông Yang', 'Xã Krông Búk', 'Xã Krông Năng', 'Xã Tân Tiến'] },
            'ia-grai': { name: 'Ia Grai', wards: ['Thị trấn Ia Kha', 'Xã Ia Ake', 'Xã Ia Blang', 'Xã Ia Bol', 'Xã Ia Der', 'Xã Ia Din', 'Xã Ia Dom', 'Xã Ia Drang', 'Xã Ia Glai', 'Xã Ia Hla', 'Xã Ia Hrú', 'Xã Ia Ka', 'Xã Ia Kênh', 'Xã Ia Khai', 'Xã Ia Ko', 'Xã Ia Kreng', 'Xã Ia Le', 'Xã Ia Mơ', 'Xã Ia Mơ Nông', 'Xã Ia Mơr', 'Xã Ia Nhin', 'Xã Ia O', 'Xã Ia Pa', 'Xã Ia Phang', 'Xã Ia Rong', 'Xã Ia Rsai', 'Xã Ia Rsươm', 'Xã Ia Sao', 'Xã Ia Tôr', 'Xã Ia Tul', 'Xã Ia Yiêng', 'Xã Kông Chro', 'Xã Kông Htok', 'Xã Kông Klang', 'Xã Kông Lơng Khơng', 'Xã Kông Pắc', 'Xã Kông Yang', 'Xã Krông Búk', 'Xã Krông Năng', 'Xã Tân Tiến'] },
            'mang-yang': { name: 'Mang Yang', wards: ['Thị trấn Kon Dơng', 'Xã Ayun', 'Xã Chư A Thai', 'Xã Chư Băh', 'Xã Chư Đăng Ya', 'Xã Chư Jôr', 'Xã Chư Kpă', 'Xã Chư Mố', 'Xã Chư Păh', 'Xã Chư Răng', 'Xã Chư Sê', 'Xã Chư Tơng', 'Xã Đăk Đoa', 'Xã Đăk Krong', 'Xã Đăk Sơmei', 'Xã Đăk Sơr', 'Xã Đăk Tơ Pang', 'Xã Đăk Trăm', 'Xã Đăk Yă', 'Xã Đăk Yang', 'Xã Đăk Yên', 'Xã Đăk Đrông', 'Xã Đăk Hà', 'Xã Đăk Hring', 'Xã Đăk Kơ Nia', 'Xã Đăk Long', 'Xã Đăk Mar', 'Xã Đăk Năng', 'Xã Đăk Nên', 'Xã Đăk Pék', 'Xã Đăk Pơ', 'Xã Đăk Rong', 'Xã Glar', 'Xã Hà Bầu', 'Xã Hà Đông', 'Xã Hà Tây', 'Xã Hà Tân', 'Xã Hà Tĩnh', 'Xã Hà Trung', 'Xã Hà Vinh', 'Xã Ia Băng', 'Xã Ia Blang', 'Xã Ia Bol', 'Xã Ia Der', 'Xã Ia Din', 'Xã Ia Dom', 'Xã Ia Drang', 'Xã Ia Glai', 'Xã Ia Hla', 'Xã Ia Hrú', 'Xã Ia Ka', 'Xã Ia Kênh', 'Xã Ia Khai', 'Xã Ia Ko', 'Xã Ia Kreng', 'Xã Ia Le', 'Xã Ia Mơ', 'Xã Ia Mơ Nông', 'Xã Ia Mơr', 'Xã Ia Nhin', 'Xã Ia O', 'Xã Ia Pa', 'Xã Ia Phang', 'Xã Ia Rong', 'Xã Ia Rsai', 'Xã Ia Rsươm', 'Xã Ia Sao', 'Xã Ia Tôr', 'Xã Ia Tul', 'Xã Ia Yiêng', 'Xã Kông Chro', 'Xã Kông Htok', 'Xã Kông Klang', 'Xã Kông Lơng Khơng', 'Xã Kông Pắc', 'Xã Kông Yang', 'Xã Krông Búk', 'Xã Krông Năng', 'Xã Tân Tiến'] },
            'kong-chro': { name: 'Kông Chro', wards: ['Thị trấn Kông Chro', 'Xã Chư A Thai', 'Xã Chư Băh', 'Xã Chư Đăng Ya', 'Xã Chư Jôr', 'Xã Chư Kpă', 'Xã Chư Mố', 'Xã Chư Păh', 'Xã Chư Răng', 'Xã Chư Sê', 'Xã Chư Tơng', 'Xã Đăk Đoa', 'Xã Đăk Krong', 'Xã Đăk Sơmei', 'Xã Đăk Sơr', 'Xã Đăk Tơ Pang', 'Xã Đăk Trăm', 'Xã Đăk Yă', 'Xã Đăk Yang', 'Xã Đăk Yên', 'Xã Đăk Đrông', 'Xã Đăk Hà', 'Xã Đăk Hring', 'Xã Đăk Kơ Nia', 'Xã Đăk Long', 'Xã Đăk Mar', 'Xã Đăk Năng', 'Xã Đăk Nên', 'Xã Đăk Pék', 'Xã Đăk Pơ', 'Xã Đăk Rong', 'Xã Glar', 'Xã Hà Bầu', 'Xã Hà Đông', 'Xã Hà Tây', 'Xã Hà Tân', 'Xã Hà Tĩnh', 'Xã Hà Trung', 'Xã Hà Vinh', 'Xã Ia Băng', 'Xã Ia Blang', 'Xã Ia Bol', 'Xã Ia Der', 'Xã Ia Din', 'Xã Ia Dom', 'Xã Ia Drang', 'Xã Ia Glai', 'Xã Ia Hla', 'Xã Ia Hrú', 'Xã Ia Ka', 'Xã Ia Kênh', 'Xã Ia Khai', 'Xã Ia Ko', 'Xã Ia Kreng', 'Xã Ia Le', 'Xã Ia Mơ', 'Xã Ia Mơ Nông', 'Xã Ia Mơr', 'Xã Ia Nhin', 'Xã Ia O', 'Xã Ia Pa', 'Xã Ia Phang', 'Xã Ia Rong', 'Xã Ia Rsai', 'Xã Ia Rsươm', 'Xã Ia Sao', 'Xã Ia Tôr', 'Xã Ia Tul', 'Xã Ia Yiêng', 'Xã Kông Chro', 'Xã Kông Htok', 'Xã Kông Klang', 'Xã Kông Lơng Khơng', 'Xã Kông Pắc', 'Xã Kông Yang', 'Xã Krông Búk', 'Xã Krông Năng', 'Xã Tân Tiến'] },
            'dak-po': { name: 'Đăk Pơ', wards: ['Thị trấn Đăk Pơ', 'Xã Chư A Thai', 'Xã Chư Băh', 'Xã Chư Đăng Ya', 'Xã Chư Jôr', 'Xã Chư Kpă', 'Xã Chư Mố', 'Xã Chư Păh', 'Xã Chư Răng', 'Xã Chư Sê', 'Xã Chư Tơng', 'Xã Đăk Đoa', 'Xã Đăk Krong', 'Xã Đăk Sơmei', 'Xã Đăk Sơr', 'Xã Đăk Tơ Pang', 'Xã Đăk Trăm', 'Xã Đăk Yă', 'Xã Đăk Yang', 'Xã Đăk Yên', 'Xã Đăk Đrông', 'Xã Đăk Hà', 'Xã Đăk Hring', 'Xã Đăk Kơ Nia', 'Xã Đăk Long', 'Xã Đăk Mar', 'Xã Đăk Năng', 'Xã Đăk Nên', 'Xã Đăk Pék', 'Xã Đăk Pơ', 'Xã Đăk Rong', 'Xã Glar', 'Xã Hà Bầu', 'Xã Hà Đông', 'Xã Hà Tây', 'Xã Hà Tân', 'Xã Hà Tĩnh', 'Xã Hà Trung', 'Xã Hà Vinh', 'Xã Ia Băng', 'Xã Ia Blang', 'Xã Ia Bol', 'Xã Ia Der', 'Xã Ia Din', 'Xã Ia Dom', 'Xã Ia Drang', 'Xã Ia Glai', 'Xã Ia Hla', 'Xã Ia Hrú', 'Xã Ia Ka', 'Xã Ia Kênh', 'Xã Ia Khai', 'Xã Ia Ko', 'Xã Ia Kreng', 'Xã Ia Le', 'Xã Ia Mơ', 'Xã Ia Mơ Nông', 'Xã Ia Mơr', 'Xã Ia Nhin', 'Xã Ia O', 'Xã Ia Pa', 'Xã Ia Phang', 'Xã Ia Rong', 'Xã Ia Rsai', 'Xã Ia Rsươm', 'Xã Ia Sao', 'Xã Ia Tôr', 'Xã Ia Tul', 'Xã Ia Yiêng', 'Xã Kông Chro', 'Xã Kông Htok', 'Xã Kông Klang', 'Xã Kông Lơng Khơng', 'Xã Kông Pắc', 'Xã Kông Yang', 'Xã Krông Búk', 'Xã Krông Năng', 'Xã Tân Tiến'] },
            'phu-thien': { name: 'Phú Thiện', wards: ['Thị trấn Phú Thiện', 'Xã Ayun', 'Xã Chư A Thai', 'Xã Chư Băh', 'Xã Chư Đăng Ya', 'Xã Chư Jôr', 'Xã Chư Kpă', 'Xã Chư Mố', 'Xã Chư Păh', 'Xã Chư Răng', 'Xã Chư Sê', 'Xã Chư Tơng', 'Xã Đăk Đoa', 'Xã Đăk Krong', 'Xã Đăk Sơmei', 'Xã Đăk Sơr', 'Xã Đăk Tơ Pang', 'Xã Đăk Trăm', 'Xã Đăk Yă', 'Xã Đăk Yang', 'Xã Đăk Yên', 'Xã Đăk Đrông', 'Xã Đăk Hà', 'Xã Đăk Hring', 'Xã Đăk Kơ Nia', 'Xã Đăk Long', 'Xã Đăk Mar', 'Xã Đăk Năng', 'Xã Đăk Nên', 'Xã Đăk Pék', 'Xã Đăk Pơ', 'Xã Đăk Rong', 'Xã Glar', 'Xã Hà Bầu', 'Xã Hà Đông', 'Xã Hà Tây', 'Xã Hà Tân', 'Xã Hà Tĩnh', 'Xã Hà Trung', 'Xã Hà Vinh', 'Xã Ia Băng', 'Xã Ia Blang', 'Xã Ia Bol', 'Xã Ia Der', 'Xã Ia Din', 'Xã Ia Dom', 'Xã Ia Drang', 'Xã Ia Glai', 'Xã Ia Hla', 'Xã Ia Hrú', 'Xã Ia Ka', 'Xã Ia Kênh', 'Xã Ia Khai', 'Xã Ia Ko', 'Xã Ia Kreng', 'Xã Ia Le', 'Xã Ia Mơ', 'Xã Ia Mơ Nông', 'Xã Ia Mơr', 'Xã Ia Nhin', 'Xã Ia O', 'Xã Ia Pa', 'Xã Ia Phang', 'Xã Ia Rong', 'Xã Ia Rsai', 'Xã Ia Rsươm', 'Xã Ia Sao', 'Xã Ia Tôr', 'Xã Ia Tul', 'Xã Ia Yiêng', 'Xã Kông Chro', 'Xã Kông Htok', 'Xã Kông Klang', 'Xã Kông Lơng Khơng', 'Xã Kông Pắc', 'Xã Kông Yang', 'Xã Krông Búk', 'Xã Krông Năng', 'Xã Tân Tiến'] },
            'chu-se': { name: 'Chư Sê', wards: ['Thị trấn Chư Sê', 'Xã Chư A Thai', 'Xã Chư Băh', 'Xã Chư Đăng Ya', 'Xã Chư Jôr', 'Xã Chư Kpă', 'Xã Chư Mố', 'Xã Chư Păh', 'Xã Chư Răng', 'Xã Chư Sê', 'Xã Chư Tơng', 'Xã Đăk Đoa', 'Xã Đăk Krong', 'Xã Đăk Sơmei', 'Xã Đăk Sơr', 'Xã Đăk Tơ Pang', 'Xã Đăk Trăm', 'Xã Đăk Yă', 'Xã Đăk Yang', 'Xã Đăk Yên', 'Xã Đăk Đrông', 'Xã Đăk Hà', 'Xã Đăk Hring', 'Xã Đăk Kơ Nia', 'Xã Đăk Long', 'Xã Đăk Mar', 'Xã Đăk Năng', 'Xã Đăk Nên', 'Xã Đăk Pék', 'Xã Đăk Pơ', 'Xã Đăk Rong', 'Xã Glar', 'Xã Hà Bầu', 'Xã Hà Đông', 'Xã Hà Tây', 'Xã Hà Tân', 'Xã Hà Tĩnh', 'Xã Hà Trung', 'Xã Hà Vinh', 'Xã Ia Băng', 'Xã Ia Blang', 'Xã Ia Bol', 'Xã Ia Der', 'Xã Ia Din', 'Xã Ia Dom', 'Xã Ia Drang', 'Xã Ia Glai', 'Xã Ia Hla', 'Xã Ia Hrú', 'Xã Ia Ka', 'Xã Ia Kênh', 'Xã Ia Khai', 'Xã Ia Ko', 'Xã Ia Kreng', 'Xã Ia Le', 'Xã Ia Mơ', 'Xã Ia Mơ Nông', 'Xã Ia Mơr', 'Xã Ia Nhin', 'Xã Ia O', 'Xã Ia Pa', 'Xã Ia Phang', 'Xã Ia Rong', 'Xã Ia Rsai', 'Xã Ia Rsươm', 'Xã Ia Sao', 'Xã Ia Tôr', 'Xã Ia Tul', 'Xã Ia Yiêng', 'Xã Kông Chro', 'Xã Kông Htok', 'Xã Kông Klang', 'Xã Kông Lơng Khơng', 'Xã Kông Pắc', 'Xã Kông Yang', 'Xã Krông Búk', 'Xã Krông Năng', 'Xã Tân Tiến'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'dak-lak': {
        name: 'Đắk Lắk',
        districts: {
            'buon-ma-thuot': { name: 'Buôn Ma Thuột', wards: ['Phường Ea Tam', 'Phường Khánh Xuân', 'Phường Tân An', 'Phường Tân Hòa', 'Phường Tân Lập', 'Phường Tân Lợi', 'Phường Tân Thành', 'Phường Tân Tiến', 'Phường Thành Công', 'Phường Thành Nhất', 'Phường Thống Nhất', 'Phường Tự An', 'Xã Cư Êbur', 'Xã Ea Kao', 'Xã Ea Tu', 'Xã Hòa Khánh', 'Xã Hòa Phú', 'Xã Hòa Thắng', 'Xã Hòa Thuận', 'Xã Hòa Xuân'] },
            'buon-ho': { name: 'Buôn Hồ', wards: ['Thị trấn Buôn Hồ', 'Xã Cư Bao', 'Xã Cư Drăm', 'Xã Cư Kty', 'Xã Cư Pơng', 'Xã Ea Bar', 'Xã Ea Drông', 'Xã Ea Hleo', 'Xã Ea Hning', 'Xã Ea Ktur', 'Xã Ea Nuôl', 'Xã Ea Sol', 'Xã Ea Tir', 'Xã Ea Tul', 'Xã Ea Uy', 'Xã Ea Yiêng', 'Xã Krông Búk', 'Xã Krông Năng', 'Xã Tân Tiến'] },
            'ea-hleo': { name: 'Ea H\'leo', wards: ['Thị trấn Ea Drăng', 'Xã Cư M\'ta', 'Xã Cư Króa', 'Xã Dliê Yang', 'Xã Ea H\'đing', 'Xã Ea H\'leo', 'Xã Ea Khal', 'Xã Ea Nam', 'Xã Ea Ral', 'Xã Ea Sol', 'Xã Ea Tir', 'Xã Ea Wy', 'Xã Ea Yiêng'] },
            'ea-sup': { name: 'Ea Súp', wards: ['Thị trấn Ea Súp', 'Xã Cư KBang', 'Xã Cư M\'lan', 'Xã Ea Bung', 'Xã Ea Lê', 'Xã Ea Rốk', 'Xã Ia Jlơi', 'Xã Ia Lốp', 'Xã Ia Rvê', 'Xã Ya Tờ Mốt'] },
            'cu-kuin': { name: 'Cư Kuin', wards: ['Xã Cư Êwi', 'Xã Dray Bhăng', 'Xã Ea Bhôk', 'Xã Ea Hu', 'Xã Ea Ktur', 'Xã Ea Ning', 'Xã Ea Tiêu', 'Xã Hòa Hiệp'] },
            'krong-buk': { name: 'Krông Búk', wards: ['Thị trấn Krông Búk', 'Xã Chư KBô', 'Xã Cư Né', 'Xã Cư Pơng', 'Xã Ea Ngai', 'Xã Ea Sin', 'Xã Pơng Drang', 'Xã Tân Lập'] },
            'krong-nang': { name: 'Krông Năng', wards: ['Thị trấn Krông Năng', 'Xã Cư Klông', 'Xã Dliê Ya', 'Xã Ea Dăh', 'Xã Ea Hồ', 'Xã Ea Păl', 'Xã Ea Tân', 'Xã Ea Tóh', 'Xã Ea Tul', 'Xã Krông Jing', 'Xã Phú Lộc', 'Xã Tam Giang'] },
            'ea-karat': { name: 'Ea Kar', wards: ['Thị trấn Ea Kar', 'Xã Cư Bông', 'Xã Cư Elang', 'Xã Cư Huê', 'Xã Cư Jang', 'Xã Cư Ni', 'Xã Cư Prông', 'Xã Cư Yang', 'Xã Ea Đar', 'Xã Ea Kmút', 'Xã Ea Ô', 'Xã Ea Păl', 'Xã Ea Sar', 'Xã Ea Sô', 'Xã Ea Tih', 'Xã Xuân Phú'] },
            'mdrak': { name: 'M\'Đrắk', wards: ['Thị trấn M\'Đrắk', 'Xã Cư Króa', 'Xã Cư M\'ta', 'Xã Cư Prao', 'Xã Cư San', 'Xã Ea H\'mlay', 'Xã Ea Lai', 'Xã Ea M\'doal', 'Xã Ea Pil', 'Xã Ea Riêng', 'Xã Ea Trang', 'Xã Krông Á', 'Xã Krông Jing'] },
            'krong-a-na': { name: 'Krông A Na', wards: ['Thị trấn Buôn Trấp', 'Xã Băng A Drênh', 'Xã Bình Hòa', 'Xã Dur KMăl', 'Xã Ea Bông', 'Xã Ea Na', 'Xã Quảng Điền'] },
            'krong-bong': { name: 'Krông Bông', wards: ['Thị trấn Krông Kmar', 'Xã Cư Drăm', 'Xã Cư Kty', 'Xã Cư Pơng', 'Xã Dang Kang', 'Xã Ea Trul', 'Xã Hòa Lễ', 'Xã Hòa Phong', 'Xã Hòa Sơn', 'Xã Hòa Tân', 'Xã Hòa Thành', 'Xã Khuê Ngọc Điền', 'Xã Yang Mao', 'Xã Yang Reh'] },
            'krong-pac': { name: 'Krông Pắk', wards: ['Thị trấn Phước An', 'Xã Ea Hiu', 'Xã Ea Kênh', 'Xã Ea Kly', 'Xã Ea KNuec', 'Xã Ea Kuăng', 'Xã Ea Phê', 'Xã Ea Uy', 'Xã Ea Yiêng', 'Xã Ea Yông', 'Xã Hòa An', 'Xã Hòa Đông', 'Xã Hòa Phú', 'Xã Hòa Tân', 'Xã Hòa Thành', 'Xã Hòa Thuận', 'Xã Krông Búk', 'Xã Tân Tiến'] },
            'lak': { name: 'Lắk', wards: ['Thị trấn Liên Sơn', 'Xã Bông Krang', 'Xã Buôn Tría', 'Xã Buôn Triết', 'Xã Đắk Liêng', 'Xã Đắk Nuê', 'Xã Đắk Phơi', 'Xã Ea R\'bin', 'Xã Krông Nô', 'Xã Liên Sơn', 'Xã Nam Ka', 'Xã Yang Tao'] },
            'cu-mgar': { name: 'Cư M\'gar', wards: ['Thị trấn Quảng Phú', 'Xã Cư Dliê M\'nông', 'Xã Cư M\'gar', 'Xã Cư Suê', 'Xã Cuor Đăng', 'Xã Ea D\'rơng', 'Xã Ea H\'đing', 'Xã Ea Kiết', 'Xã Ea Kpam', 'Xã Ea Kuếh', 'Xã Ea M\'dróh', 'Xã Ea M\'nang', 'Xã Ea Pốk', 'Xã Ea Tar', 'Xã Ea Tul', 'Xã Quảng Hiệp', 'Xã Quảng Tiến'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'ha-nam': {
        name: 'Hà Nam',
        districts: {
            'phu-ly': { name: 'Phủ Lý', wards: ['Phường Châu Sơn', 'Phường Hai Bà Trưng', 'Phường Lam Hạ', 'Phường Lê Hồng Phong', 'Phường Liêm Chính', 'Phường Lương Khánh Thiện', 'Phường Minh Khai', 'Phường Quang Trung', 'Phường Thanh Châu', 'Phường Thanh Tuyền', 'Xã Đinh Xá', 'Xã Kim Bình', 'Xã Liêm Chung', 'Xã Liêm Tiết', 'Xã Liêm Tuyền', 'Xã Phù Vân', 'Xã Thanh Hà', 'Xã Thanh Lưu', 'Xã Thanh Tâm', 'Xã Trịnh Xá'] },
            'duy-tien': { name: 'Duy Tiên', wards: ['Thị trấn Đồng Văn', 'Thị trấn Hòa Mạc', 'Xã Bạch Thượng', 'Xã Châu Giang', 'Xã Châu Sơn', 'Xã Chuyên Ngoại', 'Xã Đọi Sơn', 'Xã Đồng Hóa', 'Xã Hoàng Đông', 'Xã Hợp Lý', 'Xã Mộc Bắc', 'Xã Mộc Nam', 'Xã Tiên Hải', 'Xã Tiên Hiệp', 'Xã Tiên Ngoại', 'Xã Tiên Nội', 'Xã Tiên Phong', 'Xã Tiên Sơn', 'Xã Tiên Tân', 'Xã Trác Văn', 'Xã Yên Bắc', 'Xã Yên Nam'] },
            'kim-bang': { name: 'Kim Bảng', wards: ['Thị trấn Ba Sao', 'Thị trấn Quế', 'Xã Đại Cương', 'Xã Đồng Hóa', 'Xã Hoàng Tây', 'Xã Khả Phong', 'Xã Lê Hồ', 'Xã Liên Sơn', 'Xã Ngọc Sơn', 'Xã Nguyễn Úy', 'Xã Nhật Tân', 'Xã Nhật Tựu', 'Xã Tân Sơn', 'Xã Thanh Sơn', 'Xã Thi Sơn', 'Xã Thụy Lôi', 'Xã Tượng Lĩnh', 'Xã Văn Xá'] },
            'ly-nhan': { name: 'Lý Nhân', wards: ['Thị trấn Vĩnh Trụ', 'Xã Bắc Lý', 'Xã Chân Lý', 'Xã Chính Lý', 'Xã Công Lý', 'Xã Đạo Lý', 'Xã Đồng Lý', 'Xã Đức Lý', 'Xã Hòa Hậu', 'Xã Hợp Lý', 'Xã Nguyên Lý', 'Xã Nhân Bình', 'Xã Nhân Chính', 'Xã Nhân Đạo', 'Xã Nhân Hậu', 'Xã Nhân Hưng', 'Xã Nhân Khang', 'Xã Nhân Mỹ', 'Xã Nhân Nghĩa', 'Xã Nhân Thịnh', 'Xã Phú Phúc', 'Xã Tiến Thắng', 'Xã Văn Lý', 'Xã Xuân Khê'] },
            'binh-luc': { name: 'Bình Lục', wards: ['Thị trấn Bình Mỹ', 'Xã An Đổ', 'Xã An Lão', 'Xã An Mỹ', 'Xã An Ninh', 'Xã An Nội', 'Xã Bình Nghĩa', 'Xã Bồ Đề', 'Xã Bối Cầu', 'Xã Đồn Xá', 'Xã Đồng Du', 'Xã Hưng Công', 'Xã La Sơn', 'Xã Ngọc Lũ', 'Xã Tiêu Động', 'Xã Tràng An', 'Xã Trung Lương', 'Xã Vũ Bản', 'Xã Xuân Khê'] },
            'thanh-liem': { name: 'Thanh Liêm', wards: ['Thị trấn Kiện Khê', 'Xã Liêm Cần', 'Xã Liêm Phong', 'Xã Liêm Sơn', 'Xã Liêm Thuận', 'Xã Liêm Túc', 'Xã Thanh Bình', 'Xã Thanh Hà', 'Xã Thanh Hải', 'Xã Thanh Hương', 'Xã Thanh Lưu', 'Xã Thanh Nghị', 'Xã Thanh Nguyên', 'Xã Thanh Phong', 'Xã Thanh Tâm', 'Xã Thanh Tân', 'Xã Thanh Thủy', 'Xã Thanh Tuyền'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'ha-tinh': {
        name: 'Hà Tĩnh',
        districts: {
            'ha-tinh': { name: 'Hà Tĩnh', wards: ['Phường Bắc Hà', 'Phường Đại Nài', 'Phường Hà Huy Tập', 'Phường Nam Hà', 'Phường Nguyễn Du', 'Phường Tân Giang', 'Phường Thạch Linh', 'Phường Thạch Quý', 'Phường Trần Phú', 'Phường Văn Yên', 'Xã Đức Thuận', 'Xã Thạch Bình', 'Xã Thạch Đồng', 'Xã Thạch Hạ', 'Xã Thạch Hưng', 'Xã Thạch Môn', 'Xã Thạch Trung'] },
            'hong-linh': { name: 'Hồng Lĩnh', wards: ['Phường Bắc Hồng', 'Phường Đậu Liêu', 'Phường Đức Thuận', 'Phường Nam Hồng', 'Phường Trung Lương', 'Xã Thuận Lộc'] },
            'huong-son': { name: 'Hương Sơn', wards: ['Thị trấn Phố Châu', 'Thị trấn Tây Sơn', 'Xã An Hòa Thịnh', 'Xã Sơn An', 'Xã Sơn Bằng', 'Xã Sơn Bình', 'Xã Sơn Châu', 'Xã Sơn Diệm', 'Xã Sơn Giang', 'Xã Sơn Hà', 'Xã Sơn Hàm', 'Xã Sơn Hồng', 'Xã Sơn Kim 1', 'Xã Sơn Kim 2', 'Xã Sơn Lâm', 'Xã Sơn Lễ', 'Xã Sơn Lĩnh', 'Xã Sơn Long', 'Xã Sơn Mai', 'Xã Sơn Mỹ', 'Xã Sơn Ninh', 'Xã Sơn Phú', 'Xã Sơn Phúc', 'Xã Sơn Quang', 'Xã Sơn Tân', 'Xã Sơn Tây', 'Xã Sơn Thịnh', 'Xã Sơn Thủy', 'Xã Sơn Tiến', 'Xã Sơn Trà', 'Xã Sơn Trung', 'Xã Sơn Trường'] },
            'duc-tho': { name: 'Đức Thọ', wards: ['Thị trấn Đức Thọ', 'Xã Bùi Xá', 'Xã Đức An', 'Xã Đức Châu', 'Xã Đức Đồng', 'Xã Đức Dũng', 'Xã Đức Hòa', 'Xã Đức La', 'Xã Đức Lạc', 'Xã Đức Lâm', 'Xã Đức Lạng', 'Xã Đức Lập', 'Xã Đức Long', 'Xã Đức Nhân', 'Xã Đức Quang', 'Xã Đức Tân', 'Xã Đức Thanh', 'Xã Đức Thịnh', 'Xã Đức Thủy', 'Xã Đức Vĩnh', 'Xã Liên Minh', 'Xã Tân Hương', 'Xã Tân Thái', 'Xã Thái Yên', 'Xã Trung Lễ', 'Xã Trường Sơn', 'Xã Tùng Ảnh', 'Xã Yên Hồ'] },
            'vu-quang': { name: 'Vũ Quang', wards: ['Thị trấn Vũ Quang', 'Xã Ân Phú', 'Xã Đức Bồng', 'Xã Đức Giang', 'Xã Đức Hương', 'Xã Đức Liên', 'Xã Đức Lĩnh', 'Xã Hương Điền', 'Xã Hương Minh', 'Xã Hương Quang', 'Xã Hương Thọ', 'Xã Sơn Thọ'] },
            'nghi-xuan': { name: 'Nghi Xuân', wards: ['Thị trấn Nghi Xuân', 'Xã Cổ Đạm', 'Xã Cương Gián', 'Xã Tiên Điền', 'Xã Xuân An', 'Xã Xuân Đan', 'Xã Xuân Giang', 'Xã Xuân Hải', 'Xã Xuân Hội', 'Xã Xuân Hồng', 'Xã Xuân Lam', 'Xã Xuân Liên', 'Xã Xuân Lĩnh', 'Xã Xuân Mỹ', 'Xã Xuân Phổ', 'Xã Xuân Thành', 'Xã Xuân Trường', 'Xã Xuân Viên', 'Xã Xuân Yên'] },
            'can-loc': { name: 'Can Lộc', wards: ['Thị trấn Nghèn', 'Xã Đồng Lộc', 'Xã Gia Hanh', 'Xã Khánh Lộc', 'Xã Kim Song Trường', 'Xã Mỹ Lộc', 'Xã Phú Lộc', 'Xã Quang Lộc', 'Xã Sơn Lộc', 'Xã Song Lộc', 'Xã Thanh Lộc', 'Xã Thiên Lộc', 'Xã Thuần Thiện', 'Xã Thượng Lộc', 'Xã Thường Nga', 'Xã Tiến Lộc', 'Xã Trung Lộc', 'Xã Tùng Lộc', 'Xã Vượng Lộc', 'Xã Xuân Lộc', 'Xã Yên Lộc'] },
            'huong-khe': { name: 'Hương Khê', wards: ['Thị trấn Hương Khê', 'Xã Gia Phố', 'Xã Hà Linh', 'Xã Hòa Hải', 'Xã Hương Bình', 'Xã Hương Đô', 'Xã Hương Giang', 'Xã Hương Lâm', 'Xã Hương Liên', 'Xã Hương Long', 'Xã Hương Thủy', 'Xã Hương Trà', 'Xã Hương Trạch', 'Xã Hương Vĩnh', 'Xã Hương Xuân', 'Xã Lộc Yên', 'Xã Phú Gia', 'Xã Phú Phong', 'Xã Phúc Đồng', 'Xã Phúc Trạch', 'Xã Phương Điền', 'Xã Phương Mỹ'] },
            'thach-ha': { name: 'Thạch Hà', wards: ['Thị trấn Thạch Hà', 'Xã Bắc Sơn', 'Xã Nam Điền', 'Xã Ngọc Sơn', 'Xã Thạch Bàn', 'Xã Thạch Đài', 'Xã Thạch Điền', 'Xã Thạch Đỉnh', 'Xã Thạch Hải', 'Xã Thạch Hội', 'Xã Thạch Hưng', 'Xã Thạch Kênh', 'Xã Thạch Khê', 'Xã Thạch Lạc', 'Xã Thạch Lâm', 'Xã Thạch Liên', 'Xã Thạch Long', 'Xã Thạch Lưu', 'Xã Thạch Ngọc', 'Xã Thạch Sơn', 'Xã Thạch Tân', 'Xã Thạch Thắng', 'Xã Thạch Thanh', 'Xã Thạch Tiến', 'Xã Thạch Trị', 'Xã Thạch Văn', 'Xã Thạch Vĩnh', 'Xã Thạch Xuân', 'Xã Tượng Sơn', 'Xã Việt Xuyên'] },
            'cam-xuyen': { name: 'Cẩm Xuyên', wards: ['Thị trấn Cẩm Xuyên', 'Xã Cẩm Bình', 'Xã Cẩm Duệ', 'Xã Cẩm Dương', 'Xã Cẩm Hà', 'Xã Cẩm Hòa', 'Xã Cẩm Hưng', 'Xã Cẩm Huy', 'Xã Cẩm Lạc', 'Xã Cẩm Lĩnh', 'Xã Cẩm Minh', 'Xã Cẩm Mỹ', 'Xã Cẩm Nam', 'Xã Cẩm Nhượng', 'Xã Cẩm Phúc', 'Xã Cẩm Quan', 'Xã Cẩm Quang', 'Xã Cẩm Sơn', 'Xã Cẩm Thạch', 'Xã Cẩm Thành', 'Xã Cẩm Thịnh', 'Xã Cẩm Trung', 'Xã Cẩm Vịnh', 'Xã Cẩm Yên'] },
            'ky-anh': { name: 'Kỳ Anh', wards: ['Thị trấn Kỳ Anh', 'Xã Kỳ Bắc', 'Xã Kỳ Châu', 'Xã Kỳ Đồng', 'Xã Kỳ Giang', 'Xã Kỳ Hải', 'Xã Kỳ Hợp', 'Xã Kỳ Khang', 'Xã Kỳ Lạc', 'Xã Kỳ Lâm', 'Xã Kỳ Liên', 'Xã Kỳ Long', 'Xã Kỳ Nam', 'Xã Kỳ Ninh', 'Xã Kỳ Phong', 'Xã Kỳ Phú', 'Xã Kỳ Sơn', 'Xã Kỳ Tân', 'Xã Kỳ Tây', 'Xã Kỳ Thọ', 'Xã Kỳ Thư', 'Xã Kỳ Thượng', 'Xã Kỳ Tiến', 'Xã Kỳ Trung', 'Xã Kỳ Văn', 'Xã Kỳ Xuân'] },
            'loc-ha': { name: 'Lộc Hà', wards: ['Thị trấn Lộc Hà', 'Xã An Lộc', 'Xã Bình Lộc', 'Xã Hộ Độ', 'Xã Hồng Lộc', 'Xã Ích Hậu', 'Xã Mai Phụ', 'Xã Phù Lưu', 'Xã Tân Lộc', 'Xã Thạch Bằng', 'Xã Thạch Châu', 'Xã Thạch Kim', 'Xã Thạch Mỹ', 'Xã Thịnh Lộc'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    },
    'hau-giang': {
        name: 'Hậu Giang',
        districts: {
            'vi-thanh': { name: 'Vị Thanh', wards: ['Phường I', 'Phường II', 'Phường III', 'Phường IV', 'Phường V', 'Phường VII', 'Xã Hỏa Lựu', 'Xã Hỏa Tiến', 'Xã Tân Tiến', 'Xã Vị Tân', 'Xã Vị Thắng', 'Xã Vị Thủy', 'Xã Vị Trung', 'Xã Vĩnh Thuận Đông', 'Xã Vĩnh Thuận Tây', 'Xã Vĩnh Trung', 'Xã Vĩnh Tường'] },
            'nga-bay': { name: 'Ngã Bảy', wards: ['Phường Hiệp Lợi', 'Phường Hiệp Thành', 'Phường Lái Hiếu', 'Phường Ngã Bảy', 'Xã Đại Thành', 'Xã Hiệp Lợi', 'Xã Tân Thành', 'Xã Tân Thạnh'] },
            'chau-thanh-a': { name: 'Châu Thành A', wards: ['Thị trấn Một Ngàn', 'Xã Đông Phú', 'Xã Đông Phước', 'Xã Đông Phước A', 'Xã Đông Thạnh', 'Xã Phú Hữu', 'Xã Phú Tân', 'Xã Tân Hòa', 'Xã Tân Hội', 'Xã Tân Long', 'Xã Tân Phú Thạnh', 'Xã Thạnh Hòa', 'Xã Thạnh Lộc', 'Xã Thạnh Lợi', 'Xã Thạnh Phú', 'Xã Thạnh Quới', 'Xã Thạnh Thắng', 'Xã Thạnh Tiến', 'Xã Thạnh Trị', 'Xã Vĩnh Bình', 'Xã Vĩnh Thuận', 'Xã Vĩnh Trung'] },
            'chau-thanh': { name: 'Châu Thành', wards: ['Thị trấn Ngã Sáu', 'Xã Đông Phú', 'Xã Đông Phước', 'Xã Đông Phước A', 'Xã Đông Thạnh', 'Xã Phú Hữu', 'Xã Phú Tân', 'Xã Tân Hòa', 'Xã Tân Hội', 'Xã Tân Long', 'Xã Tân Phú Thạnh', 'Xã Thạnh Hòa', 'Xã Thạnh Lộc', 'Xã Thạnh Lợi', 'Xã Thạnh Phú', 'Xã Thạnh Quới', 'Xã Thạnh Thắng', 'Xã Thạnh Tiến', 'Xã Thạnh Trị', 'Xã Vĩnh Bình', 'Xã Vĩnh Thuận', 'Xã Vĩnh Trung'] },
            'phung-hiep': { name: 'Phụng Hiệp', wards: ['Thị trấn Búng Tàu', 'Thị trấn Cây Dương', 'Thị trấn Kinh Cùng', 'Thị trấn Phụng Hiệp', 'Xã Bình Thành', 'Xã Hiệp Hưng', 'Xã Hòa An', 'Xã Hòa Mỹ', 'Xã Long Thạnh', 'Xã Phương Bình', 'Xã Phương Phú', 'Xã Tân Bình', 'Xã Tân Long', 'Xã Tân Phú Hưng', 'Xã Thạnh Hòa', 'Xã Thạnh Lộc', 'Xã Thạnh Lợi', 'Xã Thạnh Phú', 'Xã Thạnh Quới', 'Xã Thạnh Thắng', 'Xã Thạnh Tiến', 'Xã Thạnh Trị', 'Xã Vĩnh Bình', 'Xã Vĩnh Thuận', 'Xã Vĩnh Trung'] },
            'vi-thuy': { name: 'Vị Thủy', wards: ['Thị trấn Nàng Mau', 'Xã Vị Bình', 'Xã Vị Đông', 'Xã Vị Thắng', 'Xã Vị Thanh', 'Xã Vị Thủy', 'Xã Vị Trung', 'Xã Vĩnh Thuận Đông', 'Xã Vĩnh Thuận Tây', 'Xã Vĩnh Trung', 'Xã Vĩnh Tường'] },
            'long-my': { name: 'Long Mỹ', wards: ['Thị trấn Long Mỹ', 'Thị trấn Trà Lồng', 'Xã Long Bình', 'Xã Long Phú', 'Xã Long Trị', 'Xã Long Trị A', 'Xã Lương Nghĩa', 'Xã Lương Tâm', 'Xã Tân Phú', 'Xã Thuận Hòa', 'Xã Thuận Hưng', 'Xã Vĩnh Thuận Đông', 'Xã Vĩnh Thuận Tây', 'Xã Vĩnh Viễn', 'Xã Vĩnh Viễn A', 'Xã Xà Phiên'] }
        },
        departments: ['Sở Nội vụ', 'Sở Tài chính', 'Sở Kế hoạch và Đầu tư', 'Sở Tư pháp', 'Sở Y tế', 'Sở Giáo dục và Đào tạo', 'Sở Lao động - Thương binh và Xã hội', 'Sở Văn hóa và Thể thao', 'Sở Thông tin và Truyền thông', 'Sở Khoa học và Công nghệ', 'Sở Tài nguyên và Môi trường', 'Sở Giao thông Vận tải', 'Sở Xây dựng', 'Sở Công Thương', 'Sở Nông nghiệp và Phát triển nông thôn']
    }
};

// Hàm tạo dữ liệu mẫu cho các tỉnh chưa có dữ liệu chi tiết
function generateGenericDistricts(provinceName) {
    // Tên huyện mẫu phổ biến
    const districtNames = [
        'An', 'Bình', 'Cẩm', 'Đông', 'Hòa', 'Hưng', 'Long', 'Mỹ', 
        'Nam', 'Phú', 'Quảng', 'Tân', 'Thạnh', 'Thanh', 'Thiện', 
        'Trung', 'Vĩnh', 'Xuân', 'Yên', 'Đức', 'Lộc', 'Sơn', 'Thủy',
        'Bắc', 'Tây', 'Hải', 'Kim', 'Lai', 'Minh', 'Phong', 'Thái'
    ];
    
    // Tên phường/xã mẫu phổ biến
    const wardNames = [
        'An', 'Bình', 'Cẩm', 'Đông', 'Hòa', 'Hưng', 'Long', 'Mỹ',
        'Nam', 'Phú', 'Quảng', 'Tân', 'Thạnh', 'Thanh', 'Thiện',
        'Trung', 'Vĩnh', 'Xuân', 'Yên', 'Đức', 'Lộc', 'Sơn', 'Thủy',
        'Bắc', 'Tây', 'Hải', 'Kim', 'Lai', 'Minh', 'Phong', 'Thái',
        'Đông', 'Tây', 'Nam', 'Bắc', 'Trung', 'Thượng', 'Hạ', 
        'Đông Nam', 'Tây Bắc', 'Đông Bắc', 'Tây Nam', 'Trung Tâm',
        'Phú', 'Hưng', 'Thịnh', 'Phúc', 'Lộc', 'Thọ', 'An', 'Bình'
    ];
    
    // Lấy tên tỉnh ngắn gọn (bỏ "Tỉnh" hoặc "Thành phố")
    const shortProvinceName = provinceName.replace(/^(Tỉnh|Thành phố)\s+/i, '');
    
    const genericDistricts = [
        { name: 'Thành phố ' + shortProvinceName, type: 'city' },
        { name: 'Thị xã ' + shortProvinceName, type: 'town' }
    ];
    
    // Thêm 15-20 huyện
    for (let i = 0; i < 18; i++) {
        genericDistricts.push({
            name: 'Huyện ' + districtNames[i % districtNames.length],
            type: 'district'
        });
    }
    
    const districts = {};
    genericDistricts.forEach((dist, index) => {
        const wards = [];
        if (dist.type === 'city') {
            // Thành phố có nhiều phường (15-25 phường)
            const numWards = 20 + Math.floor(Math.random() * 6);
            for (let i = 0; i < numWards; i++) {
                if (i < wardNames.length) {
                    wards.push('Phường ' + wardNames[i]);
                } else {
                    const wardNum = i + 1;
                    wards.push('Phường ' + wardNum);
                }
            }
        } else if (dist.type === 'town') {
            // Thị xã có ít phường hơn (10-15 phường)
            const numWards = 12 + Math.floor(Math.random() * 4);
            for (let i = 0; i < numWards; i++) {
                if (i < wardNames.length) {
                    wards.push('Phường ' + wardNames[i]);
                } else {
                    const wardNum = i + 1;
                    wards.push('Phường ' + wardNum);
                }
            }
        } else {
            // Huyện có nhiều xã (25-35 xã)
            const numWards = 30 + Math.floor(Math.random() * 6);
            const districtShortName = dist.name.replace('Huyện ', '');
            const wardPrefixes = ['Xã', 'Thị trấn'];
            for (let i = 0; i < numWards; i++) {
                const prefix = i === 0 ? 'Thị trấn' : 'Xã'; // Thị trấn đầu tiên
                if (i < wardNames.length) {
                    wards.push(prefix + ' ' + wardNames[i]);
                } else {
                    const wardNum = i + 1;
                    if (i === 0) {
                        wards.push('Thị trấn ' + districtShortName);
                    } else {
                        wards.push('Xã ' + districtShortName + ' ' + wardNum);
                    }
                }
            }
        }
        districts['district-' + index] = { name: dist.name, wards: wards };
    });
    
    return districts;
}

// Danh sách đầy đủ 63 tỉnh/thành phố Việt Nam (loại bỏ các tỉnh đã có dữ liệu chi tiết)
const allProvinces = [
    'Bắc Kạn', 
    'Cao Bằng', 
    'Đắk Lắk', 
    'Đắk Nông', 
    'Điện Biên', 
    'Đồng Tháp', 
    'Gia Lai', 
    'Hà Giang', 
    'Hà Nam', 
    'Hà Tĩnh', 
    'Hậu Giang', 
    'Hòa Bình', 
    'Hưng Yên', 
    'Kon Tum', 
    'Lai Châu', 
    'Lạng Sơn', 
    'Lào Cai', 
    'Long An', 
    'Nam Định', 
    'Ninh Bình', 
    'Ninh Thuận', 
    'Phú Thọ', 
    'Phú Yên', 
    'Quảng Bình', 
    'Quảng Nam', 
    'Quảng Ngãi', 
    'Quảng Trị', 
    'Sóc Trăng', 
    'Sơn La', 
    'Tây Ninh', 
    'Thái Bình', 
    'Thái Nguyên', 
    'Tiền Giang', 
    'Trà Vinh', 
    'Tuyên Quang', 
    'Vĩnh Long', 
    'Vĩnh Phúc', 
    'Yên Bái'
];

// Danh sách đầy đủ các Sở/Ban ngành
const allDepartments = [
    'Sở Nội vụ',
    'Sở Tài chính',
    'Sở Kế hoạch và Đầu tư',
    'Sở Tư pháp',
    'Sở Y tế',
    'Sở Giáo dục và Đào tạo',
    'Sở Lao động - Thương binh và Xã hội',
    'Sở Văn hóa và Thể thao',
    'Sở Thông tin và Truyền thông',
    'Sở Khoa học và Công nghệ',
    'Sở Tài nguyên và Môi trường',
    'Sở Giao thông Vận tải',
    'Sở Xây dựng',
    'Sở Công Thương',
    'Sở Nông nghiệp và Phát triển nông thôn',
    'Sở Du lịch',
    'Sở Quy hoạch - Kiến trúc',
    'Sở Tài chính - Kế hoạch',
    'Ban Dân tộc',
    'Ban Tôn giáo',
    'Ban Quản lý Khu công nghiệp',
    'Ban Quản lý Dự án',
    'Cục Thuế',
    'Cục Hải quan',
    'Cục Thống kê',
    'Cục Quản lý Thị trường',
    'Chi cục Bảo vệ Môi trường',
    'Chi cục Phát triển Nông thôn',
    'Trung tâm Dịch vụ Công',
    'Văn phòng UBND',
    'Phòng Nội vụ',
    'Phòng Tài chính - Kế hoạch',
    'Phòng Tư pháp',
    'Phòng Y tế',
    'Phòng Giáo dục và Đào tạo',
    'Phòng Lao động - Thương binh và Xã hội',
    'Phòng Văn hóa và Thông tin',
    'Phòng Tài nguyên và Môi trường',
    'Phòng Kinh tế',
    'Phòng Nông nghiệp và Phát triển nông thôn'
];

// Khởi tạo dropdown tỉnh thành
function initProvinceSelectors() {
    const provinceSelects = document.querySelectorAll('#province, #searchProvince');
    const wardSelects = document.querySelectorAll('#ward, #searchWard');
    // Chỉ populate departments cho searchDepartment, không populate cho soBanNganh (form đã có danh sách cố định)
    const searchDepartmentSelect = document.getElementById('searchDepartment');
    if (searchDepartmentSelect) {
        allDepartments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            searchDepartmentSelect.appendChild(option);
        });
    }
    
    // Populate provinces
    provinceSelects.forEach(select => {
        // Thêm các tỉnh có dữ liệu chi tiết
        const detailedProvinces = [
            { value: 'ha-noi', name: 'Hà Nội' },
            { value: 'ho-chi-minh', name: 'Hồ Chí Minh' },
            { value: 'da-nang', name: 'Đà Nẵng' },
            { value: 'can-tho', name: 'Cần Thơ' },
            { value: 'hai-phong', name: 'Hải Phòng' },
            { value: 'dong-nai', name: 'Đồng Nai' },
            { value: 'binh-duong', name: 'Bình Dương' },
            { value: 'an-giang', name: 'An Giang' },
            { value: 'khanh-hoa', name: 'Khánh Hòa' },
            { value: 'quang-ninh', name: 'Quảng Ninh' },
            { value: 'thanh-hoa', name: 'Thanh Hóa' },
            { value: 'nghe-an', name: 'Nghệ An' },
            { value: 'thua-thien-hue', name: 'Thừa Thiên Huế' },
            { value: 'lam-dong', name: 'Lâm Đồng' },
            { value: 'ba-ria-vung-tau', name: 'Bà Rịa - Vũng Tàu' },
            { value: 'kien-giang', name: 'Kiên Giang' },
            { value: 'bac-lieu', name: 'Bạc Liêu' },
            { value: 'bac-giang', name: 'Bắc Giang' },
            { value: 'bac-ninh', name: 'Bắc Ninh' },
            { value: 'ben-tre', name: 'Bến Tre' },
            { value: 'binh-dinh', name: 'Bình Định' },
            { value: 'binh-phuoc', name: 'Bình Phước' },
            { value: 'binh-thuan', name: 'Bình Thuận' },
            { value: 'ca-mau', name: 'Cà Mau' },
            { value: 'hai-duong', name: 'Hải Dương' }
        ];
        
        detailedProvinces.forEach(prov => {
            const option = document.createElement('option');
            option.value = prov.value;
            option.textContent = prov.name;
            select.appendChild(option);
        });
        
        // Thêm các tỉnh thành còn lại
        allProvinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province.toLowerCase().replace(/\s+/g, '-').replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a').replace(/[èéẹẻẽêềếệểễ]/g, 'e').replace(/[ìíịỉĩ]/g, 'i').replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o').replace(/[ùúụủũưừứựửữ]/g, 'u').replace(/[ỳýỵỷỹ]/g, 'y').replace(/đ/g, 'd');
            option.textContent = province;
            select.appendChild(option);
        });
    });
    
    // Handle province change
    provinceSelects.forEach(select => {
        select.addEventListener('change', function () {
            const provinceId = this.value;
            const isSearch = this.id === 'searchProvince';
            const districtSelect = isSearch ? document.getElementById('searchDistrict') : null;
            const wardSelect = isSearch ? document.getElementById('searchWard') : document.getElementById('ward');
            const deptSelect = isSearch ? document.getElementById('searchDepartment') : document.getElementById('soBanNganh');
            
            // Reset districts and wards
            if (districtSelect) {
                districtSelect.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
                districtSelect.disabled = !provinceId;
            }
            if (wardSelect) {
                wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
                wardSelect.disabled = !provinceId;
            }
            // Departments không cần reset vì đã được load sẵn từ đầu
            
            if (provinceId && provincesData[provinceId]) {
                const province = provincesData[provinceId];
                
                // Populate districts
                if (districtSelect) {
                    Object.keys(province.districts).forEach(districtId => {
                        const district = province.districts[districtId];
                        const option = document.createElement('option');
                        option.value = districtId;
                        option.textContent = district.name;
                        districtSelect.appendChild(option);
                    });
                    districtSelect.disabled = false;
                }
                
                // Populate all wards from all districts
                if (wardSelect) {
                    const allWards = [];
                    Object.keys(province.districts).forEach(districtId => {
                        const district = province.districts[districtId];
                        if (district.wards) {
                            district.wards.forEach(ward => {
                                if (!allWards.includes(ward)) {
                                    allWards.push(ward);
                                }
                            });
                        }
                    });
                    
                    allWards.sort().forEach(ward => {
                        const option = document.createElement('option');
                        option.value = ward;
                        option.textContent = ward;
                        wardSelect.appendChild(option);
                    });
                    wardSelect.disabled = false;
                }
                
                // Departments đã được populate từ đầu, không cần load lại
            } else if (provinceId) {
                // For other provinces, generate generic districts and departments
                const provinceName = this.options[this.selectedIndex].text;
                const genericDistricts = generateGenericDistricts(provinceName);
                
                // Populate districts
                if (districtSelect) {
                    Object.keys(genericDistricts).forEach(districtId => {
                        const district = genericDistricts[districtId];
                        const option = document.createElement('option');
                        option.value = districtId;
                        option.textContent = district.name;
                        districtSelect.appendChild(option);
                    });
                    districtSelect.disabled = false;
                }
                
                // Populate all wards from all generic districts
                if (wardSelect) {
                    const allWards = [];
                    Object.keys(genericDistricts).forEach(districtId => {
                        const district = genericDistricts[districtId];
                        if (district.wards) {
                            district.wards.forEach(ward => {
                                if (!allWards.includes(ward)) {
                                    allWards.push(ward);
                                }
                            });
                        }
                    });
                    
                    allWards.sort().forEach(ward => {
                        const option = document.createElement('option');
                        option.value = ward;
                        option.textContent = ward;
                        wardSelect.appendChild(option);
                    });
                    wardSelect.disabled = false;
                }
                
                // Departments đã được populate từ đầu, không cần load lại
                
                // Store generic districts for later use
                if (!window.genericDistrictsData) {
                    window.genericDistrictsData = {};
                }
                window.genericDistrictsData[provinceId] = genericDistricts;
            }
        });
    });
    
    // Handle district change for search form
    const searchDistrictSelect = document.getElementById('searchDistrict');
    if (searchDistrictSelect) {
        searchDistrictSelect.addEventListener('change', function () {
            const districtId = this.value;
            const provinceId = document.getElementById('searchProvince')?.value;
            const wardSelect = document.getElementById('searchWard');
            
            if (!wardSelect || !provinceId) return;
            
            // Reset wards
            wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
            
            let districts = null;
            
            // Get districts from provincesData or genericDistrictsData
            if (provincesData[provinceId]) {
                districts = provincesData[provinceId].districts;
            } else if (window.genericDistrictsData && window.genericDistrictsData[provinceId]) {
                districts = window.genericDistrictsData[provinceId];
            }
            
            if (districts) {
                if (districtId && districts[districtId] && districts[districtId].wards) {
                    // Show only wards from selected district
                    const wards = districts[districtId].wards;
                    wards.sort().forEach(ward => {
                        const option = document.createElement('option');
                        option.value = ward;
                        option.textContent = ward;
                        wardSelect.appendChild(option);
                    });
                    wardSelect.disabled = false;
                } else if (!districtId) {
                    // If no district selected, show all wards from all districts
                    const allWards = [];
                    Object.keys(districts).forEach(distId => {
                        const district = districts[distId];
                        if (district.wards) {
                            district.wards.forEach(ward => {
                                if (!allWards.includes(ward)) {
                                    allWards.push(ward);
                                }
                            });
                        }
                    });
                    
                    allWards.sort().forEach(ward => {
                        const option = document.createElement('option');
                        option.value = ward;
                        option.textContent = ward;
                        wardSelect.appendChild(option);
                    });
                    wardSelect.disabled = false;
                }
            }
        });
    }
}

// Kiểm tra trạng thái đăng ký liên kết ngân hàng
function checkBankSyncStatus() {
    const registrations = localStorage.getItem('bankSyncRegistrations');
    if (registrations) {
        const regs = JSON.parse(registrations);
        // Kiểm tra xem có đăng ký nào đã được phê duyệt không
        const approvedReg = regs.find(reg => reg.status === 'approved' || reg.status === 'pending');
        if (approvedReg) {
            // Tự động check checkbox nếu đã có đăng ký
            const bankSyncCheckbox = document.getElementById('bankSync');
            if (bankSyncCheckbox) {
                bankSyncCheckbox.checked = true;
            }
        }
    }
}

// Render danh sách khi trang được tải
document.addEventListener('DOMContentLoaded', function () {
    // Khởi tạo trường ngày hẹn (chỉ nếu element tồn tại)
    if (document.getElementById('appointmentDate') && document.getElementById('appointmentDateDisplay')) {
    initAppointmentDateField();
    }
    // Khởi tạo select thời gian (chỉ nếu element tồn tại)
    if (document.getElementById('appointmentTime')) {
    initAppointmentTimeSelect();
    }
    initLogo();
    initThemeSelector();
    initProvinceSelectors();
    // Chỉ render appointments nếu đang ở trang có element appointmentsList
    if (document.getElementById('appointmentsList')) {
    renderAppointments();
    }
    checkBankSyncStatus();
    initNavigationMenu();
    initSearchAdvanced();
    initFeaturedServiceButtons();
    initServiceFormModal();
    initCategoryLinks();
    initSubmenuLinks();
    initRegistrationFormModal();
});

// Xử lý các category links - điền vào ô tìm kiếm và mở panel
function initCategoryLinks() {
    const categoryLinks = document.querySelectorAll('.category-link');
    if (!categoryLinks.length) return;
    
    const searchInput = document.getElementById('searchInputMain');
    const advancedPanel = document.getElementById('searchAdvancedPanel');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            
            // Lấy tên dịch vụ từ text của link
            const serviceName = this.textContent.trim();
            
            // Điền vào ô tìm kiếm
            if (searchInput) {
                searchInput.value = serviceName;
                searchInput.focus();
            }
            
            // Mở panel tìm kiếm nâng cao nếu đang ẩn
            if (advancedPanel && advancedPanel.style.display === 'none') {
                advancedPanel.style.display = 'block';
                setTimeout(() => {
                    advancedPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
            
            // Hiển thị thông báo
            showNotification(`Đã chọn: ${serviceName}`, 'info');
        });
    });
}

// Xử lý các submenu links chưa có handler
function initSubmenuLinks() {
    // Xử lý các submenu links không có ID hoặc onclick
    const submenuLinks = document.querySelectorAll('.submenu a:not([id]):not([onclick])');
    if (!submenuLinks.length) return;
    
    const searchInput = document.getElementById('searchInputMain');
    const advancedPanel = document.getElementById('searchAdvancedPanel');
    
    submenuLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            
            // Lấy tên dịch vụ từ text (bỏ icon SVG)
            const textContent = Array.from(this.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .join(' ')
                .trim();
            
            const serviceName = textContent || this.textContent.trim();
            
            // Điền vào ô tìm kiếm
            if (searchInput) {
                searchInput.value = serviceName;
                searchInput.focus();
            }
            
            // Mở panel tìm kiếm nâng cao nếu đang ẩn
            if (advancedPanel && advancedPanel.style.display === 'none') {
                advancedPanel.style.display = 'block';
                setTimeout(() => {
                    advancedPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
            
            // Đóng menu mobile nếu đang mở
            const navMenu = document.getElementById('navMenu');
            if (navMenu && navMenu.classList.contains('active')) {
                const navToggle = document.getElementById('navToggle');
                if (navToggle) {
                    navToggle.click();
                }
            }
            
            // Hiển thị thông báo
            showNotification(`Đã chọn: ${serviceName}`, 'info');
        });
    });
    
    // Xử lý các menu items chính không có submenu
    const mainMenuItems = document.querySelectorAll('.nav-item:not(.has-submenu) .nav-link');
    mainMenuItems.forEach(link => {
        // Bỏ qua nút Trang chủ (đã có handler riêng)
        if (link.closest('.nav-item-home')) return;
        
        link.addEventListener('click', function (e) {
            e.preventDefault();
            
            const menuText = this.querySelector('span')?.textContent.trim() || this.textContent.trim();
            
            // Điền vào ô tìm kiếm
            if (searchInput) {
                searchInput.value = menuText;
                searchInput.focus();
            }
            
            // Mở panel tìm kiếm nâng cao nếu đang ẩn
            if (advancedPanel && advancedPanel.style.display === 'none') {
                advancedPanel.style.display = 'block';
                setTimeout(() => {
                    advancedPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
            
            // Đóng menu mobile nếu đang mở
            const navMenu = document.getElementById('navMenu');
            if (navMenu && navMenu.classList.contains('active')) {
                const navToggle = document.getElementById('navToggle');
                if (navToggle) {
                    navToggle.click();
                }
            }
            
            // Hiển thị thông báo
            showNotification(`Đã chọn: ${menuText}`, 'info');
        });
    });
}

// Gắn chức năng cho các nút dịch vụ nổi bật
function initFeaturedServiceButtons() {
    const buttons = document.querySelectorAll('.featured-service-btn');
    if (!buttons.length) {
        return;
    }
    
    const searchInput = document.getElementById('searchInputMain');
    const advancedPanel = document.getElementById('searchAdvancedPanel');
    
    buttons.forEach((button, index) => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            
            const serviceName = button.dataset.serviceName ||
                (button.querySelector('.featured-service-title')
                    ? button.querySelector('.featured-service-title').textContent.trim()
                    : button.textContent.trim());
            
            // Điền tên dịch vụ vào ô tìm kiếm
            if (searchInput) {
                searchInput.value = serviceName;
                searchInput.focus();
            }
            
            // Mở panel tìm kiếm nâng cao
            if (advancedPanel && advancedPanel.style.display === 'none') {
                advancedPanel.style.display = 'block';
                // Cuộn đến panel
                setTimeout(() => {
                    advancedPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
            
            // Xử lý chức năng đặc biệt cho từng nút
            const action = button.dataset.action;
            const openForm = button.dataset.openForm;
            
            if (openForm === 'true' || action === 'form') {
                // Điều hướng đến trang đăng ký thủ tục nhà đất
                if (serviceName === 'Dịch vụ công trực tuyến' || serviceName.includes('Dịch vụ công')) {
                    // Kiểm tra nếu có href hợp lệ, để browser xử lý điều hướng tự nhiên
                    const href = button.getAttribute('href');
                    if (href && href !== '#' && href.includes('dang-ky-thu-tuc-nha-dat.html')) {
                        // Cho phép điều hướng tự nhiên, không cần preventDefault
                        window.location.href = href;
                        return;
                    }
                    // Nếu không có href, điều hướng bằng JavaScript
                    window.location.href = 'dang-ky-thu-tuc-nha-dat.html';
                    return;
                } else {
                    // Mở form đăng ký cho các dịch vụ khác
                    openServiceForm(serviceName);
                }
            } else if (action === 'search') {
                // Thực hiện tìm kiếm
                performServiceSearch(serviceName);
            } else if (action === 'redirect') {
                // Chuyển hướng đến trang dịch vụ
                const redirectUrl = button.dataset.url || '#';
                if (redirectUrl !== '#') {
                    window.location.href = redirectUrl;
                    return;
                }
            } else {
                // Mặc định: chỉ điền vào ô tìm kiếm và mở panel
                // Không làm gì thêm
            }
            
            // Thêm hiệu ứng visual
            button.style.transform = 'scale(0.98)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
            
            // Log hành động
            console.log('Người dùng đã chọn dịch vụ:', {
                serviceName: serviceName,
                action: action || 'default',
                timestamp: new Date().toISOString()
            });
            
            showNotification(`Đã chọn dịch vụ: ${serviceName}`, 'info');
        });
        
        // Thêm hiệu ứng hover tốt hơn
        button.addEventListener('mouseenter', function () {
            this.style.transition = 'all 0.3s ease';
        });
    });
}

// Hàm thực hiện tìm kiếm dịch vụ
function performServiceSearch(serviceName) {
    console.log('Đang tìm kiếm dịch vụ:', serviceName);
    
    // Lưu lịch sử tìm kiếm
    const searchHistory = JSON.parse(localStorage.getItem('serviceSearchHistory') || '[]');
    const searchEntry = {
        keyword: serviceName,
        timestamp: new Date().toISOString()
    };
    searchHistory.unshift(searchEntry);
    // Giữ tối đa 50 lần tìm kiếm
    if (searchHistory.length > 50) {
        searchHistory.pop();
    }
    localStorage.setItem('serviceSearchHistory', JSON.stringify(searchHistory));
    
    showNotification(`Đang tìm kiếm: ${serviceName}...`, 'info');
    
    // Có thể thêm logic tìm kiếm thực tế ở đây
    // Ví dụ: gọi API, lọc danh sách dịch vụ, etc.
    
    // Giả lập tìm kiếm
    setTimeout(() => {
        showNotification(`Tìm thấy các dịch vụ liên quan đến "${serviceName}"`, 'success');
    }, 1000);
}

function openServiceForm(serviceName) {
    const modal = document.getElementById('serviceFormModal');
    if (!modal) {
        console.warn('Không tìm thấy modal form dịch vụ');
        return;
    }
    
    const title = document.getElementById('serviceFormTitle');
    if (title) {
        title.textContent = serviceName ? `Đăng ký ${serviceName}` : 'Đăng ký dịch vụ';
    }
    
    // Điền tên dịch vụ vào form nếu có trường tương ứng
    const serviceInput = document.getElementById('serviceFormServiceName') || 
                         modal.querySelector('input[name="dichVuCong"], input[placeholder*="dịch vụ"], input[placeholder*="Dịch vụ"]');
    if (serviceInput) {
        serviceInput.value = serviceName;
    }
    
    // Focus vào trường đầu tiên
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
        setTimeout(() => {
            firstInput.focus();
        }, 300);
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Cuộn lên đầu modal
    setTimeout(() => {
        modal.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
}

function initServiceFormModal() {
    const modal = document.getElementById('serviceFormModal');
    if (!modal) return;
    
    const closeBtn = document.getElementById('closeServiceFormModal');
    const cancelBtn = document.getElementById('cancelServiceForm');
    const form = document.getElementById('serviceForm');
    
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            
            // Lấy dữ liệu form
            const formData = new FormData(form);
            const data = {};
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                const name = input.name || input.id || input.getAttribute('placeholder') || 'field';
                if (input.type === 'checkbox') {
                    data[name] = input.checked;
                } else if (input.type === 'radio') {
                    if (input.checked) {
                        data[name] = input.value;
                    }
                } else {
                    data[name] = input.value;
                }
            });
            
            // Validate form
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#dc3545';
                    setTimeout(() => {
                        field.style.borderColor = '';
                    }, 2000);
                }
            });
            
            if (!isValid) {
                showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
                return;
            }
            
            // Lưu vào localStorage (có thể gửi lên server sau)
            const registrations = JSON.parse(localStorage.getItem('serviceRegistrations') || '[]');
            const newRegistration = {
                id: Date.now().toString(),
                serviceName: document.getElementById('serviceFormTitle')?.textContent || 'Dịch vụ',
                data: data,
                createdAt: new Date().toISOString()
            };
            registrations.push(newRegistration);
            localStorage.setItem('serviceRegistrations', JSON.stringify(registrations));
            
            console.log('Đã lưu đăng ký dịch vụ:', newRegistration);
            
            showNotification('Đã gửi thông tin đăng ký dịch vụ thành công', 'success');
            
            // Reset form sau 1 giây
            setTimeout(() => {
                form.reset();
                closeModal();
            }, 1500);
        });
    }
}

// Khởi tạo tìm kiếm nâng cao
function initSearchAdvanced() {
    const btnAdvanced = document.querySelector('.btn-search-advanced');
    const panel = document.getElementById('searchAdvancedPanel');
    const searchInputMain = document.getElementById('searchInputMain');
    const btnSearchMain = document.getElementById('btnSearchMain');
    
    // Toggle panel tìm kiếm nâng cao
    if (btnAdvanced && panel) {
        btnAdvanced.addEventListener('click', function () {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }
    
    // Xử lý tìm kiếm chính
    function performSearch() {
        const keyword = searchInputMain ? searchInputMain.value.trim() : '';
        if (keyword) {
            console.log('Đang tìm kiếm:', keyword);
            // Có thể thêm logic tìm kiếm thực tế ở đây
            showNotification('Đang tìm kiếm: ' + keyword, 'info');
        } else {
            showNotification('Vui lòng nhập từ khóa tìm kiếm', 'warning');
        }
    }
    
    // Tìm kiếm khi nhấn Enter
    if (searchInputMain) {
        searchInputMain.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
}

// Khởi tạo menu điều hướng responsive
function initNavigationMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    const navItems = document.querySelectorAll('.nav-item.has-submenu');

    // Hàm đóng menu
    function closeMenu() {
        if (navToggle) navToggle.classList.remove('active');
        if (navMenu) navMenu.classList.remove('active');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    }

    // Hàm mở menu
    function openMenu() {
        if (navToggle) navToggle.classList.add('active');
        if (navMenu) navMenu.classList.add('active');
        if (navOverlay) navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
    }

    // Toggle menu mobile
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            if (navMenu.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Đóng menu khi click vào overlay
        if (navOverlay) {
            navOverlay.addEventListener('click', function () {
                closeMenu();
            });
        }

        // Đóng menu khi click bên ngoài
        document.addEventListener('click', function (e) {
            if (window.innerWidth <= 768) {
                if (!navMenu.contains(e.target) && !navToggle.contains(e.target) && navMenu.classList.contains('active')) {
                    closeMenu();
                }
            }
        });

        // Xử lý submenu trên mobile
        navItems.forEach(item => {
            const navLink = item.querySelector('.nav-link');
            if (navLink) {
                navLink.addEventListener('click', function (e) {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        e.stopPropagation();
                        item.classList.toggle('active');
                    }
                });
            }
        });

        // Đóng menu khi resize về desktop
        window.addEventListener('resize', function () {
            if (window.innerWidth > 768) {
                closeMenu();
                navItems.forEach(item => item.classList.remove('active'));
            }
        });

        // Đóng menu khi nhấn phím ESC
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMenu();
            }
        });

        // Xử lý nút "Trang chủ" - điều hướng về trang chủ hoặc scroll về đầu trang
        const homeNavItem = document.querySelector('.nav-item-home');
        if (homeNavItem) {
            const homeLink = homeNavItem.querySelector('.nav-link');
            if (homeLink) {
                homeLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    
                    // Đóng menu nếu đang mở (mobile)
                    if (navMenu && navMenu.classList.contains('active')) {
                        closeMenu();
                    }
                    
                    // Kiểm tra xem có đang ở trang index.html không
                    const currentPath = window.location.pathname;
                    const currentPage = currentPath.split('/').pop() || '';
                    const isHomePage = currentPage === 'index.html' || 
                                      currentPage === '' || 
                                      currentPage.endsWith('/') ||
                                      currentPath.includes('index.html');
                    
                    if (isHomePage) {
                        // Đang ở trang chủ, scroll về đầu trang
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                        // Đang ở trang khác, điều hướng về trang chủ
                        window.location.href = 'index.html';
                    }
                });
            }
        }
    }
}



// Khởi tạo khi DOM ready
function initAllModals() {
    console.log('Đã khởi tạo tất cả modal');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllModals);
} else {
    initAllModals();
}

// Hàm toggle form đăng ký
function toggleRegisterForm(button) {
    if (!button) {
        console.error('toggleRegisterForm: button không tồn tại');
        return;
    }
    
    const procedureItem = button.closest('.procedure-item');
    if (!procedureItem) {
        console.error('toggleRegisterForm: Không tìm thấy .procedure-item');
        return;
    }
    
    const form = procedureItem.querySelector('.procedure-register-form');
    if (!form) {
        console.error('toggleRegisterForm: Không tìm thấy .procedure-register-form');
        return;
    }
    
    const isVisible = form.style.display !== 'none';
    
    if (isVisible) {
        form.style.display = 'none';
        button.textContent = 'Đăng ký';
    } else {
        form.style.display = 'block';
        button.textContent = 'Ẩn form';
        
        // Scroll đến form
        setTimeout(() => {
            form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// Hàm xử lý submit form đăng ký
function handleRegisterSubmit(event, form) {
    if (!event || !form) {
        console.error('handleRegisterSubmit: thiếu tham số');
        return false;
    }
    
    event.preventDefault();
    
    const formData = new FormData(form);
    const procedureItem = form.closest('.procedure-item');
    const procedureLink = procedureItem ? procedureItem.querySelector('.procedure-link') : null;
    const procedureName = procedureLink ? procedureLink.textContent.trim() : 'Thủ tục';
    
    // Lấy dữ liệu từ form
    const formInputs = form.querySelectorAll('input, textarea, select');
    const data = {};
    formInputs.forEach(input => {
        const label = input.closest('.form-group')?.querySelector('label');
        const fieldName = label ? label.textContent.replace('*', '').trim() : input.type || input.name || 'field';
        data[fieldName] = input.value;
    });
    
    // Kiểm tra các trường bắt buộc
    const requiredFields = form.querySelectorAll('input[required], textarea[required], select[required]');
    let hasError = false;
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            hasError = true;
            field.style.borderColor = '#dc3545';
            setTimeout(() => {
                field.style.borderColor = '';
            }, 2000);
        }
    });
    
    if (hasError) {
        showNotification('Vui lòng điền đầy đủ các trường bắt buộc!', 'error');
        return false;
    }
    
    // Hiển thị thông báo
    showNotification(`Đã gửi đăng ký cho: ${procedureName}`, 'success');
    
    // Reset form
    form.reset();
    
    // Ẩn form sau 2 giây
    setTimeout(() => {
        const formContainer = form.closest('.procedure-register-form');
        if (formContainer) {
            formContainer.style.display = 'none';
            const button = procedureItem.querySelector('.btn-register-procedure');
            if (button) {
                button.textContent = 'Đăng ký';
            }
        }
    }, 2000);
    
    // Log dữ liệu (có thể gửi lên server sau)
    console.log('Đã gửi biểu mẫu:', {
        thủ_tục: procedureName,
        dữ_liệu: data
    });
    
    return false;
}

// Đặt các hàm vào window để có thể gọi từ onclick/onsubmit inline
window.toggleRegisterForm = toggleRegisterForm;
window.handleRegisterSubmit = handleRegisterSubmit;

// ==================== Xử lý Form Đăng Ký Thủ Tục Hành Chính ====================

// Mở modal form đăng ký thủ tục hành chính
function openRegistrationFormModal() {
    const modal = document.getElementById('registrationFormModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Reset form
        const form = document.getElementById('registrationForm');
        if (form) {
            form.reset();
            // Ẩn phần OTP ban đầu
            const otpSection = document.getElementById('otpSection');
            if (otpSection) {
                otpSection.style.display = 'none';
            }
        }
    }
}

// Đóng modal form đăng ký
function closeRegistrationFormModal() {
    const modal = document.getElementById('registrationFormModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ==================== Hàm mở/đóng Modal Đăng Ký ====================

// Mở modal đăng ký dịch vụ
function openRegistrationFormModal() {
    const modal = document.getElementById('registrationFormModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Focus vào input đầu tiên sau khi modal mở
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
        
        console.log('Đã mở modal đăng ký dịch vụ công trực tuyến');
    } else {
        console.error('Không tìm thấy modal đăng ký dịch vụ');
    }
}

// Đóng modal đăng ký dịch vụ
function closeRegistrationFormModal() {
    const modal = document.getElementById('registrationFormModal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Reset form nếu cần
        const form = document.getElementById('registrationForm');
        if (form) {
            // Không reset form tự động, để người dùng có thể lưu bản nháp
        }
        
        // Ẩn phần OTP nếu đang hiển thị
        const otpSection = document.getElementById('otpSection');
        if (otpSection) {
            otpSection.style.display = 'none';
        }
        
        // Dừng timer OTP nếu đang chạy
        if (otpTimer) {
            clearInterval(otpTimer);
            otpTimer = null;
        }
        
        console.log('Đã đóng modal đăng ký dịch vụ');
    }
}

// LƯU Ý: Logic xử lý nút "Dịch vụ công trực tuyến" đã được tích hợp vào initFeaturedServiceButtons()
// Không cần handler riêng ở đây để tránh xung đột

// Xử lý nút đóng modal - được gọi trong DOMContentLoaded
function initRegistrationFormModal() {
    const closeBtn = document.getElementById('closeRegistrationFormModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeRegistrationFormModal);
    }
    
    // Đóng modal khi click bên ngoài
    const modal = document.getElementById('registrationFormModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeRegistrationFormModal();
            }
        });
    }
    
    // Đóng modal khi nhấn phím ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('registrationFormModal');
            if (modal && modal.style.display !== 'none') {
                closeRegistrationFormModal();
            }
        }
    });
    
    // Xử lý form submission
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistrationFormSubmit);
    }
    
    // Xử lý nút Lưu hồ sơ
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', handleSaveDraft);
    }
    
    // Xử lý nút Tải lại
    const resetFormBtn = document.getElementById('resetFormBtn');
    if (resetFormBtn) {
        resetFormBtn.addEventListener('click', function () {
            if (confirm('Bạn có chắc chắn muốn tải lại form? Tất cả dữ liệu đã nhập sẽ bị xóa.')) {
                registrationForm.reset();
                const otpSection = document.getElementById('otpSection');
                if (otpSection) {
                    otpSection.style.display = 'none';
                }
            }
        });
    }
    
    // Xử lý nút In mẫu
    const printFormBtn = document.getElementById('printFormBtn');
    if (printFormBtn) {
        printFormBtn.addEventListener('click', function () {
            window.print();
        });
    }
    
    // Xử lý gửi lại OTP
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', handleResendOTP);
    }
}

// ==================== Xử lý OTP ====================

let otpTimer = null;
let otpTimerSeconds = 300; // 5 phút

// Gửi mã OTP
function sendOTP(phoneNumber) {
    // Simulate gửi OTP (trong thực tế sẽ gọi API)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`Mã OTP cho số ${phoneNumber}: ${otpCode}`);
    
    // Lưu OTP vào sessionStorage để verify
    sessionStorage.setItem('pendingOTP', otpCode);
    sessionStorage.setItem('otpPhone', phoneNumber);
    sessionStorage.setItem('otpExpiry', Date.now() + (5 * 60 * 1000)); // 5 phút
    
    // Hiển thị phần OTP
    const otpSection = document.getElementById('otpSection');
    if (otpSection) {
        otpSection.style.display = 'block';
        otpSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Bắt đầu đếm ngược
    startOTPTimer();
    
    // Hiển thị thông báo
    showNotification(`Mã OTP đã được gửi đến số điện thoại ${phoneNumber}. Mã OTP: ${otpCode} (Demo)`, 'info');
    
    return otpCode;
}

// Xác thực OTP
function verifyOTP(inputOTP) {
    const storedOTP = sessionStorage.getItem('pendingOTP');
    const expiryTime = parseInt(sessionStorage.getItem('otpExpiry'));
    
    if (!storedOTP) {
        return { success: false, message: 'Không tìm thấy mã OTP. Vui lòng gửi lại.' };
    }
    
    if (Date.now() > expiryTime) {
        return { success: false, message: 'Mã OTP đã hết hạn. Vui lòng gửi lại.' };
    }
    
    if (inputOTP === storedOTP) {
        sessionStorage.removeItem('pendingOTP');
        sessionStorage.removeItem('otpPhone');
        sessionStorage.removeItem('otpExpiry');
        return { success: true, message: 'Xác thực OTP thành công!' };
    } else {
        return { success: false, message: 'Mã OTP không đúng. Vui lòng thử lại.' };
    }
}

// Bắt đầu đếm ngược OTP
function startOTPTimer() {
    const timerElement = document.getElementById('otpTimer');
    const resendBtn = document.getElementById('resendOtpBtn');
    
    if (!timerElement) return;
    
    otpTimerSeconds = 300; // Reset về 5 phút
    
    if (otpTimer) {
        clearInterval(otpTimer);
    }
    
    otpTimer = setInterval(() => {
        otpTimerSeconds--;
        
        const minutes = Math.floor(otpTimerSeconds / 60);
        const seconds = otpTimerSeconds % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timerElement) {
            timerElement.textContent = `Còn lại: ${timeString}`;
        }
        
        if (resendBtn) {
            if (otpTimerSeconds <= 0) {
                resendBtn.disabled = false;
                resendBtn.textContent = 'Gửi lại mã OTP';
                if (timerElement) {
                    timerElement.textContent = '';
                }
                clearInterval(otpTimer);
            } else {
                resendBtn.disabled = true;
            }
        }
        
        if (otpTimerSeconds <= 0) {
            clearInterval(otpTimer);
        }
    }, 1000);
}

// Gửi lại OTP
function handleResendOTP() {
    const phoneInput = document.querySelector('input[name="phone"]');
    if (!phoneInput || !phoneInput.value) {
        showNotification('Vui lòng nhập số điện thoại trước.', 'error');
        return;
    }
    
    sendOTP(phoneInput.value);
    showNotification('Đã gửi lại mã OTP.', 'success');
}

// Xử lý submit form đăng ký
function handleRegistrationFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Kiểm tra cam kết
    const agreeCommitment = formData.get('agreeCommitment');
    if (!agreeCommitment) {
        showNotification('Vui lòng xác nhận đồng ý cam kết.', 'error');
        return;
    }
    
    // Kiểm tra OTP nếu đã hiển thị
    const otpSection = document.getElementById('otpSection');
    const otpInput = document.getElementById('otpInput');
    
    if (otpSection && otpSection.style.display !== 'none') {
        const otpCode = otpInput ? otpInput.value.trim() : '';
        if (!otpCode) {
            showNotification('Vui lòng nhập mã OTP.', 'error');
            otpInput.focus();
            return;
        }
        
        const verifyResult = verifyOTP(otpCode);
        if (!verifyResult.success) {
            showNotification(verifyResult.message, 'error');
            if (otpInput) {
                otpInput.focus();
            }
            return;
        }
    } else {
        // Nếu chưa có OTP, gửi OTP trước
        const phoneNumber = formData.get('phone');
        if (!phoneNumber) {
            showNotification('Vui lòng nhập số điện thoại.', 'error');
            return;
        }
        
        sendOTP(phoneNumber);
        showNotification('Vui lòng nhập mã OTP để tiếp tục.', 'info');
        return;
    }
    
    // Thu thập dữ liệu form
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (key.includes('[]')) {
            const baseKey = key.replace('[]', '');
            if (!data[baseKey]) {
                data[baseKey] = [];
            }
            if (value instanceof File) {
                data[baseKey].push(value.name);
            } else {
                data[baseKey].push(value);
            }
        } else {
            if (value instanceof File) {
                data[key] = value.name;
            } else {
                data[key] = value;
            }
        }
    }
    
    // Lưu vào localStorage (hoặc gửi lên server)
    const submissions = JSON.parse(localStorage.getItem('registrationSubmissions') || '[]');
    const submission = {
        id: Date.now().toString(),
        ...data,
        submittedAt: new Date().toISOString(),
        status: 'pending'
    };
    submissions.push(submission);
    localStorage.setItem('registrationSubmissions', JSON.stringify(submissions));
    
    // Hiển thị thông báo thành công
    showNotification('Đã gửi yêu cầu xử lý thành công! Mã hồ sơ: ' + submission.id, 'success');
    
    // Reset form và đóng modal sau 2 giây
    setTimeout(() => {
        form.reset();
        closeRegistrationFormModal();
        if (otpSection) {
            otpSection.style.display = 'none';
        }
        if (otpTimer) {
            clearInterval(otpTimer);
        }
    }, 2000);
    
    // Log dữ liệu
    console.log('Đã gửi đăng ký thủ tục hành chính:', submission);
}

// Xử lý lưu bản nháp
function handleSaveDraft() {
    const form = document.getElementById('registrationForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
            data[key] = value.name;
        } else {
            data[key] = value;
        }
    }
    
    // Lưu vào localStorage
    const drafts = JSON.parse(localStorage.getItem('registrationDrafts') || '[]');
    const draft = {
        id: Date.now().toString(),
        ...data,
        savedAt: new Date().toISOString()
    };
    drafts.push(draft);
    localStorage.setItem('registrationDrafts', JSON.stringify(drafts));
    
    showNotification('Đã lưu bản nháp thành công!', 'success');
    console.log('Đã lưu bản nháp:', draft);
}

