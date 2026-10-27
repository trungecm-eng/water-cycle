# REQ-004 — Tiến độ

## Phiên build 1 — 2026-10-27

- Hoàn thành bước 1: lưu three.js r170 độc lập và MIT license trong `vendor/`; thêm mô tả bản đồ đóng băng sâu ở `src/map-data.js`, lưới 96 × 96 ô với 97 × 97 đỉnh, nội suy độ cao và bảng màu pastel. Seed bản đồ độc lập seed mô phỏng.
- Đổi mặc định `n` thành 1000 và miền URL thành 100–2000. Test URL mới kiểm tra 1500, 2000 và giá trị sai. Test mưa cũ bỏ số 600 cố định, so với `config.defaults.n`, giữ ý nghĩa bảo toàn.
- Chưa thay test 2D: test địa hình và hồ cũ vẫn được giữ cho đến bước chuyển lõi 3D. `world.height = 600`, cấu hình địa hình/hồ 2D tạm giữ để ứng dụng cũ tiếp tục chạy; `world.depth = 1000`, `world.seaLevel = 0`, `world.gridCells = 96` đã thêm. Lõi cũ còn giới hạn sức chứa hồ 1200; hỗ trợ chạy thật với n > 1200 sẽ hoàn thành ở bước 3, hiện mới có parser nhận miền mới.
- Bước tiếp theo: bước 2, xây `src/sim/drainage.js`; khắc lòng suối/sông và vùng chứa trước khi lấp trũng, tính hướng chảy và lưu vực. Các tọa độ trong dữ liệu là nền ban đầu, được phép hiệu chỉnh để bảo đảm quan hệ dòng chảy; heightmap hiện chưa khắc lòng hồ/ao hay suối.
- Lệnh chạy kiểm thử: `node --test` (không mạng, không trình duyệt). Kiểm tra thư viện bằng import Node trả `REVISION = '170'`; chưa import three.js vào lớp mô phỏng. Chưa chạy e2e vì lớp vẽ vẫn là REQ-001.
- Kết quả cuối phiên: toàn bộ 30 test đạt trong 164,79 giây; `git diff --check` sạch. Chưa nghiệm thu toàn bộ REQ-004; còn bước 2–11.
- Môi trường chưa cấu hình danh tính Git; commit dùng danh tính agent tạm thời qua `git -c user.name=Codex -c user.email=codex@openai.com commit`, không sửa tệp cấu hình Git.

## Phiên build 2 — 2026-10-27

- Hoàn thành bước 2: thêm `src/sim/drainage.js`, khắc đường suối/sông theo dữ liệu, đặt đáy hồ/ao, lấp trũng bằng priority-flood với độ dốc tối thiểu, xuất hướng chảy D8 và lưu vực cho mọi điểm lưới. Ba suối nối đúng hồ/sông; hồ có cửa thoát ra sông; sông ra biển; không dòng nào vào ao.
- `generateDrainage()` trả cấu trúc heightmap mở rộng: `directions` là chỉ số đích (-1 tại vùng chứa), `reservoirs` là mã vùng chứa hoặc null, `basins` là vùng chứa cuối cùng, `channels` chứa đường đi có thứ tự, `outlets` chứa ô nhận nước tràn của hồ/ao. Các chỉ số dùng cùng 97 × 97 đỉnh như heightmap; `cellAt()` ánh xạ tọa độ sang đỉnh gần nhất, có kẹp biên. Lớp vẽ và mô phỏng 3D cần dùng bản đồ này thay vì heightmap chưa khắc.
- Hằng số khắc dòng và đường tràn ao ở `mapData.drainage`. Đường tràn ao là rãnh địa hình nhãn `plain`, không phải suối/sông, đi ra biển và không quay lại lưu vực ao. Đáy ô nhận tràn thấp hơn đáy vùng chứa; chưa triển khai hạt tràn (bước 3/6).
- Thêm bốn test: duyệt mọi ô bảo đảm D8 xuống thấp nghiêm ngặt, không vòng và tới đúng lưu vực; quan hệ suối/hồ/sông/biển; đáy vùng chứa và cửa tràn; tính tất định. Địa hình sau lấp trũng vẫn có độ dốc trung bình đồng bằng khoảng 0,093, núi khoảng 0,907.
- Kiểm thử: `node --test` đạt 34/34 trong 152,52 giây; `node --test test/drainage.test.js` đạt 4/4. `git diff --check` sạch. Không có notes hoặc eval riêng của REQ-004. Các test và ứng dụng 2D cũ vẫn giữ nguyên, chưa thay bằng lõi 3D; không coi đây là nghiệm thu toàn bộ AC-2/AC-3.
- Tiếp theo: bước 3 (vùng chứa, World 3D, camera thuần, lớp vẽ three.js tối thiểu, chuyển test core/URL/clock). Còn bước 3–11; chưa chạy e2e. Danh tính commit tiếp tục truyền bằng `git -c user.name=Codex -c user.email=codex@openai.com commit`, không sửa cấu hình Git.

## Phiên build 3 — 2026-10-27

- Hoàn thành bước 3: ứng dụng dùng `World` 3D và bản đồ đã khắc/lấp trũng; `Reservoirs` đếm nước biển/hồ/ao, phân bố và sức chứa co theo `n`, tính mực nước, trạng thái ao cạn và giải phóng phần tràn đúng ô cửa thoát trong một bước. Nước trong vùng chứa không mang tọa độ riêng. Snapshot vẫn tách rời, đóng băng sâu, thêm `reservoirs`.
- Thêm camera thuần với góc 10–85°, giới hạn khoảng cách, nâng mắt camera khi gặp địa hình/mặt nước. Camera độc lập mô phỏng; đặt lại không đổi camera. Lớp vẽ mới chỉ import three.js trong `src/ui/render.js`, có địa hình tam giác phẳng, mặt biển/hồ/ao và ô suối/sông, hạt ngoài vùng chứa; camera kéo chuột/lăn chuột/mũi tên/+−. `__sim` thêm `camera` và `webgl2`; thiếu WebGL2 hiện thông báo tiếng Việt, không gọi khởi tạo three.js gây lỗi console.
- `test/core.test.js` giữ nguyên ý nghĩa URL, clock, tất định qua tạm dừng/tốc độ và snapshot/reset, nay chạy trên World 3D. Thêm `test/reservoirs.test.js` (100–2000 hạt, phân bố/mực, tràn, ao cạn/có nước lại) và `test/camera.test.js` (kẹp và lấy mẫu dày toàn góc quay). Test lưới hồ 2D chưa xóa; tương đương 3D về phân bố, mực và nhận nước đã có trong test vùng chứa, còn kiểm thử vận chuyển hoàn chỉnh ở bước 6.
- Chuyển World REQ-001 nguyên trạng sang `src/sim/legacy-world.js` chỉ cho các test air/heat/precipitation/stability cũ. Các test này có tiền tố `legacy 2D:` để tránh nhầm với nghiệm thu 3D. Đây là giàn kiểm tra hồi quy tạm thời, ứng dụng không import nó. Bước 4 chuyển test heat, bước 5 chuyển air/clusters, bước 6 chuyển precipitation, bước 7 chuyển stability rồi xóa legacy-world và các module 2D không còn dùng. Không coi các test cũ đạt là bằng chứng AC vật lý 3D đạt.
- Giới hạn có chủ ý ở mốc bước 3: `World.step()` mới xử lý tràn và đồng hồ; chưa bốc hơi, chuyển động không khí hay dòng chảy 3D. Cảnh hiện là nền tĩnh; bước 4–7 sẽ nối các giai đoạn, bước 8 hoàn thiện sa bàn/nhãn/hiệu ứng, bước 9 gom giao diện. Không chạy kịch bản vòng tuần hoàn cũ để nghiệm thu nền tĩnh.
- Kiểm tra Chromium: `python3 -m http.server 8000`, rồi `node e2e/core-3d.e2e.mjs` đạt WebGL2, n=2000, camera chuột/phím khi tạm dừng, resize, reset giữ camera, giả lập WebGL hỏng và console sạch. Không cần dependency npm hoặc cờ khởi động. Ảnh xem thử ở `/tmp/req004-step3.png` chỉ là tệp tạm, không phải ảnh nghiệm thu AC-13.
- Kiểm thử chốt bước 3: `node --test` đạt 39/39 trong 155,40 giây; sau khi bổ sung snapshot camera chỉ đọc, chạy lại 9 test core/vùng chứa/camera và e2e nền 3D đều đạt. `git diff --check` sạch.
