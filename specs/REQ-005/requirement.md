# REQ-005: Vòng tuần hoàn nước — giao diện, góc nhìn và số liệu cho học sinh thí nghiệm

**Làm sau khi REQ-004 đã vào `main`.** Sửa trên codebase của REQ-004: dùng lại thế giới 3D, bản đồ, vùng chứa, quy luật hạt, camera, phong cách sa bàn low-poly và file dữ liệu.

## Bối cảnh và mục tiêu
REQ-004 cho một sa bàn 3D đẹp, có đủ câu chuyện của nước. Nhưng giao diện vẫn là HUD và nút của REQ-001, đặt tạm ở một góc. Yêu cầu này làm **giao diện cho học sinh tự thí nghiệm**:
- Điều khiển gọn, đẹp, cùng phong cách với sa bàn.
- Số liệu dễ đọc: nước đang ở đâu, hồ và ao đầy hay vơi.
- **Bộ đếm mưa theo vùng**, để học sinh đổi gió hay đổi nắng rồi tự đo kết quả.
- Góc nhìn sẵn để xem nhanh từng phần của câu chuyện.
- Mức chất lượng thấp cho máy yếu.

Người dùng vẫn là học sinh cấp 2 tự khám phá trên máy tính của mình, chuột và bàn phím, server local, không phát hành công khai.

**Mọi AC của REQ-004 vẫn phải đúng**; test cũ không bị xóa hay làm yếu đi. Không đổi quy luật mô phỏng nào.

## Phạm vi

### Bố cục và phong cách
- Cảnh 3D chiếm toàn cửa sổ.
- Một **bảng điều khiển bên phải**, nền trắng trong mờ, bo góc, có bóng nhẹ. Bảng **thu gọn** được thành một thanh nhỏ (nút hay phím Tab), và nhớ trạng thái trong phiên.
- Bảng có ba nhóm, mỗi nhóm có tiêu đề và mở hay gập được:
  1. **Điều khiển**
  2. **Số liệu**
  3. **Chú giải**
- **Một phong cách thống nhất với sa bàn:**
  - một bộ font hệ thống dễ đọc;
  - bảng màu lấy từ bảng màu pastel của REQ-004;
  - góc bo, khoảng cách và kích thước chữ theo một thang cố định trong một file CSS biến (custom properties).

  Biểu tượng vẽ bằng SVG nội tuyến, không tải từ ngoài.
- Chữ tiếng Việt, tương phản đủ đọc (tỷ lệ tương phản ít nhất 4,5:1 cho chữ thường). Dùng được ở cửa sổ rộng từ 1024 px. Khi mở, bảng không che quá 30% chiều rộng cảnh.

### Nhóm Điều khiển
- **Hàng điều khiển thời gian:** tạm dừng hoặc tiếp tục, tốc độ ×0,5, ×1, ×2, ×4 dạng nút chọn một, đặt lại. Phím tắt như cũ.
- **Hai thanh trượt** "Nhiệt độ Mặt Trời" và "Gió", mỗi thanh có biểu tượng, giá trị hiện tại và một mô tả ngắn ở hai đầu: "Tắt nắng" / "Nắng gắt", "Lặng gió" / "Gió mạnh". Có nút **"Về mặc định"** cho riêng hai thanh, không đặt lại mô phỏng.
- **Góc nhìn sẵn**, nút và tham số `?view=`:

| Góc nhìn | Nội dung | Ghi chú |
|---|---|---|
| `overview` | Toàn cảnh | mặc định |
| `sea` | Từ biển nhìn vào núi | thấy gió đưa mây vào |
| `mountain` | Cận cảnh núi | thấy suối và hồ |
| `river` | Dọc sông | từ hồ ra cửa sông |

  - Chuyển góc nhìn có hiệu ứng chuyển mượt khoảng 1 giây.
  - Xoay hay thu phóng bằng chuột trong lúc đang chuyển thì dừng chuyển ngay và nhận điều khiển của người dùng, không giật.
  - Nút "Góc nhìn mặc định" đưa về `overview`.
- **Chất lượng đồ họa** "Cao" và "Thấp", nút và `?quality=`.
  - Mức Thấp: lưới địa hình thưa hơn, không gợn sóng biển, không bóng, mây ít khối hơn.
  - Quy luật mô phỏng giống hệt ở hai mức.
  - Nếu số khung hình trung bình dưới 30 trong 5 giây liên tiếp ở mức Cao, hiện một gợi ý không chặn: "Máy chạy chậm, thử chất lượng Thấp?", kèm nút chuyển. Gợi ý không tự đổi mức.
- Bật và tắt nhãn (phím L), như REQ-004.

### Nhóm Số liệu
- **Thẻ thời gian:** thời gian mô phỏng, tốc độ, trạng thái chạy.
- **Thẻ "Nước đang ở đâu":** một thanh ngang chia đoạn theo màu, mỗi đoạn là một nơi, kèm số và phần trăm:
  - Biển
  - Hồ
  - Ao
  - Trên không (gộp hơi nước và mây)
  - Đang rơi
  - Đang chảy (gộp sông, suối, mặt đất)

  Tổng luôn bằng 100% và bằng `n`.
- **Thẻ "Hồ và ao":** với mỗi vùng, mực nước dạng cột đứng có **vạch mực ban đầu**, mũi tên lên hay xuống theo xu hướng 10 giây gần nhất, và chữ "Ao đã cạn" khi ao cạn.
- **Thẻ "Mưa rơi ở đâu":**
  - Bộ đếm số giọt mưa đã chạm xuống từng vùng: **Núi, Đồng bằng, Biển, Hồ, Ao** (sông và suối tính vào vùng mà ô đó thuộc về), kèm phần trăm.
  - Nút **"Xóa bộ đếm"** đưa các bộ đếm về 0 mà không đặt lại mô phỏng, để học sinh đổi gió hay đổi nắng rồi đếm lại.
  - Đặt lại mô phỏng cũng đưa các bộ đếm về 0.
- **Thẻ "Đang diễn ra":** bốn giai đoạn theo quy tắc của REQ-001. Giai đoạn đang diễn ra sáng lên, kèm màu hạt tương ứng.

### Nhóm Chú giải
- Năm loại hạt: màu, tên tiếng Việt, một câu mô tả.
- Dòng "Hơi nước thật không nhìn thấy được; ở đây vẽ mờ để em theo dõi."
- Bảy vùng của bản đồ với màu tương ứng.

### Tham số URL và cửa kiểm thử
- Thêm `?view=` (`overview`, `sea`, `mountain`, `river`) và `?quality=` (`high`, `low`). Giá trị sai thì bỏ qua và dùng mặc định, không báo lỗi trên console.
- `window.__sim` (chỉ đọc) thêm: các bộ đếm mưa theo vùng, phân bố "nước đang ở đâu", góc nhìn sẵn đang chọn (hoặc "tự do" sau khi người dùng xoay), mức chất lượng, trạng thái thu gọn của bảng.

## Ràng buộc kỹ thuật
- Như REQ-004: HTML, JavaScript thuần (ES modules), three.js trong `vendor/`, không CDN, không npm dependency, không bước build. `package.json` vẫn chỉ có `type` và `scripts.test`.
- Phần tính số liệu (phân bố nước, bộ đếm mưa theo vùng, xu hướng mực nước, quy tắc "Đang diễn ra"), phần tính các góc nhìn sẵn và đường chuyển camera, và phần chọn mức chất lượng là module thuần; `node --test` chạy không cần trình duyệt.
- Giao diện là HTML và CSS phủ trên canvas, không vẽ chữ vào WebGL (trừ nhãn 3D đã có).
- Mọi chữ hiển thị nằm trong một file nội dung riêng.

## Ngoài phạm vi
- Theo dõi một giọt nước, bảng giải thích chi tiết, gợi ý thí nghiệm, giọt mây hút nhau (REQ sau).
- Biểu đồ theo thời gian, xuất số liệu, lưu cài đặt giữa các phiên.
- Chế độ tối, đa ngôn ngữ, giao diện điện thoại, cảm ứng, âm thanh, phát hành công khai.

## Tiêu chí nghiệm thu
- **AC-1 (luồng):** Mở trang ở ×1 với tham số mặc định:
  1. Thấy bảng điều khiển gọn bên phải. Thu gọn rồi mở lại; gập và mở từng nhóm.
  2. Chuyển qua bốn góc nhìn sẵn; xoay chuột trong lúc đang chuyển.
  3. Kéo Gió về 0 rồi bấm "Xóa bộ đếm": sau khoảng một phút, thẻ "Mưa rơi ở đâu" cho thấy phần lớn mưa xuống biển.
  4. Kéo Gió lên 100 và xóa bộ đếm: tỷ lệ mưa xuống núi tăng rõ.
  5. Bấm "Về mặc định" cho thanh trượt; đổi chất lượng sang Thấp rồi về Cao.
  6. Thẻ "Nước đang ở đâu" và "Hồ và ao" thay đổi theo cảnh. Đặt lại.

  Có kịch bản đầu-cuối chạy bằng trình duyệt cho luồng này, kèm một biến thể bị gián đoạn giữa chừng (đổi kích thước cửa sổ khi bảng đang mở, bấm liên tiếp nhiều góc nhìn, thu gọn bảng trong lúc đang chuyển góc nhìn) rồi tiếp tục. Console không có lỗi.
- **AC-2 (phân bố nước):** Ở mọi bước của một lần chạy 300 giây, các đoạn của "Nước đang ở đâu" khớp với số hạt theo trạng thái và theo vùng chứa, tổng bằng `n` và bằng 100% (sai số làm tròn hiển thị không quá 1%). Có test logic.
- **AC-3 (bộ đếm mưa):**
  - Mỗi giọt mưa được đếm đúng một lần, lúc chạm xuống, vào đúng một vùng theo vị trí chạm.
  - Tổng các bộ đếm bằng số giọt mưa đã chạm xuống.
  - "Xóa bộ đếm" đưa tất cả về 0 mà không đổi trạng thái mô phỏng; đặt lại cũng đưa về 0.
  - Với seed cố định, tỷ lệ "Núi" ở gió 100 lớn hơn ở gió 0.

  Có test logic.
- **AC-4 (hồ và ao):**
  - Mực hiển thị đúng mực nước của REQ-004.
  - Vạch ban đầu đúng mực lúc bắt đầu.
  - Mũi tên đi lên khi mực 10 giây gần nhất tăng, đi xuống khi giảm, không có mũi tên khi đứng yên (có ngưỡng để không nhấp nháy).
  - "Ao đã cạn" hiện đúng khi ao cạn.

  Có test logic.
- **AC-5 (góc nhìn sẵn):**
  - Bốn góc nhìn đặt camera đúng vị trí trong file dữ liệu và nằm trong giới hạn camera của REQ-004.
  - Đường chuyển kéo dài khoảng 1 giây, không đi xuyên địa hình, kết thúc đúng góc nhìn đích.
  - Thao tác chuột trong lúc chuyển thì dừng chuyển, không nhảy.
  - `?view=river` mở ở góc nhìn dọc sông.

  Có test logic cho module camera.
- **AC-6 (chất lượng):**
  - Hai mức cho cùng trạng thái mô phỏng ở cùng số bước.
  - Mức Thấp vẽ ít tam giác địa hình hơn và không có gợn sóng.
  - Gợi ý "Máy chạy chậm" chỉ hiện khi số khung hình trung bình dưới 30 trong 5 giây liên tiếp ở mức Cao, không tự đổi mức, và đóng được.

  Có test logic cho quy tắc gợi ý, với chuỗi thời gian khung hình mô phỏng.
- **AC-7 (bảng điều khiển):**
  - Thu gọn và mở rộng không làm mô phỏng nhảy hay dừng.
  - Khi mở, bảng chiếm không quá 30% chiều rộng ở cửa sổ 1024 px và 1920 px.
  - Mọi điều khiển dùng được bằng bàn phím (Tab và Enter). Phím tắt mô phỏng không bị chặn khi focus không nằm trong thanh trượt.
  - Chữ đạt tỷ lệ tương phản ít nhất 4,5:1 với nền bảng.

  Kịch bản trình duyệt kiểm tra kích thước và tương phản.
- **AC-8 (URL):** `?view=sea` và `?quality=low` có hiệu lực. `?view=moon`, `?quality=ultra` bị bỏ qua và dùng mặc định, không báo lỗi trên console. Có test.
- **AC-9 (ảnh cho nghiệm thu):** QA chụp các ảnh sau và đính kèm báo cáo:
  - bảng điều khiển mở ở góc nhìn mặc định;
  - bảng thu gọn;
  - bốn góc nhìn sẵn;
  - thẻ "Mưa rơi ở đâu" sau một phút gió 0 và sau một phút gió 100.
- **AC-10 (độ mượt):** QA đo số khung hình mỗi giây trong Chromium ở cả hai mức chất lượng, với bảng điều khiển mở, và ghi vào báo cáo. Số đo này chỉ để tham khảo; ngưỡng thật kiểm ở AC-12.
- **AC-11:** Mọi test của REQ-004 vẫn pass. `node --test` pass, không cần trình duyệt hay mạng, chạy xong trong khoảng 5 phút. `package.json` chỉ có `type` và `scripts.test`. `README.md` cập nhật: giao diện, góc nhìn sẵn, mức chất lượng, các thẻ số liệu và bộ đếm, tham số URL mới, cấu trúc thư mục, cách thử sản phẩm.
- **AC-12 (kiểm tay ở bước nghiệm thu, trên máy của người dùng):**
  - Giao diện **gọn, đẹp, cùng phong cách với sa bàn**, không che cảnh.
  - Hiểu ngay các thẻ số liệu mà không cần đọc hướng dẫn.
  - Tự làm được thí nghiệm "gió mạnh thì mưa xuống núi nhiều hơn" bằng thẻ "Mưa rơi ở đâu" trong vài phút.
  - Góc nhìn sẵn chuyển mượt và hữu ích.
  - Mức Cao chạy mượt (ít nhất 45 khung hình mỗi giây với 1000 hạt); mức Thấp mượt hơn rõ rệt.
