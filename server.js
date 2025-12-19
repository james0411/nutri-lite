const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js'); // 引入钥匙

const app = express();
app.use(cors());
app.use(express.json());

// 1. 配置你的 Supabase 仓库地址和钥匙 (请替换成你自己的)
const supabaseUrl = 'https://ekkhcgrnfglrxsnjatnm.supabase.co';
const supabaseKey = 'sb_publishable_1KrxuPbfqM9QpIsCB6hdmg_Dq3fxtZY';
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. 改造“接收产品”接口：把数据存入云端，而不是内存
app.post('/products', async (req, res) => {
  const { name, price } = req.body;

  // 1. 尝试将价格转为数字，防止类型错误
  const numericPrice = parseFloat(price);

  const { data, error } = await supabase
    .from('products')
    .insert([{ name: name, price: numericPrice }]);

  if (error) {
    // 💡 重点：在终端打印出具体的错误描述
    console.error('Supabase 报错详情:', error.message, error.details, error.hint);
    return res.status(400).json({ error: error.message });
  }

  console.log('✅ 成功入库:', name);
  res.status(201).send(`入库成功：${name}`);
});

// 3. 改造“获取产品”接口：从云端拉取
// 获取所有产品（从云端查）
app.get('/products', async (req, res) => {
  const { data, error } = await supabase
    .from('products') // 👈 确保这里的表名和你刚才成功入库的一致
    .select('*')
    .order('created_at', { ascending: false }); // 💡 教学点：按时间倒序排，最新的在最上面

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json(data); // 把从云端拿到的真数据发给前端
});

// 业务窗口：删除指定产品
app.delete('/products/:id', async (req, res) => {
  const productId = req.params.id; // 获取 URL 路径中的 id

  console.log(`收到删除请求，准备处理 ID: ${productId}`);

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId); // 💡 重点：只删除 id 匹配的那一行

  if (error) {
    console.error('删除失败:', error.message);
    return res.status(400).json({ error: error.message });
  }

  res.send('删除成功！');
});

// 业务窗口：修改指定产品
app.put('/products/:id', async (req, res) => {
  const productId = req.params.id;
  const { name, price } = req.body; // 拿到修改后的新数据
  const numPrice = parseFloat(price);

  console.log(`正在更新 ID 为 ${productId} 的产品...`);

  const { error } = await supabase
    .from('products')
    .update({ name: name, price: numPrice }) // 👈 执行更新动作
    .eq('id', productId); // 👈 锁定那一行

  if (error) {
    console.error('更新失败:', error.message);
    return res.status(400).json({ error: error.message });
  }

  res.send('修改成功！');
});

app.listen(3000, () => {
  console.log('✅ 数据库版服务器已开启！');
});