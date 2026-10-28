# REQ-006: Vòng tuần hoàn nước — nâng cấp đồ họa sa bàn

**Làm sau khi REQ-005 đã vào `main`.** Sửa trên codebase của REQ-004 và REQ-005. Đây là REQ **đồ họa**: quy luật mô phỏng không đổi.

## Bối cảnh và mục tiêu
Sản phẩm hiện đã chạy đúng và có giao diện tốt, nhưng cảnh còn **thô, trơn và xấu**: đồng bằng là một mặt phẳng xanh đồng màu, núi là các hình nón nhẵn, không có cây cối, mây mỏng, tia nắng là những đường dài tỏa từ một điểm, hồ trông như một khối nước có cột đứng bên dưới. Học sinh cấp 2 sẽ không thấy hấp dẫn.

Yêu cầu này nâng đồ họa lên thành một **sa bàn diorama low-poly đẹp, rõ ràng, dễ thương**: nhìn một lần là hiểu toàn cảnh, và có thêm nhãn giai đoạn đánh số ngay trong cảnh để học sinh nhìn ra thứ tự của vòng tuần hoàn.

Hướng đồ họa lấy từ hai ảnh concept mà người dùng đã chọn. **Ảnh không được đưa vào repo của project**, nên mọi yêu cầu dưới đây viết bằng lời và bằng danh sách kiểm. Các đặc điểm lấy từ concept:
- Khối đất nổi, cạnh cắt lớp như mô hình sa bàn; mặt tam giác phẳng; màu dịu; nền trời chuyển từ xanh nhạt sang kem ở chân trời.
- Núi gồ ghề có nhiều đỉnh, có đỉnh phủ màu trắng; chân núi và đồng bằng phủ rừng cây thông low-poly.
- Đồng bằng có các ô ruộng màu nhạt.
- Mây bông dày; mưa rơi thành màn từ đáy mây xám.
- Hồ và sông có hình dạng tự nhiên, nối liền nhau.
- Nhãn bo tròn đặt trong cảnh; nhãn giai đoạn đánh số 1 đến 4.
- Mũi tên trên trời "Gió đưa mây vào đất liền".

## Nguyên nhân nhìn chưa đẹp (để PM và Dev xử lý đúng chỗ)
Qua đọc mã hiện tại:
1. Mỗi đỉnh núi là một hình nón (`1 − khoảng cách` theo elip), nhiễu địa hình chỉ ±0,6 đơn vị, nên mặt đất gần như phẳng.
2. Màu địa hình chỉ phụ thuộc vùng và độ cao thô, không phụ thuộc độ dốc hay nhiễu.
3. Không có vật thể trang trí nào (cây, ruộng).
4. Tia nắng là các đoạn thẳng dài từ một điểm trên trời.
5. Mây là vài khối nhỏ; mưa là các nét rời.
6. Hồ và ao là một mảnh nước tròn đặt trên địa hình, lộ phần dưới.

## Phạm vi

### A. Địa hình
- **Núi:** vẫn nằm ở phía tây và đỉnh cao nhất vẫn khoảng 280 đến 300, nhưng có hình dạng **gồ ghề tự nhiên**: nhiều đỉnh phụ, sống núi, sườn có nếp, đỉnh không đối xứng. Dùng nhiễu dạng sống núi (ridged noise) sinh từ seed của bản đồ.
- **Đồng bằng:** thoải về phía biển, có **gợn địa hình nhẹ** (biên độ vài đơn vị, tần số thấp), không còn một mặt phẳng; vẫn không có vùng trũng kín ngoài hồ và ao.
- **Suối** chảy trong các **khe núi** có thể thấy được (lòng suối lõm xuống).
- **Lưới địa hình** được phép mịn hơn (tới 160 × 160 ô) để nhìn đẹp. Mức chất lượng Thấp dùng lưới thưa hơn.
- **Bờ biển** có bãi cát thoải và vệt bọt trắng dọc bờ.
- **Màu địa hình** tính theo **độ cao, độ dốc và một lượng nhiễu nhỏ**, theo bảng màu pastel trong file dữ liệu:
  - đồng bằng có ít nhất hai sắc xanh lá xen nhau;
  - chân núi xanh đậm hơn;
  - sườn dốc màu nâu đất;
  - đỉnh núi phủ màu trắng ngà (xem ghi chú dưới);
  - bãi cát vàng nhạt.
- **Ô ruộng:** trên đồng bằng có các ô chữ nhật màu nhạt xen kẽ (màu, không có hình khối), đặt tất định theo seed, chỉ trên đất thoải, không đè lên nước và bờ.
- **Ghi chú tuyết:** màu trắng ở đỉnh núi **chỉ là màu**. Không có tuyết rơi, tan hay băng; điều này ghi rõ trong README mục "Mô hình đơn giản hóa".
- **Thay đổi địa hình không được làm hỏng mô phỏng.** Mọi bất biến của REQ-004 vẫn đúng với địa hình mới: mọi ô đất thoát về vùng nước, không vùng trũng kín ngoài hồ và ao, ít nhất ba suối bắt nguồn trên núi, hồ có cửa thoát ra sông, sông đổ ra biển, ao không có suối chảy vào. Vị trí hồ, ao, suối, sông trong file bản đồ có thể được chỉnh nhẹ cho khớp địa hình mới. **Nhịp, ổn định, mưa xuống núi theo gió và bảo toàn của REQ-004** (AC-9, AC-10, AC-11 của REQ-004) vẫn phải đạt.
- **Thứ tự làm:** đổi địa hình là bước đầu tiên của plan. Chạy lại ngay các test mô phỏng của REQ-004 trước khi làm phần trang trí.
- **Phương án dự phòng (định sẵn, không cần hỏi người):** nếu địa hình gồ ghề làm các test mô phỏng không đạt sau khi đã hiệu chỉnh hằng số, thì tách thành hai lớp:
  - **Địa hình của mô phỏng:** chỉ đổi hình dạng lớn qua file bản đồ (nhiều đỉnh hơn, có sống núi), giữ đạt các test.
  - **Địa hình để vẽ:** bằng địa hình của mô phỏng cộng một lớp chi tiết gồ ghề chỉ để nhìn. Biên độ của lớp chi tiết có giới hạn, và bằng 0 trong lòng suối, lòng sông, hồ, ao, bờ biển và biển.
  - Hạt nằm trên mặt đất (`runoff`, và hạt `rain` lúc chạm đất) được **vẽ** ở độ cao của địa hình để vẽ, để không lơ lửng hay chìm.

  Báo cáo build ghi rõ phương án nào đã dùng và vì sao. Chỉ hỏi người (`need_human`) nếu cả phương án dự phòng cũng không đạt.

### B. Cây cối (chỉ để trang trí)
- **Cây thông low-poly** (vài khối nón chồng lên nhau, một thân), vẽ bằng `InstancedMesh`.
- Mức Cao: khoảng 1500 đến 3000 cây. Mức Thấp: không quá 500 cây.
- Đặt **tất định** theo seed của bản đồ (không dùng bộ sinh của mô phỏng), thành **từng cụm rừng** (nhiễu), dày ở chân núi và sườn thấp, thưa trên đồng bằng. Không đặt:
  - trên nước, lòng suối, lòng sông, bãi cát;
  - nơi dốc quá ngưỡng;
  - trên vùng đỉnh phủ trắng.
- Kích thước và sắc xanh thay đổi nhẹ giữa các cây.
- Cây **không ảnh hưởng gì đến mô phỏng** (không va chạm, không bốc hơi).

### C. Nước
- **Hồ và ao** có đường viền tự nhiên (không phải hình elip đều), nằm trong lòng chảo lõm của địa hình. Không còn khối nước nổi trên mặt đất, không còn cột nước thẳng đứng hay cạnh lộ ra ở bất kỳ góc nhìn sẵn nào. Mực nước dâng hạ thấy được.
- **Hồ nối liền với sông:** nước từ cửa thoát của hồ chảy liền một dải sang sông, không đứt đoạn, không cao hơn mặt đất.
- **Sông và suối** là dải nước mượt, rộng dần về hạ lưu, có dải sáng trôi theo chiều chảy.
- **Biển:** màu nhạt ở gần bờ và đậm dần ra xa (như concept); có vệt bọt ở bờ; sóng gợn nhẹ ở mức Cao. Cạnh sa bàn phía biển thấy lớp nước trong có chiều sâu.

### D. Mây và mưa
- Mỗi cụm mây từ `cloudMinSize` giọt trở lên được vẽ thành **khối mây bông** gồm nhiều (khoảng 5 đến 12) khối cầu low-poly chồng lên nhau, to dần theo số giọt. Mặt trên sáng, mặt dưới hơi tối. Trắng ở cụm nhỏ, xám dần khi cụm lớn.
- Giọt mây lẻ và hơi nước: giữ như hiện tại (đốm nhỏ), không làm rối cảnh.
- **Mưa:** khi cụm đang mưa, thấy một **màn mưa** từ đáy mây xuống đất: nhiều nét mảnh, ngắn, màu xanh, mật độ vừa phải, đủ nhìn thấy rõ cả khi nhìn từ xa.

### E. Mặt Trời và tia nắng
- Thấy **một Mặt Trời** (đĩa sáng có quầng) ở bầu trời, vị trí hợp với hướng ánh sáng chính của cảnh.
- **Tia nắng** thay bằng vài chùm sáng mảnh, ngắn, nhạt, **chỉ chiếu xuống mặt nước nơi đang bốc hơi** (độ dài không quá một phần ba chiều cao của cảnh), thưa hơn nhiều so với hiện tại, mờ dần theo độ dài. Chùm sáng gắn với các lần bốc hơi của mô phỏng như hiện tại, không thêm quy luật mới.
- Thanh Mặt Trời về 0 thì quầng của Mặt Trời mờ đi và không còn chùm sáng.

### F. Sa bàn, ánh sáng và bầu trời
- **Mặt cắt bốn cạnh** của khối đất có **3 đến 5 lớp** màu (lớp cỏ mỏng, đất sáng, đất nâu, đá tối) với ranh giới lượn theo độ cao địa hình. Cạnh phía biển lộ lớp nước.
- **Đáy khối** có bóng đổ nhẹ xuống nền, để khối trông nổi.
- **Bầu trời** chuyển từ xanh nhạt ở trên sang tông kem hay hồng nhạt ở chân trời. Có sương mờ nhẹ ở xa.
- **Ánh sáng:** một nguồn sáng hướng cộng ánh sáng môi trường dịu. Ở mức Cao có bóng mềm của núi lên đồng bằng nếu giữ được khung hình; nếu không giữ được thì bỏ bóng (có ghi lý do trong báo cáo).
- Bảng màu mới nằm trong file dữ liệu, mỗi màu có tên.

### G. Nhãn giai đoạn và mũi tên gió
- **Tên bốn giai đoạn thống nhất** ở mọi nơi (nhãn trong cảnh, thẻ "Đang diễn ra", chú giải, README): **Bốc hơi, Ngưng tụ, Mưa, Dòng chảy**. Thay tên hiện có trong file nội dung ("Ngưng tụ thành mây", "Mưa rơi", "Chảy về vùng chứa"); test nào kiểm tên cũ thì cập nhật theo.
- **Màu theo giai đoạn** nhất quán giữa nhãn, thẻ "Đang diễn ra" và chú giải (gợi ý: bốc hơi màu cam, ngưng tụ xám xanh, mưa xanh dương, dòng chảy xanh đậm).
- Bốn **nhãn giai đoạn đánh số**, kiểu chip bo tròn có số trong vòng tròn màu. Mỗi nhãn **bám theo nơi giai đoạn đó đang thật sự xảy ra**, để nhãn không bao giờ chỉ sai chỗ:

| Nhãn | Bám theo | Khi không có |
|---|---|---|
| **1 Bốc hơi** | phía trên vùng chứa có nhiều hạt bốc hơi nhất trong 10 giây gần nhất (thường là biển) | ẩn (ví dụ thanh Mặt Trời ở 0) |
| **2 Ngưng tụ** | phía trên đám mây **chưa mưa** lớn nhất | ẩn |
| **3 Mưa** | bên cạnh đám mây **đang mưa** lớn nhất | ẩn |
| **4 Dòng chảy** | trên đoạn suối hay sông có nhiều hạt `runoff` nhất trong 10 giây gần nhất | ẩn |

  - Nhãn di chuyển **mượt** (làm trơn vị trí), không nhảy qua lại giữa hai đám mây gần bằng nhau; chỉ đổi đối tượng bám khi đối tượng mới lớn hơn rõ rệt (có ngưỡng trễ).
  - Nhãn hiện ra và ẩn đi bằng hiệu ứng mờ dần.
  - Cách chọn đối tượng bám là module thuần, tính từ trạng thái mô phỏng.
- **Bấm vào nhãn giai đoạn hay nhãn vùng** thì camera lượn tới góc nhìn gần nơi đó, dùng cơ chế chuyển cảnh của REQ-005 (dừng ngay khi người dùng tự xoay hay thu phóng). Bấm nhãn giai đoạn thì camera nhìn vào vị trí của nhãn lúc bấm.
- **Mũi tên gió:** một mũi tên cong lớn trên trời, từ phía biển vào đất liền, kèm chữ "Gió đưa mây vào đất liền". Độ dài và độ đậm tăng theo thanh Gió; ẩn khi gió bằng 0. Mũi tên chỉ để nhìn.
- Phím N bật tắt nhãn giai đoạn và mũi tên gió; phím L bật tắt nhãn vùng như cũ. Các nhãn không che nhau ở góc nhìn mặc định.

### H. Mức chất lượng và ngân sách vẽ
- Hai mức Cao và Thấp của REQ-005 vẫn giữ, nay bao gồm: cây, độ mịn lưới, bóng, số khối mây, sóng biển.
- **Mô phỏng giống hệt ở mọi mức chất lượng** và giống hệt khi tắt hay bật các hiệu ứng trang trí.
- **Ngân sách vẽ** (đo bằng `renderer.info` trong kịch bản trình duyệt): mức Cao không quá 150 lần gọi vẽ (draw call) và 400.000 tam giác mỗi khung hình; mức Thấp không quá 80 lần gọi vẽ và 150.000 tam giác.

## Ràng buộc kỹ thuật
- Như REQ-004 và REQ-005: HTML, JavaScript thuần (ES modules), three.js trong `vendor/`, không CDN, không npm dependency, không bước build, không texture hay ảnh tải từ ngoài (màu và hình sinh bằng code). `package.json` vẫn chỉ có `type` và `scripts.test`.
- Phần tính **tất định** nằm trong module thuần để `node --test` kiểm được: sinh độ cao địa hình, màu địa hình theo độ cao và độ dốc, đặt cây, đặt ô ruộng, các lớp mặt cắt, vị trí nhãn giai đoạn. Phần dựng hình trong three.js chỉ dùng kết quả của chúng.
- **Không dùng bộ sinh ngẫu nhiên của mô phỏng** cho mọi thứ trang trí; dùng bộ sinh có seed riêng của bản đồ. Trạng thái mô phỏng không đổi dù bật hay tắt trang trí.
- `node --test` chạy xong trong khoảng 5 phút.
- **Kịch bản trình duyệt** nào không kiểm hình ảnh thì chạy ở chất lượng Thấp và `?speed=8`, để tổng thời gian kiểm thử trình duyệt không tăng quá nhiều so với REQ-005 (WebGL phần mềm trong sandbox đã chỉ đạt khoảng 8 khung hình mỗi giây ở mức Cao).

## Ngoài phạm vi
- Nước ngầm và tầng thấm (giai đoạn thứ năm); chế độ "từng bước"; quiz; theo dõi một giọt nước; bảng giải thích (REQ sau).
- Camera tự xoay.
- Tuyết rơi hay tan, mùa, ngày và đêm, thời tiết khác, thủy triều.
- Cây lớn lên hay thoát hơi nước, động vật, nhà cửa.
- Địa hình do học sinh chỉnh; nhiều bản đồ.
- Âm thanh, cảm ứng, điện thoại, lưu cài đặt, đóng gói, phát hành công khai.

## Tiêu chí nghiệm thu
- **AC-1 (luồng):** Mở `http://localhost:8000` ở ×1 với tham số mặc định.
  1. Thấy sa bàn mới: núi gồ ghề có nhiều đỉnh và đỉnh trắng, rừng cây, ô ruộng, hồ nối sông, biển nhạt dần, mặt cắt nhiều lớp, Mặt Trời, mũi tên gió.
  2. Trong 120 giây thấy mây bông hình thành, màn mưa trên núi, nước chảy về hồ và sông; nhãn "Ngưng tụ" và "Mưa" đi theo các đám mây.
  3. Kéo Gió về 0: mũi tên gió ẩn; khi mưa rơi xuống biển, nhãn "Mưa" ở trên biển chứ không ở trên núi.
  4. Bấm các nhãn để camera lượn tới; xoay và thu phóng; bật tắt nhãn (N, L); chuyển chất lượng Cao và Thấp; tạm dừng và tiếp tục.

  Có kịch bản đầu-cuối chạy bằng trình duyệt cho luồng này, kèm một biến thể bị gián đoạn giữa chừng (đổi kích thước cửa sổ, bấm nhãn trong lúc camera đang lượn, đổi chất lượng khi đang chạy). Console không có lỗi.
- **AC-2 (địa hình mới vẫn đúng):** Toàn bộ AC về bản đồ và thoát nước của REQ-004 (AC-2, AC-3, AC-7) vẫn đúng với địa hình của mô phỏng. Địa hình **dùng để vẽ** không còn dạng nón và đồng bằng không còn phẳng, đo bằng số:
  - Vùng núi có ít nhất 6 đỉnh cục bộ, mỗi đỉnh cao hơn mọi điểm trong bán kính 40 đơn vị quanh nó ít nhất 15 đơn vị.
  - Độ lệch chuẩn của độ dốc trong vùng núi ít nhất gấp đôi giá trị của địa hình REQ-004.
  - Trên đồng bằng (trừ lòng sông, ao, bờ), độ lệch chuẩn của độ cao sau khi bỏ độ dốc tổng thể nằm trong khoảng 1 đến 6 đơn vị.

  Có test logic.
- **AC-3 (nhịp và ổn định giữ nguyên):** Các AC về nhịp, ổn định, mưa xuống núi theo gió và bảo toàn của REQ-004 (AC-9, AC-10, AC-11) vẫn đạt. Báo cáo build ghi rõ đã dùng một lớp địa hình hay phương án dự phòng hai lớp. Nếu dùng hai lớp, có test cho thấy lớp chi tiết bằng 0 trong lòng suối, sông, hồ, ao, bờ và biển, có biên độ không vượt giới hạn, và hạt trên mặt đất được vẽ ở độ cao của địa hình để vẽ. Có test logic chạy mô phỏng không cần trình duyệt.
- **AC-4 (màu địa hình):** Màu của từng đỉnh lưới là hàm thuần của độ cao, độ dốc và nhiễu. Đỉnh núi cao hơn ngưỡng tuyết là màu trắng; sườn dốc hơn ngưỡng là màu nâu; ô đồng bằng thoải có ít nhất hai sắc xanh khác nhau; ô nước và bãi cát không bị tô màu cỏ. Cùng dữ liệu bản đồ thì cùng màu. Có test logic.
- **AC-5 (cây):**
  - Mức Cao có từ 1500 đến 3000 cây; mức Thấp không quá 500.
  - Không cây nào nằm trên ô nước, lòng suối, lòng sông, bãi cát hay nơi dốc quá ngưỡng.
  - Cùng dữ liệu thì cùng vị trí cây.
  - Mật độ cây ở chân núi lớn hơn rõ rệt mật độ trên đồng bằng.
  - Bật tắt cây không đổi trạng thái mô phỏng.

  Có test logic.
- **AC-6 (ô ruộng):** Ô ruộng chỉ nằm trên đất thoải, không đè lên nước, bãi cát hay lòng suối; cùng dữ liệu thì cùng vị trí. Có test logic.
- **AC-7 (nước):** Kịch bản trình duyệt chụp bốn góc nhìn sẵn (toàn cảnh, từ biển nhìn vào núi, cận cảnh núi, dọc sông) và QA xác nhận bằng ảnh: hồ và ao nằm trong lòng chảo, không còn khối nước nổi hay cột nước đứng, hồ liền sông liền biển, biển nhạt dần ở gần bờ, có bọt ở bờ. Mực nước hồ và ao vẫn khớp với mô phỏng. Có test logic cho phần tính đường viền và lòng chảo.
- **AC-8 (mây và mưa):**
  - Cụm mây đủ ngưỡng được vẽ thành khối bông có số khối cầu trong khoảng 5 đến 12, tăng đơn điệu theo số giọt.
  - Màu xám của mây là hàm đơn điệu của số giọt (giữ AC của REQ-004).
  - Cụm đang mưa có màn mưa nhìn thấy từ đáy mây xuống đất; cụm không mưa thì không có.
  - Số khối cầu và màn mưa không đổi trạng thái mô phỏng.

  Có test logic cho phần tính khối mây; ảnh chụp lúc mưa đính kèm báo cáo.
- **AC-9 (Mặt Trời và chùm sáng):**
  - Có Mặt Trời trong cảnh ở mọi góc nhìn sẵn.
  - Mỗi chùm sáng bắt đầu từ trên cao, kết thúc ở mặt nước, và dài không quá một phần ba chiều cao cảnh.
  - Số chùm sáng không quá 30 ở cùng một thời điểm.
  - Thanh Mặt Trời ở 0 thì không có chùm sáng và quầng Mặt Trời mờ hơn mức mặc định.
  - Không chùm sáng nào đi xuyên địa hình.

  Có test logic cho phần tính chùm sáng.
- **AC-10 (mặt cắt và sa bàn):** Mỗi trong bốn cạnh của khối đất có từ 3 đến 5 lớp màu, ranh giới theo độ cao địa hình, không có khe hở hay lớp chồng chéo. Cạnh phía biển lộ lớp nước. Khối có bóng dưới đáy. Có test logic cho phần tính các lớp.
- **AC-11 (nhãn giai đoạn):**
  - Có đủ bốn nhãn giai đoạn đánh số, đúng tên (Bốc hơi, Ngưng tụ, Mưa, Dòng chảy) và đúng số. Cùng bốn tên đó dùng trong thẻ "Đang diễn ra", chú giải và README.
  - **Bám đúng chỗ:**
    - "Mưa" nằm cạnh đám mây đang mưa lớn nhất;
    - "Ngưng tụ" nằm trên đám mây chưa mưa lớn nhất;
    - "Bốc hơi" nằm trên vùng chứa bốc hơi nhiều nhất trong 10 giây gần nhất;
    - "Dòng chảy" nằm trên đoạn suối hay sông có nhiều dòng chảy nhất trong 10 giây gần nhất;
    - nhãn ẩn khi giai đoạn không có đối tượng.
  - Với gió 0 và seed cố định, khi mưa rơi xuống biển thì nhãn "Mưa" nằm trên biển.
  - **Không nhảy:** hai đám mây gần bằng nhau thì nhãn không đổi đối tượng bám liên tục (có ngưỡng trễ); vị trí nhãn thay đổi liên tục, không nhảy quá một khoảng giới hạn mỗi khung hình.
  - Bấm nhãn thì camera lượn tới và dừng ở góc nhìn gần vị trí nhãn lúc bấm, không xuyên địa hình; thao tác chuột trong lúc lượn thì dừng ngay.
  - Hai nhãn bất kỳ (kể cả nhãn vùng) không chồng nhau ở góc nhìn mặc định ở cửa sổ 1280 × 800 và 1920 × 1080.
  - Phím N và L bật tắt riêng từng bộ nhãn.
  - Màu theo giai đoạn nhất quán giữa nhãn, thẻ "Đang diễn ra" và chú giải.

  Có test logic cho phần chọn đối tượng bám, ngưỡng trễ và làm trơn; kịch bản trình duyệt kiểm tra bấm nhãn và không chồng.
- **AC-11b (mũi tên gió):** Mũi tên hướng từ biển vào đất liền; độ dài tăng đơn điệu theo thanh Gió; ẩn khi gió bằng 0; không đổi trạng thái mô phỏng. Có test logic cho phần tính hình mũi tên.
- **AC-12 (ngân sách vẽ và chất lượng):** Kịch bản trình duyệt đo `renderer.info` khi vòng đang chạy đủ các giai đoạn: mức Cao không quá 150 lần gọi vẽ và 400.000 tam giác; mức Thấp không quá 80 lần gọi vẽ và 150.000 tam giác. Mô phỏng cho cùng trạng thái ở cùng số bước giữa hai mức chất lượng và giữa lúc bật và tắt trang trí. QA đo số khung hình mỗi giây ở cả hai mức và ghi vào báo cáo; số đo chỉ để tham khảo, vì Chromium trong sandbox dùng WebGL phần mềm. Ngưỡng thật (ít nhất 45 khung hình mỗi giây ở mức Cao với 1000 hạt) kiểm ở AC-15 trên máy của người dùng.
- **AC-13 (bảng kiểm hình ảnh của QA):** QA chụp ít nhất chín ảnh:
  - bốn góc nhìn sẵn;
  - một ảnh lúc mưa trên núi;
  - một ảnh gió 0 lúc mưa trên biển (thấy nhãn "Mưa" ở trên biển);
  - một ảnh cận cảnh rừng và ô ruộng;
  - một ảnh mặt cắt cạnh sa bàn;
  - một ảnh có đủ bốn nhãn giai đoạn.

  Rồi QA điền một **bảng kiểm có/không** cho từng mục dưới đây, kèm tên ảnh làm bằng chứng.

  **Bắt buộc** (không mục nào được "không"):
  1. núi nhiều đỉnh và gồ ghề, không còn dạng nón;
  2. hồ và ao nằm trong lòng chảo, không còn khối nước nổi hay cột nước đứng; hồ liền với sông;
  3. không còn tia nắng dài tỏa khắp cảnh;
  4. mây bông dày và màn mưa nhìn thấy từ đáy mây;
  5. nhãn giai đoạn bám đúng chỗ (kể cả ảnh gió 0) và không che nhau.

  **Còn lại** (tối đa một mục "không", kèm lý do):

  6. đỉnh núi có màu trắng;
  7. rừng cây ở chân núi và rải trên đồng bằng;
  8. có ô ruộng trên đồng bằng;
  9. đồng bằng có ít nhất hai sắc xanh và có gợn;
  10. biển nhạt ở gần bờ, đậm ra xa, có bọt ở bờ;
  11. có Mặt Trời và chùm sáng ngắn chiếu xuống mặt nước;
  12. mặt cắt bốn cạnh có nhiều lớp màu;
  13. bầu trời chuyển màu từ xanh sang kem ở chân trời;
  14. mũi tên gió hiện và đổi độ dài theo thanh Gió.
- **AC-14:** `node --test` pass, không cần trình duyệt hay mạng, chạy xong trong khoảng 5 phút. `package.json` chỉ có `type` và `scripts.test`. Mọi test của REQ-004 và REQ-005 vẫn pass; test nào phải đổi theo địa hình mới thì báo cáo liệt kê từng cặp. `README.md` cập nhật:
  - phong cách và bảng màu;
  - địa hình (một lớp hay hai lớp, và vì sao) và cây cối;
  - nhãn giai đoạn, mũi tên gió và phím tắt;
  - ngân sách vẽ;
  - cách thử sản phẩm;
  - mục **"Mô hình đơn giản hóa"** thêm hai ý: màu trắng ở đỉnh núi chỉ là màu, không có tuyết rơi hay tan; cây chỉ để trang trí, thực tế cây cũng đưa hơi nước vào không khí (thoát hơi nước).
- **AC-15 (kiểm tay ở bước nghiệm thu, trên máy của người dùng):**
  - Sa bàn **đẹp và bắt mắt** hơn rõ rệt so với trước, gần với hướng của hai ảnh concept đã chọn: núi gồ ghề, có rừng, hồ và sông tự nhiên, mây bông, mặt cắt nhiều lớp.
  - Nhìn một lần là hiểu toàn cảnh; nhãn giai đoạn cho biết thứ tự bốc hơi, ngưng tụ, mưa, dòng chảy, và luôn chỉ đúng nơi đang xảy ra; mũi tên gió cho thấy gió đưa mây vào đất liền.
  - Bấm nhãn giai đoạn, camera lượn tới mượt.
  - Hiệu ứng đẹp mà không rối: không có tia nắng hay nhãn che mất cảnh; nhãn đi theo mây không bị giật.
  - Chạy mượt (ít nhất 45 khung hình mỗi giây với 1000 hạt ở mức Cao); mức Thấp nhẹ hơn rõ rệt.
