import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { residentId, disabilityLevel, startDate, endDate } = req.body;

      // 入力チェック（本番用）
      if (!residentId || !disabilityLevel || !startDate) {
        return res.status(400).json({ error: '必須項目が不足しています' });
      }

      // ---- ここからモック処理 ----
      // 本来はDB更新するけど、今回は固定データを返す
      const updatedHistory = {
        id: Number(id),
        residentId: Number(residentId),
        disabilityLevel,
        startDate,
        endDate: endDate || null,
        updatedAt: new Date().toISOString()
      };
      // ---- ここまでモック処理 ----

      res.status(200).json(updatedHistory);
    } catch (error) {
      console.error('PUT エラー:', error);
      res.status(500).json({ error: '障害履歴の更新に失敗しました' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

