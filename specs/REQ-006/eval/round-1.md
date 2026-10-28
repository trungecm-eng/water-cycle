# Đánh giá REQ-006 — vòng 1

QA chạy lại toàn bộ trên mã hiện tại (nhánh `req/REQ-006`), theo `notes.md` (12:43: người dùng chấp nhận hiện trạng đồ họa, không chỉnh thêm núi/mép nước/màn mưa).

## Đã chạy
- `node --test`: **116/116 pass**, 0 fail/skip, 120,9 giây (< 5 phút, không cần trình duyệt).
- Server `python3 -m http.server 8000`, rồi các e2e: `art-flow` (luồng chính ×1, bản gián đoạn, mưa núi, mưa biển khi Gió 0), `art-budget`, `art-labels`, `art-stage-labels`, `art-trees`, `art-strata`, `art-atmosphere`, `art-screenshots`, `measure-fps`: đều pass, console không lỗi.
- `package.json` chỉ có `type` và `scripts.test`. README có đủ các mục (phong cách, một lớp địa hình + lý do, cây, nhãn/mũi tên/phím N–L, ngân sách vẽ, cách thử) và hai ý mới trong "Mô hình đơn giản hóa".
- Ngân sách (đủ bốn giai đoạn, t≈75 giây): Cao **65 lần vẽ / 250.441 tam giác** (≤150 / 400.000); Thấp **64 / 96.405** (≤80 / 150.000).
- FPS (chỉ tham khảo, Chromium WebGL phần mềm, 1000 hạt): Cao ≈ **3,3**, Thấp ≈ **8,7**. Không đại diện máy người dùng.

## Bảng tiêu chí
| AC | Kết quả | Cách kiểm |
|---|---|---|
| AC-1 (luồng) | pass | `e2e/art-flow.e2e.mjs` pass: cả luồng ×1, biến thể gián đoạn (đổi cỡ cửa sổ, bấm nhãn khi camera đang lượn, đổi chất lượng), mưa núi, Gió 0 mưa biển; console sạch. Ảnh `01`, `05`, `06`. |
| AC-2 | pass | `node --test` (terrain-art và test REQ-004) 116/116. |
| AC-3 | pass | `node --test`; README ghi dùng một lớp. |
| AC-4 | pass | `node --test`. |
| AC-5 | pass | `node --test` + `art-trees` (2.200 / 400 cây, hạt bất biến). |
| AC-6 | pass | `node --test`; ảnh `07` thấy ô ruộng. |
| AC-7 | pass | `node --test`; ảnh `01`–`04`: hồ/ao nằm trong lòng chảo, hồ nối sông ra biển, biển nhạt gần bờ có bọt. Mép nước còn thô nhưng người dùng đã chấp nhận (notes). |
| AC-8 | pass | `node --test` + `art-atmosphere`; ảnh `05`, `06` thấy mây bông và màn mưa từ đáy mây. |
| AC-9 | pass | `node --test` module chùm sáng; `art-budget`/`art-atmosphere` kiểm Mặt Trời trong khung ở bốn góc, hai mức. |
| AC-10 | pass | `node --test` + `art-strata` (bốn lớp, lớp nước phía biển, bóng đáy). Ảnh `08`. |
| AC-11 | pass | `node --test`, `art-labels`, `art-stage-labels` (nhãn, bấm lượn camera, N/L riêng, không giao nhau). Ảnh `06`: Gió 0, nhãn "Mưa" nằm trên biển. |
| AC-11b | pass | `node --test` (mũi tên hướng vào đất liền, dài tăng theo Gió, ẩn ở Gió 0). Ảnh `06` ẩn mũi tên, `01` hiện. |
| AC-12 | pass | Số đo ngân sách ở trên; node test World bất biến khi đổi mức/trang trí. FPS ghi ở trên. |
| AC-13 | pass | Chín ảnh trong `eval/round-1/`; bảng kiểm bên dưới: mục 1–5 đều "có", một mục "không" trong 6–14. |
| AC-14 | pass | Node 116/116 trong 121 giây; package đúng; README đủ mục (đọc tệp). |
| AC-15 | manual | Chờ người kiểm tay: độ đẹp/gần concept, nhãn không giật, camera lượn mượt, ≥45 FPS ở mức Cao trên máy thật (ở đây phần mềm chỉ ~3 FPS). |

## Bảng kiểm hình ảnh (AC-13)
Ảnh: `01-overview`, `02-sea`, `03-mountain`, `04-river`, `05-mountain-rain`, `06-sea-rain`, `07-forest-fields`, `08-cutaway`, `09-four-stages` (thư mục `eval/round-1/`).

| # | Mục | Có/Không | Ảnh |
|---|---|---|---|
| 1 | Núi nhiều đỉnh, gồ ghề, không còn nón | có (chóp còn nhọn nhưng nhiều đỉnh) | 01, 02, 03 |
| 2 | Hồ/ao trong lòng chảo, không khối nổi/cột đứng; hồ liền sông | có | 01, 04 |
| 3 | Không còn tia nắng dài | có | 01, 02 |
| 4 | Mây bông dày, màn mưa từ đáy mây | có | 05, 06 |
| 5 | Nhãn bám đúng chỗ (kể cả Gió 0), không che nhau | có | 01, 06, 09 |
| 6 | Đỉnh núi trắng | có | 02, 03 |
| 7 | Rừng ở chân núi và trên đồng bằng | có | 01, 07 |
| 8 | Ô ruộng | có | 07 |
| 9 | Đồng bằng ≥ 2 sắc xanh, có gợn | có | 01, 07 |
| 10 | Biển nhạt gần bờ, đậm xa, bọt ở bờ | có | 01, 02 |
| 11 | Mặt Trời và chùm sáng ngắn xuống mặt nước | **không** (Mặt Trời có; chùm sáng không thấy rõ trong các khung chụp, dù `art-atmosphere` xác nhận có tồn tại) | 01, 02 |
| 12 | Mặt cắt bốn cạnh nhiều lớp | có (hai cạnh thấy trong ảnh, bốn cạnh do `art-strata` kiểm) | 08 |
| 13 | Trời xanh → kem | có | 02, 08 |
| 14 | Mũi tên gió hiện, đổi độ dài theo Gió | có | 01, 02 (hiện), 06 (ẩn ở Gió 0) |

Mục 1–5 đều "có"; chỉ một "không" ở mục 6–14 (mục 11) → đạt.

## Lỗi cần sửa
Không có lỗi chặn. Gợi ý nhỏ (không chặn): chùm sáng nên dễ thấy hơn ở góc mặc định.
