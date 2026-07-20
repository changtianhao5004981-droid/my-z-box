document.addEventListener('DOMContentLoaded', () => {
    // 1. 动态插入右下角悬浮按钮、用户信息展示区和完整的登录/注册模态弹窗
    const html = `
    <!-- 悬浮控制中心：包含按钮和登录后的用户信息 -->
    <div id="auth-zone" style="position: fixed; bottom: 40px; right: 40px; z-index: 99999; cursor: move; user-select: none; display: flex; align-items: center; gap: 10px;">
        <button id="show-login-btn" style="padding: 12px 20px; cursor: pointer; border-radius: 50px; border: none; background: #10a37f; color: white; font-weight: 600; box-shadow: 0 4px 16px rgba(16, 163, 127, 0.4); font-size: 14px; display: flex; align-items: center; gap: 6px;">
            🔑 登录 / 注册
        </button>
        
        <!-- 登录成功后的圆形头像区域（默认隐藏） -->
        <div id="user-info" style="display: none; align-items: center; gap: 10px; background: white; padding: 6px 14px 6px 6px; border-radius: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e5e7eb;">
            <div id="user-avatar" title="点击退出登录" style="width: 34px; height: 34px; background: #10a37f; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; cursor: pointer;"></div>
            <span id="user-welcome" style="font-size: 13px; font-weight: 500; color: #374151;"></span>
        </div>
    </div>

    <!-- 登录/注册两用弹窗 -->
    <div id="auth-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 100000; justify-content: center; align-items: center;">
        <div style="background: white; padding: 25px; border-radius: 12px; width: 300px; position: relative; box-shadow: 0 8px 24px rgba(0,0,0,0.2);">
            <span id="close-modal" style="position: absolute; top: 12px; right: 15px; cursor: pointer; font-size: 20px; color: #aaa;">&times;</span>
            <h3 id="modal-title" style="margin-top:0; color:#333; margin-bottom: 16px;">用户登录</h3>
            
            <input type="text" id="auth-username" placeholder="请输入用户名" style="width: 100%; padding: 10px; margin-bottom: 12px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 6px; outline: none;">
            <input type="password" id="auth-password" placeholder="请输入密码" style="width: 100%; padding: 10px; margin-bottom: 18px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 6px; outline: none;">
            
            <button id="submit-auth-btn" style="width: 100%; padding: 10px; background: #10a37f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight:600; font-size: 14px;">登 录</button>
            
            <p style="text-align: center; font-size: 12px; margin-top: 16px; color: #6b7280; margin-bottom: 0;">
                <span id="toggle-auth-type" style="color: #10a37f; cursor: pointer; font-weight: 500;">还没有账号？点击注册</span>
            </p>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    // 2. 获取 DOM 节点
    const authZone = document.getElementById('auth-zone');
    const modal = document.getElementById('auth-modal');
    const loginBtn = document.getElementById('show-login-btn');
    const modalTitle = document.getElementById('modal-title');
    const submitAuthBtn = document.getElementById('submit-auth-btn');
    const toggleAuthType = document.getElementById('toggle-auth-type');
    const userInfo = document.getElementById('user-info');
    const userAvatar = document.getElementById('user-avatar');
    const userWelcome = document.getElementById('user-welcome');

    let isLoginMode = true;

    // --- 渲染 UI 状态函数 ---
    function checkLoginStatus() {
        const savedUser = localStorage.getItem('auth_username');
        if (savedUser) {
            // 已登录状态 UI
            loginBtn.style.display = 'none';
            userInfo.style.display = 'flex';
            userAvatar.innerText = savedUser.charAt(0).toUpperCase();
            userWelcome.innerText = savedUser;
        } else {
            // 未登录状态 UI
            loginBtn.style.display = 'flex';
            userInfo.style.display = 'none';
        }
    }

    // 初始化时先检查一次有没有登录过
    checkLoginStatus();

    // --- 点击头像退出登录 ---
    userAvatar.addEventListener('click', () => {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('auth_username');
            checkLoginStatus();
        }
    });

    // --- 拖拽核心逻辑 ---
    let isDragging = false;
    let dragOccurred = false;
    let startX, startY, initialLeft, initialTop;

    authZone.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.id === 'user-avatar') return;
        isDragging = true;
        dragOccurred = false;
        startX = e.clientX;
        startY = e.clientY;

        const rect = authZone.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        authZone.style.right = 'auto';
        authZone.style.bottom = 'auto';
        authZone.style.left = initialLeft + 'px';
        authZone.style.top = initialTop + 'px';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        dragOccurred = true;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        const padding = 10;
        const maxLeft = window.innerWidth - authZone.offsetWidth - padding;
        const maxTop = window.innerHeight - authZone.offsetHeight - padding;

        if (newLeft < padding) newLeft = padding;
        if (newLeft > maxLeft) newLeft = maxLeft;
        if (newTop < padding) newTop = padding;
        if (newTop > maxTop) newTop = maxTop;

        authZone.style.left = newLeft + 'px';
        authZone.style.top = newTop + 'px';
    });

    document.addEventListener('mouseup', () => { isDragging = false; });

    // 点击唤起弹窗
    loginBtn.addEventListener('click', () => {
        if (dragOccurred) return;
        modal.style.display = 'flex';
    });

    document.getElementById('close-modal').onclick = () => { modal.style.display = 'none'; };

    // 动态切换
    toggleAuthType.onclick = () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            modalTitle.innerText = '用户登录';
            submitAuthBtn.innerText = '登 录';
            toggleAuthType.innerText = '还没有账号？点击注册';
        } else {
            modalTitle.innerText = '用户注册';
            submitAuthBtn.innerText = '注 册';
            toggleAuthType.innerText = '已有账号？点击登录';
        }
    };

    // 提交数据
    submitAuthBtn.onclick = async () => {
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value.trim();

        if (!username || !password) {
            return alert('请完整填写用户名和密码！');
        }

        const url = isLoginMode ? '/api/login' : '/api/register';

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await res.json();

            alert(result.message);

            if (result.status === 'success') {
                if (isLoginMode) {
                    modal.style.display = 'none';
                    // 核心修改：登录成功将用户名写入持久化缓存
                    localStorage.setItem('auth_username', result.username);
                    checkLoginStatus();
                } else {
                    toggleAuthType.click();
                }
            }
        } catch (error) {
            alert('网络异常或服务器未启动，请检查后端！');
        }
    };
});