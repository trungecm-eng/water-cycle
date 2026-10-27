# REQ-001 — Đặc tả: vòng tuần hoàn nước đơn giản, đủ bốn giai đoạn

## Tóm tắt
Một web app tĩnh (HTML + JavaScript thuần + Canvas 2D) mô phỏng vòng tuần hoàn nước bằng hệ hạt trên thế giới 2D 1000 × 600: núi bên trái, hồ bên phải, Mặt Trời trên hồ. Học sinh mở `http://localhost:8000` và trong khoảng hai phút thấy nước bốc hơi, ngưng tụ thành mây, mưa và chảy về hồ; vòng tự tiếp diễn mà hồ không cạn. Có hai thanh trượt (Mặt Trời, Gió), tạm dừng, tốc độ, đặt lại, HUD, chú giải và tham số URL. Mô hình không dạy sai: hơi nước vẽ thật mờ kèm chú thích, mây là giọt nước đã ngưng tụ, tổng số hạt không đổi.

## Phạm vi
**Trong phạm vi** (chi tiết quy luật xem `requirement.md`, mục "Phạm vi"):
- Thế giới, địa hình gấp khúc từ file dữ liệu, hồ dạng lưới ô, mực nước.
- Năm trạng thái hạt `water`, `vapor`, `cloud`, `rain`, `runoff` và bốn giai đoạn chuyển trạng thái.
- Tia nhiệt Mặt Trời, nhiệt độ môi trường theo độ cao, cụm mây (`clusterRadius`, `cloudMinSize`, `rainStartSize`, có trễ), mưa dần, mưa rơi thẳng đứng, chảy xuôi sườn về hồ.
- Thanh trượt Mặt Trời và Gió; tạm dừng, tốc độ ×0,5/×1/×2/×4, đặt lại (nút và phím Space, 1–4, R).
- Bước thời gian cố định `dt = 1/60`, bộ sinh số có seed, tất định; giới hạn dồn 0,25 giây.
- Tham số URL `n`, `sun`, `wind`, `seed`, `speed`, `paused`.
- HUD, "Đang diễn ra", chú giải màu, thông báo "Hồ đã cạn", cửa kiểm thử chỉ đọc `window.__sim`.
- Test logic bằng `node --test`, kịch bản đầu-cuối trên trình duyệt cho AC-1, `README.md`.

**Ngoài phạm vi:** mây đổi màu theo độ đặc, giọt mây hút nhau, mưa nhiều ở sườn đón gió (REQ-002); vật lý dòng chảy, dòng nối đuôi, theo dõi một giọt, phần giải thích chi tiết (REQ-003); thực vật, nước ngầm, băng tuyết, nhiều hồ/núi; âm thanh, cảm ứng, điện thoại, lưu cài đặt, đóng gói, phát hành.

## Tiêu chí chấp nhận
Nội dung đầy đủ của từng tiêu chí là mục "Tiêu chí nghiệm thu" trong `requirement.md`; dưới đây là bản tóm tắt kèm cách kiểm.

- AC-1 (luồng): Mở trang ở ×1, mặc định; trong 120 giây thấy đủ tia nhiệt → rung, bốc hơi → hơi mờ bay lên → giọt mây → đám mây → mưa → chảy sườn núi hoặc rơi vào hồ → mực nước dâng; rồi tạm dừng/tiếp tục, Mặt Trời 0 rồi 100, Gió 0 rồi 100, đổi tốc độ, đặt lại. Kiểm bằng kịch bản đầu-cuối `e2e/cycle-flow.e2e.mjs` (đọc `window.__sim`, dùng `?speed=8` để rút ngắn phần chờ khi cần) và biến thể gián đoạn (đổi kích thước cửa sổ, tạm dừng nhiều lần liên tiếp); console không có lỗi.
- AC-2: Địa hình và hằng số đọc từ file dữ liệu; địa hình đơn điệu không tăng, nội suy độ cao đúng; trong các lần chạy 600 giây của AC-10 không hạt nào ra ngoài thế giới hay nằm trong lòng địa hình. Kiểm bằng `node --test`.
- AC-3: Hồ ban đầu: `n` hạt ở ô khác nhau, hàng dưới lấp trước, mực nước đúng công thức; hạt mặt nước là hạt cao nhất của cột; rời/vào hồ làm mực nước đổi đúng `levelPerParticle`, hạt vào nằm ở ô trống thấp nhất gần hoành độ nhất; `n = 1200` chứa hết. Kiểm bằng `node --test`.
- AC-4: Tia chỉ làm nóng hạt mặt nước của cột nhắm tới; hạt không được làm nóng nguội về nhiệt độ nền và không xuống dưới; ≤ 80 vẫn là `water`, > 80 thành `vapor` và đi lên; chỉ hạt mặt nước bốc hơi. Kiểm bằng `node --test`.
- AC-5: `T_env` giảm đơn điệu, không âm; `vapor` tiến về `T_env`; tới `condenseTemp` thì thành `cloud`, mất lực đẩy, không đi lên tiếp; một hạt `vapor` đứng riêng vẫn ngưng tụ. Kiểm bằng `node --test`.
- AC-6: Cụm 29 giọt không có mây, 30 có; 79 không mưa, 80 mưa, đang mưa còn 40 vẫn mưa, dưới 30 thì ngừng; bước đầu của cụm vừa mưa có < 20% giọt thành `rain`; cụm không bổ sung mưa hết trong ≤ 60 giây; `rain` rơi thẳng đứng ở mọi giá trị gió, nhanh dần, không vượt tốc độ tối đa. Kiểm bằng `node --test`.
- AC-7: 10.000 hạt `rain` thả ngẫu nhiên có seed đều thành `runoff` hoặc `water`, không xuyên địa hình; `runoff` luôn trên bề mặt, không đi lên, từ mọi điểm tới hồ trong ≤ 40 giây. Kiểm bằng `node --test`.
- AC-8: `sun = 0` từ đầu thì 120 giây không bốc hơi; kéo về 0 giữa chừng thì hạt trên không vẫn đi hết vòng; `sun = 100` cho số lần bốc hơi trong 60 giây ≥ 1,5 lần mặc định; `wind = 0` không trôi ngang do gió; gió chỉ tác động `vapor` và `cloud`; bị gió đẩy vào sườn/tường thì dừng ở bề mặt; đổi thanh trượt không làm hạt nhảy vị trí. Kiểm bằng `node --test`.
- AC-9: Với mặc định: bốc hơi đầu ≤ 10 giây, đám mây đầu ≤ 45 giây, mưa đầu ≤ 75 giây, về hồ đầu ≤ 120 giây; trong 600 giây `water` luôn ≥ 20% `n`; từ giây 120 mỗi khoảng 60 giây có ≥ 1 lần bốc hơi và ≥ 1 lần về hồ. Kiểm bằng `node --test` chạy mô phỏng không trình duyệt.
- AC-10: Với `sun ∈ {0, 50, 100}` × `wind ∈ {0, 40, 100}`, 600 giây: tổng hạt và tổng theo trạng thái luôn bằng `n`, không NaN/vô hạn, nhiệt độ trong 0–100; cùng seed/tham số/chuỗi thao tác cùng số bước thì trạng thái giống hệt (kể cả xen tạm dừng, đổi tốc độ), khác seed thì khác; tạm dừng không chạy bước nào; sau nghỉ 10 giây một lần cập nhật ≤ 0,25 giây × tốc độ; đặt lại về trạng thái đầu. Kiểm bằng `node --test`.
- AC-11: `?n=300`, `?sun=80`, `?wind=0`, `?seed=7`, `?speed=8`, `?paused=1` có hiệu lực; `?n=50`, `?n=5000`, `?n=abc`, `?sun=-5`, `?wind=200`, `?speed=0` bị bỏ qua, dùng mặc định, console không lỗi. Kiểm bằng `node --test` cho hàm đọc tham số và kịch bản đầu-cuối cho console.
- AC-12: QA đo FPS trong Chromium, 600 hạt, ×1, 10 giây khi vòng đủ các giai đoạn; trung bình ≥ 45; ghi số đo vào báo cáo. Kiểm bằng đo trong trình duyệt (`requestAnimationFrame`).
- AC-13: `node --test` pass, không trình duyệt, không mạng; `package.json` chỉ có `type` và `scripts.test`; `README.md` có cách chạy và cách thử (lệnh, địa chỉ), bảng điều khiển và tham số URL, trạng thái hạt, hằng số và ý nghĩa, cấu trúc thư mục. Kiểm bằng chạy lệnh và đọc tệp.
- AC-14 (người kiểm tay): Ở ×1, không đọc hướng dẫn: nhận ra núi, hồ, Mặt Trời và năm loại hạt nhờ chú giải; trong khoảng hai phút thấy một vòng trọn; thấy rõ tác dụng hai thanh trượt; chuyển động mượt, chữ đọc được.

## Giả định
- Cấu trúc: `index.html`, `style.css` ở gốc; logic thuần ở `src/sim/` (không DOM/canvas); vẽ và giao diện ở `src/ui/`; mọi hằng số (kể cả địa hình, màu) ở `src/config.js` (module ES xuất một đối tượng đóng băng) để trình duyệt và Node cùng import, không cần đọc file JSON qua mạng.
- Test logic ở `test/*.test.js`. Kịch bản đầu-cuối ở `e2e/*.e2e.mjs`, tên không khớp mẫu mặc định của `node --test` nên không chạy trong `node --test` (AC-13 không cần trình duyệt). Kịch bản đầu-cuối dùng Playwright có sẵn trên máy kiểm thử (không thêm vào `package.json`); README ghi lệnh chạy.
- Bộ sinh số có seed: mulberry32; seed mặc định 1. Các hiệu ứng "tất định theo seed" chỉ để hiển thị (rung, trôi nhẹ) được tính từ seed, chỉ số hạt và thời gian, không tiêu thụ bộ sinh của mô phỏng.
- "Lần bốc hơi" = một hạt đổi `water` → `vapor`; "lần về hồ" = một hạt đổi `runoff`/`rain` → `water`. HUD hiển thị "số lần nước đã về hồ" là bộ đếm thứ hai; đặt lại đưa cả hai về 0.
- Hạt `water` vào hồ được đặt vào ô trống thấp nhất; nếu nhiều ô cùng thấp nhất thì chọn cột gần hoành độ nhất, hòa thì chọn cột bên trái.
- Hạt `vapor` mới bốc hơi đặt ngay trên mặt nước tại cột đó, giữ nhiệt độ hiện tại (> 80) rồi nguội dần về `T_env`; gió và lực đẩy lên chỉ tác động `vapor`/`cloud`.
- Cụm mây tính bằng liên thông theo khoảng cách ≤ `clusterRadius` (dùng lưới băm không gian); trạng thái "đang mưa" của cụm được giữ qua các bước bằng cách gán cờ cho từng giọt và kế thừa khi cụm được tính lại (cụm mới đang mưa nếu có giọt mang cờ mưa và còn ≥ `cloudMinSize` giọt).
- Tốc độ qua URL nhận mọi số trong [0,5; 8]; nút và phím chỉ cho ×0,5, ×1, ×2, ×4. `?n` nhận số nguyên; `?seed` nhận số nguyên bất kỳ.
- Đặt lại giữ `n` và seed đang dùng (từ URL hoặc mặc định), giữ giá trị thanh trượt hiện tại, tốc độ ×1, đang chạy.
- Cửa `window.__sim` là getter trả một đối tượng mới đã đóng băng mỗi lần đọc; sửa đối tượng đó không ảnh hưởng mô phỏng.
- Nhãn và chữ giao diện tiếng Việt; phông hệ thống, cỡ chữ tối thiểu 14 px.
