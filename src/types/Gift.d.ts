type Gift = {
  action: string
  batch_combo_id: string
  batch_combo_send: BatchComboSend | null
  beatId: string
  biz_source: string
  blind_gift: string | null
  broadcast_id: number
  coin_type: string
  combo_resources_id: number
  combo_send: ComboSend | null
  combo_stay_time: number
  combo_total_coin: number
  crit_prob: number
  demarcation: number
  discount_price: number
  dmscore: number
  draw: number
  effect: number
  effect_block: number
  face: string
  float_sc_resource_id: number
  giftId: number
  giftName: string
  giftType: number
  gold: number
  guard_leve: number
  is_first: boolean
  is_special_batch: number
  magnification: number
  medal_info: MedalInfo
  name_color: string
  num: number
  original_gift_name: string
  price: number
  rcost: number
  remain: number
  rnd: string
  send_master: string | null
  silver: number
  super: number
  super_batch_gift_num: number
  super_gift_num: number
  svga_block: number
  tag_image: number
  tid: number
  timestamp: number
  top_list: string | null
  total_coin: number
  uid: number
  uname: string
}

type BatchComboSend = {
  action: string
  batch_combo_id: string
  batch_combo_num: number
  blind_gift: string | null
  gift_id: number
  gift_name: string
  gift_num: number
  send_master: string | null
  uid: number
  uname: string
}

type ComboSend = {
  action: string
  combo_id: string
  combo_num: number
  gift_id: number
  gift_name: string
  gift_num: number
  send_master: string | null
  uid: number
  uname: string
}
