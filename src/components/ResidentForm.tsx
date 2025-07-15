// src/components/ResidentForm.tsx
import React, { useState } from 'react';
import { Resident } from '../types/Resident';

interface ResidentFormProps {
  onSubmit: (resident: Resident) => void;
  groupHomes: { id: string; propertyName: string; unitName: string }[];
}

export default function ResidentForm({ onSubmit, groupHomes }: ResidentFormProps) {
  const [formData, setFormData] = useState({
    group_home_id: '',
    name: '',
    gender: '',
    birthdate: '',
    room_number: '',
    admission_date: '',
    memo: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
        const data = await res.json();
        alert('利用者登録が成功しました！');
        onSubmit(data); // ← 親に通知して一覧更新！

        // フォームを初期化
        setFormData({
          group_home_id: '',
          name: '',
          gender: '',
          birthdate: '',
          room_number: '',
          admission_date: '',
          memo: '',
        });
      } else {
        alert('登録に失敗しました...');
      }
    } catch (error) {
      console.error(error);
      alert('通信エラーが発生しました');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4 mb-8">
      <h2 className="text-xl font-semibold text-gray-800">利用者登録</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">グループホーム</label>
          <select
            name="group_home_id"
            value={formData.group_home_id}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
            required
          >
            <option value="">選択してください</option>
            {groupHomes.map((gh) => (
              <option key={gh.id} value={gh.id}>
                {gh.propertyName} - {gh.unitName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">名前</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">性別</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
            required
          >
            <option value="">選択してください</option>
            <option value="男性">男性</option>
            <option value="女性">女性</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">生年月日</label>
          <input
            type="date"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">部屋番号</label>
          <input
            name="room_number"
            value={formData.room_number}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">入居日</label>
          <input
            type="date"
            name="admission_date"
            value={formData.admission_date}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">メモ</label>
          <textarea
            name="memo"
            value={formData.memo}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
          />
        </div>
      </div>

      <button
        type="submit"
        className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 transition"
      >
        登録
      </button>
    </form>
  );
}

