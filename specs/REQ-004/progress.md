# REQ-004 — Tiến độ

## Phiên build 1 — 2026-10-27

- Hoàn thành bước 1: lưu three.js r170 độc lập và MIT license trong `vendor/`; thêm mô tả bản đồ đóng băng sâu ở `src/map-data.js`, lưới 96 × 96 ô với 97 × 97 đỉnh, nội suy độ cao và bảng màu pastel. Seed bản đồ độc lập seed mô phỏng.
- Đổi mặc định `n` thành 1000 và miền URL thành 100–2000. Test URL mới kiểm tra 1500, 2000 và giá trị sai. Test mưa cũ bỏ số 600 cố định, so với `config.defaults.n`, giữ ý nghĩa bảo toàn.
- Chưa thay test 2D: test địa hình và hồ cũ vẫn được giữ cho đến bước chuyển lõi 3D. `world.height = 600`, cấu hình địa hình/hồ 2D tạm giữ để ứng dụng cũ tiếp tục chạy; `world.depth = 1000`, `world.seaLevel = 0`, `world.gridCells = 96` đã thêm. Lõi cũ còn giới hạn sức chứa hồ 1200; hỗ trợ chạy thật với n > 1200 sẽ hoàn thành ở bước 3, hiện mới có parser nhận miền mới.
- Bước tiếp theo: bước 2, xây `src/sim/drainage.js`; khắc lòng suối/sông và vùng chứa trước khi lấp trũng, tính hướng chảy và lưu vực. Các tọa độ trong dữ liệu là nền ban đầu, được phép hiệu chỉnh để bảo đảm quan hệ dòng chảy; heightmap hiện chưa khắc lòng hồ/ao hay suối.
- Lệnh chạy kiểm thử: `node --test` (không mạng, không trình duyệt). Kiểm tra thư viện bằng import Node trả `REVISION = '170'`; chưa import three.js vào lớp mô phỏng. Chưa chạy e2e vì lớp vẽ vẫn là REQ-001.
- Kết quả cuối phiên: toàn bộ 30 test đạt trong 164,79 giây; `git diff --check` sạch. Chưa nghiệm thu toàn bộ REQ-004; còn bước 2–11.
- Môi trường chưa cấu hình danh tính Git; commit dùng danh tính agent tạm thời qua `git -c user.name=Codex -c user.email=codex@openai.com commit`, không sửa tệp cấu hình Git.
