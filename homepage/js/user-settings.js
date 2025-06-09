// 全局变量
let currentUserInfo = null;

// ===============================
// 用户设置管理器
// ===============================
class UserSettingsManager {
    constructor() {
        this.codeManager = new VerificationCodeManager();
        this.init();
    }

    init() {
        // 延迟初始化，确保DOM完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initEventListeners();
            });
        } else {
            this.initEventListeners();
        }
    }

    // ===============================
    // 修改密码相关功能
    // ===============================
    showChangePassword() {
        const userPhone = UserManager.getCurrentUserPhone();
        if (userPhone) {
            const verifyPhoneInput = document.getElementById('verify-phone-input');
            if (verifyPhoneInput) {
                verifyPhoneInput.value = userPhone;
            }
        }
        
        PopupManager.show('change-password-popup', () => this.resetChangePasswordPopup());
    }

    closeChangePasswordPopup() {
        PopupManager.close('change-password-popup', () => this.resetChangePasswordPopup());
    }

    resetChangePasswordPopup() {
        const verifyPhoneStep = document.getElementById('verify-phone-step');
        const changePasswordStep = document.getElementById('change-password-step');
        
        if (verifyPhoneStep) verifyPhoneStep.style.display = 'block';
        if (changePasswordStep) changePasswordStep.style.display = 'none';
        
        FormValidator.clearFields([
            'new-password', 
            'confirm-new-password', 
            'password-change-error', 
            'verify-code-area'
        ]);
        
        this.codeManager.resetButton('get-verify-code-btn');
    }

    // ===============================
    // 修改用户名相关功能
    // ===============================
    async showChangeUsername() {
        try {
            const userPhone = UserManager.getCurrentUserPhone();
            const userInfo = await APIManager.getUserInfo(userPhone);
            
            if (userInfo && userInfo.success) {
                const currentUsernameInput = document.getElementById('current-username');
                if (currentUsernameInput) {
                    currentUsernameInput.value = userInfo.data.customer_username || '';
                }
                currentUserInfo = userInfo.data;
                
                PopupManager.show('change-username-popup');
                FormValidator.clearFields(['new-username', 'username-change-error']);
            } else {
                alert('获取用户信息失败，请稍后重试');
            }
        } catch (error) {
            console.error('显示修改用户名弹窗错误:', error);
            alert('获取用户信息失败，请稍后重试');
        }
    }

    closeChangeUsernamePopup() {
        PopupManager.close('change-username-popup');
    }

    // ===============================
    // 修改手机号相关功能
    // ===============================
    showChangePhone() {
        const userPhone = UserManager.getCurrentUserPhone();
        if (userPhone) {
            const currentPhoneInput = document.getElementById('current-phone-input');
            if (currentPhoneInput) {
                currentPhoneInput.value = userPhone;
            }
        }
        
        PopupManager.show('change-phone-popup', () => this.resetChangePhonePopup());
    }

    closeChangePhonePopup() {
        PopupManager.close('change-phone-popup', () => this.resetChangePhonePopup());
    }

    resetChangePhonePopup() {
        const verifyCurrentPhoneStep = document.getElementById('verify-current-phone-step');
        const setNewPhoneStep = document.getElementById('set-new-phone-step');
        
        if (verifyCurrentPhoneStep) verifyCurrentPhoneStep.style.display = 'block';
        if (setNewPhoneStep) setNewPhoneStep.style.display = 'none';
        
        FormValidator.clearFields([
            'new-phone-input', 
            'phone-change-error', 
            'current-phone-code-area', 
            'new-phone-code-area'
        ]);
        
        const changePhoneSubmitBtn = document.getElementById('change-phone-submit-btn');
        if (changePhoneSubmitBtn) {
            changePhoneSubmitBtn.style.display = 'none';
        }
        
        this.codeManager.resetButton('get-current-phone-code-btn');
        this.codeManager.resetButton('get-new-phone-code-btn');
    }

    // ===============================
    // 验证码处理统一方法
    // ===============================
    handleVerificationCode(buttonId, containerId, successCallback) {
        const button = document.getElementById(buttonId);
        if (!button || button.disabled) return;
        
        const verificationCode = this.codeManager.generateCode();
        this.codeManager.startCountdown(buttonId);
        
        const codeInput = this.codeManager.createCodeInput(containerId, verificationCode);
        this.codeManager.handleCodeInput(codeInput, verificationCode, successCallback);
    }

    // ===============================
    // 事件处理方法
    // ===============================
    async handlePasswordChange() {
        const newPassword = document.getElementById('new-password').value.trim();
        const confirmPassword = document.getElementById('confirm-new-password').value.trim();
        const errorElement = document.getElementById('password-change-error');
        
        // 验证输入
        if (!newPassword || !confirmPassword) {
            errorElement.textContent = '请输入新密码和确认密码';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            errorElement.textContent = '两次输入的密码不一致';
            return;
        }
        
        if (!FormValidator.validatePassword(newPassword)) {
            errorElement.textContent = '密码必须是6-16位，包含字母和数字';
            return;
        }
        
        try {
            const userPhone = UserManager.getCurrentUserPhone();
            const result = await APIManager.updateUserPassword(userPhone, newPassword);
            
            if (result.success) {
                alert('密码修改成功！');
                this.closeChangePasswordPopup();
            } else {
                errorElement.textContent = result.message || '密码修改失败，请稍后重试';
            }
        } catch (error) {
            console.error('修改密码错误:', error);
            errorElement.textContent = '密码修改失败，请稍后重试';
        }
    }

    async handleUsernameChange() {
        const newUsername = document.getElementById('new-username').value.trim();
        const errorElement = document.getElementById('username-change-error');
        
        if (!newUsername) {
            errorElement.textContent = '请输入新用户名';
            return;
        }
        
        if (newUsername.length > 20) {
            errorElement.textContent = '用户名不能超过20个字符';
            return;
        }
        
        try {
            const userPhone = UserManager.getCurrentUserPhone();
            const result = await APIManager.updateUsername(userPhone, newUsername);
            
            if (result.success) {
                alert('用户名修改成功！');
                this.closeChangeUsernamePopup();
                
                // 更新显示的用户名
                const userBriefName = document.getElementById('user-brief-name');
                if (userBriefName) {
                    userBriefName.textContent = newUsername;
                }
            } else {
                errorElement.textContent = result.message || '用户名修改失败，请稍后重试';
            }
        } catch (error) {
            console.error('修改用户名错误:', error);
            errorElement.textContent = '用户名修改失败，请稍后重试';
        }
    }

    async handlePhoneChange() {
        const oldPhone = UserManager.getCurrentUserPhone();
        const newPhone = document.getElementById('new-phone-input').value.replace(/\s/g, '');
        const errorElement = document.getElementById('phone-change-error');
        
        try {
            const result = await APIManager.updateUserPhone(oldPhone, newPhone);
            
            if (result.success) {
                alert('手机号修改成功！');
                UserManager.setLoginStatus(newPhone); // 更新本地存储
                this.closeChangePhonePopup();
                
                // 更新UI
                if (typeof UIStateManager !== 'undefined') {
                    UIStateManager.updateLoginUI();
                }
            } else {
                errorElement.textContent = result.message || '手机号修改失败，请稍后重试';
            }
        } catch (error) {
            console.error('修改手机号错误:', error);
            errorElement.textContent = '手机号修改失败，请稍后重试';
        }
    }

    // ===============================
    // 事件监听器设置
    // ===============================
    initEventListeners() {
        // 修改密码 - 获取验证码
        const getVerifyCodeBtn = document.getElementById('get-verify-code-btn');
        if (getVerifyCodeBtn) {
            getVerifyCodeBtn.addEventListener('click', () => {
                this.handleVerificationCode('get-verify-code-btn', 'verify-code-area', () => {
                    const verifyPhoneStep = document.getElementById('verify-phone-step');
                    const changePasswordStep = document.getElementById('change-password-step');
                    if (verifyPhoneStep) verifyPhoneStep.style.display = 'none';
                    if (changePasswordStep) changePasswordStep.style.display = 'block';
                });
            });
        }
        
        // 修改密码 - 提交
        const changePasswordSubmitBtn = document.getElementById('change-password-submit-btn');
        if (changePasswordSubmitBtn) {
            changePasswordSubmitBtn.addEventListener('click', () => this.handlePasswordChange());
        }
        
        // 修改用户名 - 提交
        const changeUsernameSubmitBtn = document.getElementById('change-username-submit-btn');
        if (changeUsernameSubmitBtn) {
            changeUsernameSubmitBtn.addEventListener('click', () => this.handleUsernameChange());
        }
        
        // 修改手机号 - 验证当前手机号
        const getCurrentPhoneCodeBtn = document.getElementById('get-current-phone-code-btn');
        if (getCurrentPhoneCodeBtn) {
            getCurrentPhoneCodeBtn.addEventListener('click', () => {
                this.handleVerificationCode('get-current-phone-code-btn', 'current-phone-code-area', () => {
                    const verifyCurrentPhoneStep = document.getElementById('verify-current-phone-step');
                    const setNewPhoneStep = document.getElementById('set-new-phone-step');
                    if (verifyCurrentPhoneStep) verifyCurrentPhoneStep.style.display = 'none';
                    if (setNewPhoneStep) setNewPhoneStep.style.display = 'block';
                });
            });
        }
        
        // 修改手机号 - 获取新手机号验证码
        const getNewPhoneCodeBtn = document.getElementById('get-new-phone-code-btn');
        if (getNewPhoneCodeBtn) {
            getNewPhoneCodeBtn.addEventListener('click', async () => {
                const newPhone = document.getElementById('new-phone-input').value.replace(/\s/g, '');
                const errorElement = document.getElementById('phone-change-error');
                
                if (!FormValidator.validatePhone(newPhone)) {
                    errorElement.textContent = '请输入正确的11位手机号';
                    return;
                }
                
                const phoneExists = await APIManager.checkPhoneExists(newPhone);
                if (phoneExists) {
                    errorElement.textContent = '该手机号已被注册';
                    return;
                }
                
                this.handleVerificationCode('get-new-phone-code-btn', 'new-phone-code-area', () => {
                    const changePhoneSubmitBtn = document.getElementById('change-phone-submit-btn');
                    if (changePhoneSubmitBtn) {
                        changePhoneSubmitBtn.style.display = 'block';
                    }
                    errorElement.textContent = '';
                });
            });
        }
        
        // 修改手机号 - 提交
        const changePhoneSubmitBtn = document.getElementById('change-phone-submit-btn');
        if (changePhoneSubmitBtn) {
            changePhoneSubmitBtn.addEventListener('click', () => this.handlePhoneChange());
        }
        
        // 新手机号输入格式化
        const newPhoneInput = document.getElementById('new-phone-input');
        if (newPhoneInput) {
            FormValidator.formatPhoneInput(newPhoneInput);
        }
        
        console.log('用户设置事件监听器初始化完成');
    }
}

// 创建全局实例 - 延迟创建以确保DOM加载完成
let userSettingsManager = null;

// 页面加载完成后创建实例
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        try {
            userSettingsManager = new UserSettingsManager();
            console.log('用户设置管理器初始化完成');
        } catch (error) {
            console.error('用户设置管理器初始化失败:', error);
        }
    }, 100);
});

// 导出主要函数供外部调用 - 添加安全检查
window.showChangePassword = () => {
    if (userSettingsManager) {
        userSettingsManager.showChangePassword();
    } else {
        console.error('用户设置管理器未初始化');
    }
};

window.closeChangePasswordPopup = () => {
    if (userSettingsManager) {
        userSettingsManager.closeChangePasswordPopup();
    }
};

window.showChangeUsername = () => {
    if (userSettingsManager) {
        userSettingsManager.showChangeUsername();
    } else {
        console.error('用户设置管理器未初始化');
    }
};

window.closeChangeUsernamePopup = () => {
    if (userSettingsManager) {
        userSettingsManager.closeChangeUsernamePopup();
    }
};

window.showChangePhone = () => {
    if (userSettingsManager) {
        userSettingsManager.showChangePhone();
    } else {
        console.error('用户设置管理器未初始化');
    }
};

window.closeChangePhonePopup = () => {
    if (userSettingsManager) {
        userSettingsManager.closeChangePhonePopup();
    }
}; 