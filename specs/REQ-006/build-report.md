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
