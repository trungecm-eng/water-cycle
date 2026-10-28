# REQ-006 — Tiến độ

## Phiên build 2026-10-28 — Bước 1

- Hoàn tất bước 1: đo mốc độ dốc REQ-004 trước sửa; thêm nhiễu thuần có seed; thay ba núi bằng sáu đỉnh có sườn gồ ghề, thêm gợn đồng bằng. Giữ lưới mô phỏng 96 ô, khắc khe và priority-flood hiện có.
- Chọn **một lớp địa hình**. Toàn bộ test mô phỏng đạt mà không đổi hằng số vật lý; không cần phương án dự phòng. Chi tiết và số đo ở `build-report.md`.
- Kiểm thử: `node --test` đạt 51/51 test hiện có trong 150,274 giây; `node --test test/terrain-art.test.js` đạt 3/3 test mới. `node e2e/core-3d.e2e.mjs`, `node e2e/scenery.e2e.mjs`, `node e2e/cycle-flow.e2e.mjs` đều đạt.
- Trình duyệt chạy được với Playwright toàn cục, dùng `python3 -m http.server 8000`. Kịch bản cycle-flow đã chuyển sang `quality=low&speed=8` theo requirement: ở Cao, cảnh báo FPS có thể đổi snapshot trong lúc tạm dừng, khiến so toàn bộ snapshot thất bại dù mô phỏng đứng yên. Luồng chính Cao ×1 cũng đã chạy qua trước lỗi ở luồng gián đoạn. Giữ nguyên kỳ vọng mốc thời gian mô phỏng và tên giai đoạn cũ cho đến bước 7.
- Tiếp theo: bước 2, bảng màu và module màu theo độ dốc/độ cao/nhiễu, lưới vẽ 160/80, ruộng tất định và bọt bờ. Renderer hiện vẫn dùng lưới 96/48 và bảng màu cũ. Không đánh dấu các AC đồ họa hoàn tất chỉ vì chỉ số địa hình đạt.

## Phiên build 2026-10-28 — Bước 2

- Hoàn tất bước 2: `terrain-colors.js` tính màu từ độ cao/độ dốc/nhiễu, bảng màu pastel có tên và các ngưỡng trong `config`; `fields.js` tạo 36 ruộng tất định bằng RNG riêng, kiểm tra cả diện tích và vùng đệm. Renderer dùng lưới nội suy 160/80, ruộng chỉ tô màu đỉnh; thêm dải bọt theo đường mực nước thực tế. `__sim.scene.fields` cung cấp số ruộng.
- Kiểm thử: toàn bộ `node --test` đạt 58/58 trong 137,906 giây. Sau thay khóa cấu hình quality, nhóm quality + terrain-colors đạt lại 8/8. `node e2e/ui-quality.e2e.mjs`, `node e2e/scenery.e2e.mjs`, `node e2e/cycle-flow.e2e.mjs` đều đạt. Đã xem ảnh thử trong `/tmp`; chưa tạo bộ ảnh nghiệm thu và chưa kết luận đạt AC đồ họa tổng thể.
- Tiếp theo **bước 3**: thay mặt nước ô vuông hiện có bằng viền tự nhiên/lòng chảo, xử lý dải nối hồ–sông, mực nước và dải sáng. Sau đó thực hiện tuần tự bước 4–10. Núi hiện có sáu đỉnh cao hẹp; cần rà hình ảnh tổng thể khi thêm chân núi/rừng và ở vòng QA cuối để đánh giá vẻ tự nhiên. Mặt cắt, trời, cây, mây, Mặt Trời, nhãn giai đoạn vẫn chưa nâng cấp.
- `terrainStep` đã được thay bằng `terrainCells`; test quality và e2e quality đã cập nhật, các cặp thay đổi ghi trong `build-report.md`. Không đổi quy luật hoặc hằng số vật lý `World`.
- Git chưa cấu hình danh tính. Commit dùng tùy chọn từng lệnh: `git -c user.name='Dev Agent' -c user.email='dev-agent@example.com' commit -m '...'`; không sửa cấu hình `.git`. Server thử cổng 8000 được dừng khi kết thúc phiên; cần chạy lại ở phiên sau.
