# Tiến độ REQ-001

## Phiên build ngày 2026-10-27 — bước 1
- Hoàn thành khung HTML/CSS, cấu hình đóng băng sâu, RNG mulberry32 và nội suy/kiểm tra lòng địa hình. Trục tọa độ logic hướng lên đúng yêu cầu.
- `node --test`: 3 test đạt, không cần cài dependency hay truy cập mạng.
- Tiếp theo: bước 2 (lưới hồ), rồi bước 3 (world/clock/URL và vẽ tối thiểu).
- Các hằng số nhịp/nhiệt/chuyển động trong cấu hình hiện là giá trị khởi đầu, phải hiệu chỉnh và kiểm chứng ở bước 7; chưa khẳng định đạt nhịp sản phẩm.

## Phiên build ngày 2026-10-27 — bước 2 và bàn giao
- Hoàn thành `Lake`: lấp hàng dưới trước, quản lý ô bằng tham chiếu đối tượng hạt, tìm hạt cao nhất mỗi cột, lấy ra và đưa vào ô trống thấp nhất rồi gần hoành độ nhất (hòa chọn trái). Mực nước tính từ số hạt; kiểm tra đủ 1.200 ô và chống thêm trùng/vượt sức chứa.
- `node --test`: toàn bộ 7 test đạt. Đã hoàn thành và đánh dấu bước 1–2; bước 3–10 chưa làm. Trang hiện mới là khung canvas, chưa có vòng mô phỏng hay điều khiển.
- Phiên sau bắt đầu bước 3: tạo world/clock/params, renderer tối thiểu, main và getter snapshot đóng băng `window.__sim`. Logic thuần không phụ thuộc DOM; dùng cùng đối tượng hạt khi gọi `Lake.remove`/`Lake.add`. `Lake.add` đặt lại nhiệt độ nền và vận tốc bằng 0.
- Repo chưa có `notes.md`, `eval/` hoặc tiến độ cũ tại thời điểm đọc. Không sửa các tài liệu được bảo vệ.
- Git chưa có danh tính mặc định. Commit thành công bằng các biến môi trường `GIT_AUTHOR_NAME=ai-dev-team GIT_AUTHOR_EMAIL=ai-dev-team@localhost GIT_COMMITTER_NAME=ai-dev-team GIT_COMMITTER_EMAIL=ai-dev-team@localhost` trước lệnh git, theo danh tính commit có sẵn; không sửa `.git/config`.
- Các hằng số điều khiển vật lý chỉ là khởi điểm, cần kiểm chứng ở các bước 4–7. Chưa chạy trình duyệt/E2E/FPS vì chưa triển khai các bước liên quan.
