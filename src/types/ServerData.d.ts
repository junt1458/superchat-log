type ServerData<T> = {
  cmd: string
  data: T
  roomid: number
}

type ReceiveData = {
  type: 'gift' | 'superchat' | 'membership'
  data: ServerData<Gift | SuperChat | Membership>
  checked: boolean
}
