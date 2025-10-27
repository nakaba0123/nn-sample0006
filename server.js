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

// 🔁 定期PingでMySQLの接続を維持
setInterval(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
//    console.log("[MySQL] Ping 成功 ✅");
  } catch (err) {
//    console.warn("[MySQL] Ping失敗 🚨", err);
  }
}, 1000 * 3); // ← 30秒ごとにPing！

const queryWithRetry = async (queryFn, maxRetries = 3, waitMs = 1000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await queryFn();
    } catch (err) {
      console.error(`${err.code || ''} エラー発生、${waitMs}ms後にリトライします... 残り${maxRetries - attempt - 1}`);
      attempt++;
      if (attempt >= maxRetries) throw err;
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
};

// =======================
// 🏠 グループホーム API
// =======================
app.get('/api/group-homes/main', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM group_homes WHERE unit_type = "MAIN"'
    );
    const fixed = results.map(row => ({
      ...row,
      resident_rooms: safeParse(row.resident_rooms),
    }));
    res.json(fixed);
  } catch (err) {
    console.error('MAIN取得エラー:', err);
    res.status(500).json({ message: '取得に失敗しました' });
  }
});

app.get('/api/group-homes/sub', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT *
       FROM group_homes
       ORDER BY
         -- ① 番号が空欄またはNULLなら先に
         (facility_code IS NULL OR facility_code = '') DESC,
         -- ② コードの文字数（短い順）
         LENGTH(facility_code),
         -- ③ 最後に文字列昇順（自然順）
         facility_code`
    );

    const fixed = results.map(row => ({
      ...row,
      resident_rooms: safeParse(row.resident_rooms),
    }));

    res.json(fixed);
  } catch (err) {
    console.error('SUB取得エラー:', err);
    res.status(500).json({ message: '取得に失敗しました' });
  }
});

function safeParse(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

app.post('/api/group-homes', async (req, res) => {
  const d = req.body;
  const sql = `
    INSERT INTO group_homes (
      facility_code, property_name, unit_name, postal_code, address, 
      phone_number, common_room, resident_rooms, opening_date, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    d.facilityCode, // ← 新しく追加
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

// /api/group-homes/:id PUT
app.put("/api/group-homes/:id", async (req, res) => {
  const { id } = req.params;
  const {
    facilityCode,
    propertyName,
    unitName,
    postalCode,
    address,
    phoneNumber,
    commonRoom,
    residentRooms,
    openingDate,
  } = req.body;

  try {
    const conn = await pool.getConnection();

    // まず古い値を取得
    const [rows] = await conn.execute(
      `SELECT property_name, unit_name FROM group_homes WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ error: "対象のグループホームが存在しません" });
    }

    const oldPropertyName = rows[0].property_name;
    const oldUnitName = rows[0].unit_name;

    // group_homes の更新
    await conn.execute(
      `UPDATE group_homes
       SET facility_code=?,
           property_name=?,
           unit_name=?,
           postal_code=?,
           address=?,
           phone_number=?,
           common_room=?,
           resident_rooms=?,
           opening_date=?
       WHERE id=?`,
      [
        facilityCode,
        propertyName,
        unitName,
        postalCode,
        address,
        phoneNumber,
        commonRoom,
        JSON.stringify(residentRooms || []),
        openingDate,
        id,
      ]
    );

    // expansions の更新（property_name と unit_name を両方見る）
    await conn.execute(
      `UPDATE expansions
       SET property_name=?, unit_name=?
       WHERE property_name=? AND unit_name=?`,
      [propertyName, unitName, oldPropertyName, oldUnitName]
    );

    conn.release();
    res.json({ message: "グループホーム更新成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "更新失敗" });
  }
});

// =======================
// 👤 利用者 API（residents + disability_histories）
// =======================
app.post('/api/residents', async (req, res) => {
  const connection = await pool.getConnection();
  const now = new Date();
  
  const { 
    group_home_id, group_home_name, unit_name,
    name, name_kana, gender, birthdate,
    disability_level, disability_start_date, room_number,
    move_in_date, move_out_date,
    status
  } = req.body;

  try {
    await connection.beginTransaction();

    // INSERT INTO residents
    const residentSql = `
      INSERT INTO residents ( 
        group_home_id, group_home_name, unit_name,
        name, name_kana, gender, birthdate,
        disability_level, disability_start_date, room_number,
        move_in_date, move_out_date,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const residentValues = [
      group_home_id, group_home_name, unit_name,
      name, name_kana, gender, birthdate,
      disability_level, disability_start_date, room_number,
      move_in_date || null, move_out_date || null,
      status, now, now
    ];
    const [residentResult] = await connection.query(residentSql, residentValues);
    const residentId = residentResult.insertId;

    // INSERT disability_histories
    const historySql = `
      INSERT INTO disability_histories (
        resident_id, disability_level, start_date, end_date, created_at, updated_at
      ) VALUES (?, ?, ?, '0000-00-00', ?, ?)
    `;
    const historyValues = [
      residentId, disability_level, disability_start_date, now, now
    ];
    await connection.query(historySql, historyValues);

    await connection.commit();

    // 🔥 INSERT直後のデータを取得して返す
    const [rows] = await pool.query(`
      SELECT 
        r.*, 
        g.property_name AS group_home_name, 
        g.unit_name
      FROM residents r
      LEFT JOIN group_homes g ON r.group_home_id = g.id
      WHERE r.id = ?
    `, [residentId]);

    res.json(rows[0]); // ←完全な1件データ返す
  } catch (err) {
    await connection.rollback();
    console.error('登録エラー:', err);
    res.status(500).json({ message: '登録に失敗しました' });
  } finally {
    connection.release();
  }
});

app.get('/api/residents', async (req, res) => {
  try {
    const [results] = await pool.query(`
    SELECT 
      r.*, 
      g.property_name AS group_home_name, -- ←ここを修正
      g.unit_name
    FROM residents r
    LEFT JOIN group_homes g ON r.group_home_id = g.id
    ORDER BY r.move_in_date DESC
    `);
    res.json(results);
  } catch (err) {
    console.error('取得失敗:', err);
    res.status(500).json({ error: '取得失敗' });
  }
});

// =======================
// ❌ 利用者＋障害歴の削除 API（2テーブル同時）
// =======================
app.delete('/api/residents/:id', async (req, res) => {
  const residentId = req.params.id;
  console.log('削除対象のID:', residentId);

  const connection = await pool.getConnection(); // ← コネクション取得

  try {
    await connection.beginTransaction(); // 🔸 トランザクション開始

    // 1. 障害歴削除
    await connection.query('DELETE FROM disability_histories WHERE resident_id = ?', [residentId]);

    // 2. 利用者削除
    const [result] = await connection.query('DELETE FROM residents WHERE id = ?', [residentId]);

    await connection.commit(); // 🔸 コミット
    console.log('削除結果:', result);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: '指定された利用者が存在しません' });
    } else {
      res.json({ message: '利用者と障害歴を削除しました' });
    }
  } catch (err) {
    await connection.rollback(); // 🔸 ロールバック
    console.error('利用者削除エラー:', err);
    res.status(500).json({ message: '利用者の削除に失敗しました' });
  } finally {
    connection.release(); // 🔸 コネクション解放
  }
});

app.patch('/api/residents/:id', async (req, res) => {
  const residentId = req.params.id;
  const {
    group_home_id, group_home_name, unit_name,
    name, name_kana, gender, birthdate,
    disability_level, disability_start_date, room_number,
    move_in_date, move_out_date, status
  } = req.body;

  console.log("req.body:", req.body);
  const now = new Date();

  console.log("disability_level:", disability_level);

  const sql = `
    UPDATE residents SET
      group_home_id = ?, group_home_name = ?, unit_name = ?,
      name = ?, name_kana = ?, gender = ?, birthdate = ?,
      room_number = ?, move_in_date = ?, move_out_date = ?, status = ?, updated_at = ?
    WHERE id = ?
  `;

  const values = [
    group_home_id, group_home_name, unit_name,
    name, name_kana, gender, birthdate,
    room_number, move_in_date || null, move_out_date || null, status, now,
    residentId
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

// GET /api/usage-records?residentId=98&year=2025&month=8
app.get('/api/usage-records', async (req, res) => {
  console.log("GET /api/usage-records が呼ばれました！");
  const { residentId, year, month } = req.query;
  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`; // TODO: 月末計算は後で修正

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    // 既存のusage_recordsを取得
    const [usageRecords] = await connection.query(`
      SELECT * FROM usage_records
      WHERE resident_id = ? AND usage_date BETWEEN ? AND ?
    `, [residentId, startDate, endDate]);

    // histories取得
    const [histories] = await connection.query(`
      SELECT * FROM disability_histories
      WHERE resident_id = ?
    `, [residentId]);

    const daysInMonth = new Date(year, month, 0).getDate();
    const results = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];

      // TODO: 居住期間チェック（今は仮でtrue）
      const inRange = true;
      if (!inRange) continue;

      // 区分取得
      const disability = histories.find(h => {
        const start = new Date(h.start_date);
        const end = h.end_date ? new Date(h.end_date) : null;
        return start <= date && (!end || date <= end);
      });
      const level = disability ? disability.level : '';

      // usage_recordsから探す
      let usage = usageRecords.find(r =>
        r.usage_date.toISOString().startsWith(dateStr)
      );

      // 🔥 usageがなければINSERT
      if (!usage) {
        const [insertResult] = await connection.query(`
          INSERT INTO usage_records (resident_id, usage_date, is_used)
          VALUES (?, ?, ?)
        `, [residentId, dateStr, true]);

        // 挿入したレコードをusageとして扱う
        usage = {
          id: insertResult.insertId,
          resident_id: Number(residentId),
          usage_date: new Date(dateStr),
          is_used: 0,
        };

        usageRecords.push(usage);
      }

      // camelCaseで返す
      results.push({
        residentId: Number(residentId),
        date: dateStr,
        isUsed: !!usage.is_used,
        disabilityLevel: level || '',
      });
    }

    await connection.commit();
    connection.release();

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// usage_records の保存API
app.post('/api/usage-records', async (req, res) => {
  const { id, residentId, date, isUsed, disabilityLevel } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM usage_records WHERE resident_id = ? AND date = ?',
      [residentId, date]
    );

    if (rows.length > 0) {
      // 既存 → UPDATE
      await pool.query(
        'UPDATE usage_records SET is_used = ?, disability_level = ?, updated_at = NOW() WHERE resident_id = ? AND date = ?',
        [isUsed, disabilityLevel, residentId, date]
      );
    } else {
      // 新規 → INSERT
      await pool.query(
        'INSERT INTO usage_records (id, resident_id, date, is_used, disability_level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [id, residentId, date, isUsed, disabilityLevel]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'DB error' });
  }
});

app.patch('/api/usage-records/:id', async (req, res) => {
  const { id } = req.params;
  const { isUsed, disabilityLevel } = req.body;
  try {
    await pool.query(`
      UPDATE usage_records
      SET is_used = ?, disability_level = ?, updated_at = NOW()
      WHERE id = ?
    `, [isUsed, disabilityLevel, id]);
    res.json({ message: 'Usage record updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update usage record' });
  }
});

app.delete('/api/usage-records/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM usage_records WHERE id = ?`, [id]);
    res.json({ message: 'Usage record deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete usage record' });
  }
});

app.post('/api/disability_histories', async (req, res) => {
  console.log("POST /api/disability_histories が呼ばれました！");
  console.log("req.body:", req.body);

  const { residentId, disabilityLevel, startDate, endDate } = req.body;

  const insertSql = `
    INSERT INTO disability_histories
      (resident_id, disability_level, start_date, end_date)
    VALUES (?, ?, ?, ?)
  `;
  const insertValues = [
    residentId || null,
    disabilityLevel || null,
    startDate || null,
    endDate || null
  ];

  try {
    const [insertResult] = await pool.query(insertSql, insertValues);
    const insertedId = insertResult.insertId;
    const [latestRows] = await pool.query(
      `
        SELECT id, disability_level, start_date
        FROM disability_histories
        WHERE resident_id = ?
        ORDER BY start_date DESC
        LIMIT 1
      `,
      [residentId]
    );
    const latestHistory = latestRows[0];

    if (latestHistory && latestHistory.id === insertedId) {
      const updateSql = `
        UPDATE residents
        SET disability_level = ?,
            disability_start_date = ?
        WHERE id = ?
      `;
      const updateValues = [
        latestHistory.disability_level || null,
        latestHistory.start_date || null,
        residentId
      ];
      await pool.query(updateSql, updateValues);
    }

    res.status(201).json({
      message: '障害履歴を登録しました（最新なら利用者情報も更新済み）',
      id: insertedId
    });
  } catch (err) {
    console.error('障害履歴登録または利用者情報更新エラー:', err);
    res.status(500).json({ message: '登録または更新に失敗しました' });
  }
});


app.get('/api/disability_histories', async (req, res) => {
  const residentId = req.query.resident_id;

  try {
    const db = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    let query = `SELECT * FROM disability_histories`;
    let params = [];

    if (residentId) {
      query += ` WHERE resident_id = ?`;
      params.push(residentId);
    }

    query += ` ORDER BY start_date DESC`;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("障害履歴の取得エラー:", error);
    res.status(500).json({ error: "データ取得に失敗しました" });
  }
});

app.put('/api/disability_histories/:id', async (req, res) => {
  console.log("PUT /api/disability_histories が呼ばれました！");
  console.log("req.body:", req.body);

  const historyId = req.params.id;
  const disability_level = req.body.disabilityLevel ?? null;
  const start_date = req.body.startDate || null;
  const end_date = req.body.endDate || null;

  try {
    const [result] = await pool.query(
      `UPDATE disability_histories
       SET disability_level = ?, start_date = ?, end_date = ?
       WHERE id = ?`,
      [disability_level, start_date, end_date, historyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '更新対象が見つかりません' });
    }

    const [rows] = await pool.query(
      `SELECT * FROM disability_histories WHERE id = ?`,
      [historyId]
    );
    const updatedHistory = rows[0];

    if (!updatedHistory) {
      return res.status(404).json({ error: '履歴が見つかりません' });
    }

    const residentId = updatedHistory.resident_id;

    const [latestRows] = await pool.query(
      `SELECT id, disability_level, start_date
       FROM disability_histories
       WHERE resident_id = ?
       ORDER BY start_date DESC, id DESC
       LIMIT 1`,
      [residentId]
    );
    const latestHistory = latestRows[0];

    if (latestHistory && latestHistory.id == historyId) {
      await pool.query(
        `UPDATE residents
         SET disability_level = ?, disability_start_date = ?
         WHERE id = ?`,
        [latestHistory.disability_level || null, latestHistory.start_date || null, residentId]
      );
      console.log(`residents テーブルを更新しました（resident_id=${residentId}）`);
    }

    res.json(updatedHistory);

  } catch (err) {
    console.error('更新失敗:', err);
    res.status(500).json({ error: '更新に失敗しました' });
  }
});

// PATCH /api/disability_histories/:id
app.patch('/api/disability_histories/:id', async (req, res) => {
  console.log("PATCH /api/disability_histories が呼ばれました！");
  console.log("req.body::", req.body);
  console.log("req.body.disability_level::", req.body.disability_level);
  console.log("req.body.start_date::", req.body.start_date);
  console.log("req.body.endDate::", req.body.end_date);
  const id = req.params.id;
//  const { disabilityLevel, startDate, endDate } = req.body;
  const disability_level = req.body.disability_level ?? null;
  const start_date = req.body.start_date || null;
  const end_date = req.body.end_date || null;

  const connection = await pool.getConnection();
  try {
    // 1. 旧データ取得
    const [beforeRows] = await connection.query(
      'SELECT * FROM disability_histories WHERE id = ?',
      [id]
    );
    const before = beforeRows[0] || null;

    // 2. 更新実行
    await connection.query(
      `UPDATE disability_histories
       SET disability_level = ?,
           start_date = ?,
           end_date = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        disability_level,
        start_date || null,
        end_date || null,
        id
      ]
    );

    // 3. 新データ取得
    const [afterRows] = await connection.query(
      'SELECT * FROM disability_histories WHERE id = ?',
      [id]
    );
    const after = afterRows[0] || null;

    // 4. 両方返す
    res.json({
      before,
      after
    });

  } catch (err) {
    console.error('更新エラー:', err);
    res.status(500).json({ error: '更新に失敗しました' });
  } finally {
    connection.release();
  }
});


app.delete('/api/expansions/:id', async (req, res) => {
  const expansionId = req.params.id;

  try {
    const [result] = await pool.execute(
      'DELETE FROM expansions WHERE id = ?',
      [expansionId]
    );
    res.status(200).json({ message: '削除成功' });
  } catch (err) {
    console.error('増床削除エラー:', err);
    res.status(500).json({ error: '削除失敗' });
  }
});
/*
app.post('/api/expansions', async (req, res) => {
  console.log("POST /api/expansions が呼ばれました！");
  console.log("req.body:", req.body);

  const {
    propertyName,
    unitName,       // GHのユニット名
    expansionType,  // A or B
    newRooms,
    commonRoom,
    startDate
  } = req.body;

  if (!propertyName || !unitName) {
    return res.status(400).json({ message: "propertyName と unitName は必須です" });
  }

  let normalizedRooms;
  try {
    if (Array.isArray(newRooms)) {
      normalizedRooms = newRooms;
    } else if (typeof newRooms === "string") {
      normalizedRooms = JSON.parse(newRooms || "[]");
    } else {
      normalizedRooms = [];
    }
  } catch (e) {
    console.error("newRooms の JSON 変換失敗:", e);
    normalizedRooms = [];
  }

  const capacity = normalizedRooms.length + (commonRoom ? 1 : 0);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const expansionSql = `
      INSERT INTO expansions (
        property_name,
        unit_name,
        expansion_type,
        new_rooms,
        common_room,
        start_date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const expansionValues = [
      propertyName,
      unitName,
      expansionType || null,
      JSON.stringify(normalizedRooms),
      commonRoom ? 1 : 0,
      startDate || null
    ];
    const [expansionResult] = await conn.query(expansionSql, expansionValues);

    if (expansionType === 'A') {
      const groupHomeSql = `
        INSERT INTO group_homes (
          property_name,
          unit_name,
          capacity,
          unit_type
        ) VALUES (?, ?, ?, "SUB")
      `;
      await conn.query(groupHomeSql, [propertyName, unitName, capacity]);
    } else if (expansionType === 'B') {
      const updateSql = `
        UPDATE group_homes
        SET capacity = capacity + ?
        WHERE property_name = ? AND unit_name = ? AND unit_type = "MAIN"
      `;
      await conn.query(updateSql, [capacity, propertyName, unitName]);
    }

    await conn.commit();
    res.status(201).json({
      message: '増床情報を登録しました',
      id: expansionResult.insertId
    });
  } catch (err) {
    await conn.rollback();
    console.error('増床登録エラー:', err);
    res.status(500).json({ message: '増床登録に失敗しました' });
  } finally {
    conn.release();
  }
});
*/

app.post('/api/expansions', async (req, res) => {
  console.log("POST /api/expansions が呼ばれました！");
  console.log("req.body:", req.body);

  const {
    propertyName,
    unitName,
    expansionType, // A or B
    newRooms,
    commonRoom,
    startDate,
    facilityCode, // ← ★ 追加：別ユニット登録時に受け取る
    createdAt,    // 追加
  } = req.body;

  if (!propertyName || !unitName) {
    return res.status(400).json({ message: "propertyName と unitName は必須です" });
  }

  let normalizedRooms;
  try {
    if (Array.isArray(newRooms)) {
      normalizedRooms = newRooms;
    } else if (typeof newRooms === "string") {
      normalizedRooms = JSON.parse(newRooms || "[]");
    } else {
      normalizedRooms = [];
    }
  } catch (e) {
    console.error("newRooms の JSON 変換失敗:", e);
    normalizedRooms = [];
  }

  const capacity = normalizedRooms.length + (commonRoom ? 1 : 0);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // expansionsに記録
    const expansionSql = `
      INSERT INTO expansions (
        property_name,
        unit_name,
        expansion_type,
        new_rooms,
        common_room,
        start_date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const expansionValues = [
      propertyName,
      unitName,
      expansionType || null,
      JSON.stringify(normalizedRooms),
//      commonRoom ? 1 : 0,
      expansionType === 'A' ? commonRoom : null,
      startDate || null,
    ];
    const [expansionResult] = await conn.query(expansionSql, expansionValues);

    // === A: 別ユニット登録の場合 ===
    if (expansionType === 'A') {
      if (!facilityCode) {
        throw new Error("facilityCode が指定されていません（別ユニット登録時は必須）");
      }

      const groupHomeSql = `
        INSERT INTO group_homes (
          property_name,
          facility_code,
          created_at,
          unit_name,
          capacity,
          unit_type
        ) VALUES (?, ?, ?, ?, ?, "SUB")
      `;
      await conn.query(groupHomeSql, [propertyName, facilityCode, createdAt, unitName, capacity]);

    // === B: 単純増床（同ユニット） ===
    } else if (expansionType === 'B') {
      const updateSql = `
        UPDATE group_homes
        SET capacity = capacity + ?
        WHERE property_name = ? AND unit_name = ? AND unit_type = "MAIN"
      `;
      await conn.query(updateSql, [capacity, propertyName, unitName]);
    }

    await conn.commit();
    res.status(201).json({
      message: '増床情報を登録しました',
      id: expansionResult.insertId,
    });

  } catch (err) {
    await conn.rollback();
    console.error('増床登録エラー:', err);
    res.status(500).json({ message: '増床登録に失敗しました', error: err.message });
  } finally {
    conn.release();
  }
});

//app.get('/api/expansions', async (req, res) => {
//  console.log("GET /api/expansions");
//
//  const { group_home_id } = req.query;
//
//  const sql = group_home_id
//    ? 'SELECT * FROM expansions WHERE group_home_id = ? ORDER BY id DESC'
//    : 'SELECT * FROM expansions ORDER BY id DESC';
//
//  try {
//    const [rows] = group_home_id
//      ? await pool.query(sql, [group_home_id])
//      : await pool.query(sql);
//
//    res.status(200).json(rows);
//  } catch (err) {
//    console.error('増床一覧取得エラー:', err);
//    res.status(500).json({ message: '取得に失敗しました' });
//  }
//});

app.get('/api/expansions', async (req, res) => {
  console.log("GET /api/expansions");

  const { group_home_id } = req.query;

  const sql = group_home_id
    ? 'SELECT * FROM expansions WHERE group_home_id = ? ORDER BY id DESC'
    : 'SELECT * FROM expansions ORDER BY id DESC';

  try {
    const rows = await queryWithRetry(async () => {
      if (group_home_id) {
        return (await pool.query(sql, [group_home_id]))[0];
      } else {
        return (await pool.query(sql))[0];
      }
    }, 3, 1000); // 3回リトライ、1秒待機

    res.status(200).json(rows);
  } catch (err) {
    console.error('増床一覧取得リトライ失敗:', err);
    res.status(500).json({ message: '取得に失敗しました' });
  }
});

// PUT /api/expansions/update-property-name
app.put('/api/expansions/update-property-name', async (req, res) => {
  const { oldPropertyName, newPropertyName } = req.body;

  if (!oldPropertyName || !newPropertyName) {
    return res.status(400).json({ error: 'プロパティ名が不足しています' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE expansions
       SET property_name = ?
       WHERE property_name = ?`,
      [newPropertyName, oldPropertyName]
    );

    await conn.commit();
    res.json({ message: 'expansionsテーブルのproperty_nameを更新しました' });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ error: 'expansionsテーブルの更新に失敗しました' });
  } finally {
    conn.release();
  }
});


// -----------------------------------
// POST /api/users - 新規ユーザー登録
// -----------------------------------
app.post('/api/users', async (req, res) => {
  const {
    name,
    email,
    // department, // ←削除
    position,
    employeeId,
    joinDate,
    retirementDate,
    status,
    role,
    departmentHistory // [{ departmentName, startDate, endDate? }]
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // users テーブルに INSERT（department は除外）
    const [userResult] = await conn.execute(
      `INSERT INTO users
        (name, email, position, employee_id, join_date, retirement_date, status, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        email,
        position || null,
        employeeId ?? null,
        joinDate ?? null,
        retirementDate ?? null,
        status || 'active',
        role || 'staff'
      ]
    );

    const userId = userResult.insertId;

    // department_histories テーブルに INSERT（あれば）
    if (Array.isArray(departmentHistory) && departmentHistory.length > 0) {
      const historyValues = departmentHistory.map(h => [
        userId,
        h.departmentName,
        h.startDate,
        h.endDate || null,
        new Date()
      ]);

      await conn.query(
        `INSERT INTO department_histories
          (user_id, department_name, start_date, end_date, created_at)
         VALUES ?`,
        [historyValues]
      );
    }

    await conn.commit();
    // 返すときは users と department_histories をまとめる
    const [userRows] = await conn.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [historyRows] = await conn.query('SELECT * FROM department_histories WHERE user_id = ?', [userId]);

    // snake_case → camelCase 変換関数
    const toCamel = (row) => ({
      id: row.id,
      userId: row.user_id,
      departmentName: row.department_name,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
    });

    res.json({
      ...userRows[0],
      departmentHistory: historyRows.map(toCamel),
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ error: 'ユーザー登録に失敗しました' });
  } finally {
    conn.release();
  }
});

// -----------------------------------
// PATCH /api/users/:id - ユーザー更新（簡易版）
// -----------------------------------
app.patch('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    position,
    employeeId,
    joinDate,
    retirementDate,
    status,
    role
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // users テーブル更新
    await conn.execute(
      `UPDATE users SET
        name=?, email=?, position=?, employee_id=?, join_date=?, retirement_date=?, status=?, role=?
       WHERE id=?`,
      [
        name,
        email,
        position || null,
        employeeId || null,
        joinDate || null,
        retirementDate || null,
        status,
        role,
        id
      ]
    );

    await conn.commit();

    // 更新後のユーザー取得
    const [userRows] = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
    const user = userRows[0];

    // 部署履歴を取得
    const [historyRows] = await conn.query(
      `SELECT id, user_id, department_name, start_date, end_date
       FROM department_histories
       WHERE user_id = ?
       ORDER BY start_date ASC`,
      [id]
    );

    // ユーザーに departmentHistory を追加
    user.departmentHistory = historyRows;

    res.json(user);

  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ error: 'ユーザー更新に失敗しました' });
  } finally {
    conn.release();
  }
});

// 全ユーザー取得
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ユーザー取得エラー" });
  }
});

// DELETE /api/users/:id
app.delete("/api/users/:id", async (req, res) => {
  const userId = req.params.id;
  const connection = await pool.getConnection();

  try {
    const [result] = await connection.query(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
});

// -----------------------------------
// POST /api/department_histories - 部署履歴の追加
// -----------------------------------
app.post('/api/department_histories', async (req, res) => {
  // camelCase / snake_case 両対応
  const {
    user_id,
    userId,
    departmentName,
    startDate,
    endDate
  } = req.body;

  const userIdValue = user_id || userId;

  if (!userIdValue || !departmentName || !startDate) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();      

    const [result] = await conn.execute(
      `INSERT INTO department_histories
        (user_id, department_name, start_date, end_date, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        userIdValue,
        departmentName,
        startDate,
        endDate || null
      ]
    );

    await conn.commit();

    const [rows] = await conn.query(
      'SELECT * FROM department_histories WHERE id = ?',
      [result.insertId]
    );

    res.json(rows[0]);
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ error: '部署履歴の登録に失敗しました' });
  } finally {
    conn.release();
  }
});

// -----------------------------------
// GET /api/department_histories/:userId - 特定ユーザーの履歴一覧取得
// -----------------------------------
app.get('/api/department_histories/:userId', async (req, res) => {
  const { userId } = req.params;

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      'SELECT * FROM department_histories WHERE user_id = ? ORDER BY start_date DESC',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '履歴の取得に失敗しました' });
  } finally {
    conn.release();
  }
});

// 全部署履歴取得
app.get("/api/department_histories", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM department_histories");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "部署履歴取得エラー" });
  }
});

// -----------------------------------
// PATCH /api/department_histories/:id - 特定履歴の更新
// -----------------------------------
app.patch('/api/department_histories/:id', async (req, res) => {
  const { id } = req.params;
  const { departmentName, startDate, endDate } = req.body;

  const conn = await pool.getConnection();
  try {
    // 更新
    await conn.query(
      `UPDATE department_histories
       SET department_name = ?, start_date = ?, end_date = ?
       WHERE id = ?`,
      [
        departmentName || null,
        startDate || null,
        endDate || null,
        id
      ]
    );

    // 更新後のレコードを取得
    const [rows] = await conn.query(
      'SELECT * FROM department_histories WHERE id = ?',
      [id]
    );
    const updated = rows[0];

    // snake_case → camelCase に変換して返す
    const mapped = {
      id: updated.id,
      userId: updated.user_id,
      departmentName: updated.department_name,
      startDate: updated.start_date,
      endDate: updated.end_date,
      createdAt: updated.created_at
    };

    res.json(mapped);
  } catch (error) {
    console.error("PATCH /api/department_histories/:id error:", error);
    res.status(500).json({ error: '履歴の更新に失敗しました' });
  } finally {
    conn.release();
  }
});

// 部署履歴削除
app.delete("/api/department_histories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM department_histories WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "削除対象が見つかりません" });
    }

    res.json({ message: "部署履歴を削除しました", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "部署履歴削除エラー" });
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

