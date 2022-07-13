const pinyin = require('pinyin');
const csv = require('csv');

function connect (e) {
    const conn_btn = document.getElementById("connect_button");
    const room_div = document.getElementById("roomid");
    if(websocket == null) {
        const roomid = parseInt(room_div.value);
        if(isNaN(roomid)) {
            alert('数字以外が入力されました。');
            return;
        }
        if(chrome.storage.local != null) {
            chrome.storage.local.set({
                "last_room": roomid
            });
        }
        setStatus("接続中...");
        conn_btn.disabled = "disabled";
        ws_open(roomid);
    } else {
        let w = websocket;
        websocket = null;
        w.close();
        setStatus("切断しました。");
        conn_btn.innerText = "接続"
        conn_btn.className = 'btn btn-primary me-2';
        room_div.disabled = "";
    }
}

function on_checked(id, updated_to, type) {
    // Update data
    switch(type) {
        case "superchat": {
            if(!superchats[id])
                return;
            superchats[id].checked = updated_to;
            break;
        }
        case "gift": {
            if(!gifts[id])
                return;
            gifts[id].checked = updated_to;
            break;
        }
        case "membership": {
            if(!memberships[id])
                return;
            memberships[id].checked = updated_to;
            break;
        }
        default:
            return;
    }

    // Hide from screen (only filter enabled)
    const f = get_filter_val();
    if(f === 0 || f === 2 || f === 4 || f === 6)
        return;

    const div_a = document.getElementById(id + "_a");
    const div_s = document.getElementById(id + "_s");
    if(div_a)
        div_a.setAttribute("style", "display: none;");
    if(div_s)
        div_s.setAttribute("style", "display: none;");
}

function get_filter_val() {
    return parseInt(document.getElementById("filter").selectedIndex);
}

function get_order_val() {
    return parseInt(document.getElementById("order").selectedIndex);
}


function csv_export() {
    const all = Object.values(superchats).concat(Object.values(gifts), Object.values(memberships))
    const export_data = confirm(
        '全てのログを出力しますか?\n(キャンセルを選択した場合現在画面に表示されているもののみを出力します。)',
      )
        ? all
        : all.filter(e=>match_filter(e));

    const sorted = export_data.sort((a, b) => {
        let at = -1;
        let bt = -1;
        if(a.type === "gift")
            at = a.data.data.timestamp
        else
            at = a.data.data.start_time
        if(b.type === "gift")
            bt = b.data.data.timestamp
        else
            bt = b.data.data.start_time
    
        return (at < bt) ? -1 : 1;
    });

    const data = [
        [
            '#',
            '日時',
            '種別',
            'ユーザー名',
            'ユーザーID',
            '金額(CNY)',
            'メッセージ/ギフト/メンバーランク'
        ]
    ];

    sorted.forEach((e, i) => {
        const row = [`${i + 1}`];
        const da = e.data.data
        switch(e.type) {
            case "superchat": {
                row.push(formatDate(new Date(da.start_time * 1000)));
                row.push('スーパーチャット');
                row.push(da.user_info.uname);
                row.push(`${da.uid}`);
                row.push(`${da.price}`);
                row.push(da.message);
                break;
            }
            case "gift": {
                row.push(formatDate(new Date(da.timestamp * 1000)));
                row.push('ギフト');
                row.push(da.uname);
                row.push(`${da.uid}`);
                row.push(`${da.total_coin / 1000}`);
                row.push(`${da.giftName} x${da.num}`);
                break;
            }
            case "membership": {
                row.push(formatDate(new Date(da.start_time * 1000)));
                row.push('メンバーシップ');
                row.push(da.username);
                row.push(`${da.uid}`);
                row.push(`${(da.price / 1000) * da.num}`);
                row.push(`${da.gift_name} x${da.num}`);
                break;
            }
        }
        data.push(row);
    });

    csv.stringify(data, (error, output) => {
        if(error) {
            alert("処理中にエラーが発生しました。\n" + error);
            return;
        }

        // Append BOM to make excel readable csv
        const csv_bom = Buffer.concat([
            Buffer.from(Uint8Array.from([0xef, 0xbb, 0xbf])),
            Buffer.from(output)
        ]);
        
        // Tell browser to download csv.
        const link = document.createElement('a')
        link.href = 'data:text/csv;base64;charset=utf-8,' + csv_bom.toString("base64")
        link.download = `投げ銭ログ(${formatDate(new Date(), true)}).csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    })
}

function refreshScreen(initial) {
    if(!initial && chrome.storage.local != null) {
        chrome.storage.local.set({
            "mode": get_filter_val(),
            "order": get_order_val()
        });
    }

    const insertpos = get_order_val() == 0 ? "afterbegin" : "beforeend";
    
    const contents_all = document.getElementById("contents_all");
    const contents_superchats = document.getElementById("separated_superchat");
    const contents_gifts = document.getElementById("separated_gift");
    const contents_memberships = document.getElementById("separated_membership");

    contents_all.innerHTML = "";
    contents_superchats.innerHTML = "";
    contents_gifts.innerHTML = "";
    contents_memberships.innerHTML = "";

    const all = Object.values(superchats).concat(Object.values(gifts), Object.values(memberships));

    const filtered = all.filter(e=>match_filter(e));

    const sorted = filtered.sort((a, b) => {
        let at = -1;
        let bt = -1;
        if(a.type === "gift")
            at = a.data.data.timestamp
        else
            at = a.data.data.start_time

        if(b.type === "gift")
            bt = b.data.data.timestamp
        else
            bt = b.data.data.start_time

        return (at < bt) ? -1 : 1;
    });
    
    sorted.forEach(elem => { 
        contents_all.insertAdjacentElement(insertpos, get_typed_card(elem, elem.type, true));
        if(elem.type === "superchat") {
            contents_superchats.insertAdjacentElement(insertpos, get_typed_card(elem, elem.type, false));
        } else if(elem.type === "gift") {
            contents_gifts.insertAdjacentElement(insertpos, get_typed_card(elem, elem.type, false));
        } else if(elem.type === "membership") {
            contents_memberships.insertAdjacentElement(insertpos, get_typed_card(elem, elem.type, false));
        }
    });
    
    // Append dummy elemnt
    for(let i = 1; i <= 2; i++) {
        const dummy = document.createElement("div");
        dummy.setAttribute("class", "card border-dark mb-3 mx-auto");
        dummy.setAttribute("style", "visibility: hidden");
        dummy.setAttribute("id", "dummy_" + i);
        contents_all.insertAdjacentElement("beforeend", dummy);
    }
}

function checkadd(type, data) {
    if(!match_filter(data))
        return;

    const all_target = get_order_val() === 0 ?
        document.getElementById("contents_all")
        : document.getElementById("dummy_1");
    
    all_target.insertAdjacentElement(get_order_val() == 0 ? "afterbegin" : "beforebegin", get_typed_card(data, type, true));

    const separated_div = document.getElementById("separated_" + type);
    separated_div.insertAdjacentElement(get_order_val() == 0 ? "afterbegin" : "beforeend", get_typed_card(data, type, false));
}

function match_filter(data) {
    const f = get_filter_val();
    let price = -1;
    switch (data.type) {
        case "superchat": {
            price = data.data.data.price;
            break;
        }
        case "gift": {
            price = data.data.data.total_coin / 1000;
            break;
        }
        case "membership": {
            price = data.data.data.price / 1000 * data.data.data.num;
            break;
        }
    }
    switch (f) {
        case 0: {
            return true;
        }
        case 1: {
            return !data.checked;
        }
        case 2: {
            return price >= 30;
        }
        case 3: {
            return !data.checked && price >= 30;
        }
        case 4: {
            return price >= 99;
        }
        case 5: {
            return !data.checked && price >= 99;
        }
        case 6: {
            return price >= 999;
        }
        case 7: {
            return !data.checked && price >= 999;
        }
        default: {
            return false;
        }
    }
}

function get_typed_card(elem, type, is_all) {
    switch(type) {
        case "superchat": {
            return get_card(
                elem.id,
                elem.data.data.background_price_color,
                elem.data.data.background_bottom_color,
                elem.data.data.user_info.face,
                elem.data.data.user_info.uname,
                elem.pinyin,
                elem.data.data.price,
                elem.data.data.message,
                formatDate(new Date(elem.data.data.start_time * 1000)),
                elem.checked,
                is_all,
                "superchat"
            )
        }
        case "gift": {
            const price = elem.data.data.total_coin / 1000;
            const color_main = "#368f6e";
            const color_sub = "#4ac798";

            return get_card(
                elem.id,
                color_main,
                color_sub,
                elem.data.data.face,
                elem.data.data.uname,
                elem.pinyin,
                price,
                "(ギフト)\n" + elem.data.data.giftName + " x" + elem.data.data.num,
                formatDate(new Date(elem.data.data.timestamp * 1000)),
                elem.checked,
                is_all,
                "gift"
            )
        }
        case "membership": {
            const price = elem.data.data.price / 1000 * elem.data.data.num;

            let color_main;
            let color_sub;
            if(price >= 2000) {
                // Tier3 color (提督)
                color_main = "#bf0023";
                color_sub = "#ff8882";
            } else if(price >= 200) {
                // Tier2 color (総督)
                color_main = "#8334c4";
                color_sub = "#dfb7ff";
            } else {
                // Tier1 color (艦長)
                color_main = "#0372a6";
                color_sub = "#8dcdff";
            }

            return get_card(
                elem.id,
                color_main,
                color_sub,
                null,
                elem.data.data.username,
                elem.pinyin,
                price,
                "(メンバーシップ)\n" + elem.data.data.gift_name + " x" + elem.data.data.num,
                formatDate(new Date(elem.data.data.start_time * 1000)),
                elem.checked,
                is_all,
                "membership"
            )
        }
    }
    return null;
}

function get_card(id, body_color, sub_color, icon_url, name, name_sub, price, content, footer_text, checked, is_all, type) {
    const outer = document.createElement("div");
    outer.setAttribute("class", "card border-dark mb-3 mx-auto");
    outer.setAttribute("style", "background-color: " + sub_color + ";");
    outer.setAttribute("id", id + (is_all ? "_a" : "_s"));

    // Header
    const header = document.createElement("div");
    header.setAttribute("class", "card-header bg-transparent border-dark d-flex");

    if(icon_url != null) {
        const header_icon = document.createElement("div");
        header_icon.setAttribute("class", "rounded_icon me-2");
    
        const header_img = document.createElement("img");
        header_img.setAttribute("src", icon_url);
        header_img.setAttribute("width", 48);
        header_img.setAttribute("height", 48);
        header_img.setAttribute("referrerpolicy", "no-referrer");
    
        header_icon.append(header_img);
        header.append(header_icon);
    }
    
    const header_check = document.createElement("div");
    header_check.setAttribute("class", "d-flex align-items-center me-2");
    header_check.setAttribute("style", "width: 20px;");

    const header_checkbox = document.createElement("input");
    header_checkbox.setAttribute("type", "checkbox");
    header_checkbox.setAttribute("class", "w-100 h-100");
    if(checked) {
        header_checkbox.setAttribute("checked", "checked");
    }
    header_checkbox.addEventListener('change', (e) => {
        on_checked(id, e.target.checked, type);
    })

    header_check.append(header_checkbox);
    header.append(header_check);

    const header_cardinfo = document.createElement("div");
    header_cardinfo.setAttribute("class", "cardinfo");

    const header_cardinfo_name = document.createElement("div");
    header_cardinfo_name.setAttribute("class", "inline-block card-subtext");
    header_cardinfo_name.innerHTML = name + "<br>(" + name_sub + ")";

    const header_cardinfo_money = document.createElement("div");
    header_cardinfo_money.setAttribute("class", "inline-block card-subtext");
    header_cardinfo_money.innerText = "\\" + price;

    header_cardinfo.append(header_cardinfo_name);
    header_cardinfo.append(header_cardinfo_money);
    header.append(header_cardinfo);

    outer.append(header);

    // Body
    const body = document.createElement("div");
    body.setAttribute("class", "card-body text-light");
    body.setAttribute("style", "background-color: " + body_color + ";");

    const body_text = document.createElement("p");
    body_text.setAttribute("class", "card-text");
    body_text.innerText = content;

    body.append(body_text);

    outer.append(body);

    // Footer
    const footer = document.createElement("div");
    footer.setAttribute("class", "card-footer bg-transparent border-dark card-subtext");
    footer.innerText = footer_text;

    outer.append(footer);

    return outer;
}

let superchats;
let gifts;
let memberships;

window.addEventListener('load', () => {
    const order_e = document.getElementById('order');
    const filter_e = document.getElementById('filter');

    if(chrome.storage.local != null) {
        chrome.storage.local.get({"last_room": "", "mode": 0, "order": 0}, function(result){
            document.getElementById("roomid").value = result.last_room;
            filter_e.selectedIndex = result.mode;
            order_e.selectedIndex = result.order;
        });
    }

    superchats = {};
    gifts = {};
    memberships = {};
    document.getElementById('connect_button').addEventListener('click', connect);
    document.getElementById('csv_button').addEventListener('click', csv_export);
    filter_e.addEventListener('change', () => refreshScreen(false));
    order_e.addEventListener('change', () => refreshScreen(false));

    refreshScreen(true);
});

function onreceived (data) {
    switch(data.cmd) {
        case "SUPER_CHAT_MESSAGE": {
            const id = randStr(20);
            superchats[id] = {
                id: id,
                pinyin: toReadablePinyin(pinyin(data.data.user_info.uname, {
                    segment: true,
                    group: true
                })),
                type: "superchat",
                data: data,
                checked: false
            };
            checkadd('superchat', superchats[id]);
            break;
        }
        case "SEND_GIFT": {
            if(data.data.coin_type !== 'gold')
                break;

            const id = randStr(20);
            gifts[id] = {
                id: id,
                pinyin: toReadablePinyin(pinyin(data.data.uname, {
                    segment: true,
                    group: true
                })),
                type: "gift",
                data: data,
                checked: false
            };
            checkadd('gift', gifts[id]);
            break;
        }
        case "GUARD_BUY": {
            const id = randStr(20);
            memberships[id] = {
                id: id,
                pinyin: toReadablePinyin(pinyin(data.data.username, {
                    segment: true,
                    group: true
                })),
                type: "membership",
                data: data,
                checked: false
            };
            checkadd('membership', memberships[id]);
            break;
        }
        default:
            return;
    }
}

function setStatus(text) { 
    document.getElementById('status').innerText = text;
}

const pako = require('pako');
const textEncoder = new TextEncoder('utf-8');
const textDecoder = new TextDecoder('utf-8');

let websocket;
let heartbeatId = -1;

function randStr(N) {
    const S="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from(Array(N)).map(()=>S[Math.floor(Math.random()*S.length)]).join('');
}

async function getCommentRoomID (id) {
    const res = await fetch(`https://live.bilibili.com/${id}`);
    const txt = await res.text();
    const m = txt.match(/"room_id":\s*([1-9][0-9]*)/);
    if(m) {
        return parseInt(m[1]);
    }
    const m2 = txt.match(/"roomId":\s*"?([1-9][0-9]*)"?/);
    if(m2) {
        return parseInt(m2[1]);
    }
    return id;

}

async function ws_open (rid) {
    const room_id = await getCommentRoomID(rid);
    if(rid == -1) {
        setStatus("エラーが発生しました。");
        alert('部屋が見つかりませんでした。');
        conn_btn.disabled = "";
        return;
    }
    const room_info = await (await fetch(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${room_id}&type=0`)).json();
    
    const uid = (await (await fetch('https://api.live.bilibili.com/xlive/web-ucenter/v1/labs/InfoPlugs')).json())['data']['uid'];
    const key = room_info['data']['token'];
    const server = room_info['data']['host_list'][0];

    websocket = new WebSocket(`wss://${server.host}:${server.wss_port}/sub`);
    websocket.onopen = function() {
        send_data(JSON.stringify({
            uid: uid,
            roomid: room_id,
            protover: 2,
            platform: "web",
            type: 2,
            key: key
        }), 7);

        setStatus("接続しました。");
        const conn_btn = document.getElementById("connect_button");
        conn_btn.disabled = "";
        conn_btn.innerText = "切断";
        conn_btn.className = 'btn btn-danger me-2';
        const room_div = document.getElementById("roomid");
        room_div.disabled = "disabled";

        if(heartbeatId != -1) {
            clearInterval(heartbeatId);
        }

        heartbeatId = setInterval(() => {
            send_data('', 2);
        }, 30 * 1000);
    }

    websocket.onmessage = async function (e) {
        const packet = await decode(e.data);
        if(Array.isArray(packet.body)) {
            packet.body.forEach(e=>{
                onreceived(e);
            })
        }
    }

    websocket.onclose = function() {
        if(heartbeatId != -1) {
            clearInterval(heartbeatId);
        }

        // Reconnect if not disconnected by user.
        if(websocket != null) {
            ws_open(room_id);
        }
    }
}

function send_data (data, operator) {
    if(websocket == null)
        return;

    const d = textEncoder.encode(data);
    const l = 16 + d.byteLength;
    const header = [0, 0, 0, 0, 0, 16, 0, 1, 0, 0, 0, operator, 0, 0, 0, 1];
    writeInt(header, 0, 4, l);
    websocket.send((new Uint8Array(header.concat(...d))).buffer);
}

const toReadablePinyin = (list) => {
    let str = ''
    list.forEach((l) => {
      l.forEach((ll) => (str += ll + ' '))
    })
    return str.slice(0, -1)
}

const formatDate = (date, forFile) => {
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

// Ref: https://github.com/lovelyyoshino/Bilibili-Live-API/blob/master/API.WebSocket.md
const writeInt = function (buffer,start,len,value) {
    let i=0
    while(i<len){
        buffer[start + i] = value/Math.pow(256,len - i - 1)
        i++
    }
}

const readInt = function (buffer,start,len){
    let result = 0
    for(let i=len - 1;i >= 0;i--) {
        result += Math.pow(256,len - i - 1) * buffer[start + i]
    }
    return result
}

const decoder = function (buf) {
    const buffer = new Uint8Array(buf);
    const result = {};
    result.packetLen = readInt(buffer, 0, 4);
    result.headerLen = readInt(buffer, 4, 2)
    result.ver = readInt(buffer, 6, 2)
    result.op = readInt(buffer, 8, 4)
    result.seq = readInt(buffer, 12, 4)
    if (result.op === 5) {
        result.body = [];
        let offset = 0;
        while (offset < buffer.length) {
            const packetLen = readInt(buffer, offset + 0, 4);
            const headerLen = readInt(buffer, offset + 4, 2);;
            const data = buffer.slice(offset + headerLen, offset + packetLen);
            if (result.ver == 2) {
                const nBuffer = pako.inflate(data);
                const obj = decoder(nBuffer);
                const body = obj.body;
                result.body = result.body.concat(body);
            } else {
                const body = textDecoder.decode(data);
                if (body) {
                    result.body.push(JSON.parse(body));
                }
            }
            offset += packetLen;
        }
    } else if(result.op === 3) {
        result.body = {
            count: readInt(buffer, 16, 4)
        };
    }
    return result;
}
  
const decode = function (blob) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();;
        reader.onload = function (e) {
            resolve(decoder(new Uint8Array(e.target.result)));
        }
        reader.readAsArrayBuffer(blob);
    });
}
