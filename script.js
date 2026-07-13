// ==============================================
// MAIN SCRIPT - SATVIR_EXPLOITS
// ==============================================

// ==============================================
// TOAST
// ==============================================

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==============================================
// AUTH - Login/Register
// ==============================================

function openLogin() {
    document.getElementById('loginModal').classList.add('show');
}

function closeLogin() {
    document.getElementById('loginModal').classList.remove('show');
}

function openRegister() {
    document.getElementById('registerModal').classList.add('show');
}

function closeRegister() {
    document.getElementById('registerModal').classList.remove('show');
}

function switchToRegister() {
    closeLogin();
    openRegister();
}

function switchToLogin() {
    closeRegister();
    openLogin();
}

function loginUser(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    // Check in localStorage
    const users = JSON.parse(localStorage.getItem('vps_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem('vps_current_user', JSON.stringify(user));
        showToast('✅ Login successful!');
        closeLogin();
        
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } else {
        showToast('❌ Invalid username or password!');
    }
}

function registerUser(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;

    if (password !== confirm) {
        showToast('❌ Passwords do not match!');
        return;
    }

    const users = JSON.parse(localStorage.getItem('vps_users') || '[]');
    
    if (users.find(u => u.username === username)) {
        showToast('❌ Username already exists!');
        return;
    }

    users.push({
        username,
        email,
        password,
        role: 'user',
        created: new Date().toISOString(),
        bots: []
    });

    localStorage.setItem('vps_users', JSON.stringify(users));
    showToast('✅ Registration successful! Please login.');
    closeRegister();
    openLogin();
}

// ==============================================
// LOGOUT
// ==============================================

function logout() {
    localStorage.removeItem('vps_current_user');
    showToast('👋 Logged out!');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// ==============================================
// ADMIN FUNCTIONS
// ==============================================

function loadAdminData() {
    const users = JSON.parse(localStorage.getItem('vps_users') || '[]');
    const bots = JSON.parse(localStorage.getItem('vps_bots') || '[]');
    const payments = JSON.parse(localStorage.getItem('vps_payments') || '[]');

    // Stats
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalBots').textContent = bots.length;
    document.getElementById('runningBots').textContent = bots.filter(b => b.status === 'running').length;
    document.getElementById('totalRevenue').textContent = '₹' + payments.reduce((sum, p) => sum + p.amount, 0);

    // Users Table
    const usersBody = document.getElementById('usersBody');
    if (users.length === 0) {
        usersBody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
    } else {
        usersBody.innerHTML = users.map((u, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td>${(u.bots || []).length}</td>
                <td><span class="status-badge running">Active</span></td>
                <td>
                    <button class="btn-action edit" onclick="editUser('${u.username}')">✏️</button>
                    <button class="btn-action delete" onclick="deleteUser('${u.username}')">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    // Bots Table
    const botsBody = document.getElementById('botsBody');
    if (bots.length === 0) {
        botsBody.innerHTML = '<tr><td colspan="6">No bots found</td></tr>';
    } else {
        botsBody.innerHTML = bots.map((b, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${b.name}</td>
                <td>${b.owner}</td>
                <td><code>${b.token.substring(0, 10)}...</code></td>
                <td><span class="status-badge ${b.status === 'running' ? 'running' : 'stopped'}">${b.status}</span></td>
                <td>
                    <button class="btn-action start" onclick="startBot('${b.id}')">▶️</button>
                    <button class="btn-action stop" onclick="stopBot('${b.id}')">⏹️</button>
                    <button class="btn-action delete" onclick="deleteBot('${b.id}')">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    // Payments Table
    const paymentsBody = document.getElementById('paymentsBody');
    const pending = payments.filter(p => p.status === 'pending');
    if (pending.length === 0) {
        paymentsBody.innerHTML = '<tr><td colspan="6">No pending payments</td></tr>';
    } else {
        paymentsBody.innerHTML = pending.map((p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${p.user}</td>
                <td>₹${p.amount}</td>
                <td>${p.plan}</td>
                <td><span class="status-badge pending">Pending</span></td>
                <td>
                    <button class="btn-action start" onclick="approvePayment('${p.id}')">✅</button>
                    <button class="btn-action delete" onclick="rejectPayment('${p.id}')">❌</button>
                </td>
            </tr>
        `).join('');
    }
}

function refreshData() {
    showToast('🔄 Refreshing...');
    loadAdminData();
}

function addBot() {
    document.getElementById('addBotModal').classList.add('show');
}

function closeAddBot() {
    document.getElementById('addBotModal').classList.remove('show');
}

function submitBot(e) {
    e.preventDefault();
    const name = document.getElementById('botName').value;
    const token = document.getElementById('botToken').value;
    const owner = document.getElementById('botOwner').value;

    const bots = JSON.parse(localStorage.getItem('vps_bots') || '[]');
    bots.push({
        id: 'bot_' + Date.now(),
        name,
        token,
        owner,
        status: 'running',
        created: new Date().toISOString()
    });

    localStorage.setItem('vps_bots', JSON.stringify(bots));
    showToast('✅ Bot deployed successfully!');
    closeAddBot();
    loadAdminData();
}

function startBot(id) {
    const bots = JSON.parse(localStorage.getItem('vps_bots') || '[]');
    const bot = bots.find(b => b.id === id);
    if (bot) {
        bot.status = 'running';
        localStorage.setItem('vps_bots', JSON.stringify(bots));
        showToast('✅ Bot started!');
        loadAdminData();
    }
}

function stopBot(id) {
    const bots = JSON.parse(localStorage.getItem('vps_bots') || '[]');
    const bot = bots.find(b => b.id === id);
    if (bot) {
        bot.status = 'stopped';
        localStorage.setItem('vps_bots', JSON.stringify(bots));
        showToast('⏹️ Bot stopped!');
        loadAdminData();
    }
}

function deleteBot(id) {
    if (confirm('Delete this bot?')) {
        let bots = JSON.parse(localStorage.getItem('vps_bots') || '[]');
        bots = bots.filter(b => b.id !== id);
        localStorage.setItem('vps_bots', JSON.stringify(bots));
        showToast('🗑️ Bot deleted!');
        loadAdminData();
    }
}

function editUser(username) {
    showToast('✏️ Edit user: ' + username);
}

function deleteUser(username) {
    if (confirm('Delete user: ' + username + '?')) {
        let users = JSON.parse(localStorage.getItem('vps_users') || '[]');
        users = users.filter(u => u.username !== username);
        localStorage.setItem('vps_users', JSON.stringify(users));
        showToast('🗑️ User deleted!');
        loadAdminData();
    }
}

function approvePayment(id) {
    const payments = JSON.parse(localStorage.getItem('vps_payments') || '[]');
    const payment = payments.find(p => p.id === id);
    if (payment) {
        payment.status = 'approved';
        localStorage.setItem('vps_payments', JSON.stringify(payments));
        showToast('✅ Payment approved!');
        loadAdminData();
    }
}

function rejectPayment(id) {
    const payments = JSON.parse(localStorage.getItem('vps_payments') || '[]');
    const payment = payments.find(p => p.id === id);
    if (payment) {
        payment.status = 'rejected';
        localStorage.setItem('vps_payments', JSON.stringify(payments));
        showToast('❌ Payment rejected!');
        loadAdminData();
    }
}

function broadcast() {
    const msg = prompt('📢 Enter broadcast message:');
    if (msg) {
        showToast('📢 Broadcast sent to all users!');
    }
}

function exportData() {
    const data = {
        users: JSON.parse(localStorage.getItem('vps_users') || '[]'),
        bots: JSON.parse(localStorage.getItem('vps_bots') || '[]'),
        payments: JSON.parse(localStorage.getItem('vps_payments') || '[]')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vps_data.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ Data exported!');
}

// ==============================================
// USER FUNCTIONS
// ==============================================

function loadUserData() {
    const currentUser = JSON.parse(localStorage.getItem('vps_current_user') || 'null');
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userName').textContent = '👤 ' + currentUser.username;

    const allBots = JSON.parse(localStorage.getItem('vps_bots') || '[]');
    const userBots = allBots.filter(b => b.owner === currentUser.username);

    // Stats
    document.getElementById('myBots').textContent = userBots.length;
    document.getElementById('runningBots').textContent = userBots.filter(b => b.status === 'running').length;
    document.getElementById('uptime').textContent = '99.9%';
    document.getElementById('credits').textContent = 100;

    // Bots Table
    const botsBody = document.getElementById('botsBody');
    if (userBots.length === 0) {
        botsBody.innerHTML = '<tr><td colspan="5">No bots deployed yet</td></tr>';
    } else {
        botsBody.innerHTML = userBots.map((b, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${b.name}</td>
                <td><span class="status-badge ${b.status === 'running' ? 'running' : 'stopped'}">${b.status}</span></td>
                <td>${Math.floor(Math.random() * 100)}%</td>
                <td>
                    <button class="btn-action start" onclick="userStartBot('${b.id}')">▶️</button>
                    <button class="btn-action stop" onclick="userStopBot('${b.id}')">⏹️</button>
                    <button class="btn-action delete" onclick="userDeleteBot('${b.id}')">🗑️</button>
                </td>
            </tr>
        `).join('');
    }
}

function deployBot(e) {
    e.preventDefault();
    const name = document.getElementById('botName').value;
    const token = document.getElementById('botToken').value;

    const currentUser = JSON.parse(localStorage.getItem('vps_current_user') || 'null');
    if (!currentUser) {
        showToast('❌ Please login first!');
        return;
    }

    // Validate token
    fetch(`https://api.telegram.org/bot${token}/getMe`)
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                const bots = JSON.parse(localStorage.getItem('vps_bots') || '[]');
                bots.push({
                    id: 'bot_' + Date.now(),
                    name,
                    token,
                    owner: currentUser.username,
                    status: 'running',
                    created: new Date().toISOString()
                });
                localStorage.setItem('vps_bots', JSON.stringify(bots));
                showToast('✅ Bot deployed successfully!');
                document.getElementById('botName').value = '';
                document.getElementById('botToken').value = '';
                loadUserData();
            } else {
                showToast('❌ Invalid bot token!');
            }
        })
        .catch(() => {
            showToast('❌ Error validating bot token!');
        });
}

function userStartBot(id) {
    const bots = JSON.parse(localStorage.getItem('vps_bots') || '[]');
    const bot = bots.find(b => b.id === id);
    if (bot) {
        bot.status = 'running';
        localStorage.setItem('vps_bots', JSON.stringify(bots));
        showToast('✅ Bot started!');
        loadUserData();
    }
}

function userStopBot(id) {
    const bots = JSON.parse(localStorage.getItem('vps_bots') || '[]');
    const bot = bots.find(b => b.id === id);
    if (bot) {
        bot.status = 'stopped';
        localStorage.setItem('vps_bots', JSON.stringify(bots));
        showToast('⏹️ Bot stopped!');
        loadUserData();
    }
}

function userDeleteBot(id) {
    if (confirm('Delete this bot?')) {
        let bots = JSON.parse(localStorage.getItem('vps_bots') || '[]');
        bots = bots.filter(b => b.id !== id);
        localStorage.setItem('vps_bots', JSON.stringify(bots));
        showToast('🗑️ Bot deleted!');
        loadUserData();
    }
}

function buyCredits(amount) {
    showToast(`💳 Buying ₹${amount} credits...`);
    // Add to payments
    const payments = JSON.parse(localStorage.getItem('vps_payments') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('vps_current_user') || 'null');
    payments.push({
        id: 'pay_' + Date.now(),
        user: currentUser ? currentUser.username : 'unknown',
        amount,
        plan: amount >= 1000 ? 'Pro' : amount >= 500 ? 'Premium' : 'Basic',
        status: 'pending',
        date: new Date().toISOString()
    });
    localStorage.setItem('vps_payments', JSON.stringify(payments));
    showToast('✅ Payment submitted! Awaiting admin approval.');
}

// ==============================================
// CHECK AUTH ON PAGE LOAD
// ==============================================

// For dashboard and admin pages
if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('admin.html')) {
    const currentUser = JSON.parse(localStorage.getItem('vps_current_user') || 'null');
    if (!currentUser) {
        window.location.href = 'index.html';
    }
}