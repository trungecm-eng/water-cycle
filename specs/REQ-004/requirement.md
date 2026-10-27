# REQ-004: Vòng tuần hoàn nước — thế giới 3D sa bàn, bản đồ đầy đủ, mưa ở sườn núi

**Làm sau khi REQ-001 đã vào `main`** (đã xong). Sửa trên codebase của REQ-001.

REQ-002 và REQ-003 cũ được viết cho thế giới 2D và đã dừng. Phần còn giá trị của chúng chia lại như sau:
- **REQ-004 (này):** thế giới 3D, bản đồ, đường đi của nước, mây trượt lên sườn núi, đồ họa theo phong cách sa bàn.
- **REQ-005:** giao diện và trải nghiệm, gồm bảng điều khiển, góc nhìn sẵn, mức chất lượng, các thẻ số liệu và bộ đếm mưa theo vùng.
- REQ sau nữa: theo dõi một giọt nước, phần giải thích và gợi ý thí nghiệm.

## Bối cảnh và mục tiêu
REQ-001 cho vòng tuần hoàn nước chạy đúng: bảo toàn, tự cân bằng, đủ bốn giai đoạn. Nhưng nó là một lát cắt 2D (một sườn núi, một hồ), và đồ họa quá đơn sơ để học sinh muốn xem.

Yêu cầu này giữ **quy luật** của REQ-001 và thay **thế giới** và **đồ họa**, để học sinh nhìn thấy trọn câu chuyện của nước trên một bản đồ quen thuộc: **nước bốc hơi chủ yếu từ biển → gió đưa hơi ẩm vào đất liền → mây bị núi đẩy lên cao, lạnh đi và mưa → nước chảy theo suối về hồ, ra sông và về lại biển; một phần đọng ở ao.**

Người dùng vẫn là **học sinh cấp 2 tự khám phá trên máy tính của mình**, dùng chuột và bàn phím, chạy bằng server local. Sản phẩm không phát hành công khai. Ba điều cơ bản của REQ-001 vẫn giữ: hơi nước vô hình (chỉ vẽ mờ, có chú thích), mây là giọt nước nhỏ đã ngưng tụ, và tổng lượng nước không đổi.

## Phạm vi

### Phong cách đồ họa: sa bàn low-poly
Toàn bộ cảnh theo **một** phong cách, để "đẹp" có nghĩa cụ thể:
- **Sa bàn:** bản đồ là một khối đất vuông nổi giữa nền trời. Bốn mặt cạnh của khối lộ các lớp đất (đất nâu, đá xám) như một mô hình cắt ra. Phía biển, cạnh khối thấy được lớp nước trong.
- **Low-poly:** các mặt tam giác phẳng (flat shading), được chiếu sáng theo hướng Mặt Trời, không dùng texture. Đường nét gọn, không lởm chởm.
- **Bảng màu dịu (pastel), cố định trong file dữ liệu:**

| Thành phần | Màu |
|---|---|
| Biển | xanh ngọc, đậm dần ra xa bờ |
| Bờ biển | cát vàng nhạt |
| Đồng bằng | xanh lá tươi |
| Chân núi | xanh lá đậm |
| Sườn núi | nâu |
| Đỉnh núi | xám đá (không có tuyết, vì băng tuyết ngoài phạm vi) |
| Sông, suối, hồ, ao | xanh dương sáng, trong mờ |
| Bầu trời | chuyển từ xanh nhạt ở chân trời lên xanh hơn ở trên cao |

- **Nước:**
  - mặt nước phẳng, trong mờ, hơi bóng;
  - biển có gợn sóng low-poly chuyển động chậm;
  - sông và suối có dải sáng trôi về hạ lưu để thấy chiều chảy.

  Các hiệu ứng nước chỉ để nhìn, chạy theo thời gian mô phỏng, nên dừng theo khi tạm dừng.
- **Mây:**
  - mỗi cụm từ `cloudMinSize` giọt trở lên được vẽ thành **khối mây low-poly mềm**, gồm vài khối tròn chồng lên nhau quanh cụm;
  - mây trắng ở cụm nhỏ, xám dần khi cụm lớn tới `rainStartSize`;
  - giọt mây lẻ là chấm trắng nhỏ.
- **Hạt:**
  - `vapor` là đốm trắng rất mờ;
  - `rain` là vệt ngắn màu xanh đậm;
  - `runoff` là giọt xanh sáng chạy trên mặt đất và theo suối, sông.
- **Ánh sáng:** một nguồn sáng hướng (Mặt Trời) cộng ánh sáng môi trường dịu, có bóng nhẹ của núi nếu chạy đủ mượt. Độ sáng của cảnh tăng nhẹ theo thanh Mặt Trời. Có sương mờ nhẹ ở xa để tạo chiều sâu.
- **Nhãn 3D** cho các vùng: Núi, Đồng bằng, Suối, Sông, Hồ, Ao, Biển. Nhãn có nền bo góc, luôn quay về camera, đọc được, không che nhau ở góc nhìn mặc định. Bật và tắt bằng phím L.

### Thế giới và bản đồ
- Mặt bằng **1000 × 1000 đơn vị** (x từ tây sang đông, z từ nam lên bắc), y hướng lên. **Mực nước biển ở y = 0**, đỉnh núi cao nhất khoảng 300.
- **Địa hình là một lưới độ cao** (gợi ý 96 × 96 ô, đủ để trông low-poly), sinh bằng code từ **mô tả bản đồ trong file dữ liệu**: vị trí, kích thước và độ cao của từng vùng, đường đi của sông và suối. Nhiễu dùng một seed riêng của bản đồ. Cùng mô tả thì cùng địa hình; seed mô phỏng (`?seed=`) không đổi địa hình.
- **Bố cục** (gợi ý; PM được chỉnh, miễn giữ đúng quan hệ giữa các vùng):

| Vùng | Vị trí và đặc điểm |
|---|---|
| **Biển** | dải phía đông (khoảng x > 750), bờ cong tự nhiên, có bãi cát |
| **Đồng bằng** | giữa núi và biển, thấp (y khoảng 5 đến 30), dốc rất thoải về phía biển |
| **Núi** | dải phía tây (khoảng x < 300), một đỉnh cao nhất và vài đỉnh phụ, sườn dốc **quay về phía biển** (sườn đón gió) |
| **Suối** | ít nhất ba suối bắt nguồn trên núi, chảy theo khe núi |
| **Hồ** | ở chân núi, nhận nước từ ít nhất một suối, có một **cửa thoát** ra sông |
| **Sông** | bắt đầu từ cửa thoát của hồ, nhận thêm ít nhất một suối, uốn khúc qua đồng bằng và đổ ra biển ở **cửa sông** |
| **Ao** | nhỏ, trên đồng bằng, chỉ nhận nước mưa trên vùng trũng quanh nó |

- **Thoát nước:** mỗi ô đất có một **hướng chảy** về một ô thấp hơn bên cạnh, tính từ lưới độ cao. Mọi ô đất đều thoát về một vùng nước (biển, hồ, ao, hoặc suối và sông rồi tới đó), **không có vùng trũng kín** nào ngoài hồ và ao.

### Nước trong các vùng nước
- Biển, hồ và ao là **vùng chứa**. Hạt `water` trong vùng chứa không vẽ từng hạt: vùng chứa vẽ thành mặt nước và đếm số hạt của nó.
- **Hồ và ao có mực nước** thay đổi theo số hạt (gợi ý `mực = đáy + số hạt × hệ số`), nhìn thấy được. Mỗi vùng có một **sức chứa**.
  - Hồ đầy thì phần vượt chảy ra cửa thoát xuống sông.
  - Ao đầy thì phần vượt chảy theo hướng chảy của ô tại mép ao.
- **Ao được phép cạn.** Khi cạn, đáy ao lộ ra (màu bùn), và nhãn Ao đổi thành "Ao (đã cạn)". Đây là điều học sinh nên thấy: ao cạn khi ít mưa.
- **Biển rất lớn:** mực nước biển trên màn hình coi như không đổi, nhưng biển vẫn đếm số hạt để bảo toàn.
- **Số hạt mặc định 1000**, miền 100 đến 2000. Phân bố ban đầu nằm trong file dữ liệu (gợi ý với 1000 hạt: biển 740, hồ 200 với sức chứa 320, ao 60 với sức chứa 120). Các ngưỡng `cloudMinSize` và `rainStartSize` được chỉnh theo số hạt mới.

### Bốn giai đoạn trong thế giới 3D
Các trạng thái hạt, ngưỡng nhiệt, ngưng tụ do nhiệt độ, cụm mây, ngưỡng mưa có trễ, mưa dần và bảo toàn **giữ như REQ-001**. Những chỗ dưới đây đổi theo thế giới mới:

1. **Bốc hơi:**
   - Mỗi vùng chứa bốc hơi theo **diện tích mặt nước × nhiệt độ Mặt Trời**, tất định theo seed. Biển là nguồn lớn nhất.
   - Hạt bốc hơi xuất hiện tại một điểm ngẫu nhiên (có seed) trên mặt nước của vùng đó, nhiệt độ trên 80, rồi bay lên.
   - Vùng chứa hết hạt thì ngừng bốc hơi. Suối và sông không bốc hơi.
   - Tia nắng vẫn được vẽ chiếu xuống mặt nước, và tắt khi thanh Mặt Trời ở 0.
   - Quy tắc "tia làm nóng hạt mặt nước của một cột" của REQ-001 bị thay bằng quy tắc này.
2. **Ngưng tụ:**
   - `T_env` giảm theo độ cao tính từ mực nước biển.
   - Hạt `vapor` nguội tới `condenseTemp` thì thành `cloud`.
   - Cụm mây dùng khoảng cách 3D.
3. **Mưa:**
   - Ngưỡng và trễ như REQ-001.
   - Xác suất mưa mỗi bước của một giọt bằng `p0 × f(T)`, trong đó `f(condenseTemp) = 1`, `f` tăng khi giọt lạnh hơn, và `f(0)` khoảng 3. Như vậy mây càng bị đẩy lên cao thì càng mưa nhiều.
   - Hạt `rain` rơi thẳng đứng theo trục y; gió không tác động lên nó.
4. **Chảy về vùng chứa:**
   - Hạt `rain` chạm đất thì thành `runoff`; chạm mặt biển, hồ hay ao thì vào vùng đó thành `water`.
   - Hạt `runoff` đi theo **hướng chảy** của ô: chỗ dốc chảy nhanh, đồng bằng chậm nhưng không đứng yên. Vào ô suối hay sông thì theo dòng tới hồ hay biển.
   - Hạt `runoff` luôn nằm trên mặt địa hình (hay mặt nước suối, sông) và không bao giờ đi lên cao hơn.
   - **Từ bất kỳ ô đất nào, hạt tới một vùng chứa trong tối đa 60 giây.**

### Gió và mưa ở sườn núi
- Gió thổi **từ biển vào đất liền** (từ đông sang tây), độ mạnh theo thanh trượt như REQ-001. Gió chỉ tác động `vapor` và `cloud`.
- **Mây trượt lên sườn núi:** hạt `vapor` hay `cloud` bị gió đẩy vào sườn núi thì trượt **lên theo sườn**, thay vì dừng lại. Lên cao thì nguội thêm theo `T_env`, nên ngưng tụ sớm hơn và mưa nhiều hơn. Hạt không bao giờ xuyên địa hình.
- **Gió lặng dần sau đỉnh núi:** ở phía tây của đường đỉnh, tác động của gió giảm dần về 0, để mây không dồn vào mép tây của sa bàn.

### Camera và điều khiển
- **Xoay quanh tâm bản đồ** bằng kéo chuột hoặc phím mũi tên; **thu phóng** bằng lăn chuột hoặc phím + và −. Góc nhìn giới hạn trong 10° đến 85° so với mặt ngang. Camera không chui xuống dưới địa hình hay mặt nước, và khoảng cách thu phóng có giới hạn.
- Góc nhìn mặc định nhìn từ phía đông nam, thấy biển ở gần và núi ở xa.
- Các điều khiển, phím tắt, HUD và chú giải của REQ-001 được giữ và đặt gọn ở một góc màn hình, không che phần lớn cảnh. Thiết kế lại giao diện thuộc REQ-005.

### Thời gian, tham số URL, cửa kiểm thử
- **Thời gian:** như REQ-001: bước cố định, tạm dừng, tốc độ, đặt lại, kẹp 0,25 giây khi tab ẩn, tất định theo seed.
- **Tham số URL:** như REQ-001 (`n` nay có miền 100 đến 2000, `sun`, `wind`, `seed`, `speed`, `paused`). Giá trị sai thì bỏ qua và dùng mặc định, không báo lỗi trên console.
- **`window.__sim`** (chỉ đọc), như REQ-001, thêm:
  - số hạt của từng vùng chứa;
  - mực nước hồ và ao;
  - trạng thái cạn của ao;
  - vị trí camera;
  - cờ cho biết WebGL2 đã khởi tạo được.

## Ràng buộc kỹ thuật
- HTML, JavaScript thuần (ES modules), **WebGL qua three.js**: một file đặt trong `vendor/`, phiên bản ghi rõ, kèm license. Không CDN, không npm dependency, không bước build. `package.json` vẫn chỉ có `"type": "module"` và `"scripts": {"test": "node --test"}`.
- Chạy bằng `python3 -m http.server 8000` ở gốc repo rồi mở `http://localhost:8000`.
- **Logic tách khỏi phần vẽ** như REQ-001. Sinh địa hình, hướng chảy, vùng chứa, đổi trạng thái, cụm mây, mưa, gió, dòng chảy, camera và thời gian là module thuần; `node --test` chạy không cần trình duyệt. three.js **chỉ** được import trong lớp vẽ.
- Mọi hằng số, bảng màu và mô tả bản đồ nằm trong file dữ liệu.
- Không tải ảnh hay texture từ ngoài.
- **WebGL không khởi tạo được:** trang hiện thông báo tiếng Việt rõ ràng thay cho cảnh, không trang trắng, không lỗi chưa bắt trên console.
- **Kiểm thử trình duyệt:** sandbox có Chromium headless với WebGL2 phần mềm (SwiftShader), không cần cờ khởi động. Kịch bản e2e kiểm tra WebGL2 khởi tạo được, và có thể dùng `?speed=8` để chạy nhanh.
- **Thời gian chạy test:** `node --test` cần chạy xong trong khoảng 5 phút trên máy phát triển. Test dài 600 giây mô phỏng chỉ dùng tham số mặc định; các tổ hợp tham số dùng 300 giây.

### Test cũ của REQ-001
- **Được thay bằng test tương đương cho thế giới 3D:** test gắn với thế giới 2D (đường gấp khúc, lưới ô của hồ, tia nhiệt theo cột, rìa hồ ở x = 640, miền `n` cũ). Báo cáo build và QA liệt kê test nào bị thay và test nào thay nó.
- **Giữ nguyên ý nghĩa:** các test còn lại (bảo toàn, tất định, thời gian, URL, ngưng tụ do nhiệt độ, ngưỡng mây và mưa có trễ, mưa dần, mưa rơi thẳng, gió chỉ tác động hơi nước và mây). Ngưỡng có thể đổi giá trị theo số hạt mới; ý nghĩa của test giữ nguyên.

## Ngoài phạm vi
- Thiết kế lại giao diện: bảng điều khiển dạng thẻ, góc nhìn sẵn, mức chất lượng, thẻ "nước đang ở đâu", bộ đếm mưa theo vùng (REQ-005).
- Theo dõi một giọt nước, bảng giải thích, gợi ý thí nghiệm, giọt mây hút nhau (REQ sau).
- Thực vật và thoát hơi nước, nước ngầm, băng và tuyết, thủy triều, ngày và đêm, mùa.
- Địa hình do học sinh chỉnh sửa; nhiều bản đồ.
- Âm thanh, cảm ứng và giao diện điện thoại, lưu cài đặt, đóng gói, phát hành công khai.

## Tiêu chí nghiệm thu
- **AC-1 (luồng):** Mở `http://localhost:8000` ở ×1 với tham số mặc định:
  1. Thấy sa bàn 3D có đủ núi, đồng bằng, suối, sông, hồ, ao và biển, kèm nhãn.
  2. Trong 120 giây thấy: hơi nước bốc lên chủ yếu từ biển, gió đưa vào đất liền, mây trượt lên sườn núi và mưa, giọt nước chảy theo suối về hồ hoặc theo sông ra biển, mực nước hồ dâng hạ.
  3. Xoay và thu phóng camera; bật và tắt nhãn.
  4. Tạm dừng: hạt, sóng biển và dải sáng trên sông đều đứng yên. Tiếp tục.
  5. Kéo thanh Mặt Trời về 0 rồi lên 100; kéo thanh Gió về 0 rồi lên 100. Đặt lại.

  Có kịch bản đầu-cuối chạy bằng trình duyệt cho luồng này, kèm một biến thể bị gián đoạn giữa chừng (đổi kích thước cửa sổ, xoay camera trong lúc tạm dừng, tạm dừng nhiều lần) rồi tiếp tục. Console không có lỗi.
- **AC-2 (bản đồ):**
  - Lưới độ cao sinh từ file dữ liệu; cùng dữ liệu thì cùng lưới; đổi `?seed=` không đổi lưới.
  - Ô biển ở dưới mực nước biển. Đỉnh cao nhất nằm trong vùng núi. Độ dốc trung bình của đồng bằng nhỏ hơn rõ rệt độ dốc trung bình của núi.
  - Có ít nhất ba suối bắt nguồn ở vùng núi.
  - Hồ nhận nước từ ít nhất một suối và có cửa thoát ra sông. Sông nhận ít nhất một suối và đổ ra biển.
  - Ao không có suối hay sông chảy vào.

  Có test logic.
- **AC-3 (thoát nước):**
  - Từ mọi ô đất, đi theo hướng chảy sẽ tới một vùng chứa sau hữu hạn bước, không vòng lặp, không kẹt.
  - Hướng chảy không bao giờ đi lên cao hơn.
  - Từ mọi ô đất, hạt `runoff` tới vùng chứa trong tối đa 60 giây mô phỏng.

  Có test logic.
- **AC-4 (vùng chứa):**
  - Phân bố ban đầu đúng file dữ liệu.
  - Mực nước hồ và ao đúng công thức theo số hạt.
  - Hồ vượt sức chứa thì phần vượt ra cửa thoát; ao vượt sức chứa thì phần vượt chảy theo hướng chảy tại mép ao. Không vùng chứa nào vượt sức chứa quá một bước.
  - Vùng chứa hết hạt thì không bốc hơi. Ao hết hạt thì `window.__sim` báo ao cạn, và có nước về thì hết cạn.

  Có test logic.
- **AC-5 (bốc hơi):**
  - Với cùng nhiệt độ Mặt Trời, số hạt bốc hơi của mỗi vùng chứa tỷ lệ với diện tích mặt nước của nó (sai số thống kê nhỏ, 300 giây, seed cố định). Biển là nguồn lớn nhất.
  - `sun = 0` thì không có hạt nào bốc hơi.
  - Hạt bốc hơi xuất hiện trên mặt nước của đúng vùng chứa của nó, với nhiệt độ trên 80.

  Có test logic.
- **AC-6 (ngưng tụ, mây, mưa):**
  - AC-5 và AC-6 của REQ-001 vẫn đúng trong thế giới 3D, với khoảng cách cụm trong 3D, `T_env` theo độ cao trên mực nước biển, và ngưỡng theo số hạt mới.
  - `f(condenseTemp) = 1`; `f` đơn điệu không tăng theo nhiệt độ; `f(0)` khoảng 3.
  - Hai cụm đang mưa giống nhau, chỉ khác nhiệt độ: cụm lạnh hơn ra nhiều giọt mưa hơn trong 10 giây.

  Có test logic.
- **AC-7 (chạm đất và chảy):**
  - Thả 10.000 hạt `rain` ở vị trí ngẫu nhiên có seed trên toàn bản đồ: mỗi hạt thành `runoff` hoặc vào đúng vùng chứa nó rơi trúng. Không hạt nào xuyên địa hình.
  - Mọi hạt `runoff` cuối cùng vào một vùng chứa.
  - Hạt rơi trong lưu vực của hồ thì về hồ (hay qua hồ ra sông); hạt rơi trong lưu vực của ao thì về ao.

  Có test logic.
- **AC-8 (gió và sườn núi):**
  - Gió đẩy `vapor` và `cloud` từ đông sang tây, mạnh theo thanh trượt; gió 0 thì không có trôi ngang do gió. Gió không tác động `rain`, `runoff`, `water`.
  - Hạt bị đẩy vào sườn núi thì độ cao tăng dần, nằm trên bề mặt, không xuyên địa hình, nhiệt độ giảm theo `T_env` mới. Gió 0 thì không hạt nào bị đẩy lên theo sườn.
  - Phía tây đường đỉnh, tác động của gió giảm về 0. Với gió 100 trong 300 giây, không lúc nào có quá 5% số giọt mây nằm trong 20 đơn vị sát mép tây.

  Có test logic.
- **AC-9 (câu chuyện của bản đồ):** Với seed cố định, 300 giây, đếm từ giây 60:
  - Gió 0: phần lớn mưa rơi xuống biển.
  - Gió mặc định (40): ít nhất 25% số giọt mưa rơi xuống vùng núi.
  - Gió 100: ít nhất 50% số giọt mưa rơi xuống vùng núi.
  - Tỷ lệ mưa xuống núi tăng theo gió (0 < 40 < 100).

  Nếu không đạt được cùng lúc với AC-10, cần hỏi người (`need_human`), không tự nới. Có test logic.
- **AC-10 (nhịp và ổn định):** Với tham số và seed mặc định:
  - Ở ×1: hạt đầu tiên bốc hơi trong 10 giây, đám mây đầu tiên trong 45 giây, giọt mưa đầu tiên trong 75 giây, hạt đầu tiên rơi xuống đất rồi vào một vùng chứa trong 120 giây.
  - Trong 600 giây: hồ không lúc nào cạn hẳn, có ít nhất một lần nước từ suối vào hồ, và có ít nhất một lần nước từ sông ra biển.

  Nếu một mốc không đạt được cùng lúc với các mốc khác, cần hỏi người (`need_human`), không tự nới. Có test logic chạy mô phỏng không cần trình duyệt.
- **AC-11 (bảo toàn và tất định):**
  - Ở mọi tổ hợp `sun ∈ {0, 50, 100}` và `wind ∈ {0, 40, 100}`, trong 300 giây: tổng số hạt luôn bằng `n`; tổng theo trạng thái và theo nơi chứa bằng `n`; không giá trị NaN hay vô hạn; không hạt nào ở ngoài thế giới hay dưới mặt địa hình.
  - Tính tất định, tạm dừng, tốc độ, kẹp thời gian khi tab ẩn và đặt lại như AC-10 của REQ-001.

  Có test logic.
- **AC-12 (camera):**
  - Góc nhìn bị kẹp trong 10° đến 85°; thu phóng bị kẹp trong giới hạn.
  - Camera không bao giờ ở dưới mặt địa hình hay mặt nước, kể cả khi xoay sát núi.

  Có test logic cho module camera.
- **AC-13 (đồ họa có mặt):** Kịch bản trình duyệt xác nhận:
  - WebGL2 khởi tạo được; cảnh có địa hình, biển, hồ, ao, sông, suối và bảy nhãn; hai nhãn bất kỳ không chồng lên nhau ở góc nhìn mặc định.
  - Khi giả lập WebGL không khởi tạo được, trang hiện thông báo tiếng Việt và không có lỗi chưa bắt.

  QA **chụp bốn ảnh** (toàn cảnh mặc định, nhìn từ biển vào núi, cận cảnh núi với suối và hồ, và lúc mây đang mưa trên sườn núi) và đính kèm báo cáo để người xem ở bước nghiệm thu.
- **AC-14 (URL):** `?n=1500` có hiệu lực. `?n=50`, `?n=3000` và các giá trị sai của REQ-001 bị bỏ qua và dùng mặc định, không báo lỗi trên console. Có test.
- **AC-15 (độ mượt):** QA đo số khung hình mỗi giây trong Chromium với 1000 hạt, ở ×1, trong 10 giây khi vòng đủ các giai đoạn, và ghi số đo vào báo cáo. Chromium headless dùng WebGL phần mềm nên số đo này chỉ để tham khảo. Ngưỡng thật (ít nhất 45 khung hình mỗi giây) kiểm ở AC-18 trên máy của người dùng.
- **AC-16 (test cũ):** Các test của REQ-001 thuộc nhóm "giữ nguyên ý nghĩa" vẫn pass. Các test thuộc nhóm "được thay" có test tương đương cho thế giới 3D; báo cáo liệt kê từng cặp. `node --test` chạy xong trong khoảng 5 phút.
- **AC-17:** `node --test` pass, không cần trình duyệt hay mạng. `package.json` chỉ có `type` và `scripts.test`. `vendor/` có three.js, phiên bản và license. `README.md` cập nhật:
  - bản đồ và các vùng;
  - phong cách và bảng màu;
  - điều khiển camera;
  - tham số URL;
  - hằng số và file mô tả bản đồ;
  - cấu trúc thư mục;
  - cách chạy kiểm thử trình duyệt;
  - cách thử sản phẩm (lệnh và địa chỉ);
  - mục **"Mô hình đơn giản hóa"**: hơi nước thật vô hình; nước bay hơi ở mọi nhiệt độ; sông và suối luôn hiện đầy nước dù lượng nước đang chảy ít hay nhiều; mực nước biển coi như không đổi; không có nước ngầm và cây cối.
- **AC-18 (kiểm tay ở bước nghiệm thu, trên máy của người dùng):**
  - Cảnh trông như một **sa bàn low-poly gọn gàng, màu dịu**, đẹp hơn rõ rệt so với REQ-001.
  - Nhận ra ngay núi, đồng bằng, suối, sông, hồ, ao, biển, cả khi tắt nhãn.
  - Mặt nước trông như nước; mây trông như mây và xám dần khi lớn.
  - Thấy được câu chuyện: hơi nước từ biển, gió đưa vào, mây trượt lên núi và mưa, nước chảy theo suối và sông về lại biển.
  - Xoay và thu phóng camera dễ dùng.
  - Chuyển động mượt (ít nhất 45 khung hình mỗi giây với 1000 hạt).
