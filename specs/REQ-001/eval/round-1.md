# Báo cáo nghiệm thu REQ-001 — vòng 1

Môi trường: Chromium 140 (Playwright), `python3 -m http.server 8000`, Node. Tôi tự chạy lại mọi thứ, không dựa vào lời của developer.

Lệnh đã chạy: `node --test` (26/26 đạt, ~122 s), `node e2e/cycle-flow.e2e.mjs` (đạt cả hai luồng và phần URL), `node e2e/measure-fps.e2e.mjs`, cùng một kịch bản Playwright riêng chụp ảnh (`?speed=8`, console sạch).

| AC | Kết quả | Cách kiểm |
|---|---|---|
| AC-1 (luồng) | pass | `e2e/cycle-flow.e2e.mjs`: luồng mặc định ×1 thấy đủ 5 trạng thái, nước được làm nóng, cụm mây hiển thị; mốc bốc hơi 0,95 s, mây 13,3 s, mưa 20,1 s, về hồ 22,1 s. Sau đó: tạm dừng (trạng thái đứng yên), Mặt Trời 0 (không bốc hơi mới) → 100, Gió 0 → 100, đổi tốc độ, phím Space/1–4/R, đặt lại (water=600, bộ đếm 0, ×1, đang chạy). Biến thể gián đoạn (`?speed=8`, đổi kích thước cửa sổ 3 lần, tạm dừng/tiếp tục 3 lần) rồi chạy tiếp tới hết vòng và các thao tác trên: đạt. Console/pageerror sạch. Ảnh: `round-1/early.png`, `round-1/cycle.png`. |
| AC-2 | pass | `node --test` (foundation, stability: kiểm từng hạt từng bước 600 s, 9 tổ hợp). |
| AC-3 | pass | `test/lake.test.js` đạt. |
| AC-4 | pass | `test/heat.test.js` đạt. |
| AC-5 | pass | `test/air.test.js` đạt. |
| AC-6 | pass | `test/precipitation.test.js` đạt (29/30, 79/80, 40, rơi thẳng ở gió 0/40/100). Lưu ý: câu "mưa hết trong ≤ 60 giây" mâu thuẫn với "dưới 30 thì ngừng"; developer hiểu là cụm giảm xuống dưới 30 rồi ngừng (đã ghi rõ trong README). Cách hiểu hợp lý, không tính là lỗi; người có thể xem lại cách diễn đạt. |
| AC-7 | pass | `test/precipitation.test.js`: 10.000 hạt, runoff từ mọi hoành độ tới hồ ≤ 40 s. |
| AC-8 | pass | `test/stability.test.js`, `test/heat.test.js`, `test/air.test.js`; E2E xác nhận kéo thanh không làm hạt nhảy và sun=0 không bốc hơi mới. |
| AC-9 | pass | Test mặc định đạt; E2E trong trình duyệt cho cùng mốc (0,95/13,3/20,1/22,1 s, đều trong giới hạn 10/45/75/120). |
| AC-10 | pass | `test/stability.test.js` + `test/core.test.js` đạt (bảo toàn, hữu hạn, tất định, khác seed, tạm dừng, giới hạn 0,25 s, đặt lại). |
| AC-11 | pass | Test hàm đọc tham số + E2E phần URL ("URL cases passed", console sạch). |
| AC-12 | pass | Chromium 140, 600 hạt, ×1, 1280×1000, đủ 5 trạng thái lúc bắt đầu đo: 601 frame / 10,016 s = **60,0 FPS** (≥ 45). Lưu ý: chạy headless, không có GPU thật. |
| AC-13 | pass | `node --test` đạt không cần mạng/trình duyệt; `package.json` chỉ có `type` và `scripts.test`; README có đủ mục: chạy, điều khiển, tham số URL, hạt, hằng số, kiểm thử, cấu trúc. |
| AC-14 | manual | Chờ người kiểm tay. Ảnh chụp cho thấy bố cục rõ, có núi/hồ/Mặt Trời/hạt; người cần đánh giá: chú giải dễ hiểu không cần hướng dẫn, độ mượt trên máy thật, hai thanh trượt có tác dụng rõ, chữ dễ đọc. |

## Lỗi cần sửa
Không có lỗi nào được phát hiện ở vòng này.
