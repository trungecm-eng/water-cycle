# REQ-005 — Báo cáo nghiệm thu vòng 1

Môi trường: Chromium 140 headless (WebGL phần mềm), `python3 -m http.server 8000`, nhánh `req/REQ-005`. Tôi tự chạy lại toàn bộ lệnh, không dựa vào số liệu của báo cáo build.

## Kết quả tổng

| AC | Kết luận | Cách kiểm |
|----|----------|-----------|
| AC-1 (luồng) | pass | `node e2e/ui-flow.e2e.mjs` (295 s, exit 0): chạy cả luồng ×1 mặc định và biến thể gián đoạn (đổi kích thước cửa sổ khi bảng mở, bấm liên tiếp nhiều góc nhìn, thu gọn bảng khi đang chuyển, rồi tiếp tục). Luồng mặc định: gió 0 → Biển 94% (421 giọt); gió 100 → Núi 80%. Biến thể gián đoạn: Biển 96% → Núi 83%. Thu gọn/mở, gập/mở nhóm, "Về mặc định", chất lượng Thấp rồi Cao, `__sim` đổi thẻ, đặt lại đều qua. Console không lỗi. Luồng đã nằm trong repo (`e2e/ui-flow.e2e.mjs`). |
| AC-2 | pass | `node --test` (51/51) gồm test phân bố nước 300 giây: tổng bằng n, phần trăm cộng 100, lệch ≤ 1. |
| AC-3 | pass | `node --test`: mỗi giọt mưa tính đúng một bộ đếm, xóa bộ đếm giữ nguyên World so với World song song, Núi gió 100 > gió 0. |
| AC-4 | pass | `node --test`: `level-trend` (cửa sổ 10 s, trễ, tạm dừng), mực/vạch ban đầu/ao cạn với World. |
| AC-5 | pass | `node --test` (views: đường chuyển 1 s, cao hơn địa hình, điểm cuối trùng, gián đoạn không nhảy) và `ui-flow`/`ui-views` e2e đạt; `?view=river` mở đúng. |
| AC-6 | pass | `node --test` (`quality.test.js`, snapshot World high/low giống nhau, quy tắc gợi ý FPS) và `e2e/ui-quality.e2e.mjs` đạt. |
| AC-7 | pass | `e2e/ui-panel.e2e.mjs` đạt: bảng ≤ 30% ở 1024 và 1920 px, canvas toàn cửa sổ, Tab/Enter/Space, phím tắt, thời gian tăng đều khi thu gọn; 110 đoạn chữ, 0 lỗi tương phản (≥ 4,5:1). |
| AC-8 | pass | Test hàm đọc tham số trong `node --test` (`?view=moon`, `?quality=ultra` rơi về mặc định) và e2e không có lỗi console. |
| AC-9 | pass | `e2e/ui-screenshots.e2e.mjs` đạt (144 s); tám ảnh ở `specs/REQ-005/screenshots/`, bản sao ở `eval/round-1/` (bên dưới). Sau 60 s: gió 0 → Biển 100% (281 giọt); gió 100 → Núi 100% (232 giọt). |
| AC-10 | pass | `e2e/measure-fps.e2e.mjs`, bảng mở, 1000 hạt, ×1, 1280×1000: Cao ≈ 7,9 FPS, Thấp ≈ 12,3 FPS (WebGL phần mềm, chỉ tham khảo, không có ngưỡng). |
| AC-11 | pass | `node --test`: 51/51 pass, 105 s, không cần mạng/trình duyệt. Toàn bộ e2e cũ (core-3d, cycle-flow, scenery, scene, screenshots, panel-foundation, ui-controls, ui-statistics, ui-views) exit 0. `package.json` chỉ có `type` và `scripts.test`. README có đủ mục (đã đọc). |
| AC-12 | manual | Chờ người kiểm tay: giao diện đẹp/gọn, thẻ số liệu dễ hiểu, tự làm thí nghiệm gió–mưa núi, góc nhìn chuyển mượt, ≥ 45 FPS mức Cao với 1000 hạt trên máy thật (headless phần mềm không chứng nhận được). |

## Ảnh

Ảnh trong `specs/REQ-005/eval/round-1/`: `01-panel-open.png`, `02-panel-collapsed.png`, `03-overview.png`, `04-sea.png`, `05-mountain.png`, `06-river.png`, `07-rain-wind-0.png`, `08-rain-wind-100.png`. Ảnh 01 xem trực tiếp: bảng phải trong mờ, ba nhóm, thanh trượt có biểu tượng và mô tả hai đầu, nhãn 3D hiển thị đúng.

## Lỗi cần sửa

Không có lỗi nào làm hỏng tiêu chí.

## Ghi chú

- Các script e2e cũ (REQ-004) ghi đè ảnh trong `specs/REQ-004/screenshots/` khi chạy; tôi đã `git checkout` để phục hồi. Nên cân nhắc cho chúng không ghi đè bằng chứng của REQ trước.
- FPS headless rất thấp do WebGL phần mềm; chỉ AC-12 trên máy thật mới kết luận được ngưỡng.
