// src/components/ResidentForm.tsx
import React, { useState } from 'react';

export default function ResidentForm() {
  const [formData, setFormData] = useState({
    group_home_id: '',
    name: '',
    gender: '',
    birthdate: '',
    room_number: '',
    admission_date: '',
    memo: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('https://nn-sample0006-production.up.railway.app/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert('利用者登録が成功しました！');
      } else {
        alert('登録に失敗しました...');
      }
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>利用者登録</h2>
      <input name="group_home_id" placeholder="グループホームID" onChange={handleChange} />
      <input name="name" placeholder="名前" onChange={handleChange} />
      <select name="gender" onChange={handleChange}>
        <option value="">性別を選択</option>
        <option value="男性">男性</option>
        <option value="女性">女性</option>
      </select>
      <input name="birthdate" type="date" onChange={handleChange} />
      <input name="room_number" placeholder="部屋番号" onChange={handleChange} />
      <input name="admission_date" type="date" onChange={handleChange} />
      <textarea name="memo" placeholder="メモ" onChange={handleChange} />
      <button type="submit">登録</button>
    </form>
  );
}

