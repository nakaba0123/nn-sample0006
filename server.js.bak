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
  connectTimeout: 10000,       // 10秒でタイムアウト
  acquireTimeout: 10000,       // プールから接続取得の待機時間
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
  INSERT INTO group_homes (
    property_name, unit_name, postal_code, address, 
    phone_number, common_room, resident_rooms, opening_date, created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
const values = [
  d.propertyName, d.unitName, d.postalCode,  // ←ここ直す！
  d.address, d.phoneNumber, d.commonRoom,
  JSON.stringify(d.residentRooms), d.openingDate, d.createdAt
];

  pool.query(sql, values, (err) => {
    if (err) {
      console.error('登録エラー実ログ:', err);
      return res.status(500).json({ message: '登録に失敗しました' });
    }
    res.json({ message: '登録に成功しました' });
  });
});

app.delete('/group-homes/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM group_homes WHERE id = ?';
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error('削除エラー:', err);
      return res.status(500).json({ message: '削除に失敗しました' });
    }
    res.json({ message: '削除に成功しました' });
  });
});

// ── UPDATE（PUT）: グループホームを編集 ──
app.put('/group-homes/:id', (req, res) => {
  const { id } = req.params;       // ← URL から ID を取得
  const d = req.body;              // ← フロントから送られてきた編集値

  const sql = `
    UPDATE group_homes SET
      property_name  = ?,
      unit_name      = ?,
      postal_code    = ?,
      address        = ?,
      phone_number   = ?,
      common_room    = ?,
      resident_rooms = ?,
      opening_date   = ?
    WHERE id = ?`;
  const values = [
    d.propertyName,
    d.unitName,
    d.postalCode,
    d.address,
    d.phoneNumber,
    d.commonRoom,
    JSON.stringify(d.residentRooms),
    d.openingDate,
    id,                // ← 最後に WHERE 用の ID
  ];

  pool.query(sql, values, (err) => {
    if (err) {
      console.error('更新エラー:', err);
      return res.status(500).json({ message: '更新に失敗しました' });
    }
    res.json({ message: '更新に成功しました' });
  });
});

app.post('/residents', (req, res) => {

  console.log("📦 POSTされた内容:", req.body);  // ←←← ここで確認

const {
  groupHomeId,
  name,
  nameKana,
  gender,
  birthdate,
  disabilityLevel,
  disabilityStartDate,
  roomNumber,
  moveInDate,
  moveOutDate,
  memo
} = req.body;

const sql = `
  INSERT INTO residents (
    group_home_id, name, name_kana, gender, birthdate,
    disability_level, disability_start_date,
    room_number, admission_date, discharge_date, memo, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
`;

const values = [
  Number(groupHomeId),
  name,
  nameKana,
  gender,
  birthdate,
  disabilityLevel,
  disabilityStartDate,
  roomNumber,
  moveInDate,
  moveOutDate || null,
  memo || ""
];

pool.query(sql, values, (err, result) => {
  if (err) {
    console.error('登録失敗:', err);
    res.status(500).json({ error: '登録失敗' });
  } else {
    res.status(201).json({ message: '利用者登録成功', id: result.insertId });
  }
});

});

app.get('/residents', (req, res) => {
  const sql = `
    SELECT * FROM residents
    ORDER BY admission_date DESC
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error('取得失敗:', err);
      res.status(500).json({ error: '取得失敗' });
    } else {
      res.json(results);
    }
  });
});

// ✅ 利用者削除（関連 usage_records も削除）
app.delete('/residents/:id', (req, res) => {
  const residentId = req.params.id;

  // まず関連する usage_records を削除（必要に応じて）
  const deleteUsageRecordsSql = 'DELETE FROM usage_records WHERE resident_id = ?';
  const deleteResidentSql = 'DELETE FROM residents WHERE id = ?';

  pool.query(deleteUsageRecordsSql, [residentId], (err) => {
    if (err) {
      console.error('使用記録削除エラー:', err);
      return res.status(500).json({ message: '使用記録の削除に失敗しました' });
    }

    // 次に利用者データ削除
    pool.query(deleteResidentSql, [residentId], (err) => {
      if (err) {
        console.error('利用者削除エラー:', err);
        return res.status(500).json({ message: '利用者の削除に失敗しました' });
      }

      res.json({ message: '削除に成功しました' });
    });
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

