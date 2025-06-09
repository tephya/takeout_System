// 常量定义
const API_BASE_URL = 'http://localhost:3000/api';
const STATUS_TYPES = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
};

// 工具函数
const utils = {
    formatDate(dateString) {
        const date = new Date(dateString);
        return isNaN(date.getTime()) 
            ? '无效日期' 
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    formatPrice(price) {
        return parseFloat(price) || 0;
    },

    handleError(error) {
        console.error(error);
        return null;
    }
};

// 订单状态处理
const orderStatus = {
    getClass(status) {
        const statusMap = {
            [STATUS_TYPES.PENDING]: 'status-pending',
            [STATUS_TYPES.PROCESSING]: 'status-processing',
            [STATUS_TYPES.COMPLETED]: 'status-completed',
            [STATUS_TYPES.CANCELLED]: 'status-cancelled'
        };
        return statusMap[status] || 'status-processing';
    },

    getText(status) {
        const textMap = {
            [STATUS_TYPES.PENDING]: '👨‍🍳 商家备餐中',
            [STATUS_TYPES.PROCESSING]: '🛵 骑手配送中',
            [STATUS_TYPES.COMPLETED]: '✅ 已完成',
            [STATUS_TYPES.CANCELLED]: '❌ 已取消'
        };
        return textMap[status] || '⏳ 处理中';
    }
};

// API 服务
const orderService = {
    getCustomerOrders: async (customer_id) => {
        const response = await fetch(`${API_BASE_URL}/CustomerOrderView?customer_id=${customer_id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).catch(utils.handleError);

        if (!response?.ok) return null;

        const result = await response.json().catch(utils.handleError);
        return result?.data || null;
    }
};

// 视图渲染
const orderView = {
    renderOrderItem(order) {
        const totalPrice = utils.formatPrice(order.total_price);
        // 判断是否显示取消按钮
        const canCancel = order.order_status !== 'Cancelled' && order.order_status !== 'Completed';

        // 新增：好评/差评按钮，仅已完成订单显示
        let commentBtns = '';
        if (order.order_status === 'Completed') {
            commentBtns = `
                <span class="comment-btns">
                    <img src="../../homepage/images/icons/yammy.svg"
                        class="comment-icon comment-good" 
                        title="好评"
                        data-type="good" 
                        data-order-id="${order.order_id}"
                        data-product-id="${order.product_id}">
                    <img src="../../homepage/images/icons/dame.svg" 
                        class="comment-icon comment-bad" 
                        title="差评" 
                        data-type="bad" 
                        data-order-id="${order.order_id}"
                        data-product-id="${order.product_id}">
                </span>
            `;
        }

        return `
            <div class="order-item">
                <div class="merchant-info">
                    <img src="../../Merchant/images/store-pending.svg" 
                         alt="商家图片"
                         class="merchant-image">
                    <span>${order.merchant_name || '未知商家'}</span>
                </div>
                <span class="product-name">${order.product_name || '未知商品'}</span>
                <span class="quantity">${order.order_quantity || 0}</span>
                <span class="price">¥${totalPrice.toFixed(2)}</span>
                <div class="status-wrapper">
                    <span class="${orderStatus.getClass(order.order_status)}">${orderStatus.getText(order.order_status)}</span>
                    ${commentBtns}
                </div>
                <span class="order-time">${utils.formatDate(order.order_date)}
                    ${canCancel ? `<button class="cancel-btn" data-order-id="${order.order_id}">取消</button>` : ''}
                </span>
            </div>
        `;
    },

    renderOrderList(orders = []) {
        if (!orders.length) {
            return this.showMessage('empty', '暂无订单记录');
        }

        return `
            <div class="order-list">
                <div class="order-header">
                    <span>🏪 商家信息</span>
                    <span>🍽️ 商品</span>
                    <span>📦 数量</span>
                    <span>💰 金额</span>
                    <span>📋 状态</span>
                    <span>⏰ 时间</span>
                </div>
                ${orders.map(order => this.renderOrderItem(order)).join('')}
            </div>
        `;
    },

    showMessage(type, message) {
        const icons = {
            error: '❌',
            empty: '📭',
            login: '👤'
        };
        return `<div class="empty-order">${icons[type] || ''} ${message}</div>`;
    }
};

// 主程序
const initOrderPage = async () => {
    const orderContent = document.getElementById('order-content');
    if (!orderContent) return;

    const customer_id = localStorage.getItem('customer_id');
    if (!customer_id) {
        orderContent.innerHTML = orderView.showMessage('login', '请先登录后查看订单');
        return;
    }

    // 首次加载订单数据
    await loadOrders(orderContent, customer_id);
        
    // 每30秒自动刷新一次订单数据
    setInterval(async () => {
        await loadOrders(orderContent, customer_id);
    }, 30000);
};

// 抽取加载订单的函数
const loadOrders = async (orderContent, customer_id) => {
    try {
        const orderData = await orderService.getCustomerOrders(customer_id);
        if (orderData) {
            orderContent.innerHTML = orderView.renderOrderList(orderData);
        } else {
            orderContent.innerHTML = orderView.showMessage('error', '获取订单数据失败，请稍后重试');
        }
    } catch (error) {
        console.error('加载订单失败:', error);
        orderContent.innerHTML = orderView.showMessage('error', '加载订单失败，请刷新页面重试');
    }
};

// 弹窗HTML插入body
if (!document.getElementById('cancel-modal')) {
    const modal = document.createElement('div');
    modal.id = 'cancel-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="modal-mask" 
            style="position:fixed;
            left:0;top:0;width:100vw;
            height:100vh;background:
            rgba(0,0,0,0.3);z-index:1000;">
        </div>
        <div class="modal-content" style="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;padding:32px 32px 24px 32px;border-radius:12px;z-index:1001;min-width:280px;max-width:90vw;box-shadow:0 4px 24px rgba(0,0,0,0.15);text-align:center;">
            <div style="font-size:18px;margin-bottom:18px;">确认是否取消订单？</div>
            <div style="margin-top:10px;">
                <button id="modal-confirm-cancel" style="background:#e74c3c;color:#fff;padding:8px 24px;border:none;border-radius:6px;margin-right:16px;cursor:pointer;">确认取消</button>
                <button id="modal-cancel-cancel" style="background:#eee;color:#333;padding:8px 24px;border:none;border-radius:6px;cursor:pointer;">返回</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 事件委托绑定取消按钮
function bindCancelBtnEvent() {
    document.getElementById('order-content').addEventListener('click', function(e) {
        if (e.target.classList.contains('cancel-btn')) {
            const orderId = e.target.getAttribute('data-order-id');
            showCancelModal(orderId);
        }
    });
}

function showCancelModal(orderId) {
    const modal = document.getElementById('cancel-modal');
    modal.style.display = 'block';
    // 绑定弹窗按钮
    document.getElementById('modal-confirm-cancel').onclick = async function() {
        // 调用接口取消订单
        try {
            const res = await fetch('http://localhost:3000/api/updateOrderStatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, order_status: 'Cancelled' })
            });
            const data = await res.json();
            if (data.success) {
                modal.style.display = 'none';
                // 刷新订单列表
                const customer_id = localStorage.getItem('customer_id');
                await loadOrders(document.getElementById('order-content'), customer_id);
            } else {
                alert('取消失败：' + (data.message || '未知错误'));
            }
        } catch (err) {
            alert('网络错误，请稍后重试');
        }
    };
    document.getElementById('modal-cancel-cancel').onclick = function() {
        modal.style.display = 'none';
    };
}

// 页面加载后绑定事件
window.onload = async function() {
    await initOrderPage();
    bindCancelBtnEvent();
};

// 监听点击好评和差评，实现评价数自增
document.getElementById('order-content').addEventListener('click', function(e) {
    // 好评
    if (e.target.classList.contains('comment-good')) {
        const productId = e.target.dataset.productId;
        fetch('http://localhost:3000/api/incrementProductGoodRvCount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('感谢您的好评！');
                // 可选：更新页面好评数
            } else {
                alert('好评失败，请稍后重试');
            }
        });
    }
    // 差评
    if (e.target.classList.contains('comment-bad')) {
        const productId = e.target.dataset.productId;
        fetch('http://localhost:3000/api/incrementProductBadRvCount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('我们会努力改进，感谢您的反馈！');
                // 可选：更新页面差评数
            } else {
                alert('差评失败，请稍后重试');
            }
        });
    }
});