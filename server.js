const express = require('express');
const cors = require('cors');
const path = require("path");
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ MySQL接続プールに変更
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("✅ MySQL接続プールを作成しました");

// ✅ 一覧取得（nullやJSON形式の補正あり）
app.get('/group-homes', (req, res) => {
  pool.query('SELECT * FROM group_homes', (err, results) => {
    if (err) {
      console.error('DB取得エラー実ログ:', err);
      return res.status(500).json({ message: '取得に失敗しました' });
    }

    const fixed = results.map(row => ({
      ...row,
      resident_rooms: (() => {
        try {
          const parsed = JSON.parse(row.resident_rooms || '[]');
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })(),
    }));

    console.log('取得件数:', fixed.length);
    res.json(fixed);
  });
});

// ✅ 登録（JSON.stringify）
app.post('/group-homes', (req, res) => {
  const d = req.body;
  const sql = `
    INSERT INTO group_homes (id, property_name, unit_name, postal_code, address, phone_number, common_room, resident_rooms, opening_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    d.id, d.property_name, d.unit_name, d.postal_code,
    d.address, d.phone_number, d.common_room,
    JSON.stringify(d.resident_rooms), d.opening_date, d.created_at
  ];

  pool.query(sql, values, (err) => {
    if (err) {
      console.error('登録エラー実ログ:', err);
      return res.status(500).json({ message: '登録に失敗しました' });
    }
    res.json({ message: '登録に成功しました' });
  });
});

// IP取得
app.get('/my-ip', async (req, res) => {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch('https://api.ipify.org?format=json');
  const data = await response.json();
  res.json(data);
});

// 静的ファイル & React初期画面
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

