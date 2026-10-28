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

Sa bàn low-poly có mặt tam giác phẳng, mặt cắt bốn lớp cỏ/đất sáng/đất nâu/đá tối, màu pastel: biển xanh ngọc đậm dần ra xa bờ, cát vàng nhạt, đồng bằng xanh tươi, chân núi xanh đậm, sườn nâu, đỉnh trắng ngà. Hồ/ao/suối/sông xanh dương trong mờ; mây trắng chuyển xám khi lớn. Sóng biển và dải sáng dòng chảy chạy theo thời gian mô phỏng.

Địa hình dùng **một lớp**: núi nhiều đỉnh, sống núi và gợn đồng bằng theo seed bản đồ; các kiểm tra thoát nước, nhịp và bảo toàn vẫn đạt mà không đổi hằng số vật lý. Lưới vẽ nội suy cùng địa hình, hạ lòng dẫn khi vẽ để nước không bị che, tạo lòng chảo hồ/ao cố định dùng chung cho mặt đất và đường bờ đổi theo mực nước. Phần chỉnh mặt vẽ này không đổi địa hình thoát nước hoặc lượng nước của mô phỏng. Rừng thông low-poly đặt thành cụm tất định bằng seed trang trí riêng, dày ở chân núi, thưa trên đồng bằng; ô ruộng chỉ tô màu mặt đất thoải. Hồ/ao có viền tự nhiên cắt theo lòng chảo, sông nối ra biển. Mây bông nhiều khối có màn mưa, Mặt Trời có quầng và chùm sáng ngắn xuống nước đang bốc hơi. Bảng màu có tên trong `config.colors`, ngưỡng trong `config.art`.

## Điều khiển

| Thao tác | Tác dụng |
| --- | --- |
| Kéo chuột / mũi tên | Xoay camera quanh tâm bản đồ |
| Lăn chuột / + / − | Thu phóng có giới hạn; camera không chui dưới đất/nước |
| L | Bật/tắt bảy nhãn vùng |
| N | Bật/tắt bốn nhãn giai đoạn và mũi tên gió |
| Bấm nhãn vùng/giai đoạn | Camera lượn tới vị trí nhãn lúc bấm |
| Mặt Trời 0–100 | Điều chỉnh bốc hơi theo diện tích; 0 tắt tia và ngừng bốc hơi |
| Gió 0–100 | Đẩy hơi nước/mây từ biển vào núi; không đẩy mưa hay runoff |
| Space / nút tạm dừng | Dừng hạt, sóng biển và dải sáng; camera vẫn dùng được |
| 1–4 / nút tốc độ | ×0,5 / ×1 / ×2 / ×4 |
| R / Đặt lại | Khởi tạo lại phân bố nước; giữ seed, số hạt, thanh trượt và camera; về ×1 đang chạy |

Cảnh chiếm toàn cửa sổ; bảng trong mờ bên phải rộng tối đa 30%, cuộn bên trong khi thiếu chiều cao. Nút thu gọn hoặc phím B giấu/mở bảng. Ba nhóm Điều khiển, Số liệu và Chú giải gập/mở được, nhớ trạng thái trong phiên. Tab chuyển focus, Enter kích hoạt nút/nhóm; Space tạm dừng/tiếp tục kể cả khi focus ở nút. Khi focus ở thanh trượt, phím dùng hành vi trình duyệt.

“Về mặc định” chỉ đưa Mặt Trời/Gió về 50/40, giữ mô phỏng. Bốn góc nhìn Toàn cảnh (`overview`), Từ biển nhìn vào núi (`sea`), Cận cảnh núi (`mountain`), Dọc sông (`river`) chuyển mượt trong một giây, kể cả khi tạm dừng. Kéo chuột, lăn chuột hoặc phím camera ngắt chuyển ngay; “Góc nhìn mặc định” về toàn cảnh.

Chất lượng Cao có lưới 160 × 160, 2.200 cây, bóng mềm, sóng và mây 5–12 khối; Thấp dùng lưới 80 × 80, 400 cây, bỏ bóng/sóng, mây 5–7 khối và giảm tỷ lệ điểm ảnh. Ngân sách mỗi khung: Cao ≤ 150 draw call / 400.000 tam giác; Thấp ≤ 80 / 150.000, đo bằng `renderer.info` khi đủ bốn giai đoạn. Đổi mức giữ mô phỏng và camera. Nếu Cao chạy dưới 30 FPS trong năm giây liên tiếp, gợi ý chuyển Thấp hiện lên; có thể đóng, không tự đổi mức.

Nhóm Số liệu có thời gian, thanh “Nước đang ở đâu” (sáu đoạn cộng đúng 100%), cột Hồ và ao có vạch ban đầu/mũi tên xu hướng 10 giây, “Mưa rơi ở đâu” (năm vùng, số giọt và phần trăm), và bốn giai đoạn “Đang diễn ra”: **Bốc hơi, Ngưng tụ, Mưa, Dòng chảy**. Các nhãn giai đoạn trong cảnh có số 1–4, bám hoạt động thật và dùng cùng màu với thẻ/chú giải. Phím N hoặc nút “Nhãn giai đoạn” bật tắt riêng với nhãn bản đồ (L). “Xóa bộ đếm” chỉ xóa mốc đếm mưa, không đổi hạt hay thời gian; Đặt lại cũng xóa bộ đếm. Chú giải giải thích năm loại hạt và bảy vùng.

Mũi tên “Gió đưa mây vào đất liền” cong từ biển về núi, dài và đậm hơn khi tăng Gió, ẩn khi Gió 0. Nhãn chỉ hiện khi có hoạt động; Bốc hơi và Dòng chảy dùng cửa sổ 10 giây, Ngưng tụ theo mây chưa mưa lớn nhất, Mưa theo mây đang mưa lớn nhất, có trễ và làm trơn vị trí. Bấm nhãn lượn tới, xoay/thu phóng ngắt ngay.

Để thử đồ họa: mở mặc định ×1, quan sát 120 giây; đổi bốn góc nhìn, bấm nhãn, thử N/L, tạm dừng và chuyển Cao/Thấp. Đưa Gió về 0 để thấy mưa và nhãn Mưa trên biển.

Để thử thí nghiệm: đặt Gió 0, xóa bộ đếm, chờ khoảng 60 giây mô phỏng và đọc tỷ lệ mưa Biển/Núi. Đặt Gió 100, xóa bộ đếm, chờ thêm 60 giây và so tỷ lệ Núi. Có thể tạm dừng để đọc số.

## Tham số URL

Ví dụ: <http://localhost:8000/?n=1500&sun=80&wind=40&seed=7&speed=8&paused=1>.

| Tham số | Miền | Mặc định |
| --- | --- | --- |
| `n` | Số nguyên 100–2000 | 1000 |
| `sun`, `wind` | 0–100 | 50, 40 |
| `seed` | Số nguyên | 1 |
| `speed` | 0.5–8 | 1 |
| `paused` | `1` tạm dừng | Đang chạy |
| `view` | `overview`, `sea`, `mountain`, `river` | `overview` |
| `quality` | `high`, `low` | `high` |

Giá trị sai dùng mặc định, không báo lỗi console. Seed mô phỏng không thay bản đồ. Cùng seed và thao tác cho cùng trạng thái tại cùng số bước.

## Mô hình đơn giản hóa

Hơi nước thật vô hình; đốm trắng rất mờ chỉ giúp theo dõi. Nước thật bay hơi ở mọi nhiệt độ; mô hình phát hạt nóng trên 80 theo nhịp diện tích × Mặt Trời, rồi làm nguội để ngưng tụ. Mây là giọt nước nhỏ đã ngưng tụ, không phải hơi nước. Các con số nhiệt độ không dùng dự đoán thời tiết.

Sông và suối luôn hiện đầy nước dù lượng đang chảy ít hay nhiều. Mực biển coi như không đổi, nhưng vẫn đếm nước để bảo toàn. Không có nước ngầm. Màu trắng ở đỉnh núi chỉ là màu, không có tuyết rơi hay tan. Cây chỉ để trang trí; thực tế cây cũng đưa hơi nước vào không khí qua thoát hơi nước. Hồ/ao có mực theo số hạt, sức chứa co theo tổng hạt. Runoff đi theo các đỉnh lưới xuống thấp nên có thể thấy chuyển động theo nấc.

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
node e2e/ui-flow.e2e.mjs
node e2e/ui-panel.e2e.mjs
node e2e/ui-quality.e2e.mjs
node e2e/ui-controls.e2e.mjs
node e2e/ui-statistics.e2e.mjs
node e2e/ui-views.e2e.mjs
node e2e/panel-foundation.e2e.mjs
node e2e/ui-screenshots.e2e.mjs
node e2e/art-flow.e2e.mjs
node e2e/art-labels.e2e.mjs
node e2e/art-budget.e2e.mjs
node e2e/art-screenshots.e2e.mjs
node e2e/measure-fps.e2e.mjs
```

Script tìm Playwright ở repo hoặc npm toàn cục; hỗ trợ `PLAYWRIGHT_MODULE` trỏ tới index.mjs và `BASE_URL`. Chromium dùng WebGL2 phần mềm, không cần cờ. Luồng ×1 và biến thể ×8 có resize/tạm dừng/xoay camera; lỗi console làm test thất bại. Bốn ảnh lưu ở `specs/REQ-004/screenshots/`. Tám ảnh giao diện mới lưu ở `specs/REQ-005/screenshots/`. Đo FPS cả Cao và Thấp, bảng mở, 1000 hạt, ×1, cửa sổ 1280 × 1000 trong 10 giây khi đủ các trạng thái; số đo phần mềm chỉ tham khảo, không có ngưỡng đạt. AC-12 của REQ-005 cần người dùng xem cảnh và đo ≥45 FPS trên máy của mình.

`window.__sim` là snapshot chỉ đọc: hạt, cụm, thời gian, số đếm, vùng chứa/mực/cạn, camera, WebGL2, sự kiện dòng chảy, mưa theo vùng, tên đối tượng/nhãn/hiệu ứng cảnh. Thêm `rainTally`, `waterDistribution`, `view` (hoặc `free`), `quality` và `panel`. Không có API sửa mô phỏng.

## Cấu trúc thư mục

- `index.html`, `style.css`: bố cục tiếng Việt.
- `src/content.js`: mọi chữ hiển thị tiếng Việt; `src/quality.js`: mức vẽ và gợi ý FPS.
- `src/stats/`: phân bố, mưa, xu hướng mực và giai đoạn, logic thuần.
- `src/ui/theme.css`: biến màu, font, khoảng cách; `src/ui/statistics.js`: thẻ số liệu.
- `src/main.js`: nối đồng hồ, mô phỏng, renderer, HUD và điều khiển.
- `src/sim/`: logic thuần bản đồ, thoát nước, vùng chứa, nhiệt/không khí/mưa/chảy, camera, URL, RNG, clock và World.
- `src/ui/`: three.js, sa bàn, nhãn, camera chuột/phím, HUD và controls; chỉ lớp này import three.js.
- `vendor/`: three.js ES module, phiên bản và giấy phép MIT.
- `test/`, `test-support/`: kiểm thử Node và trợ giúp; `e2e/`: Chromium.
- `specs/REQ-004/`: đặc tả, kế hoạch, bàn giao, báo cáo và ảnh.
- `specs/REQ-005/`: đặc tả giao diện, kế hoạch, bàn giao, báo cáo và tám ảnh.

Ảnh REQ-006: `specs/REQ-006/screenshots/` (chín ảnh và evidence.json). Kịch bản không kiểm ảnh ưu tiên Thấp ×8; kiểm mặc định, URL tốc độ và chuyển chất lượng vẫn giữ trường hợp riêng. `scene.renderInfo` chứa calls/triangles, `scene.sunScreen` là tọa độ chiếu chuẩn hóa để kiểm Mặt Trời; scene còn có trees, cloudBlocks, rainStreaks, stageLabels và windArrow. FPS phần mềm chỉ tham khảo; AC-15 của REQ-006 cần kiểm đẹp/mượt và ≥45 FPS trên máy người dùng.
