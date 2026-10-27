# Báo cáo nghiệm thu REQ-004 — vòng 1

Môi trường: Chromium headless (Playwright, WebGL2 SwiftShader), `python3 -m http.server 8000`, nhánh `req/REQ-004`.

## Đã chạy
- `node --test`: 39/39 đạt, 82,7 giây (< 5 phút). Kết quả AC-9/AC-10 in ra: mưa xuống núi gió 0/40/100 = 0 / 1611 trên 1735 / 2477 trên 2477; mốc mặc định bốc hơi 0,05 s, mây 28,1 s, mưa 33,3 s, về vùng chứa 36,9 s; hồ ≥ 179 hạt, 152 lượt suối → hồ, 108 lượt sông → biển.
- e2e có sẵn: `core-3d`, `scenery`, `cycle-flow` (×1 và gián đoạn ×8, kèm ca URL), `scene`, `screenshots`, `measure-fps` — đều đạt, console không lỗi.
- Kịch bản QA mới `tests/e2e/qa-journey.e2e.mjs` (chạy 2 lần: bình thường và có trục trặc giữa chừng — đặt lại ở giây ~20, xoay camera, đổi cỡ cửa sổ — rồi chạy tiếp 150 giây): tổng hạt luôn 1000; bốc hơi từ biển nhiều hơn hồ+ao; `rainLandings.mountain` 641 / 598; `returns` 570 / 553; mực hồ đổi (≈19,7 so với mức đầu); đủ 7 nhãn; console không lỗi.
- FPS (AC-15, tham khảo): 119 khung hình / 10,02 s = 11,9 FPS trên SwiftShader (phần mềm), 1000 hạt ×1.

## Kết quả theo tiêu chí

| AC | Kết quả | Cách kiểm |
|---|---|---|
| AC-1 (luồng) | pass | `cycle-flow.e2e.mjs` ×1 và biến thể gián đoạn (đổi cỡ cửa sổ, xoay camera khi tạm dừng, tạm dừng nhiều lần, `?speed=8`); thêm `tests/e2e/qa-journey.e2e.mjs` có trục trặc (đặt lại giữa chừng). Mưa núi, runoff, mực hồ đổi, tạm dừng đứng yên, Mặt Trời/Gió, đặt lại đều đạt. |
| AC-2 | pass | `node --test` (heightmap/drainage) 39/39 |
| AC-3 | pass | `node --test` |
| AC-4 | pass | `node --test` (reservoirs) |
| AC-5 | pass | `node --test` (heat) |
| AC-6 | pass | `node --test` (air/precipitation) |
| AC-7 | pass | `node --test` (drainage/precipitation) |
| AC-8 | pass | `node --test` (air) |
| AC-9 | pass | `node --test`, số liệu mưa núi ở trên tăng chặt theo gió |
| AC-10 | pass | `node --test`, mốc thời gian ở trên đều trong ngưỡng |
| AC-11 | pass | `node --test` (stability-*) |
| AC-12 | pass | `node --test` (camera) |
| AC-13 | pass | `scene.e2e.mjs`, `scenery.e2e.mjs` (7 nhãn không giao nhau, giả lập WebGL hỏng hiện thông báo); `screenshots.e2e.mjs` sinh 4 ảnh, đính kèm bên dưới |
| AC-14 | pass | `node --test` cho hàm đọc tham số; `cycle-flow` "URL cases passed", console sạch |
| AC-15 | pass | số đo 11,9 FPS (SwiftShader), chỉ để tham khảo |
| AC-16 | pass | `node --test` 82,7 s; `build-report.md` có bảng cặp test cũ → mới |
| AC-17 | pass | `package.json` chỉ có `type` và `scripts.test`; `vendor/` có three.module.min.js r170, README phiên bản, `three.LICENSE`; README có đủ các mục, gồm "Mô hình đơn giản hóa"; three chỉ import trong `src/ui/` |
| AC-18 | manual — Chờ người kiểm tay | Người xem: đẹp/low-poly dịu màu hơn REQ-001, nhận ra bảy vùng khi tắt nhãn (phím L), nước/mây trông đúng, câu chuyện biển → núi → biển, camera dễ dùng, ≥ 45 FPS trên máy thật (ở đây chỉ có SwiftShader). |

## Ảnh
- `eval/round-1/01-default.png` toàn cảnh mặc định
- `eval/round-1/02-sea-to-mountains.png` từ biển nhìn vào núi
- `eval/round-1/03-mountains-streams-lake.png` cận cảnh núi, suối, hồ
- `eval/round-1/04-mountain-rain.png` mây mưa trên sườn núi

## Lỗi cần sửa
Không có lỗi chặn nghiệm thu.

Ghi chú nhỏ: trong ảnh 04 (gió 40) phần lớn khối mây trắng còn nằm trên đồng bằng gần bờ; không vi phạm AC nào, người kiểm tay có thể cân nhắc ở AC-18.
