const express = require('express');
const cors = require('cors');
const path = require("path");
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MySQL接続
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

db.connect(err => {
  if (err) {
    console.error('MySQL接続エラー:', err);
  } else {
    console.log('MySQLに接続成功！');
  }
});

// APIルート
app.get('/group-homes', (req, res) => {
  db.query('SELECT * FROM group_homes', (err, results) => {
    if (err) return res.status(500).json({ message: '取得に失敗しました' });
    res.json(results);
  });
});

app.post('/group-homes', (req, res) => {
  const d = req.body;
  const sql = `
    INSERT INTO group_homes (id, property_name, unit_name, postal_code, address, phone_number, common_room, resident_rooms, opening_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    d.id, d.propertyName, d.unitName, d.postalCode,
    d.address, d.phoneNumber, d.commonRoom,
    JSON.stringify(d.residentRooms), d.openingDate, d.createdAt
  ];

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ message: '登録に失敗しました' });
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
  console.log(`Server is running on port ${PORT}`);
});

