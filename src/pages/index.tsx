import { KeepLiveWS } from 'bilibili-live-ws/browser'
import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import pinyin from 'pinyin'
import React, { useEffect, useState } from 'react'
import style from '@/styles/Index.module.css'
import { calc_price, formatDate, toReadablePinyin } from '@/utils/display'

const Home: NextPage = () => {
  const [live, setLive] = useState<KeepLiveWS | null>(null)
  const [statusMessage, setStatusMessage] = useState('接続操作を行ってください。')
  const [superChats, setSuperChats] = useState<ReceiveData[]>([])
  const [filtered, setFilteredSuperChats] = useState<ReceiveData[]>([])
  const [older, setOlder] = useState(false)

  useEffect(() => {
    if (localStorage == null) return

    const id = localStorage.getItem('roomid')
    if (id == null) return

    const id_div = document.getElementById('roomid') as HTMLInputElement
    id_div.value = id

    let filterIndexStr = localStorage.getItem('filter')
    if (filterIndexStr == null) filterIndexStr = '0'
    const filterIndex = parseInt(filterIndexStr)
    if (isNaN(filterIndex)) return
    const filter_div = document.getElementById('filter') as HTMLSelectElement
    filter_div.selectedIndex = filterIndex

    let sortIndexStr = localStorage.getItem('sort')
    if (sortIndexStr == null) sortIndexStr = '0'
    const sortIndex = parseInt(sortIndexStr)
    if (isNaN(sortIndex)) return
    const sort_div = document.getElementById('sort') as HTMLSelectElement
    sort_div.selectedIndex = sortIndex
  }, [])

  const genArr = () => {
    const arr = []
    for (let i = 0; superChats.length > 3 && (superChats.length + arr.length) % 3 > 0; i++) {
      arr.push(i)
    }
    return arr
  }

  const onConnectClicked = () => {
    setLive((live) => {
      if (live == null) {
        const roomid_div = document.getElementById('roomid') as HTMLInputElement
        const roomid = parseInt(roomid_div.value)
        if (isNaN(roomid)) {
          alert('数字以外が入力されました。')
          return null
        }
        localStorage.setItem('roomid', `${roomid}`)

        setStatusMessage('接続中...')
        const l = new KeepLiveWS(roomid)
        l.on('open', () => {
          setStatusMessage('接続しました。')
        })

        // スーパーチャットはこっちで飛んでくる
        l.on('SUPER_CHAT_MESSAGE', (data: ServerData<SuperChat>) => {
          setSuperChats((list) => {
            const l = [...list, { type: 'superchat', data: data, checked: false } as ReceiveData]
            setFilteredSuperChats(filter(l))
            return l
          })
        })

        // ギフト情報はこっちで飛んでくる
        l.on('SEND_GIFT', (data: ServerData<Gift>) => {
          if (data.data.coin_type === 'gold') {
            if (!data.data.timestamp) data.data.timestamp = Math.floor(new Date().getTime() / 1000)
            setSuperChats((list) => {
              const l = [...list, { type: 'gift', data: data, checked: false } as ReceiveData]
              setFilteredSuperChats(filter(l))
              return l
            })
          }
        })

        // メンバーシップはここ
        l.on('GUARD_BUY', (data) => {
          setSuperChats((list) => {
            const l = [...list, { type: 'membership', data: data, checked: false } as ReceiveData]
            setFilteredSuperChats(filter(l))
            return l
          })
        })

        return l
      } else {
        live.removeAllListeners()
        live.close()
        setStatusMessage('切断しました。')
        return null
      }
    })
  }

  const filter = (list: ReceiveData[]): ReceiveData[] => {
    const mode_div = document.getElementById('filter') as HTMLSelectElement
    if (mode_div == null) return list

    const mode = mode_div.selectedIndex
    switch (mode) {
      case 0:
        return list
      case 1:
        return list.filter((e) => !e.checked)
      case 2:
        return list.filter((e) => calc_price(e) >= 30)
      case 3:
        return list.filter((e) => !e.checked && calc_price(e) >= 30)
      case 4:
        return list.filter((e) => calc_price(e) >= 99)
      case 5:
        return list.filter((e) => !e.checked && calc_price(e) >= 99)
      default:
        return list
    }
  }

  const onSortChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {
    localStorage.setItem('sort', `${e.target.selectedIndex}`)
    setOlder(e.target.selectedIndex === 1)
  }

  const onExportClicked = async () => {
    const export_data = confirm(
      '全てのログを出力しますか?\n(キャンセルを選択した場合現在画面に表示されているもののみを出力します。)',
    )
      ? await new Promise<ReceiveData[]>((resolve) => {
          setSuperChats((list) => {
            resolve(list)
            return list
          })
        })
      : await new Promise<ReceiveData[]>((resolve) => {
          setFilteredSuperChats((list) => {
            resolve(list)
            return list
          })
        })

    const res = await fetch('/api/csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(export_data),
    })
    const csv = await res.text()

    const link = document.createElement('a')
    link.href = 'data:text/csv;base64;charset=utf-8,' + csv
    link.download = `投げ銭ログ(${formatDate(new Date(), true)}).csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const onFilterChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {
    localStorage.setItem('filter', `${e.target.selectedIndex}`)
    setSuperChats((list) => {
      setFilteredSuperChats(filter(list))
      return list
    })
  }

  const onCheckChanged = (elem: HTMLInputElement, target: ReceiveData) => {
    setSuperChats((list) => {
      const l = [...list]
      const i = l.indexOf(target)
      if (i != -1) {
        l[i].checked = elem.checked
      }
      setFilteredSuperChats(filter(l))
      return l
    })
  }

  return (
    <div className={style.container}>
      <Head>
        <title>SuperChat Log Viewer</title>
        <meta name='description' content='Generated by create next app' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <div className={style.header}>
        <h1 className={style.title}>SuperChat Log Viewer</h1>
        <div className={style.links}>
          <Link href='https://github.com/junt1458'>
            <a rel='noopener noreferrer' target='_blank'>
              <div className={style.links_link}>Developer</div>
            </a>
          </Link>

          <Link href='https://github.com/junt1458/superchat-log'>
            <a rel='noopener noreferrer' target='_blank'>
              <div className={style.links_link}>Repository</div>
            </a>
          </Link>

          <Link href='https://github.com/junt1458/superchat-log/blob/main/LICENSE_3rdparty.md'>
            <a rel='noopener noreferrer' target='_blank'>
              <div className={style.links_link}>License (3rdparty)</div>
            </a>
          </Link>
        </div>
        <div className={style.settings_item}>
          <span className={style.settings_left}>ルームID</span>
          <span className={style.settings_right}>
            <input
              type='number'
              readOnly={live != null}
              disabled={live != null}
              id='roomid'
              className={style.settings_right}
            />
          </span>
        </div>
        <div className={style.settings_item}>
          <button onClick={onConnectClicked}>{live == null ? '接続' : '切断'}</button>
          <button onClick={onExportClicked} disabled={live == null}>
            CSVに出力
          </button>
        </div>
        <div className={style.settings_item}>
          <span>{statusMessage}</span>
        </div>
        <div className={style.settings_item}>
          <span className={style.settings_left}>表示モード</span>
          <select className={style.settings_right} onChange={onFilterChanged} id='filter'>
            <option>すべて表示する</option>
            <option>未読のみ表示する</option>
            <option>30元以上のみ表示する(全て)</option>
            <option>30元以上のみ表示する(未読のみ)</option>
            <option>99元以上のみ表示する(全て)</option>
            <option>99元以上のみ表示する(未読のみ)</option>
          </select>
        </div>
        <div className={style.settings_item}>
          <span className={style.settings_left}>並び変え</span>
          <select className={style.settings_right} onChange={onSortChanged} id='sort'>
            <option>新しい順</option>
            <option>古い順</option>
          </select>
        </div>
      </div>
      <div className={style.body_wrapper}>
        <div className={style.body}>
          {filtered.map((v, i, a) => {
            const index = older ? i : a.length - 1 - i
            const content = a[index]
            if (content.type === 'superchat') {
              const data = content.data.data as SuperChat
              return (
                <div className={style.card} key={'SuperChat ' + index}>
                  <div
                    className={style.userinfo}
                    style={{ backgroundColor: data.background_price_color }}
                  >
                    <img
                      src={data.user_info.face}
                      alt='User Icon'
                      width={48}
                      className={style.userinfo_icon}
                      referrerPolicy='no-referrer'
                    />
                    <input
                      type='checkbox'
                      className={style.userinfo_check}
                      onChange={(e) => onCheckChanged(e.target, content)}
                      checked={content.checked}
                    />
                    <div className={style.userinfo_detail}>
                      <div className={style.userinfo_namedate}>
                        <div className={style.userinfo_detail_name}>{data.user_info.uname}</div>
                        <div className={style.userinfo_detail_pinyin}>
                          (
                          {toReadablePinyin(
                            pinyin(data.user_info.uname, {
                              segment: true,
                              group: true,
                            }),
                          )}
                          )
                        </div>
                        <div className={style.userinfo_detail_date}>
                          {formatDate(new Date(data.start_time * 1000))}
                        </div>
                      </div>
                      <span className={style.userinfo_amount}>&yen;{calc_price(content)}</span>
                    </div>
                  </div>
                  <div
                    className={style.content}
                    style={{ backgroundColor: data.background_bottom_color }}
                  >
                    {data.message}
                  </div>
                </div>
              )
            } else if (content.type === 'gift') {
              const data = content.data.data as Gift
              return (
                <div className={style.card} key={'Gift ' + index}>
                  <div className={style.userinfo} style={{ backgroundColor: '#4ac798' }}>
                    <img
                      src={data.face}
                      alt='User Icon'
                      width={48}
                      className={style.userinfo_icon}
                      referrerPolicy='no-referrer'
                    />
                    <input
                      type='checkbox'
                      className={style.userinfo_check}
                      onChange={(e) => onCheckChanged(e.target, content)}
                      checked={content.checked}
                    />
                    <div className={style.userinfo_detail}>
                      <div className={style.userinfo_namedate}>
                        <div className={style.userinfo_detail_name}>{data.uname}</div>
                        <div className={style.userinfo_detail_pinyin}>
                          (
                          {toReadablePinyin(
                            pinyin(data.uname, {
                              segment: true,
                              group: true,
                            }),
                          )}
                          )
                        </div>
                        <div className={style.userinfo_detail_date}>
                          {formatDate(new Date(data.timestamp * 1000))}
                        </div>
                      </div>
                      <span className={style.userinfo_amount}>&yen;{calc_price(content)}</span>
                    </div>
                  </div>
                  <div className={style.content} style={{ backgroundColor: '#368f6e' }}>
                    (ギフト) <br />
                    {data.giftName} x{data.num}
                  </div>
                </div>
              )
            } else {
              const data = content.data.data as Membership
              return (
                <div className={style.card} key={'Membership ' + index}>
                  <div className={style.userinfo} style={{ backgroundColor: '#b65bfc' }}>
                    <div style={{ width: '5px' }}></div>
                    <input
                      type='checkbox'
                      className={style.userinfo_check}
                      onChange={(e) => onCheckChanged(e.target, content)}
                      checked={content.checked}
                    />
                    <div className={style.userinfo_detail}>
                      <div className={style.userinfo_namedate}>
                        <div className={style.userinfo_detail_name}>{data.username}</div>
                        <div className={style.userinfo_detail_pinyin}>
                          (
                          {toReadablePinyin(
                            pinyin(data.username, {
                              segment: true,
                              group: true,
                            }),
                          )}
                          )
                        </div>
                        <div className={style.userinfo_detail_date}>
                          {formatDate(new Date(data.start_time * 1000))}
                        </div>
                      </div>
                      <span className={style.userinfo_amount}>&yen;{calc_price(content)}</span>
                    </div>
                  </div>
                  <div className={style.content} style={{ backgroundColor: '#7e39b3' }}>
                    (メンバーシップ) <br />
                    {data.gift_name} x{data.num}
                  </div>
                </div>
              )
            }
          })}
          {genArr().map((v) => (
            <div className={style.card_invisible} key={'Dummy ' + (v + 1)} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
