type ServerData<T> = {
  cmd: string
  data: T
  roomid: number
}

type GiftOrSuperChatData = {
  type: 'gift' | 'superchat'
  data: ServerData<Gift | SuperChat>
  checked: boolean
}
