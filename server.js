const express = require('express');
const cors = require('cors');
const path = require("path");
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

console.log("✅ MySQL接続プールを作成しました");

// =======================
// 🏠 グループホーム API
// =======================
app.get('/api/group-homes', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM group_homes');
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
    res.json(fixed);
  } catch (err) {
    console.error('DB取得エラー実ログ:', err);
    res.status(500).json({ message: '取得に失敗しました' });
  }
});

app.post('/api/group-homes', async (req, res) => {
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

  try {
    await pool.query(sql, values);
    res.json({ message: '登録に成功しました' });
  } catch (err) {
    console.error('登録エラー実ログ:', err);
    res.status(500).json({ message: '登録に失敗しました' });
  }
});

app.delete('/api/group-homes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM group_homes WHERE id = ?', [id]);
    res.json({ message: '削除に成功しました' });
  } catch (err) {
    console.error('削除エラー:', err);
    res.status(500).json({ message: '削除に失敗しました' });
  }
});

app.put('/api/group-homes/:id', async (req, res) => {
  const { id } = req.params;
  const d = req.body;
  const sql = `
    UPDATE group_homes SET
      property_name = ?,
      unit_name = ?,
      postal_code = ?,
      address = ?,
      phone_number = ?,
      common_room = ?,
      resident_rooms = ?,
      opening_date = ?
    WHERE id = ?`;
  const values = [
    d.propertyName, d.unitName, d.postalCode, d.address,
    d.phoneNumber, d.commonRoom, JSON.stringify(d.residentRooms), d.openingDate, id
  ];
  try {
    await pool.query(sql, values);
    res.json({ message: '更新に成功しました' });
  } catch (err) {
    console.error('更新エラー:', err);
    res.status(500).json({ message: '更新に失敗しました' });
  }
});

// =======================
// 👤 利用者 API
// =======================
app.post('/api/residents', async (req, res) => {
  const {
    group_home_id, name, name_kana, gender, birthdate,
    disability_level, disability_start_date, room_number,
    admission_date, discharge_date, memo
  } = req.body; 

  const sql = `
    INSERT INTO residents (
      group_home_id, name, name_kana, gender, birthdate,
      disability_level, disability_start_date,
      room_number, admission_date, discharge_date, memo, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

  const values = [
    Number(group_home_id), name, name_kana, gender, birthdate,
    disability_level || null, disability_start_date || null, room_number || null,
    admission_date || null, discharge_date || null, memo || ''
  ];

  try { 
    const [result] = await pool.query(sql, values);
    res.status(201).json({ message: '利用者登録成功', id: result.insertId });
  } catch (err) {
    console.error('登録失敗:', err);
    res.status(500).json({ error: '登録失敗' });
  } 
});

app.get('/api/residents', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM residents ORDER BY admission_date DESC');
    res.json(results);
  } catch (err) {
    console.error('取得失敗:', err);
    res.status(500).json({ error: '取得失敗' });
  }
});

app.delete('/api/residents/:id', async (req, res) => {
  const residentId = req.params.id;
  console.log('削除対象のID:', residentId); // ← これ追加！
  try {
    const result = await pool.query('DELETE FROM residents WHERE id = ?', [residentId]);
    console.log('削除結果:', result); // ← これも追加！
    res.json({ message: '削除に成功しました' });
  } catch (err) {
    console.error('利用者削除エラー:', err); // ← エラーログをちゃんと出す！
    res.status(500).json({ message: '利用者の削除に失敗しました' });
  }
});

app.patch('/api/residents/:id', async (req, res) => {
  const residentId = req.params.id;
  const {
    group_home_id, name, name_kana, gender, birthdate,
    disabilityHistory, room_number,
    admission_date, discharge_date, memo
  } = req.body;

  const now = new Date();

  const current = disabilityHistory.find((h) => !h.endDate);
  const disability_level = current?.disabilityLevel || null;
  const disability_start_date = current?.startDate || null;

  const dischargeDate = !discharge_date || discharge_date === "" ? null : discharge_date;

  const sql = `
    UPDATE residents SET
      group_home_id = ?, name = ?, name_kana = ?, gender = ?,
      birthdate = ?, disability_level = ?, disability_start_date = ?,
      room_number = ?, admission_date = ?, discharge_date = ?, memo = ?, updated_at = ?
    WHERE id = ?
  `;
  const values = [
    group_home_id, name, name_kana, gender, birthdate,
    disability_level, disability_start_date,
    room_number, admission_date, dischargeDate, memo, now, residentId
  ];

  try {
    console.log('[PATCH] 更新データ:', values);
    await pool.query(sql, values);
    res.json({ message: '利用者を更新しました' });
  } catch (err) {
    console.error('利用者更新エラー:', err);
    res.status(500).json({ message: '利用者の更新に失敗しました' });
  }
});

app.get('/api/residents/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM residents WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: '居住者が見つかりません' });
    res.json(rows[0]);
  } catch (err) {
    console.error('取得失敗:', err);
    res.status(500).json({ error: '取得失敗' });
  }
});

app.get('/api/usage-records', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usage_records');
    res.json(rows);
  } catch (err) {
    console.error('📛 usage_records取得エラー:', err);
    res.status(500).json({ error: '内部サーバーエラー' });
  }
});

app.post('/api/disability_histories', async (req, res) => {
  const { resident_id, disability_level, start_date, end_date } = req.body;

  const sql = `
    INSERT INTO disability_histories
      (resident_id, disability_level, start_date, end_date)
    VALUES (?, ?, ?, ?)
  `;

  const values = [
    resident_id,
    disability_level,
    start_date,
    end_date || null  // null許容
  ];

  try {
    const [result] = await pool.query(sql, values);
    res.status(201).json({ message: '障害履歴を登録しました', id: result.insertId });
  } catch (err) {
    console.error('障害履歴登録エラー:', err);
    res.status(500).json({ message: '障害履歴の登録に失敗しました' });
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
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

