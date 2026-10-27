# REQ-005 — Báo cáo build

## Bước 1: nền giao diện

- Chuyển toàn bộ nội dung hiển thị sang `src/content.js`, gồm khung HTML, tên hạt, tên vùng, nhãn 3D, trạng thái và lỗi WebGL2. `index.html` còn khung trang và điểm vào module.
- Bảng điều khiển bên phải phủ trên canvas toàn cửa sổ, dùng biến trong `src/ui/theme.css`; ba nhóm dùng phần tử `details` nguyên bản. Nút thu gọn và phím B giữ Tab cho di chuyển focus.
- `sessionStorage` nhớ bảng và từng nhóm; lỗi truy cập chỉ bỏ qua việc lưu. `__sim.panel` trả bản chụp đóng băng, không cho sửa trạng thái qua cửa kiểm thử.
- Không thay đổi World, quy luật hay các hằng số vật lý.

### Thay đổi kịch bản cũ

`e2e/core-3d.e2e.mjs`: thay điều kiện bảng nằm ngoài canvas bằng canvas có mép trái 0, rộng bằng cửa sổ và bảng rộng không quá 30%, đúng bố cục mới trong spec. Đổi chữ dùng để tìm nhóm từ “Chú giải và mô hình” thành “Chú giải”. Giữ nguyên các kiểm tra mô phỏng, chuột, resize, đặt lại, nắng, tạm dừng và WebGL2 dự phòng.

### Kiểm tra bổ sung

`e2e/panel-foundation.e2e.mjs` kiểm kích thước 1024/1920, gập/mở ba nhóm, lưu qua tải lại trang, phím B và bỏ qua khi focus thanh trượt, thu gọn không đổi hạt hoặc thời gian khi tạm dừng, console không lỗi. Các bước sau bổ sung luồng đầy đủ và kiểm tra tương phản/bàn phím theo kế hoạch.

### Kết quả chạy bước 1

- `node --test`: 39/39 đạt, 112,25 giây.
- `node e2e/core-3d.e2e.mjs`, `node e2e/scenery.e2e.mjs`, `node e2e/scene.e2e.mjs`, `node e2e/panel-foundation.e2e.mjs`: đạt, không lỗi console.
- `git diff --check`: đạt.
