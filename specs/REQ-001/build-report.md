# Báo cáo kiểm chứng build REQ-001

Ngày: 2026-10-27. Phạm vi: bước 7–10 của kế hoạch; các bước 1–6 đã có trước phiên này.

## Môi trường và lệnh

- Linux x86_64, Node v24.22.1, Python 3.11.2.
- Chromium headless 140.0.7339.16, Playwright toàn cục có sẵn; không thêm dependency vào repo.
- Server: `python3 -m http.server 8000` tại gốc repo.
- Logic: `node --test`.
- Trình duyệt: `node e2e/cycle-flow.e2e.mjs`.
- Hiệu năng: `node e2e/measure-fps.e2e.mjs`.

## Nhịp và ổn định

| Mốc mặc định, ×1 | Đo được (giây mô phỏng) | Giới hạn |
| --- | ---: | ---: |
| Bốc hơi đầu | 0,9333 | 10 |
| Đám mây đầu | 13,2667 | 45 |
| Mưa đầu | 20,1333 | 75 |
| Về hồ đầu | 22,0833 | 120 |

Logic và E2E mặc định cho cùng các mốc. Quan sát trình duyệt được lấy theo RAF nên có thể trễ một frame so với bước xảy ra sự kiện. Mốc đo bằng giây mô phỏng; luồng mặc định dùng tốc độ ×1, không tăng tốc mô phỏng để kiểm các giới hạn.

Trong 600 giây mặc định, hồ còn ít nhất 370/600 hạt (61,7%, yêu cầu ≥20%). Test kiểm mọi cửa sổ 60 giây căn theo bước cố định bắt đầu từ giây 120: luôn có bốc hơi và về hồ. Các hằng số hiện có đã đạt nhịp, không cần thay đổi.

Test chín tổ hợp `sun ∈ {0,50,100}` × `wind ∈ {0,40,100}` chạy 600 giây mỗi tổ hợp, kiểm từng hạt ở từng bước: trạng thái hợp lệ, tổng lượng nước, nhiệt độ 0–100, số hữu hạn, không ngoài thế giới hay xuyên địa hình, số hạt water khớp hồ. Test bổ sung xác nhận sun=100 cho ít nhất 1,5 lần bốc hơi của mặc định trong 60 giây; ngắt nắng giữa chừng không bốc hơi mới nhưng vẫn ngưng tụ, mưa và về hồ.

## Kịch bản trình duyệt

Cả hai luồng đạt, console/pageerror không lỗi:

- Mặc định ×1, cửa sổ 1024×900: ghi nhận nước nhận nhiệt, đủ năm trạng thái, đám mây và nước về hồ trong hạn; kiểm tạm dừng không đổi snapshot, slider 0/100, HUD, phím Space/1–4/R, tốc độ, reset và snapshot đóng băng sâu.
- Biến thể ×8: sau bốc hơi, ba lần dừng/tiếp tục xen thay kích thước cửa sổ; tiếp tục đủ vòng và cùng các kiểm tra điều khiển. Mốc quan sát lần cuối: 0,9333 / 13,3333 / 20,2667 / 22,1167 giây.
- URL hợp lệ: n=300/sun=80/wind=0/seed=7/speed=8/paused=1. Sau chạy cùng số bước, snapshot khớp World độc lập với seed=7.
- URL không hợp lệ: n=50/5000/abc, sun=-5, wind=200, speed=0 đều trở về mặc định của tham số tương ứng.
- Ở rộng 1024 px, không tràn ngang; đã xem ảnh giao diện để kiểm bố cục và chữ.

## FPS (AC-12)

Chromium 140.0.7339.16, viewport 1280×1000, 600 hạt, tốc độ ×1. Bắt đầu đo tại t=22,0667 giây với cả năm trạng thái: water=471, vapor=34, cloud=77, rain=17, runoff=1.

Lượt cuối đếm 601 frame trong 10,0163 giây thực: **60,0022 FPS**, đạt yêu cầu trung bình ≥45. Không có lỗi console hoặc pageerror. Công cụ đếm nhịp `requestAnimationFrame`; kết quả là số đo trên môi trường headless này, QA có thể chạy lại cùng lệnh trên máy đích.

## Phần cần phân biệt khi nghiệm thu

- AC-14 dành cho người kiểm tay: chưa có học sinh đánh giá mức độ nhận biết núi/hồ/Mặt Trời, hiểu năm loại hạt, thấy tác dụng thanh và cảm nhận chuyển động. Kiểm tự động và ảnh giao diện không thay thế phần này.
- Theo quy tắc trễ bắt buộc, cụm ngừng mưa khi còn dưới 30 giọt. Vì vậy câu “cụm không bổ sung mưa hết trong 60 giây” được kiểm là xuống dưới ngưỡng và ngừng mưa, không phải 0 giọt. Test và README giữ rõ cách hiểu này; không thay đổi requirement/spec. Các giọt còn lại có thể mưa tiếp khi cụm được bổ sung.
- Không sửa các tài liệu được bảo vệ. `package.json` vẫn chỉ có `type` và `scripts.test`; README đã có đủ cách chạy/thử, điều khiển, URL, trạng thái, hằng số và cấu trúc.

## Kết quả cuối

`node --test`: **26/26 đạt**, 0 lỗi/skip, thời gian lượt cuối 125,70 giây. E2E và công cụ FPS đều kết thúc với mã 0. `git diff --check` đạt. Đã hoàn thành toàn bộ mười bước build; phần đánh giá thủ công AC-14 dành cho giai đoạn nghiệm thu như nêu trên.
