# Vòng tuần hoàn nước

Sa bàn 3D dành cho học sinh cấp 2: nước bốc hơi chủ yếu từ biển, theo gió lên núi, ngưng tụ thành mây, mưa rồi chảy về hồ và biển. Tổng số hạt được bảo toàn.

## Chạy và thử sản phẩm

Không cần cài thư viện, CDN hoặc build:

```sh
python3 -m http.server 8000
```

Mở <http://localhost:8000> bằng trình duyệt máy tính hỗ trợ WebGL2. Ở ×1, quan sát trong 120 giây để thấy vòng đầu. Nếu thiếu WebGL2, trang hiện thông báo tiếng Việt.

## Bản đồ và phong cách

Bản đồ 1000 × 1000 có núi phía tây, ba suối, hồ chân núi có cửa thoát ra sông, đồng bằng, ao biệt lập và biển phía đông. Nước sông chảy ra biển; hồ đầy tràn qua cửa thoát, ao đầy tràn theo địa hình. Ao có thể cạn và lộ đáy bùn.

Sa bàn low-poly có mặt tam giác phẳng, mặt cắt đất nâu/đá xám, màu pastel: biển xanh ngọc đậm dần ra xa bờ, cát vàng nhạt, đồng bằng xanh tươi, chân núi xanh đậm, sườn nâu, đỉnh xám không tuyết. Hồ/ao/suối/sông xanh dương trong mờ; mây trắng chuyển xám khi lớn. Sóng biển và dải sáng dòng chảy chạy theo thời gian mô phỏng.

## Điều khiển

| Thao tác | Tác dụng |
| --- | --- |
| Kéo chuột / mũi tên | Xoay camera quanh tâm bản đồ |
| Lăn chuột / + / − | Thu phóng có giới hạn; camera không chui dưới đất/nước |
| L | Bật/tắt bảy nhãn vùng |
| Mặt Trời 0–100 | Điều chỉnh bốc hơi theo diện tích; 0 tắt tia và ngừng bốc hơi |
| Gió 0–100 | Đẩy hơi nước/mây từ biển vào núi; không đẩy mưa hay runoff |
| Space / nút tạm dừng | Dừng hạt, sóng biển và dải sáng; camera vẫn dùng được |
| 1–4 / nút tốc độ | ×0,5 / ×1 / ×2 / ×4 |
| R / Đặt lại | Khởi tạo lại phân bố nước; giữ seed, số hạt, thanh trượt và camera; về ×1 đang chạy |

Khi focus ở thanh trượt, phím dùng hành vi trình duyệt. HUD hiển thị thời gian, các trạng thái, mực hồ và số lượt về vùng chứa. Mở “Chú giải và mô hình” để đọc đủ năm trạng thái. Thu nhỏ cửa sổ vẫn có thể cuộn cột điều khiển.

## Tham số URL

Ví dụ: <http://localhost:8000/?n=1500&sun=80&wind=40&seed=7&speed=8&paused=1>.

| Tham số | Miền | Mặc định |
| --- | --- | --- |
| `n` | Số nguyên 100–2000 | 1000 |
| `sun`, `wind` | 0–100 | 50, 40 |
| `seed` | Số nguyên | 1 |
| `speed` | 0.5–8 | 1 |
| `paused` | `1` tạm dừng | Đang chạy |

Giá trị sai dùng mặc định, không báo lỗi console. Seed mô phỏng không thay bản đồ. Cùng seed và thao tác cho cùng trạng thái tại cùng số bước.

## Mô hình đơn giản hóa

Hơi nước thật vô hình; đốm trắng rất mờ chỉ giúp theo dõi. Nước thật bay hơi ở mọi nhiệt độ; mô hình phát hạt nóng trên 80 theo nhịp diện tích × Mặt Trời, rồi làm nguội để ngưng tụ. Mây là giọt nước nhỏ đã ngưng tụ, không phải hơi nước. Các con số nhiệt độ không dùng dự đoán thời tiết.

Sông và suối luôn hiện đầy nước dù lượng đang chảy ít hay nhiều. Mực biển coi như không đổi, nhưng vẫn đếm nước để bảo toàn. Không có nước ngầm và cây cối. Hồ/ao có mực theo số hạt, sức chứa co theo tổng hạt. Runoff đi theo các đỉnh lưới xuống thấp nên có thể thấy chuyển động theo nấc.

## Hằng số và dữ liệu

`src/config.js` chứa các hằng số, bảng màu và camera; `src/map-data.js` chứa vùng, đỉnh núi, đường đỉnh, đường suối/sông, nhãn, seed bản đồ và phân bố ban đầu (740 biển, 200 hồ, 60 ao). Dữ liệu đóng băng sâu. Mực hồ/ao = đáy + số hạt × hệ số. Hướng thoát nước D8 khắc kênh và lấp trũng kín ngoài hồ/ao.

Bước thời gian 1/60 giây, mỗi cập nhật kẹp 0,25 giây thực × tốc độ; tab ẩn không bù thời gian. Cụm liên thông trong bán kính 40; 30 giọt hiện mây, 80 bắt đầu mưa, dưới 30 ngừng. Giọt lạnh mưa nhiều hơn; gió giảm về 0 sau đường đỉnh. Hiệu ứng vẽ không dùng RNG mô phỏng.

## Kiểm thử

Node không cần mạng hoặc trình duyệt:

```sh
node --test
```

Bao gồm 10.000 giọt mưa, runoff từ mọi ô trong ≤60 giây, mặc định 600 giây, chín tổ hợp sun × wind trong 300 giây. Thời gian mục tiêu dưới khoảng 5 phút.

E2E cần server trên và Playwright/Chromium cài sẵn trong môi trường kiểm thử, không thêm npm dependency vào dự án:

```sh
node e2e/core-3d.e2e.mjs
node e2e/scenery.e2e.mjs
node e2e/cycle-flow.e2e.mjs
node e2e/scene.e2e.mjs
node e2e/screenshots.e2e.mjs
node e2e/measure-fps.e2e.mjs
```

Script tìm Playwright ở repo hoặc npm toàn cục; hỗ trợ `PLAYWRIGHT_MODULE` trỏ tới index.mjs và `BASE_URL`. Chromium dùng WebGL2 phần mềm, không cần cờ. Luồng ×1 và biến thể ×8 có resize/tạm dừng/xoay camera; lỗi console làm test thất bại. Bốn ảnh lưu ở `specs/REQ-004/screenshots/`. Đo FPS 1000 hạt, ×1, cửa sổ 1280 × 1000 trong 10 giây khi đủ các trạng thái; số đo phần mềm chỉ tham khảo, không có ngưỡng đạt. AC-18 cần người dùng xem cảnh và đo ≥45 FPS trên máy của mình.

`window.__sim` là snapshot chỉ đọc: hạt, cụm, thời gian, số đếm, vùng chứa/mực/cạn, camera, WebGL2, sự kiện dòng chảy, mưa theo vùng, tên đối tượng/nhãn/hiệu ứng cảnh. Không có API sửa mô phỏng.

## Cấu trúc thư mục

- `index.html`, `style.css`: bố cục tiếng Việt.
- `src/main.js`: nối đồng hồ, mô phỏng, renderer, HUD và điều khiển.
- `src/sim/`: logic thuần bản đồ, thoát nước, vùng chứa, nhiệt/không khí/mưa/chảy, camera, URL, RNG, clock và World.
- `src/ui/`: three.js, sa bàn, nhãn, camera chuột/phím, HUD và controls; chỉ lớp này import three.js.
- `vendor/`: three.js ES module, phiên bản và giấy phép MIT.
- `test/`, `test-support/`: kiểm thử Node và trợ giúp; `e2e/`: Chromium.
- `specs/REQ-004/`: đặc tả, kế hoạch, bàn giao, báo cáo và ảnh.
