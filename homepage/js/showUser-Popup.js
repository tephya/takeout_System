// 用户信息显示重构版本 - 使用通用工具库

// DOM元素引用
const userElements = {
    unlogin: document.getElementById('unlogin'),
    userbrief: document.getElementById('is-login'),
    userPopup: document.getElementById('user-login-popup'),
    userBriefName: document.getElementById('user-brief-name')
};

// 用户弹窗交互管理
class UserPopupManager {
    static initUserPopupEvents() {
        if (!userElements.userbrief || !userElements.userPopup) return;

        // 鼠标悬停显示弹窗
        userElements.userbrief.addEventListener('mouseenter', () => {
            userElements.userPopup.style.display = 'block';
        });

        // 鼠标离开用户头像
        userElements.userbrief.addEventListener('mouseleave', (e) => {
            const to = e.relatedTarget;
            if (!userElements.userPopup.contains(to)) {
                userElements.userPopup.style.display = 'none';
            }
        });

        // 鼠标离开弹窗
        userElements.userPopup.addEventListener('mouseleave', (e) => {
            const to = e.relatedTarget;
            if (!userElements.userbrief.contains(to)) {
                userElements.userPopup.style.display = 'none';
            }
        });
    }
}

// 检查是否未登录状态
function checkIsUnlogin() {
    if (userElements.unlogin && userElements.unlogin.style.display === 'block') {
        return true;
    }
    return false;
}

// 页面初始化
function initPage() {
    try {
        // 检查登录状态并更新UI
        if (typeof UIStateManager !== 'undefined') {
            UIStateManager.updateLoginUI();
        } else {
            console.error('UIStateManager未定义，请检查common-utils.js是否正确加载');
        }
        
        // 初始化用户弹窗事件
        UserPopupManager.initUserPopupEvents();
        
        // 检查未登录状态
        checkIsUnlogin();
        
        console.log('用户信息页面初始化完成');
    } catch (error) {
        console.error('页面初始化错误:', error);
    }
}

// 自定义登出函数 - 添加更好的用户反馈
function customLogout() {
    try {
        console.log('用户点击登出按钮');
        
        // 显示登出提示
        const userBriefName = document.getElementById('user-brief-name');
        if (userBriefName) {
            userBriefName.textContent = '正在登出...';
        }
        
        // 执行登出
        if (typeof UIStateManager !== 'undefined') {
            UIStateManager.logout();
            localStorage.clear();   // 每次登出清除localStorage
        } else {
            // 备用登出逻辑
            UserManager.clearLoginStatus();
            location.reload(); // 刷新页面以确保状态更新
        }
        
        console.log('登出操作完成');
    } catch (error) {
        console.error('登出操作失败:', error);
        // 备用方案 - 刷新页面
        location.reload();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保common-utils.js完全加载
    setTimeout(initPage, 100);
});

// 导出登出函数供外部调用，使用自定义的登出函数
window.logout = customLogout;