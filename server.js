const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// 1. 基础配置
const supabaseUrl = 'https://ekkhcgrnfglrxsnjatnm.supabase.co';
const supabaseKey = 'sb_publishable_1KrxuPbfqM9QpIsCB6hdmg_Dq3fxtZY'; // 生产环境建议用环境变量
const supabase = createClient(supabaseUrl, supabaseKey);

// 🔑 管理员密码
const ADMIN_PASSWORD = "123456"; 

// 🛡️ 2. 定义保安中间件 (必须放在接口定义之前)
const authMiddleware = (req, res, next) => {
    const userPassword = req.headers['authorization'];
    if (userPassword === ADMIN_PASSWORD) {
        next(); // 密码正确，放行
    } else {
        console.warn(`🛡️ 拦截到非法访问，输入密码为: ${userPassword}`);
        res.status(401).send('身份验证失败：密码错误');
    }
};

// ---------------------------------------------------------
// 3. 业务接口 (API Routes)
// ---------------------------------------------------------

// A. 获取产品列表 (允许公开访问，无需密码)
app.get('/products', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// B. 录入新产品 (受保护)
app.post('/products', authMiddleware, async (req, res) => {
    const { name, price } = req.body;
    const numericPrice = parseFloat(price);

    const { data, error } = await supabase
        .from('products')
        .insert([{ name: name, price: numericPrice }]);

    if (error) {
        console.error('Supabase 报错:', error.message);
        return res.status(400).json({ error: error.message });
    }
    res.status(201).send(`入库成功：${name}`);
});

// C. 修改产品 (受保护)
app.put('/products/:id', authMiddleware, async (req, res) => {
    const productId = req.params.id;
    const { name, price } = req.body;
    const numPrice = parseFloat(price);

    const { error } = await supabase
        .from('products')
        .update({ name: name, price: numPrice })
        .eq('id', productId);

    if (error) {
        console.error('更新失败:', error.message);
        return res.status(400).json({ error: error.message });
    }
    res.send('修改成功！');
});

// D. 删除产品 (受保护)
app.delete('/products/:id', authMiddleware, async (req, res) => {
    const productId = req.params.id;
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) {
        console.error('删除失败:', error.message);
        return res.status(400).json({ error: error.message });
    }
    res.send('删除成功！');
});

// 4. 启动服务器 (适配 Railway 端口)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ CRM 后端服务器已开启，端口：${PORT}`);
});