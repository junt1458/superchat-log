import * as csv from 'csv'
import * as iconv from 'iconv-lite'
import { NextApiRequest, NextApiResponse } from 'next'

const CSVApi = async (req: NextApiRequest, res: NextApiResponse) => {
  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}/${('0' + (date.getMonth() + 1)).slice(-2)}/${(
      '0' + date.getDate()
    ).slice(-2)} ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}:${(
      '0' + date.getSeconds()
    ).slice(-2)}`
  }

  const data = req.body as GiftOrSuperChatData[]
  if (!data) {
    res.status(400).json({ error: 'Invalid data provided.' })
    return
  }

  const csv_data = [
    ['#', '日時', '種別', 'ユーザー名', 'ユーザーID', '金額(CNY)', 'メッセージ/ギフト名称'],
  ]

  data.forEach((e, i) => {
    const row: string[] = []
    row.push(`${i + 1}`)
    row.push(
      formatDate(
        new Date(
          (e.type == 'gift'
            ? (e.data.data as Gift).timestamp
            : (e.data.data as SuperChat).start_time) * 1000,
        ),
      ),
    )
    row.push(e.type == 'gift' ? 'ギフト' : 'スーパーチャット')
    row.push(
      e.type == 'gift' ? (e.data.data as Gift).uname : (e.data.data as SuperChat).user_info.uname,
    )
    row.push(`${e.type == 'gift' ? (e.data.data as Gift).uid : (e.data.data as SuperChat).uid}`)
    row.push(
      `${
        e.type == 'gift'
          ? (e.data.data as Gift).total_coin / 1000
          : (e.data.data as SuperChat).price
      }`,
    )
    row.push(
      e.type == 'gift'
        ? `${(e.data.data as Gift).giftName} x${(e.data.data as Gift).num}`
        : (e.data.data as SuperChat).message,
    )
    csv_data.push(row)
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
