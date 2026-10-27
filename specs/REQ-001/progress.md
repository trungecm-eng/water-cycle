# Tiến độ REQ-001

## Phiên build ngày 2026-10-27 — bước 1
- Hoàn thành khung HTML/CSS, cấu hình đóng băng sâu, RNG mulberry32 và nội suy/kiểm tra lòng địa hình. Trục tọa độ logic hướng lên đúng yêu cầu.
- `node --test`: 3 test đạt, không cần cài dependency hay truy cập mạng.
- Tiếp theo: bước 2 (lưới hồ), rồi bước 3 (world/clock/URL và vẽ tối thiểu).
- Các hằng số nhịp/nhiệt/chuyển động trong cấu hình hiện là giá trị khởi đầu, phải hiệu chỉnh và kiểm chứng ở bước 7; chưa khẳng định đạt nhịp sản phẩm.

## Phiên build ngày 2026-10-27 — bước 2 và bàn giao
- Hoàn thành `Lake`: lấp hàng dưới trước, quản lý ô bằng tham chiếu đối tượng hạt, tìm hạt cao nhất mỗi cột, lấy ra và đưa vào ô trống thấp nhất rồi gần hoành độ nhất (hòa chọn trái). Mực nước tính từ số hạt; kiểm tra đủ 1.200 ô và chống thêm trùng/vượt sức chứa.
- `node --test`: toàn bộ 7 test đạt. Đã hoàn thành và đánh dấu bước 1–2; bước 3–10 chưa làm. Trang hiện mới là khung canvas, chưa có vòng mô phỏng hay điều khiển.
- Phiên sau bắt đầu bước 3: tạo world/clock/params, renderer tối thiểu, main và getter snapshot đóng băng `window.__sim`. Logic thuần không phụ thuộc DOM; dùng cùng đối tượng hạt khi gọi `Lake.remove`/`Lake.add`. `Lake.add` đặt lại nhiệt độ nền và vận tốc bằng 0.
- Repo chưa có `notes.md`, `eval/` hoặc tiến độ cũ tại thời điểm đọc. Không sửa các tài liệu được bảo vệ.
- Git chưa có danh tính mặc định. Commit thành công bằng các biến môi trường `GIT_AUTHOR_NAME=ai-dev-team GIT_AUTHOR_EMAIL=ai-dev-team@localhost GIT_COMMITTER_NAME=ai-dev-team GIT_COMMITTER_EMAIL=ai-dev-team@localhost` trước lệnh git, theo danh tính commit có sẵn; không sửa `.git/config`.
- Các hằng số điều khiển vật lý chỉ là khởi điểm, cần kiểm chứng ở các bước 4–7. Chưa chạy trình duyệt/E2E/FPS vì chưa triển khai các bước liên quan.

## Phiên build ngày 2026-10-27 — bước 3
- Hoàn thành World (hạt, hồ, bộ đếm, reset giữ thanh trượt, snapshot sao chép và đóng băng sâu), Clock (bước cố định, tốc độ, tạm dừng, giới hạn dồn), bộ đọc URL và renderer Canvas tối thiểu. `index.html` nạp `src/main.js`; getter `window.__sim` trả snapshot chỉ đọc kèm tốc độ/trạng thái tạm dừng.
- `node --test`: 11/11 test đạt. Bổ sung test URL, giới hạn đồng hồ ở các tốc độ, xen tạm dừng/đổi tốc độ cùng số bước, snapshot và reset. Có epsilon trong cấu hình để tránh mất bước do sai số khi trừ dt nhiều lần.
- Tiếp theo là bước 4: tia nhiệt, nguội nước, bốc hơi, lực đẩy lên và hiệu ứng rung; sau đó làm lần lượt bước 5–10. World.step hiện chỉ tăng số bước, chưa có chuyển trạng thái. Tính khác biệt theo seed của toàn bộ mô phỏng cần kiểm lại khi có hành vi ngẫu nhiên ở bước 4; RNG riêng đã có test ở bước 1.
- API dùng tiếp: `world.particles`, `world.lake`, `world.rng`, `world.rays`, `world.clusters`; `world.snapshot()`; `clock.advance(elapsedSeconds)`, `setPaused`, `reset`. Main hiện tự bỏ thời gian giữa các lần đổi visibility. Reset World và Clock cần được gọi cùng nhau khi nối nút ở bước 8.
- Chưa chạy trình duyệt/E2E/FPS; renderer hiện chỉ có địa hình, hồ, Mặt Trời và hạt ban đầu. Không khẳng định đạt các AC của vòng hoàn chỉnh.

## Phiên build ngày 2026-10-27 — bước 4
- Hoàn thành tia nhiệt phát theo sun, chọn cột bằng RNG có seed, bay tới hạt mặt nước hiện tại rồi truyền nhiệt; nước nguội về nền, chỉ mặt nước vượt 80 mới bốc hơi. Hơi nước có lực đẩy lên và giới hạn trần tạm thời. Renderer vẽ tia và rung mặt nước theo seed/id/thời gian, không đổi tọa độ logic hay tiêu thụ RNG.
- `node --test`: 15/15 test đạt, gồm test tia chỉ làm nóng đúng mặt nước, ngưỡng nhiệt, hạt bị chôn không bốc hơi, mức nước giảm, lực đẩy, sun=0 trong 120 giây, ngắt tia đang bay khi sun về 0, tính tất định và khác seed.
- Đã hoàn thành bước 1–4; tiếp theo bước 5: nhiệt độ môi trường, ngưng tụ, gió, va chạm địa hình và cụm mây. World.step hiện chưa có các quy luật đó; không coi trạng thái hiện tại là vòng hoàn chỉnh. Chưa kiểm chứng nhịp/ổn định, E2E hoặc FPS.
- Khi sun=0, xóa tia đang bay và phần nhịp tích lũy để bảo đảm không có bốc hơi mới ngay sau thao tác. Nước vẫn nguội, hơi đã có vẫn chuyển động. Bước 5 cần thay phần chuyển động vapor hiện tại để xử lý nhiệt và va chạm đầy đủ.
- Commit dùng danh tính qua biến môi trường như phiên trước, không sửa cấu hình Git.

## Phiên build ngày 2026-10-27 — bước 5
- Hoàn thành `air.js`: nhiệt độ môi trường theo độ cao, hơi nước nguội theo hàm mũ về nhiệt độ môi trường, ngưng tụ độc lập khi đạt ngưỡng; mây dừng chuyển động đứng, trôi ngang nhẹ tất định, gió đẩy sang trái. Va chạm chặn tại tường/trần và tìm điểm sát sườn bằng chia đôi, không đẩy mây lên cao theo sườn.
- Hoàn thành `clusters.js`: gom giọt mây bằng liên thông với lưới băm không gian, ngưỡng hiển thị 30 giọt; renderer vẽ hợp các vòng tròn mờ. Snapshot sao chép cả danh sách id của cụm trước khi đóng băng để không đóng băng dữ liệu mô phỏng.
- `node --test`: 19/19 test đạt. Test mới gồm nhiệt độ môi trường, ngưng tụ hạt riêng lẻ, giữ độ cao, gió/va chạm, cụm liên thông qua ô băm và bảo vệ snapshot. Chưa chạy trình duyệt, E2E hay FPS.
- Tiếp theo bước 6: bổ sung cờ mưa có trễ theo từng giọt, mưa dần, rơi thẳng, runoff và về hồ. `findClusters` hiện trả `{ids, size, visible, raining: false}`; cần bổ sung kế thừa cờ mưa khi tính lại cụm. `world.particles[id]` là hạt tương ứng vì mảng giữ nguyên thứ tự. Sau đó làm bước 7–10, chưa khẳng định nhịp hay ổn định đạt yêu cầu.
- Commit dùng danh tính qua biến môi trường như các phiên trước; không sửa cấu hình Git. Phiên này kết thúc tại bước hoàn chỉnh để phiên sau tiếp tục từ bước 6.

## Phiên build ngày 2026-10-27 — bước 6
- Hoàn thành `precipitation.js`: xác suất mưa theo dt và RNG, ngưỡng bắt đầu 80/tiếp tục từ 30 giọt với cờ kế thừa từng giọt; mưa bỏ vận tốc ngang, gia tốc trọng trường và tốc độ tối đa; bắt va chạm địa hình hoặc mực hồ trước khi xuyên qua. Runoff đi sang phải trên bề mặt, vào hồ bằng Lake.add; World đếm số lần về hồ. Canvas báo “Hồ đã cạn” khi không còn water (HUD đầy đủ thuộc bước 8).
- `node --test`: 23/23 test đạt. Kiểm thử mới: ngưỡng 79/80/40/29 và mưa dần, 10.000 hạt mưa ngẫu nhiên có seed, runoff từ mọi hoành độ nguyên 0–639 tới hồ trong 40 giây, rơi thẳng và tăng tốc ở gió 0/40/100, bảo toàn số hạt khi về hồ.
- Điểm cần biết: AC-6 có hai câu không đồng nhất nếu hiểu “mưa hết” là còn 0 giọt: quy tắc bắt buộc dừng dưới 30 để lại giọt mây. Triển khai giữ đúng quy tắc ngưỡng; test 60 giây kiểm cụm không bổ sung đã xuống dưới 30 và ngừng mưa, không khẳng định toàn bộ giọt đã thành rain. Cần nêu rõ khi nghiệm thu; không tự sửa requirement/spec.
- Tiếp theo bước 7: đo và hiệu chỉnh bốn mốc nhịp, ổn định 600 giây và lưới sun × wind; các hằng số chưa được hiệu chỉnh. Sau đó bước 8–10: giao diện điều khiển/HUD, E2E, README và FPS. Chưa chạy trình duyệt, chưa khẳng định toàn bộ AC đạt.
- Phiên dừng tại bước 6 hoàn chỉnh. Commit dùng biến môi trường danh tính ai-dev-team như phiên trước, không sửa cấu hình Git.
