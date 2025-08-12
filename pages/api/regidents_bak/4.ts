// [id].ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
    method,
  } = req;

  if (method === 'GET') {
    try {
      // ここでDB接続して居住者情報を取得（仮）
      const resident = {
        id,
        name: "テスト太郎",
        roomNumber: "101号",
        disabilityLevel: "1",
      };

      res.status(200).json(resident);
    } catch (error) {
      console.error('取得エラー:', error);
      res.status(500).json({ error: '取得失敗' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}

