const express = require('express');
const cors = require('cors');
const path = require("path");
const mysql = require('mysql2/promise'); // ← ここが重要！！！
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ Promise対応のMySQL接続プールに変更
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  // ✅ acquireTimeout は無効なので削除してもOK。警告出てたよね。
});

console.log("✅ MySQL接続プールを作成しました");

// =======================
// 🏠 グループホーム API
// =======================
app.get('/api/group-homes', (req, res) => {
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

app.post('/api/group-homes', (req, res) => {
  const d = req.body;
  const sql = `
    INSERT INTO group_homes (
      property_name, unit_name, postal_code, address, 
      phone_number, common_room, resident_rooms, opening_date, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    d.propertyName, d.unitName, d.postalCode,
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

app.delete('/api/group-homes/:id', (req, res) => {
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

app.put('/api/group-homes/:id', (req, res) => {
  const { id } = req.params;
  const d = req.body;

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
    id,
  ];

  pool.query(sql, values, (err) => {
    if (err) {
      console.error('更新エラー:', err);
      return res.status(500).json({ message: '更新に失敗しました' });
    }
    res.json({ message: '更新に成功しました' });
  });
});

// =======================
// 👤 利用者 API
// =======================
app.post('/api/residents', (req, res) => {
  console.log("📦 POSTされた内容:", req.body);

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

app.get('/api/residents', (req, res) => {
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

app.delete('/api/residents/:id', (req, res) => {
  const residentId = req.params.id;

//  const deleteUsageRecordsSql = 'DELETE FROM usage_records WHERE resident_id = ?';
  const deleteResidentSql = 'DELETE FROM residents WHERE id = ?';

//  pool.query(deleteUsageRecordsSql, [residentId], (err) => {
//    if (err) {
//      console.error('使用記録削除エラー:', err);
//      return res.status(500).json({ message: '使用記録の削除に失敗しました' });
//    }

    pool.query(deleteResidentSql, [residentId], (err) => {
      if (err) {
        console.error('利用者削除エラー:', err);
        return res.status(500).json({ message: '利用者の削除に失敗しました' });
      }

      res.json({ message: '削除に成功しました' });
    });
  });
//});

// 利用者情報の更新（PATCH）
app.patch('/api/residents/:id', (req, res) => {
  const residentId = req.params.id;
  const {
    group_home_id,
    name,
    name_kana,
    gender,
    birthdate,
    disability_level,
    disability_start_date,
    room_number,
    admission_date,
    discharge_date,
    memo,
  } = req.body;

  const sql = `
    UPDATE residents
    SET
      group_home_id = ?,
      name = ?,
      name_kana = ?,
      gender = ?,
      birthdate = ?,
      disability_level = ?,
      disability_start_date = ?,
      room_number = ?,
      admission_date = ?,
      discharge_date = ?,
      memo = ?
    WHERE id = ?
  `;

  const values = [
    group_home_id,
    name,
    name_kana,
    gender,
    birthdate,
    disability_level,
    disability_start_date,
    room_number,
    admission_date,
    discharge_date,
    memo,
    residentId,
  ];

  pool.query(sql, values, (err, results) => {
    if (err) {
      console.error('利用者更新エラー:', err);
      return res.status(500).json({ message: '利用者の更新に失敗しました' });
    }

    res.json({ message: '利用者を更新しました' });
  });
});

// server.js に ↓ これが必要！
app.get("/api/residents/:id", async (req, res) => {
  const id = req.params.id;
  const [rows] = await pool.query("SELECT * FROM residents WHERE id = ?", [id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: "居住者が見つかりません" });
  }
  res.json(rows[0]);
});

app.get("/api/usage-records", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM usage_records");
    res.json(rows);
  } catch (error) {
    console.error("📛 usage_records取得エラー:", error);
    res.status(500).json({ error: "内部サーバーエラー" });
  }
});

// =======================
// 🌐 補助 API
// =======================
app.get('/api/my-ip', async (req, res) => {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch('https://api.ipify.org?format=json');
  const data = await response.json();
  res.json(data);
});

// =======================
// 📦 フロントエンドルート
// =======================
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

