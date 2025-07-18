// pages/api/residents/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    // ダミー例。実際はDB接続
    res.status(200).json({
      id,
      name: "出口",
      roomNumber: "104号",
    });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

