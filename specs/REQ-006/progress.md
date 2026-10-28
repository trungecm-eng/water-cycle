# REQ-006 — Tiến độ

## Phiên build 2026-10-28 — Bước 1

- Hoàn tất bước 1: đo mốc độ dốc REQ-004 trước sửa; thêm nhiễu thuần có seed; thay ba núi bằng sáu đỉnh có sườn gồ ghề, thêm gợn đồng bằng. Giữ lưới mô phỏng 96 ô, khắc khe và priority-flood hiện có.
- Chọn **một lớp địa hình**. Toàn bộ test mô phỏng đạt mà không đổi hằng số vật lý; không cần phương án dự phòng. Chi tiết và số đo ở `build-report.md`.
- Kiểm thử: `node --test` đạt 51/51 test hiện có trong 150,274 giây; `node --test test/terrain-art.test.js` đạt 3/3 test mới. `node e2e/core-3d.e2e.mjs`, `node e2e/scenery.e2e.mjs`, `node e2e/cycle-flow.e2e.mjs` đều đạt.
- Trình duyệt chạy được với Playwright toàn cục, dùng `python3 -m http.server 8000`. Kịch bản cycle-flow đã chuyển sang `quality=low&speed=8` theo requirement: ở Cao, cảnh báo FPS có thể đổi snapshot trong lúc tạm dừng, khiến so toàn bộ snapshot thất bại dù mô phỏng đứng yên. Luồng chính Cao ×1 cũng đã chạy qua trước lỗi ở luồng gián đoạn. Giữ nguyên kỳ vọng mốc thời gian mô phỏng và tên giai đoạn cũ cho đến bước 7.
- Tiếp theo: bước 2, bảng màu và module màu theo độ dốc/độ cao/nhiễu, lưới vẽ 160/80, ruộng tất định và bọt bờ. Renderer hiện vẫn dùng lưới 96/48 và bảng màu cũ. Không đánh dấu các AC đồ họa hoàn tất chỉ vì chỉ số địa hình đạt.
