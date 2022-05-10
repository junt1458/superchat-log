export const calc_price = (data: ReceiveData): number => {
  if (data.type == 'gift') {
    const d = data.data.data as Gift
    return d.total_coin / 1000
  } else if (data.type == 'superchat') {
    const d = data.data.data as SuperChat
    return d.price
  } else if (data.type == 'membership') {
    const d = data.data.data as Membership
    return (d.price / 1000) * d.num
  }
  return -1
}

export const formatDate = (date: Date, forFile?: boolean): string => {
  if (forFile) {
    return `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${(
      '0' + date.getDate()
    ).slice(-2)}-${('0' + date.getHours()).slice(-2)}-${('0' + date.getMinutes()).slice(-2)}-${(
      '0' + date.getSeconds()
    ).slice(-2)}`
  } else {
    return `${date.getFullYear()}/${('0' + (date.getMonth() + 1)).slice(-2)}/${(
      '0' + date.getDate()
    ).slice(-2)} ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}:${(
      '0' + date.getSeconds()
    ).slice(-2)}`
  }
}

export const toReadablePinyin = (list: string[][]): string => {
  let str = ''
  list.forEach((l) => {
    l.forEach((ll) => (str += ll + ' '))
  })
  return str.slice(0, -1)
}
