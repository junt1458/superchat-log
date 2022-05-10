import * as csv from 'csv'
import * as iconv from 'iconv-lite'
import { NextApiRequest, NextApiResponse } from 'next'
import { formatDate } from '@/utils/display'

const CSVApi = async (req: NextApiRequest, res: NextApiResponse) => {
  const toCSVRow = (d: ReceiveData, i: number): string[] => {
    const row = [`${i + 1}`]
    if (d.type === 'gift') {
      const da = d.data.data as Gift
      row.push(formatDate(new Date(da.timestamp * 1000)))
      row.push('ギフト')
      row.push(da.uname)
      row.push(`${da.uid}`)
      row.push(`${da.total_coin / 1000}`)
      row.push(`${da.giftName} x${da.num}`)
    } else if (d.type === 'superchat') {
      const da = d.data.data as SuperChat
      row.push(formatDate(new Date(da.start_time * 1000)))
      row.push('スーパーチャット')
      row.push(da.user_info.uname)
      row.push(`${da.uid}`)
      row.push(`${da.price}`)
      row.push(da.message)
    } else if (d.type === 'membership') {
      const da = d.data.data as Membership
      row.push(formatDate(new Date(da.start_time * 1000)))
      row.push('メンバーシップ')
      row.push(da.username)
      row.push(`${da.uid}`)
      row.push(`${(da.price / 1000) * da.num}`)
      row.push(`${da.gift_name} x${da.num}`)
    }
    return row
  }

  const data = req.body as ReceiveData[]
  if (!data) {
    res.status(400).json({ error: 'Invalid data provided.' })
    return
  }

  const csv_data = [
    [
      '#',
      '日時',
      '種別',
      'ユーザー名',
      'ユーザーID',
      '金額(CNY)',
      'メッセージ/ギフト/メンバーランク',
    ],
  ]

  data.forEach((e, i) => {
    csv_data.push(toCSVRow(e, i))
  })

  const csvdata = await new Promise<string>((resolve, reject) => {
    csv.stringify(csv_data, (error, output) => {
      if (error) {
        reject(error)
        return
      }
      resolve(output)
    })
  })

  // Append Byte Order Mark
  const csv_buffer = Buffer.concat([
    Buffer.from(Uint8Array.from([0xef, 0xbb, 0xbf])),
    Buffer.from(csvdata),
  ])

  // Encode to Base64
  res
    .setHeader('Content-Type', 'text/csv; charset=utf-8')
    .status(200)
    .send(csv_buffer.toString('base64'))
}

export default CSVApi
