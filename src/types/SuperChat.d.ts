type SuperChat = {
  background_bottom_color: string
  background_color: string
  background_color_end: string
  background_color_start: string
  background_icon: string
  background_image: string
  background_price_color: string
  color_point: number
  dmscore: number
  end_time: number
  gift: GiftInfo
  id: number
  is_ranked: number
  is_send_audit: number
  medal_info: MedalInfo
  message: string
  message_font_color: string
  message_trans: string
  price: number
  rate: number
  start_time: number
  time: number
  token: string
  trans_mark: number
  ts: number
  uid: number
  user_info: UserInfo
}

type UserInfo = {
  face: string
  face_frame: string
  guard_leve: number
  is_main_vip: number
  is_svip: number
  is_vip: number
  level_color: string
  manager: number
  name_color: string
  title: string
  uname: string
  user_level: number
}

type GiftInfo = {
  gift_id: number
  gift_name: string
  num: number
}

type MedalInfo = {
  anchor_roomid: number
  anchor_uname: string
  guard_level: number
  icon_id: number
  is_lighted: number
  medal_color: string
  medal_color_border: number
  medal_color_end: number
  medal_color_start: number
  medal_level: number
  medal_name: string
  special: string
  target_id: number
}
