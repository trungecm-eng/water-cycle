# REQ-002: Vòng tuần hoàn nước — mây đậm dần, gió đưa mây vào núi, mưa ở sườn đón gió

**Làm sau khi REQ-001 đã vào `main`.** Sửa trên codebase của REQ-001: dùng lại thế giới, hồ, trạng thái hạt, đồng hồ mô phỏng, bộ sinh có seed, thanh trượt, HUD và file dữ liệu hằng số.

## Bối cảnh và mục tiêu
REQ-001 cho vòng chạy trọn với quy luật đơn giản. Còn ba chỗ học sinh chưa học được đúng:
1. **Mây trông rời rạc.** Giọt mây nằm thành lớp mỏng, rải rác, không tụ thành đám rõ ràng. Đám mây cũng không cho biết lúc nào sắp mưa.
2. **Mây bị gió dồn vào sườn núi thì đứng sát sườn.** Nó mưa ở đó chỉ vì bị chặn lại.
3. **Không thấy vì sao vùng núi hay mưa.** Ngoài thực tế, gió đẩy không khí ẩm lên theo sườn núi; lên cao thì lạnh hơn, nên mưa nhiều hơn ở **sườn đón gió**.

REQ này sửa ba chỗ đó, để học sinh tự thí nghiệm với thanh Gió và thấy được kết quả bằng số.

**Mọi AC của REQ-001 vẫn phải đúng**, gồm cả các mốc nhịp và ổn định ở AC-9; test cũ không bị xóa hay làm yếu đi. Chỉ có hai quy tắc của REQ-001 được thay, và cả hai đã được viết sao cho AC của REQ-001 vẫn giữ:
- Xác suất một giọt mây thành mưa không còn là hằng số mà tăng khi giọt lạnh hơn (xem "Mưa ở sườn đón gió"). Ở nhiệt độ `condenseTemp` nó bằng giá trị cũ.
- Hạt `vapor` và `cloud` bị gió đẩy vào sườn núi không còn dừng ở bề mặt mà bị đẩy lên theo sườn.

## Phạm vi

### Đám mây tụ lại
- Các giọt mây trong bán kính hút (gợi ý 40) **hút nhau** nhẹ, nên một vùng giọt mây rải rác tụ thành đám gọn. Lực hút có giới hạn và giữ khoảng cách tối thiểu giữa hai giọt (không chồng khít lên nhau).
- **Mây trôi như một khối:** gió tác động như nhau lên mọi giọt của một cụm, nên đám mây giữ hình dạng khi trôi.

### Đám mây đậm dần
- Đám mây vẽ thành một khối mềm, mờ, bao lấy cụm (không còn là các vòng tròn rời nhau).
- **Màu theo số giọt:** trắng ở `cloudMinSize` giọt, xám dần, tới xám xịt (mây tích mưa) ở `rainStartSize` giọt. Màu là hàm đơn điệu của số giọt. Mây đang mưa có vệt mưa mờ bên dưới.
- Học sinh nhìn màu mây đoán được mây nào sắp mưa.

### Mưa ở sườn đón gió
- **Đẩy lên theo sườn:** hạt `vapor` hay `cloud` bị gió đẩy vào sườn núi thì trượt **lên theo sườn**, thay vì dừng lại. Hạt không bao giờ xuyên địa hình.
- Lên cao thì `T_env` thấp hơn, nên hạt nguội thêm: `vapor` ngưng tụ sớm hơn, còn giọt mây thì lạnh hơn.
- **Xác suất mưa theo độ lạnh:** trong cụm đang mưa, xác suất mỗi bước của một giọt bằng `p0 × f(T)`, với `f(condenseTemp) = 1`, `f` tăng khi nhiệt độ giọt giảm, và `f(0)` khoảng 3. Giá trị trong file dữ liệu. Ngưỡng bắt đầu và ngừng mưa của REQ-001 không đổi.
- **Gió lặng dần khi qua đỉnh:** trên đỉnh phẳng (gợi ý x < 100), tác động của gió giảm dần về 0. Nhờ vậy mây không dồn vào tường trái.
- Một dòng giải thích ngắn trên trang: "Gió đẩy không khí ẩm lên theo sườn núi; càng lên cao càng lạnh nên mây đặc lại và mưa nhiều hơn ở sườn đón gió."

### Bộ đếm cho học sinh thí nghiệm
- HUD thêm:
  - số đám mây và số đám đang mưa;
  - **"Mưa xuống núi"** và **"Mưa xuống hồ"**: số giọt mưa đã chạm đất ở mỗi nơi, kèm tỷ lệ phần trăm. Chạm địa hình tức x < 640, chạm vùng hồ tức x ≥ 640.

  Đặt lại thì các bộ đếm về 0.
- Nút **"Xóa bộ đếm"** đưa hai bộ đếm mưa về 0 mà không đặt lại mô phỏng, để học sinh đổi gió rồi đếm lại.
- `window.__sim` thêm hai bộ đếm này và màu (hay độ xám) của từng đám mây, vẫn chỉ đọc.

### Mục tiêu đo được của thanh Gió
Với seed mặc định, `sun` mặc định, chạy 300 giây, đếm từ giây 60:

| Gió | Kết quả mong muốn |
|---|---|
| 0 | ít nhất 70% mưa rơi xuống hồ |
| 40 (mặc định) | ít nhất 25% mưa rơi xuống núi |
| 100 | ít nhất 60% mưa rơi xuống núi |

Hiệu chỉnh hằng số để đạt các mục tiêu này. Nếu không đạt được cùng lúc với các mốc nhịp và ổn định của REQ-001, cần hỏi người (`need_human`), không tự nới.

## Ràng buộc kỹ thuật
- Như REQ-001: HTML, JavaScript thuần (ES modules), Canvas 2D, không thư viện, không CDN, không bước build, không WebGL. `package.json` vẫn chỉ có `type` và `scripts.test`.
- Quy luật mới (lực hút, gió theo khối, đẩy lên theo sườn, xác suất theo độ lạnh, gió lặng trên đỉnh, màu mây theo số giọt, bộ đếm) là module thuần. Hằng số mới nằm trong file dữ liệu.
- Mọi yếu tố ngẫu nhiên dùng bộ sinh có seed; tính tất định của REQ-001 vẫn giữ.

## Ngoài phạm vi
- Vật lý dòng chảy, dòng nối đuôi, theo dõi một giọt nước, phần giải thích chi tiết (REQ-003).
- Gió đổi hướng hay theo thời gian, nhiều lớp mây, sấm sét, tuyết, bóng mây trên mặt đất.
- Âm thanh, giao diện điện thoại, lưu cài đặt, đóng gói, phát hành công khai.

## Tiêu chí nghiệm thu
- **AC-1 (luồng):** Mở trang ở ×1 với tham số mặc định:
  1. Thấy giọt mây tụ thành đám gọn, đám mây trắng rồi xám dần.
  2. Đám mây xám xịt bắt đầu mưa.
  3. Mây được gió đưa vào núi và trượt lên theo sườn; mưa rơi xuống sườn.
  4. Kéo Gió về 0 và bấm "Xóa bộ đếm": phần lớn mưa xuống hồ.
  5. Kéo Gió lên 100 và xóa bộ đếm: phần lớn mưa xuống núi.

  Tạm dừng, tiếp tục, đặt lại vẫn đúng. Có kịch bản đầu-cuối chạy bằng trình duyệt, kèm biến thể bị gián đoạn giữa chừng (đổi kích thước cửa sổ, đổi gió nhiều lần liên tiếp) rồi tiếp tục. Console không có lỗi.
- **AC-2 (tụ lại):**
  - Với gió 0, 60 giọt mây rải trong một vùng 400 × 100 (khoảng cách lân cận không quá `clusterRadius`) tụ lại: sau 15 giây, bán kính bao của chúng nhỏ hơn lúc đầu ít nhất 30%, và chúng vẫn là một cụm.
  - Hai giọt bất kỳ không bao giờ gần hơn khoảng cách tối thiểu.

  Có test logic.
- **AC-3 (trôi như một khối):** Với gió không đổi và không có giọt nào chạm địa hình, khoảng cách giữa hai giọt bất kỳ trong một cụm thay đổi không quá mức do lực hút gây ra: so với cùng cụm khi gió 0, chênh lệch không quá 5%. Có test logic.
- **AC-4 (màu mây):** Độ xám của đám mây là hàm đơn điệu của số giọt: `cloudMinSize` giọt gần trắng, `rainStartSize` giọt xám xịt. Đám lớn hơn không bao giờ sáng hơn đám nhỏ hơn. Có test logic.
- **AC-5 (đẩy lên theo sườn):**
  - Hạt `vapor` hay `cloud` bị gió đẩy vào sườn núi thì độ cao tăng dần, nằm trên bề mặt, không xuyên địa hình, nhiệt độ giảm theo `T_env` của độ cao mới.
  - Với gió 0, không có hạt nào bị đẩy lên theo sườn.

  Có test logic.
- **AC-6 (mưa theo độ lạnh):**
  - `f(condenseTemp) = 1`; `f` đơn điệu không tăng theo nhiệt độ; `f(0)` khoảng 3.
  - Hai cụm đang mưa giống nhau, chỉ khác nhiệt độ: cụm lạnh hơn ra nhiều giọt mưa hơn trong 10 giây.
  - Các ngưỡng bắt đầu, ngừng mưa và "mưa dần" của REQ-001 (AC-6) vẫn đúng.

  Có test logic.
- **AC-7 (gió qua đỉnh):** Trên đỉnh phẳng, tác động của gió giảm dần về 0. Với gió 100 trong 300 giây, không lúc nào có quá 5% số giọt mây nằm trong khoảng 20 đơn vị sát tường trái. Có test logic.
- **AC-8 (mục tiêu của thanh Gió):** Ba mục tiêu trong bảng "Mục tiêu đo được của thanh Gió" đều đạt với seed mặc định; tỷ lệ mưa xuống núi tăng theo gió (0 < 40 < 100). Có test logic chạy mô phỏng không cần trình duyệt.
- **AC-9 (bộ đếm):**
  - Mỗi giọt mưa được đếm đúng một lần, khi nó chạm đất, vào đúng một trong hai bộ đếm theo hoành độ chạm.
  - Tổng hai bộ đếm bằng số giọt mưa đã chạm đất.
  - "Xóa bộ đếm" đưa cả hai về 0 mà không đổi trạng thái hạt. Đặt lại cũng đưa chúng về 0.

  Có test logic.
- **AC-10 (REQ-001 vẫn đúng):** Mọi test của REQ-001 pass, gồm nhịp, ổn định, bảo toàn và tất định (AC-9, AC-10 của REQ-001) với các quy luật mới. AC-12 của REQ-001 (ít nhất 45 khung hình mỗi giây với 600 hạt) vẫn đạt; QA ghi số đo.
- **AC-11:** `node --test` pass, không cần trình duyệt hay mạng. `package.json` chỉ có `type` và `scripts.test`. `README.md` cập nhật: đám mây đậm dần, mưa ở sườn đón gió, bộ đếm, hằng số mới.
- **AC-12 (kiểm tay ở bước nghiệm thu):**
  - Đám mây trông như mây và xám dần trước khi mưa.
  - Thấy mây trượt lên theo sườn núi và mưa xuống sườn.
  - Tự làm thí nghiệm với thanh Gió và bộ đếm được trong vài phút: gió càng mạnh, mưa xuống núi càng nhiều.
  - Không thấy mây dồn đống ở mép trái.
