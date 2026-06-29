// Hệ thống Cảnh Giới (Càng lên cao Linh Khí yêu cầu càng tăng)
const CANH_GIOI = [
    { name: "Luyện Khí", maxTang: 9, expRequired: (tang) => tang * 100 },
    { name: "Trúc Cơ", maxTang: 9, expRequired: (tang) => tang * 300 + 1000 },
    { name: "Kim Đan", maxTang: 9, expRequired: (tang) => tang * 1000 + 4000 },
    { name: "Nguyên Anh", maxTang: 9, expRequired: (tang) => tang * 5000 + 15000 },
    { name: "Hóa Thần", maxTang: 9, expRequired: (tang) => tang * 20000 + 60000 },
    { name: "Luyện Hư", maxTang: 9, expRequired: (tang) => tang * 100000 + 250000 },
    { name: "Hợp Thể", maxTang: 9, expRequired: (tang) => tang * 500000 + 1200000 },
    { name: "Đại Thừa", maxTang: 9, expRequired: (tang) => tang * 2000000 + 5000000 },
    { name: "Độ Kiếp", maxTang: 9, expRequired: (tang) => tang * 10000000 + 25000000 },
    { name: "Phi Thăng Tiên Giới", maxTang: 1, expRequired: () => Infinity }
];

// Hệ thống Linh Căn (Hệ nguyên tố & Phẩm chất)
const NGUYEN_TO = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ", "Lôi", "Băng", "Phong", "Quang", "Ám", "Hỗn Độn"];
const PHAM_CHAT_LINH_CAN = [
    { name: "Sơ Cấp", rateBonus: 1.0 },
    { name: "Trung Cấp", rateBonus: 1.25 },
    { name: "Thượng Cấp", rateBonus: 1.6 },
    { name: "Thiên Cấp", rateBonus: 2.1 }
];

// Hệ thống Linh Thú (Có điểm mạnh/yếu rõ ràng)
const LINH_THU_LIST = {
    "Xích Diễm Khuyển": { rarity: "Phàm Cấp", Atk: 50, Def: 10, note: "Mạnh: Gây thiêu đốt hệ Hỏa | Yếu: Sợ nước (Thủy hệ)" },
    "Băng Sương Yến": { rarity: "Trung Cấp", Atk: 120, Def: 40, note: "Mạnh: Tốc độ cao, đóng băng | Yếu: Phòng thủ vật lý kém" },
    "U Minh Tật Phong Báo": { rarity: "Thượng Cấp", Atk: 450, Def: 150, note: "Mạnh: Bạo kích cực cao, hệ Phong | Yếu: Lượng máu (HP) thấp" },
    "Thao Thiết Thần Thú": { rarity: "Tiên Cấp", Atk: 2500, Def: 1200, note: "Mạnh: Hút máu, vạn vật đều nuốt | Yếu: Tốn rất nhiều tài nguyên để nuôi" }
};

// Cửa hàng vật phẩm và Trang bị giá cả hợp lý
const CUA_HANG = {
    dan_duoc: {
        "Sơ Cấp Tụ Khí Đan": { gia: 100, pham: "Nhất Đẳng", type: "exp", value: 150, desc: "Tăng lập tức 150 Linh Khí" },
        "Bá Vương Phá Chướng Đan": { gia: 1500, pham: "Tam Đẳng", type: "rate", value: 0.2, desc: "Tăng 20% tỷ lệ đột phá" }
    },
    trang_bi: {
        "Phàm Thiết Kiếm": { gia: 200, pham: "Phàm Cấp", Atk: 15, Def: 0 },
        "Linh Vũ Pháp Y": { gia: 1000, pham: "Trung Cấp", Atk: 0, Def: 80 },
        "Thanh Phong Cổ Kiếm": { gia: 5000, pham: "Thượng Cấp", Atk: 350, Def: 50 },
        "Thái Hư Trấn Thiên Ấn": { gia: 100000, pham: "Tiên Cấp", Atk: 4500, Def: 2500 }
    }
};

// Cốt truyện tương tác sinh động theo cấp độ quái
const COT_TRUYEN = (level) => {
    if (level <= 10) return "Bạn vừa bước chân vào giới Tu Chân, bắt đầu thanh trừng yêu quái phá hoại thôn làng để báo thù cho gia đình.";
    if (level <= 50) return "Danh tiếng vang xa, bạn phát hiện ra một tông môn bí ẩn đang âm mưu hiến tế vạn dân để luyện tà công.";
    if (level <= 150) return "Trận chiến Chính - Tà nổ ra! Bạn một mình một kiếm xông pha vạn dặm Ma vực để tìm kiếm tung tích Tiên giới.";
    return "Cự môn Tiên giới đã hiển lộ trước mắt, đánh bại Thủ vệ tối cao để chứng đạo thành Tiên!";
};

// Hàm tự động tạo danh sách 250 cấp độ Quái vật logic
const generateMonsters = () => {
    let monsters = {};
    const tinhAnh = ["Yêu Tộc", "Ma Thú", "Cổ Thi", "Độc Tộc", "Cự Long", "Vương Giả"];
    for (let i = 1; i <= 250; i++) {
        let nameIdx = i % tinhAnh.length;
        let expDrop = i * 25 + Math.floor(i * i * 0.5);
        let stoneDrop = i * 15 + Math.floor(i * i * 0.3);
        monsters[i] = {
            name: `${tinhAnh[nameIdx]} Cấp ${i}`,
            exp: expDrop,
            stone: stoneDrop,
            itemDrop: i % 10 === 0 ? "Da Yêu Thú Thượng Hạng" : "Dược Liệu Thô"
        };
    }
    return monsters;
};
const QUAI_VAT = generateMonsters();

module.exports = { CANH_GIOI, NGUYEN_TO, PHAM_CHAT_LINH_CAN, LINH_THU_LIST, CUA_HANG, QUAI_VAT, COT_TRUYEN };
