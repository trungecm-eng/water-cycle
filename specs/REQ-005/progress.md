# REQ-005 — Tiến độ build

## Phiên 2026-10-27 — Bước 1 hoàn tất

Đã tách nội dung ra `src/content.js`, biến phong cách ra `src/ui/theme.css`, chuyển canvas toàn cửa sổ và bảng phủ bên phải. Ba nhóm gập/mở bằng `details`; nút thu gọn và phím B, nhớ bảng/nhóm trong `sessionStorage`, có `__sim.panel` chỉ đọc. Nhãn bản đồ và lỗi WebGL2 lấy nội dung từ file chung. Giữ nguyên id điều khiển và `data-hud`; không sửa World hoặc quy luật.

Kiểm tra: `node --test` đạt 39/39 trong 112,25 giây. Các kịch bản `core-3d`, `scenery`, `scene` và `panel-foundation` đều đạt. Chạy server bằng `python3 -m http.server 8000`; Playwright hiện có và dùng được trực tiếp qua `e2e/browser.mjs`, không cần cài dependency trong repo. Báo cáo chi tiết và thay đổi kiểm tra bố cục cũ ở `build-report.md`.

Tiếp theo: bước 2 trong `plan.md`, viết các module số liệu thuần và test. `activeStages` vẫn ở `src/ui/hud.js`, chuyển sang `src/stats/stages.js` ở bước 2. Các thẻ và điều khiển hiện vẫn giữ nội dung cũ để bước 3–4 thay tiếp. Nội dung khung HTML nằm trong `panelMarkup` của `content.js`, được `createPanel` chèn trước khi main tìm canvas. Không dùng Tab để thu gọn; Tab dành cho focus theo spec. Đã đổi nhãn bản đồ trong `map-data.js` thành id + position; chữ lấy từ `content.regions`. Chưa làm các bước 2–8, chưa có ảnh nghiệm thu hay đo FPS REQ-005, chưa kết luận AC-12 kiểm tay.

## Phiên 2026-10-27 — Bước 2 hoàn tất

Đã thêm `src/stats/water-distribution.js`, `rain-tally.js`, `level-trend.js`, `stages.js`. Phân bố trả `{ counts, percentages, total }`, sáu khóa `sea/lake/pond/airborne/rain/runoff`; phần trăm dùng phần dư lớn nhất. `RainTally` có `clear(world)` và `read(world)`, trừ mốc chụp từ `rainLandings`, không sửa World. Khi World thay mảng hạt do reset, mốc trở về 0; vẫn đếm được mưa sau reset ngay cả khi giao diện không đọc ở thời gian 0. `LevelTrend.update(time, count, level)` trả mực hiện tại, mực ban đầu, `direction` (`up/down/null`), `dry`; `reset()` cho lúc đặt lại. Lưu cửa sổ 10 giây, ngưỡng vào 3 hạt/ra 1 hạt ở `config.stats`. HUD dùng hàm giai đoạn đã tách và tiếp tục export hàm cũ để tương thích. Không đổi World hoặc hằng số vật lý.

Kiểm tra: `node --test` đạt 44/44, thời gian thực 122,517 giây (log ở `/tmp/req005-all-tests.log`, không phải artifact bền vững). Test số liệu riêng đạt 5/5, kiểm phân bố từng bước trong 300 giây mặc định, bộ đếm từng vùng kể cả suối/sông, không đếm lặp, hai World song song, tỷ lệ mưa núi với gió 0/100 từ giây 60 đến 300, ngưỡng trễ và ao cạn. Sau khi bổ sung xử lý reset giữa hai lần đọc, chạy lại ba test liên quan đạt 3/3. `node e2e/panel-foundation.e2e.mjs` và `node e2e/core-3d.e2e.mjs` đạt với server `python3 -m http.server 8000`. Môi trường không có `/usr/bin/time`; dùng từ khóa shell `time`.

Tiếp theo: bước 3, nối các module vào các thẻ Số liệu và Chú giải, bổ sung `__sim.rainTally`, `__sim.waterDistribution`. Nhớ gọi `RainTally.clear(world)` khi xóa bộ đếm, `LevelTrend.reset()` khi đặt lại (đặc biệt reset khi thời gian vẫn bằng 0), và cập nhật xu hướng sau mỗi bước mô phỏng để cửa sổ chính xác khi tăng tốc. Mọi chữ mới vẫn phải đặt trong `src/content.js`. Các bước 3–8 chưa làm; chưa kết luận nghiệm thu toàn REQ-005.
