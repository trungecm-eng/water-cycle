# Vòng tuần hoàn nước

Mô phỏng bằng hạt dành cho học sinh cấp 2: nước trong hồ nhận nhiệt, bốc hơi, ngưng tụ thành giọt mây, mưa rơi và chảy về hồ. Tổng lượng nước được giữ nguyên. Đây là mô hình đơn giản hóa, nhiệt độ dùng thang 0–100 của mô hình.

## Chạy trên máy

Không cần cài thư viện, CDN hoặc build. Tại gốc repo:

```sh
python3 -m http.server 8000
```

Mở <http://localhost:8000> trong trình duyệt máy tính, cửa sổ rộng từ 1024 px. Giữ tốc độ ×1 để quan sát; với mặc định, vòng đầu hoàn tất trong 120 giây và tiếp tục lặp lại.

## Điều khiển

| Điều khiển | Tác dụng |
| --- | --- |
| Nhiệt độ Mặt Trời, 0–100 | Điều chỉnh nhịp tia nhiệt; 0 ngừng tia và bốc hơi mới. Hạt trên không vẫn tiếp tục vòng. |
| Gió, 0–100 | Thổi hơi nước và giọt mây sang trái, từ hồ về phía núi; không tác động mưa và dòng chảy. |
| Tạm dừng / Tiếp tục, Space | Dừng mọi bước mô phỏng; tiếp tục không bù thời gian dừng. |
| ×0,5 / ×1 / ×2 / ×4, phím 1–4 | Đổi tốc độ; không đổi vị trí tức thời. |
| Đặt lại, R | Giữ số hạt, seed và hai thanh trượt; khởi tạo nước trong hồ, về ×1, đang chạy. |

Khi focus đang ở thanh trượt, bàn phím điều khiển thanh theo hành vi trình duyệt; bấm ra ngoài để dùng phím tắt. Khi tab bị ẩn, quay lại không bù thời gian đã ẩn. HUD hiện thời gian, tốc độ, trạng thái chạy, số hạt từng trạng thái, mực nước, số lần về hồ và giá trị thanh. “Đang diễn ra” dựa trên sự hiện diện của vapor/cloud/rain/runoff tương ứng bốn giai đoạn.

## Tham số URL

Ví dụ: <http://localhost:8000/?n=300&sun=80&wind=0&seed=7&speed=8&paused=1>.

| Tham số | Miền hợp lệ | Mặc định |
| --- | --- | --- |
| `n` | Số nguyên 100–1200 | 600 |
| `sun` | 0–100 | 50 |
| `wind` | 0–100 | 40 |
| `seed` | Số nguyên | 1 |
| `speed` | 0,5–8 (viết dấu chấm trong URL, ví dụ `0.5`) | 1 |
| `paused` | `1` để tạm dừng lúc mở | Đang chạy |

Giá trị sai hoặc ngoài miền được bỏ qua, dùng mặc định. Seed và chuỗi thao tác giống nhau cho cùng trạng thái ở cùng số bước.

## Hạt và ý nghĩa

| Trạng thái | Hiển thị | Ý nghĩa |
| --- | --- | --- |
| `water` | Xanh dương | Nước nằm yên trong các ô hồ; chỉ hạt mặt nước nhận tia nhiệt. |
| `vapor` | Trắng rất mờ | Hơi nước bay lên và nguội dần. Hơi nước thật không nhìn thấy được; ở đây vẽ mờ để theo dõi. |
| `cloud` | Chấm trắng rõ, cụm có vùng trắng mờ | Những giọt nước rất nhỏ đã ngưng tụ khi hơi nước gặp lạnh. |
| `rain` | Xanh dương đậm | Mưa rơi thẳng đứng do trọng lực. |
| `runoff` | Xanh dương đậm trên mặt đất | Nước chảy xuôi sườn sang phải về hồ. |

Mực hồ là `60 + số hạt water × 0,1` đơn vị. Nước về hồ lấp ô trống thấp nhất, ưu tiên cột gần nơi vào. Nhiệt độ, độ cao và thời gian là các đại lượng đơn giản hóa của mô hình; không dùng để dự đoán thời tiết thực tế.

## Hằng số

Mọi dữ liệu mô phỏng và màu hạt ở `src/config.js`, đóng băng sâu để tránh thay đổi ngoài ý muốn.

| Nhóm | Ý nghĩa và các giá trị chính |
| --- | --- |
| `world`, `terrain` | Thế giới 1000 × 600, gốc dưới trái; núi trái dốc tới rìa hồ x=640; đáy hồ y=60. |
| `lake` | Ô cạnh 6, 60 cột × 20 hàng; mỗi hạt tăng mức nước 0,1. |
| `defaults`, `limits` | Mặc định và miền hợp lệ của tham số. |
| `clock` | Bước cố định 1/60 giây; mỗi frame nhận tối đa 0,25 giây thực nhân tốc độ. |
| `heat` | Nền hồ 20; chỉ vượt 80 mới bốc hơi; ngưng tụ khi ≤20; môi trường `max(0, 30 − 0,09 × (y − 60))`; nhịp tối đa 30 tia/giây, nhiệt mỗi tia 35. |
| `motion` | Lực nổi, gió, trôi mây, trọng lực, giới hạn tốc độ mưa và tốc độ chảy; runoff 24 đơn vị/giây. |
| `cloud` | Bán kính liên thông 40; từ 30 giọt vẽ đám mây; từ 80 bắt đầu mưa, tiếp tục tới dưới 30; xác suất mưa dùng nhịp 0,15/giây. |
| `sun`, `visual`, `colors` | Vị trí Mặt Trời, kích thước hạt/tia, độ mờ, độ rung và bảng màu. |

Cụm không được bổ sung dừng mưa khi còn dưới 30 giọt theo quy tắc trễ. Các giọt mây còn lại chờ cụm được bổ sung để mưa tiếp.

## Kiểm thử

Logic chạy với Node 24, không cần mạng hoặc trình duyệt:

```sh
node --test
```

Có các kiểm tra từng giai đoạn, 10.000 giọt mưa, nhịp vòng và lưới chín tổ hợp sun × wind trong 600 giây mô phỏng. Bộ test mất khoảng hai phút trên máy phát triển; không đặt điều kiện thời gian chạy máy.

E2E cần Playwright và Chromium có sẵn trên máy kiểm thử, cùng server ở trên; không thêm dependency vào `package.json`:

```sh
node e2e/cycle-flow.e2e.mjs
node e2e/measure-fps.e2e.mjs
```

Script tìm Playwright ở repo hoặc thư mục npm toàn cục. Có thể truyền `PLAYWRIGHT_MODULE` là đường dẫn module (`index.mjs`), và `BASE_URL` để đổi địa chỉ server. Không cần cài gì khi môi trường đã có công cụ.

E2E chạy vòng mặc định ở ×1, biến thể ×8 bị resize và tạm dừng nhiều lần, điều khiển bằng chuột/phím, đặt lại, URL và snapshot chỉ đọc; lỗi console làm test thất bại. Công cụ FPS chờ đủ cả năm trạng thái, giữ 600 hạt/×1 ở Chromium 1280 × 1000 rồi đếm `requestAnimationFrame` trong ít nhất 10 giây, yêu cầu trung bình ≥45 FPS và in JSON số đo. Đo lại trên máy QA vì kết quả phụ thuộc môi trường.

`window.__sim` là getter trả bản sao đóng băng sâu, gồm thời gian, đếm trạng thái, mức hồ, số lần bốc hơi/về hồ, sun/wind, cụm mây (id giọt, số giọt, cờ hiển thị/mưa), hạt, tốc độ và tạm dừng. Không có API để sửa trạng thái qua cửa này.

Người kiểm tay cần quan sát ×1: nhận ra núi/hồ/Mặt Trời và năm loại hạt bằng chú giải; thấy vòng trọn, tác dụng hai thanh trượt, chuyển động mượt và chữ đọc được. E2E không thay thế đánh giá khả năng hiểu của học sinh.

## Cấu trúc

- `index.html`, `style.css`: trang và bố cục tiếng Việt.
- `src/main.js`: nối đồng hồ, mô phỏng, Canvas, giao diện và cửa kiểm thử.
- `src/config.js`: dữ liệu và hằng số chung.
- `src/sim/`: logic thuần (hồ, nhiệt, không khí, cụm, mưa/chảy, địa hình, RNG, clock, URL, World), không dùng DOM/Canvas.
- `src/ui/`: vẽ Canvas, controls và HUD.
- `test/`: test Node; `e2e/`: kịch bản Chromium và đo FPS, không nằm trong tập test Node mặc định.
- `specs/REQ-001/`: yêu cầu, đặc tả, kế hoạch và nhật ký bàn giao.
