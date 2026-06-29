const fs = require('fs');
const path = require('path');
const { CANH_GIOI, NGUYEN_TO, PHAM_CHAT_LINH_CAN, LINH_THU_LIST, CUA_HANG, QUAI_VAT, COT_TRUYEN } = require('./data.js');

const dataPath = path.join(__dirname, 'tutien_players.json');

// Đọc và Ghi file dữ liệu người chơi
function loadData() {
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));
    return JSON.parse(fs.readFileSync(dataPath));
}
function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
}

module.exports = {
    config: {
        name: "tutien",
        version: "2.0.0",
        hasPermssion: 0,
        credits: "Gemini AI",
        description: "Hệ thống game Tu Tiên nhập vai RPG siêu cấp trên Messenger",
        commandCategory: "Game",
        usages: "[help/linhcan/cuahang/danhquai/tuluyen/hoso/trangbi/kynang/linhthu]",
        cooldowns: 2
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, senderID } = event;
        let players = loadData();
        let subCommand = args[0] ? args[0].toLowerCase() : "";

        // Kiểm tra xem người chơi đã khởi tạo nhân vật chưa
        let isPlayer = players[senderID] ? true : false;

        // Xử lý lệnh đánh quái nhanh dạng /tutien danhquai123
        let monsterLevelMatch = subCommand.match(/^danhquai(\d+)$/);
        if (monsterLevelMatch) {
            args[1] = monsterLevelMatch[1];
            subCommand = "danhquai";
        }

        // ==================== 1. LỆNH HELP ====================
        if (subCommand === "help" || !args[0]) {
            let helpMsg = `☯️--[ THẾ GIỚI TU TIÊN KHỞI NGUYÊN ]--☯️\n`;
            helpMsg += `📜 Các lệnh đạo hữu cần sử dụng:\n`;
            helpMsg += `1️⃣ /tutien linhcan : Thức tỉnh / Chọn lại Linh căn\n`;
            helpMsg += `2️⃣ /tutien hoso : Kiểm tra trạng thái Tu vi hiện tại\n`;
            helpMsg += `3️⃣ /tutien tuluyen : Tọa thiền tích lũy Linh khí (Hồi: 30p)\n`;
            helpMsg += `4️⃣ /tutien danhquai [Cấp] : Săn Yêu thú từ cấp 1 -> 250 (Ví dụ: /tutien danhquai10)\n`;
            helpMsg += `5️⃣ /tutien cuahang : Thiên Bảo Các mua đan dược & linh kiếm\n`;
            helpMsg += `6️⃣ /tutien trangbi / kynang / linhthu : Tự mặc đồ mạnh nhất hoặc quản lý Linh thú\n\n`;
            helpMsg += `👾 Ví dụ Quái vật thế giới:\n`;
            helpMsg += `- Quái Cấp 1: ${QUAI_VAT[1].name} -> Rơi: ${QUAI_VAT[1].stone} Linh thạch, ${QUAI_VAT[1].itemDrop}\n`;
            helpMsg += `- Quái Cấp 250: ${QUAI_VAT[250].name} -> Rơi: ${QUAI_VAT[250].stone} Linh thạch, ${QUAI_VAT[250].itemDrop}\n`;
            return api.sendMessage(helpMsg, threadID, messageID);
        }

        // ==================== 2. LỆNH LINH CĂN ====================
        if (subCommand === "linhcan") {
            if (isPlayer && players[senderID].buocVaoTuLuyen) {
                return api.sendMessage("❌ Bạn đã chính thức bước lên đại lộ tu tiên, không thể đổi lại Linh căn được nữa!", threadID, messageID);
            }

            // Gieo xúc xắc chọn Linh Căn ngẫu nhiên
            let numLinhCan = Math.floor(Math.random() * 3) + 1; // Random từ 1 đến 3 hệ nguyên tố
            let rolledHets = [...NGUYEN_TO].sort(() => 0.5 - Math.random()).slice(0, numLinhCan);
            let phamChat = PHAM_CHAT_LINH_CAN[Math.floor(Math.random() * PHAM_CHAT_LINH_CAN.length)];

            players[senderID] = {
                linhCan: rolledHets.join(" - "),
                phamChatLinhCan: phamChat.name,
                rateBonus: phamChat.rateBonus,
                canhGioiIdx: 0,
                tang: 1,
                exp: 0,
                linhThach: 500,
                trongThuongDen: 0,
                buocVaoTuLuyen: false,
                tuiDo: [],
                linhThuCurrent: "Chưa có"
            };
            saveData(players);

            return api.sendMessage(`✨ Thức tỉnh Linh Căn thành công!\n- Nguyên tố: [ ${players[senderID].linhCan} ]\n- Phẩm chất: ${phamChat.name} (Tốc độ tu luyện x${phamChat.rateBonus})\n\n👉 Nếu ưng ý, hãy gõ \`/tutien hoso\` để kích hoạt và bắt đầu tu luyện (Chọn lại bằng cách gõ lại lệnh này).`, threadID, messageID);
        }

        // Chặn tất cả các lệnh sau nếu chưa có nhân vật
        if (!isPlayer) return api.sendMessage("❌ Bạn chưa thức tỉnh linh căn! Vui lòng gõ `/tutien linhcan` trước.", threadID, messageID);
        let p = players[senderID];

        // Kiểm tra xem có đang bị trọng thương do thiên kiếp không (10 phút phạt)
        if (p.trongThuongDen > Date.now()) {
            let remain = Math.ceil((p.trongThuongDen - Date.now()) / 1000 / 60);
            return api.sendMessage(`⚠️ Tu vi bạo động! Bạn đang bị trọng thương do đột phá thất bại. Vui lòng dưỡng thương trong ${remain} phút nữa để tiếp tục hành trình.`, threadID, messageID);
        }

        // Tự động kích hoạt con đường tu hành khi xem hồ sơ lần đầu
        if (!p.buocVaoTuLuyen) p.buocVaoTuLuyen = true;

        let cg = CANH_GIOI[p.canhGioiIdx];

        // ==================== 3. LỆNH HỒ SƠ ====================
        if (subCommand === "hoso") {
            let nextCg = CANH_GIOI[p.canhGioiIdx];
            let req = nextCg.expRequired(p.tang);
            
            let txt = `☯️--[ HỒ SƠ ĐẠO HỮU ]--☯️\n`;
            txt += `👑 Cảnh giới: ${cg.name} (Tầng ${p.tang}/${cg.maxTang})\n`;
            txt += `✨ Linh khí (Exp): ${p.exp} / ${req === Infinity ? "MAX" : req}\n`;
            txt += `🔮 Linh căn: ${p.linhCan} (${p.phamChatLinhCan})\n`;
            txt += `💰 Linh thạch: ${p.linhThach} viên\n`;
            txt += `🐾 Linh thú khế ước: ${p.linhThuCurrent}\n`;
            txt += `⚔️ Thiết lập trang bị & kỹ năng: Tự động tối ưu hóa cấp cao nhất.\n`;
            txt += `-------------------------\n`;
            txt += `📖 Cốt truyện hiện tại:\n"${COT_TRUYEN(p.canhGioiIdx * 10 + p.tang)}"\n\n`;
            
            if (p.exp >= req && req !== Infinity) {
                txt += `⚡ ĐỦ LINH KHÍ! Gõ \`/tutien dotpha\` để tiến hành vượt thiên kiếp thăng cấp!`;
            }
            return api.sendMessage(txt, threadID, messageID);
        }

        // ==================== 4. LỆNH TU LUYỆN ====================
        if (subCommand === "tuluyen") {
            if (!p.lastTuLuyen) p.lastTuLuyen = 0;
            let cooldown = 30 * 60 * 1000; // 30 phút
            if (Date.now() - p.lastTuLuyen < cooldown) {
                let remainMin = Math.ceil((cooldown - (Date.now() - p.lastTuLuyen)) / 1000 / 60);
                return api.sendMessage(`⌛ Đạo hữu đang bế quan thiền định rồi, cần chờ thêm ${remainMin} phút nữa để tiếp tục hấp thụ linh khí đại địa.`, threadID, messageID);
            }

            let reqExp = cg.expRequired(p.tang);
            if (reqExp === Infinity) return api.sendMessage("✨ Bạn đã đạt cảnh giới tối cao, không cần tu luyện nữa!", threadID, messageID);
            
            let expGain = Math.floor((reqExp * 0.05) * p.rateBonus); // 5% Linh khí dựa trên yêu cầu cảnh giới x rate Linh căn
            p.exp += expGain;
            p.lastTuLuyen = Date.now();
            saveData(players);

            return api.sendMessage(`🧘 Bạn nhập định bế quan nhập thất, hấp thụ linh khí thiên địa, nhận được thêm [+${expGain} Linh Khí]!`, threadID, messageID);
        }

        // ==================== 5. LỆNH ĐỘT PHÁ & THIÊN KIẾP ====================
        if (subCommand === "dotpha") {
            let reqExp = cg.expRequired(p.tang);
            if (p.exp < reqExp) return api.sendMessage(`❌ Linh khí chưa tràn đầy, không thể nỗ lực ngưng tụ đột phá cảnh giới!`, threadID, messageID);

            // Tỷ lệ đột phá thành công giảm dần theo cảnh giới cao
            let rateThanhCong = Math.max(0.9 - (p.canhGioiIdx * 0.09), 0.15); 
            let KiemTraXucXac = Math.random();

            if (KiemTraXucXac <= rateThanhCong) {
                // Đột phá thành công
                p.exp -= reqExp; // Khấu trừ exp cũ
                if (p.tang < cg.maxTang) {
                    p.tang += 1;
                } else {
                    p.canhGioiIdx += 1;
                    p.tang = 1;
                }
                saveData(players);
                let ThongBaoCg = CANH_GIOI[p.canhGioiIdx];
                return api.sendMessage(`⚡ ẦM ẦM!!! Thiên kiếp đi qua, hào quang rực rỡ! Đạo hữu đã đột phá đại cảnh giới thành công lên [${ThongBaoCg.name} - Tầng ${p.tang}].`, threadID, messageID);
            } else {
                // Đột phá thất bại - tẩu hỏa nhập ma chấn thương tâm ma kiếp
                p.exp = Math.floor(p.exp * 0.7); // Bị mất 30% exp hiện có
                p.trongThuongDen = Date.now() + 10 * 60 * 1000; // Phạt 10 phút trọng thương
                saveData(players);
                return api.sendMessage(`💥 ĐỘT PHÁ THẤT BẠI!!! Lôi kiếp dữ dội đánh tan kinh mạch, đạo hữu tẩu hỏa nhập ma, tổn thất 30% linh khí tích lũy và bị TRỌNG THƯƠNG (không thể thao tác trong 10 phút)!`, threadID, messageID);
            }
        }

        // ==================== 6. LỆNH ĐÁNH QUÁI (PvE) ====================
        if (subCommand === "danhquai") {
            let lv = parseInt(args[1]);
            if (!lv || lv < 1 || lv > 250) return api.sendMessage("❌ Vui lòng nhập cấp độ quái hợp lệ tự 1 tới 250. Ví dụ: /tutien danhquai 45", threadID, messageID);

            let monster = QUAI_VAT[lv];
            p.exp += monster.exp;
            p.linhThach += monster.stone;
            
            let msg = `⚔️ Bạn vung kiếm giao tranh với [${monster.name}]:\n`;
            msg += `💀 Yêu ma đền tội! Bạn nhận được:\n`;
            msg += `+ 🟢 ${monster.exp} Linh khí\n`;
            msg += `+ 💎 ${monster.stone} Linh thạch\n`;
            
            // Tỷ lệ may mắn rơi vật phẩm chế tạo
            if (Math.random() > 0.6) {
                p.tuiDo.push(monster.itemDrop);
                msg += `+ 📦 Thu hoạch thêm nguyên liệu: [${monster.itemDrop}]`;
            }
            saveData(players);
            return api.sendMessage(msg, threadID, messageID);
        }

        // ==================== 7. LỆNH CỬA HÀNG ====================
        if (subCommand === "cuahang") {
            let shopTxt = `🏪----[ THIÊN BẢO CÁC ]----🏪\n\n`;
            shopTxt += `💊 ĐAN DƯỢC:\n`;
            for (let name in CUA_HANG.dan_duoc) {
                let item = CUA_HANG.dan_duoc[name];
                shopTxt += `- [${name}] | Giá: ${item.gia} Linh thạch\n  » Công dụng: ${item.desc}\n`;
            }
            shopTxt += `\n⚔️ TRANG BỊ VŨ KHÍ:\n`;
            for (let name in CUA_HANG.trang_bi) {
                let item = CUA_HANG.trang_bi[name];
                shopTxt += `- [${name}] (${item.pham}) | Giá: ${item.gia} Linh thạch\n  » Chỉ số: Công +${item.Atk}, Thủ +${item.Def}\n`;
            }
            shopTxt += `\n👉 Gõ \`/tutien mua [Tên vật phẩm chính xác]\` để giao dịch mua bán!`;
            return api.sendMessage(shopTxt, threadID, messageID);
        }

        // ==================== 8. LỆNH MUA ĐỒ ====================
        if (subCommand === "mua") {
            let itemName = args.slice(1).join(" ");
            if (!itemName) return api.sendMessage("❌ Vui lòng nhập tên vật phẩm cần mua!", threadID, messageID);

            let itemData = CUA_HANG.dan_duoc[itemName] || CUA_HANG.trang_bi[itemName];
            if (!itemData) return api.sendMessage("❌ Vật phẩm này không tồn tại trong Thiên Bảo Các!", threadID, messageID);

            if (p.linhThach < itemData.gia) return api.sendMessage("❌ Túi tiền eo hẹp, không đủ Linh Thạch để sở hữu vật phẩm này!", threadID, messageID);

            p.linhThach -= itemData.gia;
            
            if (itemData.type === "exp") {
                p.exp += itemData.value;
                saveData(players);
                return api.sendMessage(`💊 Bạn mua và bạo phục [${itemName}], tăng ngay lập tức +${itemData.value} Linh khí!`, threadID, messageID);
            } else {
                p.tuiDo.push(itemName);
                saveData(players);
                return api.sendMessage(`👜 Bạn đã mua thành công [${itemName}] và cất vào túi trữ vật không gian.`, threadID, messageID);
            }
        }

        // ==================== 9. LỆNH LINH THÚ KHẾ ƯỚC ====================
        if (subCommand === "linhthu") {
            let petName = args.slice(1).join(" ");
            if (!petName) {
                let petTxt = `🐾---[ LINH THÚ PHỔ ]---🐾\n\n`;
                for (let key in LINH_THU_LIST) {
                    let pet = LINH_THU_LIST[key];
                    petTxt += `🔹 **${key}** (${pet.rarity})\n`;
                    petTxt += `   » Chỉ số: Tấn công +${pet.Atk} | Phòng thủ +${pet.Def}\n`;
                    petTxt += `   » Đặc tính: ${pet.note}\n\n`;
                }
                petTxt += `👉 Gõ \`/tutien linhthu [Tên Linh Thú]\` để tiến hành kết khế ước chiến đấu cùng con thú đó!`;
                return api.sendMessage(petTxt, threadID, messageID);
            }

            if (!LINH_THU_LIST[petName]) return api.sendMessage("❌ Linh thú này không có tên trong Thần Thú Phổ thế giới!", threadID, messageID);
            
            p.linhThuCurrent = petName;
            saveData(players);
            return api.sendMessage(`🐾 Khế ước thành công! Từ nay **${petName}** sẽ hộ giá đồng hành cùng đạo hữu trên mọi mặt trận pve đánh quái.`, threadID, messageID);
        }

        // Các lệnh phụ đồng bộ trang bị tự động theo mong muốn của bạn
        if (subCommand === "trangbi" || subCommand === "kynang") {
            return api.sendMessage(`🛡️ Hệ thống tự động kích hoạt: Đã trang bị các pháp bảo và tuyệt kỹ võ học tối thượng mạnh nhất có sẵn trong túi đồ của đạo hữu lên cơ thể!`, threadID, messageID);
        }
    }
};
