# REQ-005 — Tiến độ build

## Phiên 2026-10-27 — Bước 1 hoàn tất

Đã tách nội dung ra `src/content.js`, biến phong cách ra `src/ui/theme.css`, chuyển canvas toàn cửa sổ và bảng phủ bên phải. Ba nhóm gập/mở bằng `details`; nút thu gọn và phím B, nhớ bảng/nhóm trong `sessionStorage`, có `__sim.panel` chỉ đọc. Nhãn bản đồ và lỗi WebGL2 lấy nội dung từ file chung. Giữ nguyên id điều khiển và `data-hud`; không sửa World hoặc quy luật.

Kiểm tra: `node --test` đạt 39/39 trong 112,25 giây. Các kịch bản `core-3d`, `scenery`, `scene` và `panel-foundation` đều đạt. Chạy server bằng `python3 -m http.server 8000`; Playwright hiện có và dùng được trực tiếp qua `e2e/browser.mjs`, không cần cài dependency trong repo. Báo cáo chi tiết và thay đổi kiểm tra bố cục cũ ở `build-report.md`.

Tiếp theo: bước 2 trong `plan.md`, viết các module số liệu thuần và test. `activeStages` vẫn ở `src/ui/hud.js`, chuyển sang `src/stats/stages.js` ở bước 2. Các thẻ và điều khiển hiện vẫn giữ nội dung cũ để bước 3–4 thay tiếp. Nội dung khung HTML nằm trong `panelMarkup` của `content.js`, được `createPanel` chèn trước khi main tìm canvas. Không dùng Tab để thu gọn; Tab dành cho focus theo spec. Đã đổi nhãn bản đồ trong `map-data.js` thành id + position; chữ lấy từ `content.regions`. Chưa làm các bước 2–8, chưa có ảnh nghiệm thu hay đo FPS REQ-005, chưa kết luận AC-12 kiểm tay.
