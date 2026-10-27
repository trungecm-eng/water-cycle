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

## Bước 3: thẻ số liệu và chú giải

Đã nối các module thuần qua `src/ui/statistics.js`: phân bố sáu đoạn cùng số hạt/phần trăm, cột mực hồ/ao có vạch ban đầu và xu hướng, năm bộ đếm mưa cùng nút xóa độc lập, bốn giai đoạn sáng theo trạng thái hạt. Chú giải có mô tả năm loại hạt và màu bảy vùng. Giữ toàn bộ `data-hud` cũ; dòng giai đoạn cũ ẩn vì đã có thẻ riêng. `__sim.rainTally` và `__sim.waterDistribution` là bản chụp đóng băng cả các trường con. Không sửa World hoặc kịch bản cũ ở bước này.

Xu hướng lấy mẫu sau mỗi bước cố định của Clock; thao tác đặt lại lấy mẫu ngay trước khung hình tiếp theo để vạch ban đầu đúng ngay cả khi không tạm dừng. Xóa mưa chỉ đổi mốc trong RainTally.

Kiểm tra: `node --test` đạt 44/44 trong 159,89 giây; `ui-statistics`, `panel-foundation`, `core-3d` đạt. Kịch bản số liệu kiểm số hàng, tổng phân bố, chú giải, xóa khi tạm dừng không đổi thời gian/hạt, phân bố đổi khi chạy và đặt lại xóa mưa. `git diff --check` đạt. Chưa thực hiện nghiệm thu toàn bộ, ảnh và FPS của bước 8.

`node e2e/cycle-flow.e2e.mjs` cũng đạt cả luồng mặc định ×1, luồng gián đoạn và các trường hợp URL; không thay selector hay giảm điều kiện kiểm tra.

## Bước 4: điều khiển thí nghiệm

Hàng thời gian đặt trước hai thanh trượt; giữ id và nút tốc độ chọn một bằng `aria-pressed`. Hai thanh có SVG nội tuyến, giá trị, mô tả hai đầu liên kết bằng `aria-describedby`. Nút “Về mặc định” chỉ đưa nắng/gió về `config.defaults`, đồng bộ thanh và output; không gọi reset World hay Clock. Nút “Nhãn bản đồ” dùng chung trạng thái với phím L, có `aria-pressed`.

Space trên mọi nút nay thực hiện phím tắt tạm dừng/tiếp tục như AC-7; chặn kích hoạt mặc định của Space để tránh thao tác hai lần. Enter vẫn kích hoạt nút đang focus. Phím tắt tiếp tục bỏ qua thanh trượt. Không sửa selector hoặc nới điều kiện của kịch bản cũ trong bước này.

`e2e/ui-controls.e2e.mjs` kiểm giữ nguyên thời gian/hạt/bộ đếm/camera/tốc độ khi về mặc định, đổi slider cập nhật World và output, Enter, tốc độ chọn một, nút nhãn/phím L, Space khi focus nút và bỏ qua shortcut trên thanh trượt.

Kiểm tra bước 4: `node --test` đạt 44/44 trong 127,824 giây; `ui-controls`, `core-3d`, `panel-foundation`, `ui-statistics`, `scenery`, `scene` đều đạt, console không lỗi. `git diff --check` đạt. Bước 5–8 còn lại, chưa nghiệm thu toàn REQ-005.

## Bước 5: góc nhìn sẵn

Bốn góc nhìn đọc từ map-data.js; Camera có target riêng và giữ phép kẹp mắt an toàn. ViewTransition chuyển 1 giây thực, smoothstep, chọn đường phương vị ngắn nhất; nhận chọn tiếp giữa chừng và ngắt không nhảy khi chuột/bàn phím camera thao tác. URL view sai về overview; __sim.view có trạng thái free. Giao diện có bốn nút chọn một, nút mặc định và tên góc nhìn hiện tại. Không đổi mô phỏng hoặc test cũ.

Kiểm tra: node --test đạt 47/47 trong 127,131 giây. Test mới kiểm 16 cặp đường chuyển với 1.001 mẫu/cặp, giới hạn, mặt đất/mặt nước, kết thúc đúng 1 giây, ngắt, chọn tiếp, đường góc ngắn và URL. ui-views, core-3d, ui-controls, panel-foundation đều đạt; console không lỗi. git diff --check đạt. Bước 6–8 chưa thực hiện.

## Bước 6: chất lượng đồ họa

Đã thêm `src/quality.js`: đọc URL độc lập World, hai bộ thông số bất biến trong config, đo FPS theo các cửa sổ một giây liên tiếp ở mức Cao. Năm giây liên tiếp dưới 30 FPS hiện gợi ý; đúng 30 không hiện. Tab ẩn, đổi mức hay đóng gợi ý xóa cửa sổ; đóng rồi không hiện lại trong phiên trang. Gợi ý có nút chuyển Thấp và nút đóng, không tự đổi mức.

Cao vẽ 18.432 tam giác địa hình, sóng biển, bóng Mặt Trời trên địa hình và mây, tối đa 9 khối/cụm. Thấp vẽ 4.608 tam giác (lấy mỗi đỉnh thứ hai), ẩn sóng, tắt bóng, tối đa 4 khối/cụm và pixel ratio tối đa 1. Đổi mức tại chỗ, không sửa World, camera hay quy luật. `__sim.quality` và `__sim.scene` cho phép đọc mức, gợi ý, số tam giác, bóng, pixel ratio và hiệu ứng. Không sửa hoặc nới kiểm tra e2e cũ trong bước này.

Test mới `test/quality.test.js` kiểm URL, FPS giả lập (20/30/60), ngắt chuỗi, tab ẩn, đóng vĩnh viễn, đổi mức và hai World cùng seed/cùng bước. `e2e/ui-quality.e2e.mjs` kiểm đổi mức thật, số tam giác, sóng, bóng, pixel ratio, giữ nguyên hạt/thời gian/camera/phân bố khi tạm dừng, URL low/ultra và console. File này được làm ngay ở bước 6 để kiểm lớp vẽ; bước 7 tiếp tục các kịch bản còn lại.

Kiểm tra bước 6: `node --test` đạt 51/51 trong 143,257 giây. Sau khi gom hằng số đồ họa vào config và thêm kiểm ngưỡng đúng 30 FPS, chạy lại `node --test test/quality.test.js` đạt 4/4 và `ui-quality` đạt. Các e2e `core-3d`, `scenery`, `scene`, `ui-views`, `ui-controls`, `panel-foundation` đều đạt, console không lỗi. `git diff --check` đạt. Chưa có ảnh và số đo FPS REQ-005, chưa nghiệm thu bước 7–8 hoặc AC-12.
