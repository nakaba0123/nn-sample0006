import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma'; // Prisma を使ってる想定

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { residentId, disabilityLevel, startDate, endDate } = req.body;

      // 入力チェック
      if (!residentId || !disabilityLevel || !startDate) {
        return res.status(400).json({ error: '必須項目が不足しています' });
      }

      // データ更新
      const updatedHistory = await prisma.disabilityHistory.update({
        where: { id: Number(id) },
        data: {
          residentId: Number(residentId),
          disabilityLevel,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null
        }
      });

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

