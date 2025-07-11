const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MySQL接続設定（Railway用）
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || 'your-hostname',
  user: process.env.MYSQL_USER || 'your-username',
  password: process.env.MYSQL_PASSWORD || 'your-password',
  database: process.env.MYSQL_DATABASE || 'your-database',
});

// 接続テスト
db.connect(err => {
  if (err) {
    console.error('MySQL接続エラー:', err);
  } else {
    console.log('MySQLに接続成功！');
  }
});

// グループホーム登録API
app.post('/group-homes', (req, res) => {
  const data = req.body;
  const sql = `
    INSERT INTO group_homes (id, property_name, unit_name, postal_code, address, phone_number, common_room, resident_rooms, opening_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    data.id,
    data.propertyName,
    data.unitName,
    data.postalCode,
    data.address,
    data.phoneNumber,
    data.commonRoom,
    JSON.stringify(data.residentRooms), // ※ MySQL 5.7未満なら TEXT型を使う
    data.openingDate,
    data.createdAt
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('DB挿入エラー:', err);
      return res.status(500).json({ message: '登録に失敗しました' });
    }
    res.status(200).json({ message: '登録に成功しました' });
  });
});

// グループホーム一覧取得API
app.get('/group-homes', (req, res) => {
  db.query('SELECT * FROM group_homes', (err, results) => {
    if (err) {
      console.error('DB取得エラー:', err);
      return res.status(500).json({ message: '取得に失敗しました' });
    }
    res.status(200).json(results);
  });
});

app.get('/my-ip', async (req, res) => {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch('https://api.ipify.org?format=json');
  const data = await response.json();
  res.json(data);
});

// ① 静的ファイルの提供
const path = require("path");
app.use(express.static(path.join(__dirname, "dist"))); // ← build出力先がdistの場合

// ② すべての未定義ルートで index.html を返す
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

