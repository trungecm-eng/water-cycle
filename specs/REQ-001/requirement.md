# REQ-001: Vòng tuần hoàn nước — một vòng đơn giản, đủ bốn giai đoạn

REQ đầu tiên trong ba REQ của project, cắt theo chiều dọc:
- **REQ-001 (này):** vòng tuần hoàn chạy trọn và tự duy trì, quy luật đơn giản, đủ bốn giai đoạn.
- REQ-002: mây hình thành và đậm dần cho đúng hơn, gió đưa mây vào núi, mưa nhiều ở sườn đón gió.
- REQ-003: dòng chảy trên sườn núi, theo dõi một giọt nước, phần giải thích cho học sinh.

## Bối cảnh và mục tiêu
Một web app chạy trên trình duyệt mô phỏng **vòng tuần hoàn nước** bằng hệ hạt. Người dùng là **học sinh cấp 2 tự khám phá trên máy tính của mình**, dùng chuột và bàn phím, chạy bằng server local. Sản phẩm không phát hành công khai.

Mỗi hạt là một lượng nước nhỏ. Hạt đổi trạng thái theo nhiệt độ và vị trí của nó, và màu hạt cho biết trạng thái. Đây là mô hình đơn giản hóa, nhưng **không được dạy sai ba điều cơ bản**:
1. Hơi nước là vô hình; trên màn hình nó chỉ được vẽ thật mờ, kèm chú thích.
2. Mây là những **giọt nước rất nhỏ đã ngưng tụ** khi hơi nước gặp lạnh, không phải hơi nước.
3. Nước không mất đi: tổng lượng nước (số hạt) luôn không đổi.

Mục tiêu của REQ này là **vòng chạy trọn, tự cân bằng và xem được ở tốc độ thường**: học sinh mở trang, trong khoảng hai phút thấy nước bốc hơi, thành mây, mưa và quay về hồ, rồi vòng cứ thế tiếp diễn mà hồ không cạn.

## Phạm vi

### Thế giới và bố cục
- Thế giới 2D có kích thước logic **1000 × 600 đơn vị**, gốc ở góc dưới trái, trục y hướng lên. Canvas co giãn theo cửa sổ, giữ đúng tỷ lệ (không méo).
- **Bố cục cố định:** ngọn núi bên trái, sườn núi dốc xuống phía phải, hồ nước bên phải. Mặt Trời ở phía trên hồ. Hai mép trái và phải của thế giới là tường; mép trên là trần. Hạt không ra ngoài được.
- **Địa hình** là một đường gấp khúc trong file dữ liệu, đơn điệu không tăng từ trái sang phải. Gợi ý: `(0,340) (100,340) (250,250) (420,150) (560,85) (640,60)`: đỉnh phẳng từ x = 0 đến 100, sườn dốc tới **rìa hồ** ở x = 640. Từ x = 640 đến 1000 là lòng hồ, đáy ở y = 60.
- **Hồ:** hạt nước nằm yên trong hồ chiếm các ô của một lưới đều (gợi ý ô cạnh 6 đơn vị, 60 cột), hàng dưới lấp trước, không chồng lên nhau. **Mực nước** = `60 + số hạt water × levelPerParticle` (gợi ý 0,1). Hạt cao nhất của mỗi cột là **hạt mặt nước** của cột đó.

### Hạt và trạng thái
- Số hạt mặc định **600**, miền cho phép **100 đến 1200** (hồ phải chứa được toàn bộ hạt cùng lúc). Tổng số hạt **không đổi** suốt thời gian chạy.
- Năm trạng thái, dùng cùng tên trong code, HUD và test:

| Trạng thái | Ý nghĩa | Hiển thị gợi ý |
|---|---|---|
| `water` | nước nằm trong hồ | xanh dương |
| `vapor` | hơi nước | trắng rất mờ, gần trong suốt |
| `cloud` | giọt mây (giọt nước nhỏ đã ngưng tụ) | chấm trắng nhỏ, rõ |
| `rain` | giọt mưa đang rơi | xanh dương đậm |
| `runoff` | nước chảy trên mặt đất | xanh dương đậm |

- Mỗi hạt có vị trí, vận tốc, nhiệt độ hạt (thang 0 đến 100) và trạng thái. Lúc bắt đầu, mọi hạt là `water`, nằm yên trong hồ, nhiệt độ bằng nhiệt độ nền của hồ (gợi ý 20).

### Giai đoạn 1: bốc hơi
- Mặt Trời liên tục phát **tia nhiệt** xuống mặt hồ; tia được vẽ thấy được khi đang bay. Mỗi tia nhắm một cột của hồ (chọn bằng bộ sinh có seed) và, khi tới nơi, cộng một lượng nhiệt cố định vào **hạt mặt nước của cột đó**. Tia không làm nóng hạt nào khác.
- Nhịp phát tia tỷ lệ với thanh trượt "Nhiệt độ Mặt Trời": bằng 0 khi thanh ở 0.
- Hạt `water` luôn nguội dần về nhiệt độ nền. Hạt mặt nước càng nóng thì rung quanh ô của nó càng mạnh (chỉ là hiển thị, tất định theo seed).
- Hạt mặt nước có nhiệt độ **vượt 80** thì thành `vapor` và có lực đẩy lên.

### Giai đoạn 2: ngưng tụ thành mây
- **Nhiệt độ môi trường** giảm theo độ cao (càng cao càng lạnh), một hàm trong file dữ liệu (gợi ý `T_env(y) = max(0, 30 − 0,09 × (y − 60))`).
- Hạt `vapor` bay lên và nguội dần về `T_env` ở độ cao của nó. Khi nhiệt độ hạt giảm tới **`condenseTemp`** (gợi ý 20) trở xuống, hạt **ngưng tụ** thành `cloud`: đổi hiển thị ngay, mất lực đẩy lên, giữ độ cao (chỉ trôi rất nhẹ, tất định theo seed). Việc ngưng tụ chỉ phụ thuộc nhiệt độ của chính hạt đó, **không** phụ thuộc số hạt xung quanh.
- **Đám mây:** các giọt mây cách nhau không quá `clusterRadius` (gợi ý 40) thuộc cùng một cụm. Cụm có từ **`cloudMinSize`** (gợi ý 30) giọt trở lên được vẽ thành một đám mây mờ bao quanh (ví dụ hợp các vòng tròn mờ). Ở REQ này đám mây chỉ cần một màu.
- Hạt `vapor` và `cloud` không xuyên được địa hình, tường và trần: bị đẩy vào thì dừng ở sát bề mặt.

### Giai đoạn 3: mưa rơi
- Cụm có từ **`rainStartSize`** (gợi ý 80, lớn hơn `cloudMinSize`) giọt trở lên thì **bắt đầu mưa**, và tiếp tục mưa cho tới khi còn **dưới `cloudMinSize`** giọt (có trễ, để mưa không chập chờn quanh ngưỡng).
- **Mưa dần:** trong cụm đang mưa, mỗi giọt mây ở mỗi bước có một xác suất nhỏ (bộ sinh có seed) thành `rain`. Không bao giờ cả cụm đổ xuống trong một lần.
- Hạt `rain` rơi **thẳng đứng** do trọng lực, nhanh dần tới một tốc độ tối đa. Gió không tác động lên nó.

### Giai đoạn 4: chảy về hồ
- Hạt `rain` chạm địa hình (đỉnh hay sườn núi) thì thành `runoff`. Hạt không bao giờ xuyên qua địa hình, ở bất kỳ tốc độ nào.
- Hạt `runoff` chảy **dọc theo bề mặt địa hình, chỉ theo chiều đi xuống (sang phải)**, kể cả trên đỉnh phẳng. Ở REQ này chỉ cần một tốc độ chảy đơn giản; REQ-003 làm phần vật lý và dòng nối đuôi.
- Hạt `runoff` tới rìa hồ, hay hạt `rain` rơi trúng vùng hồ, thì vào hồ thành `water`: nằm ở **ô trống thấp nhất gần hoành độ của nó nhất**, nhiệt độ về nhiệt độ nền. Mực nước dâng tương ứng. Hạt này có thể bốc hơi lại như mọi hạt `water` khác.
- **Hồ cạn** (không còn `water`) thì HUD báo "Hồ đã cạn"; mô phỏng vẫn chạy, không lỗi.

### Thanh trượt
- **"Nhiệt độ Mặt Trời":** 0 đến 100, mặc định 50. Thanh ở 0 thì không còn tia, không hạt mới bốc hơi; hơi nước và mây đã có vẫn đi tiếp vòng của chúng.
- **"Gió":** 0 đến 100, mặc định 40. Gió thổi **từ phía hồ vào đất liền**, tức hướng sang trái về phía núi. Gió chỉ đẩy hạt `vapor` và `cloud` theo phương ngang, tỷ lệ với giá trị thanh. Thanh ở 0 là lặng gió.
- Hai thanh có nhãn tiếng Việt, hiện giá trị, có hiệu lực ngay, và không làm hạt nào nhảy vị trí.

### Nhịp của vòng (mục tiêu sản phẩm)
Học sinh xem ở tốc độ ×1, nên các mốc dưới đây tính bằng giây thực ở ×1, với tham số mặc định và seed mặc định:

| Mốc | Không muộn hơn |
|---|---|
| Hạt đầu tiên bốc hơi | 10 giây |
| Đám mây đầu tiên (cụm từ `cloudMinSize`) | 45 giây |
| Giọt mưa đầu tiên | 75 giây |
| Hạt đầu tiên về lại hồ | 120 giây |

**Ổn định:** trong 600 giây với tham số mặc định, số hạt `water` không lúc nào dưới 20% tổng số hạt, và kể từ giây 120, mỗi khoảng 60 giây đều có ít nhất một hạt bốc hơi và một hạt về hồ.

Các hằng số được hiệu chỉnh để đạt những mốc này. Nếu PM hay Dev thấy một mốc không đạt được cùng lúc với các mốc khác, cần hỏi người (`need_human`), không tự nới.

### Thời gian và tính tất định
- Mô phỏng chạy theo **bước thời gian cố định** (`dt = 1/60` giây) với bộ cộng dồn thời gian thực. Mọi yếu tố ngẫu nhiên dùng bộ sinh có seed.
- Cùng seed, cùng tham số, cùng chuỗi thao tác thì cùng trạng thái từng hạt.
- **Tạm dừng / tiếp tục** (phím Space hoặc nút): khi dừng không có bước nào chạy; khi tiếp tục không bù thời gian đã dừng.
- **Tốc độ** ×0,5, ×1, ×2, ×4 (nút, hoặc phím 1 đến 4).
- **Đặt lại** (phím R hoặc nút): về trạng thái đầu với seed và thanh trượt hiện tại, tốc độ ×1, đang chạy.
- Tab bị ẩn rồi quay lại: không nhảy vọt; một lần cập nhật dồn tối đa 0,25 giây thời gian thực.

### Tham số URL
`?n=` (100 đến 1200), `?sun=` (0 đến 100), `?wind=` (0 đến 100), `?seed=` (số nguyên), `?speed=` (0,5 đến 8; cho phép tới ×8 để kiểm thử nhanh), `?paused=1`. Giá trị sai hay ngoài miền thì bỏ qua và dùng mặc định, không báo lỗi trên console.

### Hiển thị thông tin
- **HUD:** thời gian (giây, một chữ số thập phân), tốc độ, đang chạy hay tạm dừng, số hạt ở từng trạng thái, mực nước, số lần nước đã về hồ, giá trị hai thanh trượt.
- **"Đang diễn ra":** liệt kê các giai đoạn đang có hạt, theo một quy tắc duy nhất dùng cho cả ba REQ: giai đoạn 1 khi có `vapor`, giai đoạn 2 khi có `cloud`, giai đoạn 3 khi có `rain`, giai đoạn 4 khi có `runoff`. Tên giai đoạn bằng tiếng Việt: Bốc hơi, Ngưng tụ thành mây, Mưa rơi, Chảy về hồ.
- **Chú giải màu** cho năm trạng thái, kèm một dòng: "Hơi nước thật không nhìn thấy được; ở đây vẽ mờ để em theo dõi."
- Mọi chữ bằng tiếng Việt, đọc được ở cửa sổ rộng từ 1024 px.
- **Cửa kiểm thử** `window.__sim`: trả ảnh chụp trạng thái **chỉ đọc** (thời gian, số hạt từng trạng thái, mực nước, số lần về hồ, giá trị thanh trượt, danh sách đám mây kèm số giọt và cờ đang mưa). Không thể dùng nó để sửa trạng thái.

## Ràng buộc kỹ thuật
- HTML, JavaScript thuần (ES modules) và Canvas 2D. **Không thư viện, không CDN, không bước build, không npm dependency, không WebGL.**
- `package.json` chỉ có `"type": "module"` và `"scripts": {"test": "node --test"}`.
- Chạy bằng `python3 -m http.server 8000` ở gốc repo rồi mở `http://localhost:8000`.
- **Logic tách khỏi phần vẽ.** Mọi quy luật (địa hình, hồ, nhiệt, đổi trạng thái, cụm mây, mưa, chảy, thời gian, bộ sinh có seed) nằm trong module thuần, không đụng DOM hay canvas, để `node --test` chạy không cần trình duyệt.
- Mọi hằng số (kích thước, địa hình, ngưỡng, nhịp, tốc độ, màu) nằm trong **một file dữ liệu riêng**.
- Không dùng ảnh tải từ ngoài; mọi hình vẽ bằng code.
- Test: `node --test` (Node 24, không cài gì thêm). Test logic không đo thời gian chạy; hiệu năng do QA đo trong trình duyệt (AC-12).

## Ngoài phạm vi
- Đám mây đổi màu theo độ đặc, giọt mây hút nhau, mưa nhiều hơn ở sườn đón gió (REQ-002).
- Vật lý dòng chảy, dòng nối đuôi, theo dõi một giọt nước, phần giải thích chi tiết (REQ-003).
- Thực vật và thoát hơi nước, nước thấm và nước ngầm, băng và tuyết, nhiều hồ hay nhiều núi.
- Âm thanh, cảm ứng và giao diện điện thoại, lưu cài đặt, đóng gói, phát hành công khai.

## Tiêu chí nghiệm thu
- **AC-1 (luồng):** Mở `http://localhost:8000` ở ×1 với tham số mặc định. Trong 120 giây thấy đủ: tia nhiệt, hạt mặt nước rung rồi bốc hơi, hơi nước mờ bay lên, ngưng tụ thành giọt mây, đám mây, mưa rơi, nước chảy trên sườn núi hay rơi thẳng vào hồ, mực nước dâng lại. Sau đó học sinh:
  1. Tạm dừng (mọi thứ đứng yên) rồi tiếp tục.
  2. Kéo thanh Mặt Trời về 0 (không bốc hơi mới) rồi lên 100.
  3. Kéo thanh Gió về 0 rồi lên 100.
  4. Đổi tốc độ.
  5. Đặt lại.

  Có kịch bản đầu-cuối chạy bằng trình duyệt cho luồng này, kèm một biến thể bị gián đoạn giữa chừng (đổi kích thước cửa sổ, tạm dừng nhiều lần liên tiếp) rồi tiếp tục. Console không có lỗi.
- **AC-2 (thế giới):** Địa hình và hằng số nằm trong file dữ liệu và được test đọc. Địa hình đơn điệu không tăng; độ cao địa hình tại một hoành độ được nội suy đúng. Trong 600 giây của các lần chạy ở AC-10, không hạt nào ở ngoài thế giới hay nằm trong lòng địa hình. Có test logic.
- **AC-3 (hồ):** Lúc bắt đầu, `n` hạt `water` nằm ở các ô khác nhau, hàng dưới lấp trước; mực nước đúng công thức. Hạt mặt nước là hạt cao nhất của cột. Hạt rời hồ thì mực nước hạ đúng `levelPerParticle`; hạt vào hồ thì nằm ở ô trống thấp nhất gần hoành độ của nó nhất và mực nước dâng đúng `levelPerParticle`. Với `n = 1200`, hồ chứa hết. Có test logic.
- **AC-4 (bốc hơi):**
  - Tia chỉ làm nóng hạt mặt nước của cột nó nhắm tới.
  - Hạt không được làm nóng thì nguội dần về nhiệt độ nền, không xuống dưới mức đó.
  - Hạt có nhiệt độ ≤ 80 vẫn là `water`; vượt 80 thì thành `vapor` và đi lên.
  - Chỉ hạt mặt nước mới có thể bốc hơi.

  Có test logic.
- **AC-5 (ngưng tụ):**
  - `T_env` giảm đơn điệu theo độ cao và không âm.
  - Hạt `vapor` có nhiệt độ tiến về `T_env` ở độ cao của nó.
  - Hạt `vapor` nguội tới `condenseTemp` thì thành `cloud`, mất lực đẩy lên và không đi lên tiếp.
  - Một hạt `vapor` đứng riêng lẻ, không có hạt nào khác gần đó, vẫn ngưng tụ khi đủ lạnh (ngưng tụ do nhiệt độ, không do số lượng).

  Có test logic.
- **AC-6 (mây và mưa):**
  - Cụm 29 giọt không được vẽ thành mây; 30 giọt thì có mây.
  - Cụm 79 giọt không mưa, 80 giọt thì mưa; đang mưa mà còn 40 giọt vẫn mưa; dưới 30 giọt thì ngừng.
  - Bước đầu tiên của một cụm vừa bắt đầu mưa có ít hơn 20% số giọt thành `rain`. Một cụm không được bổ sung thì mưa hết trong tối đa 60 giây.
  - Hạt `rain` rơi thẳng đứng (hoành độ không đổi ở mọi giá trị gió), nhanh dần rồi không vượt tốc độ tối đa.

  Có test logic.
- **AC-7 (chảy và về hồ):**
  - Thả 10.000 hạt `rain` từ độ cao, hoành độ và vận tốc ngang ngẫu nhiên có seed: mọi hạt đều thành `runoff` hoặc `water`, không hạt nào xuyên địa hình.
  - Hạt `runoff` luôn nằm trên bề mặt, không bao giờ đi lên cao hơn, và từ bất kỳ điểm nào trên địa hình đều tới hồ trong tối đa 40 giây.

  Có test logic.
- **AC-8 (thanh trượt):**
  - `sun = 0` từ đầu: sau 120 giây không có hạt nào bốc hơi. `sun` kéo về 0 giữa chừng: hạt đang ở trên không vẫn ngưng tụ, mưa và về hồ.
  - `sun = 100`: số lần bốc hơi trong 60 giây gấp ít nhất 1,5 lần mức mặc định.
  - `wind = 0`: hạt `vapor` và `cloud` không có thành phần trôi ngang do gió. Gió chỉ tác động lên `vapor` và `cloud`.
  - Hạt bị gió đẩy vào sườn núi hay tường thì dừng ở bề mặt, không xuyên qua.
  - Đổi thanh trượt giữa chừng không làm hạt nào nhảy vị trí.

  Có test logic.
- **AC-9 (nhịp và ổn định):** Với tham số và seed mặc định:
  - Bốn mốc trong bảng "Nhịp của vòng" đều đạt.
  - Trong 600 giây, số `water` không lúc nào dưới 20% `n`.
  - Kể từ giây 120, mỗi khoảng 60 giây có ít nhất một lần bốc hơi và một lần về hồ.

  Có test logic chạy mô phỏng không cần trình duyệt.
- **AC-10 (bảo toàn và tất định):**
  - Ở mọi tổ hợp `sun ∈ {0, 50, 100}` và `wind ∈ {0, 40, 100}`, trong 600 giây: tổng số hạt luôn bằng `n`, tổng theo trạng thái bằng `n`, không giá trị NaN hay vô hạn, nhiệt độ trong 0 đến 100.
  - Cùng seed, tham số và chuỗi thao tác (chạy liên tục, hay xen kẽ tạm dừng và đổi tốc độ) cho cùng số bước thì trạng thái giống hệt nhau; khác seed thì khác.
  - Tạm dừng thì không có bước nào chạy.
  - Sau khoảng nghỉ 10 giây (tab ẩn), một lần cập nhật chạy không quá 0,25 giây × hệ số tốc độ.
  - Đặt lại đưa mọi thứ về trạng thái đầu.

  Có test logic.
- **AC-11 (URL):**
  - `?n=300`, `?sun=80`, `?wind=0`, `?seed=7`, `?speed=8`, `?paused=1` có hiệu lực.
  - `?n=50`, `?n=5000`, `?n=abc`, `?sun=-5`, `?wind=200`, `?speed=0` bị bỏ qua và dùng mặc định, không báo lỗi trên console.

  Có test.
- **AC-12 (độ mượt):** QA đo số khung hình mỗi giây trong Chromium với 600 hạt, ở ×1, trong 10 giây khi vòng đang chạy đủ các giai đoạn. Trung bình đạt ít nhất 45 khung hình mỗi giây. Ghi số đo vào báo cáo.
- **AC-13:** `node --test` pass, không cần trình duyệt hay mạng. `package.json` chỉ có `type` và `scripts.test`. `README.md` có:
  - cách chạy và **cách thử sản phẩm** (lệnh và địa chỉ);
  - bảng điều khiển và tham số URL;
  - các trạng thái hạt;
  - các hằng số và ý nghĩa;
  - cấu trúc thư mục.
- **AC-14 (kiểm tay ở bước nghiệm thu):** ở ×1, không cần đọc hướng dẫn:
  - nhận ra núi, hồ, Mặt Trời và năm loại hạt nhờ chú giải;
  - trong khoảng hai phút thấy được một vòng trọn;
  - thấy rõ tác dụng của hai thanh trượt;
  - chuyển động mượt, chữ đọc được.
