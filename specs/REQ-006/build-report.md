# REQ-006 — Báo cáo build

## Bước 1 — Địa hình

Dùng **một lớp địa hình**, dùng chung cho mô phỏng và dựng hình. Không đổi quy luật hoặc hằng số vật lý của `World`. Sáu khối núi lệch nhau được kết hợp với ridged noise theo seed bản đồ; đồng bằng có value noise tần số thấp. Khe suối vẫn được khắc bằng `generateDrainage`, sau đó priority-flood giữ mọi ô đất có đường thoát nước. Không cần phương án hai lớp: toàn bộ test mô phỏng hồi quy đã đạt, không cần hiệu chỉnh hằng số.

Đo trên bản đồ mặc định:

| Chỉ số | Giá trị |
|---|---:|
| Độ lệch chuẩn độ dốc vùng núi REQ-004, trước sửa | 0,7658187580460225 |
| Độ lệch chuẩn độ dốc địa hình mới sau thoát nước | 2,1947851036867845 |
| Đỉnh nổi bật, cao hơn mọi mẫu khác trong bán kính 40 ít nhất 15 | 6 |
| Độ cao lớn nhất | 293,9038900452372 |
| Độ lệch chuẩn gợn đồng bằng sau hồi quy mặt phẳng | 1,9804375788621464 |

Mốc cũ được đo bằng sai phân tiến theo hai trục trên `generateHeightmap()` trước thay đổi, seed mặc định 404; lưu thành hằng số trong `test/terrain-art.test.js`. Chỉ số mới đo trên lưới sau khắc khe và thoát nước, là lưới renderer đang sử dụng. Test đồng bằng loại vùng nước, lòng kênh và vùng lân cận hai ô trước khi hồi quy.

Các kiểm thử mới: nhiễu có seed và bị chặn trong [0, 1], sáu đỉnh/độ dốc/độ cao tối đa, gợn đồng bằng. Không sửa kỳ vọng test REQ-004/005.

Kiểm thử bước 1: toàn bộ 51 test hiện có đạt trong 150,274 giây; ba test địa hình mới đạt riêng. `e2e/core-3d.e2e.mjs` và `e2e/scenery.e2e.mjs` đạt. Chu kỳ mặc định đạt bốc hơi 0,05 giây, mây 28,067 giây, mưa 41,367 giây, nước quay về 45,967 giây; hồ không cạn trong 600 giây. Tỷ lệ mưa núi tăng theo Gió (0/40/100): 0, khoảng 94,9%, 100%.

### Thay đổi kiểm thử hồi quy

- `e2e/cycle-flow.e2e.mjs`: trước đây luồng chính chạy Cao ×1, luồng gián đoạn Cao ×8; nay cả hai chạy Thấp ×8 theo quy định cho kiểm thử không đánh giá ảnh. Giữ nguyên kiểm tra mốc thời gian mô phỏng. Lần chạy Cao trước chuyển đổi: luồng chính đạt; luồng gián đoạn lỗi do `quality.slowHint` chuyển từ false sang true trong phép so snapshot khi tạm dừng. Các URL riêng vẫn giữ tốc độ cần kiểm tra và thêm `quality=low`.

Chạy lại `e2e/cycle-flow.e2e.mjs` ở Thấp ×8: cả luồng chính, luồng gián đoạn và các URL đều đạt, console không lỗi.

## Bước 2 — Lưới, màu, ruộng và bọt bờ

Lưới vẽ nội suy từ lưới mô phỏng: Cao 160 × 160 (51.200 tam giác), Thấp 80 × 80 (12.800 tam giác). Chuyển chất lượng chỉ thay geometry, không tạo lại `World`. `terrainSample` tính độ cao, vùng và độ dốc; `terrainColor` chọn màu từ bảng dữ liệu theo thứ tự nước → cát → tuyết → sườn dốc → ruộng → chân núi/đồng bằng. Value noise theo seed riêng chọn hai sắc xanh cho vùng đất thoải. Tuyết là màu trắng ngà ở độ cao từ 230, không có vật lý tuyết.

36 ô ruộng hình chữ nhật đặt bằng RNG riêng của bản đồ; kiểm tra toàn bộ diện tích và vùng đệm 12 đơn vị, loại nước/kênh/cát/dốc. Ruộng chỉ tô màu đỉnh, không thêm mesh. Bọt là một dải mảnh men theo đường giao giữa địa hình và mực biển tìm bằng chia đôi, tránh đặt dưới phần đất bờ. `__sim.scene.fields` cho biết số ô ruộng.

Bốn test mới kiểm màu theo độ cao/độ dốc/nhiễu và vùng nước/cát, ruộng tất định không đè vùng cấm, bọt bám đường mực nước, trạng thái và RNG World giống nhau sau khi tính đồ họa ở hai mức. Ảnh xem thử ở `/tmp/req006-step2.png` chỉ phục vụ rà trong phiên; chưa phải bộ ảnh nghiệm thu bước 9. Cây, nước mới, mặt cắt mới và các hiệu ứng còn lại chưa được thực hiện.

Thay đổi test của bước 2:

- `test/quality.test.js`: trước kiểm `terrainStep=2`, nay kiểm trực tiếp `terrainCells=160/80` vì renderer đã dùng lưới nội suy riêng thay vì bỏ cách đỉnh lưới mô phỏng.
- `e2e/ui-quality.e2e.mjs`: giữ kiểm tỷ lệ tam giác 4:1 và bất biến khi chuyển mức; bổ sung số tam giác chính xác 51.200/12.800, số ruộng không đổi và đối tượng `shore-foam`.

Kiểm thử bước 2: toàn bộ `node --test` đạt **58/58** trong **137,906 giây**. Sau khi thay cấu hình từ `terrainStep` sang `terrainCells`, chạy lại nhóm `test/quality.test.js` + `test/terrain-colors.test.js`: 8/8 đạt. `e2e/ui-quality.e2e.mjs`, `e2e/scenery.e2e.mjs` và `e2e/cycle-flow.e2e.mjs` đều đạt, gồm luồng gián đoạn và URL; console không lỗi. Chưa chạy toàn bộ e2e khác hoặc đánh giá hình ảnh AC-13/AC-15; dành cho các bước 9–10.

## Bước 3 — Mặt nước và lòng dẫn

Thêm module thuần `water-shapes.js`: cắt tam giác mặt nước theo giao tuyến địa hình với mực nước, giới hạn hồ/ao bằng viền có nhiễu góc tất định. Viền co/giãn theo `reservoirs.level`; chỉ dựng lại geometry khi mực nước đổi. Không có thành đứng của hồ/ao. Biển dùng cùng phép cắt theo địa hình, màu chuyển từ nhạt tới đậm theo khoảng cách tới đường bờ thực tế; sóng vẫn chỉ bật ở Cao.

Sông/suối dùng dải rộng dần, bo các góc bậc thang bằng hai lượt corner cutting. Dải nối hồ tới đầu sông nội suy từ mực hồ xuống đầu sông. Lòng dẫn **khi vẽ** được hạ cục bộ để lưới Thấp không che mất nước; đây là chỉnh lòng dẫn đồ họa, không thêm lớp nhiễu địa hình và không thay đổi dữ liệu World, thoát nước hay hằng số vật lý. Các chỉ số núi/đồng bằng của bước 1 tiếp tục đo trên lưới mô phỏng; cần rà lại chỉ số trên bề mặt vẽ cuối cùng ở bước 10 nếu các bước sau còn chỉnh hình dạng. Dải sáng nay nội suy liên tục giữa các ô theo thời gian, thay vì nhảy từng ô.

Ba test mới: mặt nước tất định, khớp mực và nằm trong lòng chảo; kênh rộng dần và lòng dẫn thấp hơn mặt nước; nối hồ tới đúng đầu sông, không sửa mảng độ cao mô phỏng. Toàn bộ `node --test` đạt 61/61 trong 154,702 giây; sau tinh chỉnh bo kênh và giới hạn viền đã chạy lại ba test nước, đều đạt. Không đổi kỳ vọng kiểm thử cũ.

`e2e/scenery.e2e.mjs`, `e2e/core-3d.e2e.mjs`, `e2e/cycle-flow.e2e.mjs` đạt (luồng chính, gián đoạn và URL). Chụp thử bốn góc nhìn Thấp vào `/tmp/req006-water-{overview,sea,mountain,river}.png`, console sạch. Rà ảnh phát hiện kênh bị lưới Thấp che; đã sửa bằng bo kênh và hạ lòng dẫn. Các ảnh tạm không thay bộ ảnh nghiệm thu Cao/Thấp hoặc xác nhận AC-7/AC-13 cuối cùng ở bước 9–10.
