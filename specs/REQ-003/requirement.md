# REQ-003: Vòng tuần hoàn nước — dòng chảy, theo dõi một giọt nước, phần giải thích

**Làm sau khi REQ-002 đã vào `main`.** Sửa trên codebase của REQ-001 và REQ-002.

## Bối cảnh và mục tiêu
Sau REQ-002, vòng tuần hoàn chạy đúng và học sinh thí nghiệm được với Mặt Trời và Gió. Còn ba việc để sản phẩm hoàn chỉnh cho học sinh tự học:
1. **Nước chảy trên sườn núi trông chưa thật.** Các hạt chảy cùng một tốc độ, có thể chồng lên nhau. Học sinh cần thấy nước chảy nhanh ở chỗ dốc, chậm ở chỗ thoải, thành dòng nối đuôi đổ về hồ.
2. **Học sinh chưa theo được một giọt nước cụ thể.** Câu hỏi tự nhiên của học sinh là "giọt nước này sẽ đi đâu?". Theo dõi một giọt nước qua cả vòng là cách hiểu vòng tuần hoàn rõ nhất.
3. **Chưa có phần giải thích.** Học sinh tự dùng, không có giáo viên bên cạnh, nên trang phải tự giải thích từng giai đoạn và nói rõ những chỗ mô hình đơn giản hóa so với thực tế.

**Mọi AC của REQ-001 và REQ-002 vẫn phải đúng**; test cũ không bị xóa hay làm yếu đi. Quy tắc chảy đơn giản của REQ-001 được thay bằng quy tắc dưới đây. Các AC về chảy của REQ-001 (AC-7: không xuyên địa hình, luôn đi xuống, tới hồ trong 40 giây) vẫn giữ.

## Phạm vi

### Dòng chảy trên sườn núi
- Hạt `runoff` chảy dọc bề mặt địa hình theo chiều đi xuống, với **gia tốc tăng theo độ dốc** của đoạn nó đang nằm, có ma sát và tốc độ tối đa. Chỗ dốc chảy nhanh, chỗ thoải chảy chậm.
- Trên đỉnh phẳng, hạt vẫn trôi sang phải với một tốc độ tối thiểu, không đứng yên mãi.
- Qua điểm gấp của địa hình, hạt đi tiếp sang đoạn kế, không đứng lại và không nhảy vị trí.
- **Nối đuôi:** các hạt `runoff` trên địa hình giữ một khoảng cách tối thiểu dọc đường chảy. Hạt phía sau chậm lại sau hạt phía trước, không chồng lên nhau, tạo thành dòng nối đuôi.
- **Đổ vào hồ:** hạt tới rìa hồ rời bề mặt và **rơi xuống** hồ (thấy được), rồi vào hồ theo quy tắc của REQ-001.

### Theo dõi một giọt nước
- Nút **"Theo dõi một giọt nước"** (hay phím F) chọn ngẫu nhiên một hạt `water` ở mặt hồ, theo bộ sinh có seed. **Bấm chuột** vào gần một hạt (trong bán kính nhỏ) thì chọn hạt gần nhất. Bấm lại nút, hay phím Esc, thì bỏ chọn.
- Hạt được chọn có vòng sáng bao quanh và một **vệt đường đi** ngắn (vài giây gần nhất), nhìn thấy được ở mọi trạng thái. Lúc là `vapor` hạt vẫn hiện rõ hơn hạt `vapor` khác.
- **Bảng "Hành trình của giọt nước":** trạng thái hiện tại bằng tiếng Việt, danh sách các giai đoạn đã qua kèm thời điểm (ví dụ "Bốc hơi — 12,3 s", "Ngưng tụ thành mây — 18,0 s"), và **số vòng giọt này đã đi trọn**.
- Giữ lựa chọn qua tạm dừng, đổi tốc độ và đổi thanh trượt. Đặt lại thì bỏ chọn.
- Khi đang theo dõi, nếu học sinh bấm tốc độ ×4, giọt vẫn được theo đúng.

### Đếm vòng
- Một hạt **đi trọn một vòng** khi nó về lại `water` sau khi đã qua `vapor`, `cloud` và `rain`, theo đúng thứ tự đó (có hay không có `runoff`). Mỗi hạt tự đếm số vòng của mình.
- HUD thêm **tổng số vòng đã đi trọn** của mọi hạt. Bộ đếm "số lần nước về hồ" của REQ-001 vẫn giữ.

### Phần giải thích cho học sinh
- **Bảng "Vòng tuần hoàn nước"**, mở và đóng bằng một nút hay phím H, mặc định mở ở lần đầu tải trang. Bảng có:
  - Bốn giai đoạn: tên tiếng Việt, màu hạt tương ứng, hai câu giải thích dễ hiểu cho học sinh cấp 2. Giai đoạn đang diễn ra (quy tắc "Đang diễn ra" của REQ-001) được làm nổi.
  - **Gợi ý thí nghiệm**, ba câu hỏi để học sinh tự thử. Ví dụ: "Kéo Mặt Trời về 0. Chuyện gì xảy ra với hồ sau một phút?" và "Gió mạnh hay gió yếu thì mưa xuống núi nhiều hơn? Dùng bộ đếm để kiểm tra."
  - **"Mô hình này đơn giản hóa thế nào"**, bốn ý ngắn:
    1. nước thật bay hơi ở mọi nhiệt độ, không chỉ khi rất nóng;
    2. hơi nước không nhìn thấy được;
    3. ngoài thực tế còn nước thấm xuống đất, nước ngầm, và cây cối thoát hơi nước;
    4. kích thước và tốc độ không đúng tỷ lệ thật.
- Mọi chữ tiếng Việt, câu ngắn, không dùng thuật ngữ ngoài sách giáo khoa cấp 2 mà không giải thích.

### Hiển thị và cửa kiểm thử
- Mực nước có một vạch mốc thể hiện mực nước lúc bắt đầu, để học sinh so sánh hồ đang cao hơn hay thấp hơn.
- `window.__sim` thêm: số vòng của từng hạt (hay tổng), hạt đang được theo dõi và hành trình của nó, vẫn chỉ đọc.

## Ràng buộc kỹ thuật
- Như hai REQ trước: HTML, JavaScript thuần (ES modules), Canvas 2D, không thư viện, không CDN, không bước build, không WebGL. `package.json` vẫn chỉ có `type` và `scripts.test`.
- Dòng chảy, nối đuôi, đếm vòng, chọn hạt và ghi hành trình là module thuần. Hằng số mới nằm trong file dữ liệu. Nội dung giải thích nằm trong một file nội dung riêng, không viết lẫn trong code vẽ.
- Tính tất định giữ như trước: cùng seed và cùng chuỗi thao tác (kể cả chọn theo dõi bằng nút) thì cùng kết quả.

## Ngoài phạm vi
- Sông nhiều nhánh, nước thấm và nước ngầm, thực vật, băng và tuyết, nhiều hồ hay nhiều núi.
- Quiz có chấm điểm, lưu tiến trình, tài khoản.
- Âm thanh, giao diện điện thoại, đóng gói, phát hành công khai.

## Tiêu chí nghiệm thu
- **AC-1 (luồng):** Mở trang ở ×1 với tham số mặc định. Bảng giải thích đang mở; đọc rồi đóng nó. Sau đó:
  1. Bấm "Theo dõi một giọt nước" và đi theo nó qua bốc hơi, mây, mưa, chảy hay rơi về hồ. Bảng hành trình ghi đúng từng giai đoạn kèm thời điểm.
  2. Đổi tốc độ ×4 trong lúc theo dõi.
  3. Bấm chuột chọn một giọt khác, rồi bỏ chọn.
  4. Thấy nước chảy nối đuôi trên sườn, nhanh ở chỗ dốc.
  5. Mở lại bảng giải thích; giai đoạn đang diễn ra được làm nổi.

  Có kịch bản đầu-cuối chạy bằng trình duyệt, kèm biến thể bị gián đoạn giữa chừng (tạm dừng nhiều lần, đổi kích thước cửa sổ, đổi thanh trượt trong lúc đang theo dõi) rồi tiếp tục. Console không có lỗi.
- **AC-2 (chảy theo độ dốc):**
  - Trên đoạn dốc hơn, gia tốc lớn hơn.
  - Tốc độ không vượt tốc độ tối đa.
  - Trên đỉnh phẳng vẫn trôi sang phải với tốc độ tối thiểu.
  - Qua điểm gấp không nhảy vị trí.
  - AC-7 của REQ-001 vẫn đúng: không xuyên địa hình, không đi lên cao hơn, từ mọi điểm tới hồ trong 40 giây.

  Có test logic.
- **AC-3 (nối đuôi):** Thả 50 hạt `runoff` liên tiếp ở cùng một điểm trên sườn: không lúc nào hai hạt gần nhau hơn khoảng cách tối thiểu dọc đường chảy, thứ tự của chúng trên đường chảy không đổi, và cả 50 hạt đều tới hồ. Có test logic.
- **AC-4 (đổ vào hồ):** Hạt tới rìa hồ rơi xuống bằng trọng lực rồi mới thành `water`, không nhảy thẳng vào ô. Nó nằm ở ô trống thấp nhất gần hoành độ của nó nhất, như AC-3 của REQ-001. Có test logic.
- **AC-5 (đếm vòng):**
  - Một hạt qua `water → vapor → cloud → rain → water`, có hay không có `runoff`, được tính đúng một vòng.
  - Đường đi thiếu một giai đoạn không được tính. Ví dụ: một hạt bốc hơi rồi bị đặt lại thì không được tính.
  - Tổng số vòng không bao giờ giảm (trừ khi đặt lại) và bằng tổng số vòng của từng hạt.
  - Với tham số mặc định, trong 600 giây có ít nhất 20 vòng đi trọn, và ít nhất một hạt đi trọn hai vòng.

  Có test logic.
- **AC-6 (theo dõi một giọt):**
  - Nút chọn một hạt `water` ở mặt hồ theo bộ sinh có seed; cùng seed và cùng thời điểm bấm thì chọn cùng một hạt.
  - Bấm chuột chọn hạt gần nhất trong bán kính; bấm vào chỗ trống thì không đổi lựa chọn.
  - Hành trình ghi mọi lần đổi trạng thái của hạt, đúng thứ tự, đúng thời điểm (một chữ số thập phân).
  - Lựa chọn được giữ qua tạm dừng, đổi tốc độ và đổi thanh trượt; mất khi đặt lại; Esc bỏ chọn.

  Có test logic cho phần chọn và ghi hành trình.
- **AC-7 (nội dung giải thích):**
  - Bảng có đủ bốn giai đoạn, ba gợi ý thí nghiệm và bốn ý "đơn giản hóa".
  - Nội dung nằm trong file nội dung riêng và được test đọc.
  - Giai đoạn đang diễn ra được làm nổi theo đúng quy tắc của REQ-001.
  - Phím H mở và đóng bảng.

  Có test cho file nội dung và quy tắc làm nổi.
- **AC-8 (ổn định cuối cùng):**
  - Ở mọi tổ hợp `sun ∈ {0, 50, 100}` và `wind ∈ {0, 40, 100}`, trong 600 giây: bảo toàn số hạt và tính tất định như AC-10 của REQ-001.
  - Với tham số mặc định, các mốc nhịp và ổn định của REQ-001 (AC-9) và mục tiêu thanh Gió của REQ-002 (AC-8) vẫn đạt.

  Có test logic.
- **AC-9 (độ mượt):** QA đo trong Chromium với 600 hạt, ở ×1, trong 10 giây khi đang theo dõi một giọt và có dòng chảy trên sườn: trung bình đạt ít nhất 45 khung hình mỗi giây. Ghi số đo vào báo cáo.
- **AC-10:** Mọi test của REQ-001 và REQ-002 vẫn pass. `node --test` pass, không cần trình duyệt hay mạng. `package.json` chỉ có `type` và `scripts.test`. `README.md` hoàn chỉnh:
  - bốn giai đoạn và quy luật của từng giai đoạn;
  - trạng thái hạt;
  - hai thanh trượt, bộ đếm, theo dõi một giọt nước;
  - điều khiển và tham số URL;
  - hằng số;
  - cấu trúc thư mục;
  - cách thử sản phẩm;
  - những điểm mô hình đơn giản hóa.
- **AC-11 (kiểm tay ở bước nghiệm thu):** Một học sinh cấp 2 tự dùng, không có người hướng dẫn:
  - đọc bảng giải thích và hiểu bốn giai đoạn;
  - theo dõi được một giọt nước đi hết vòng và kể lại được hành trình của nó;
  - thấy nước chảy nhanh ở chỗ dốc, thành dòng nối đuôi về hồ;
  - làm được ít nhất một gợi ý thí nghiệm và thấy kết quả;
  - chạy vài phút không cạn hồ, không đứng yên, không giật.
