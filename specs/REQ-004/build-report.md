# REQ-004 — Báo cáo build (đang thực hiện)

## Phạm vi hiện tại

Đã triển khai bước 1–7. Đồ họa hoàn chỉnh, giao diện, kịch bản trình duyệt và chạy nghiệm thu toàn bộ còn ở bước 8–11; chưa kết luận đạt toàn bộ yêu cầu.

## Chuyển kiểm thử REQ-001 sang thế giới 3D

Các cặp dưới đây giữ mục đích kiểm tra, thay các chi tiết phụ thuộc biểu diễn 2D:

| Test cũ | Test 3D thay thế |
| --- | --- |
| `terrain is monotone and interpolates all segments` | `test/heightmap.test.js`: địa hình tất định, biển dưới 0, đỉnh trong núi, dốc đồng bằng ≤ 1/3 dốc núi, nội suy và kẹp biên; `test/drainage.test.js`: hướng chảy xuống thấp |
| `initial fill uses distinct cells bottom first and fits 1200 particles` | `3D worlds distribute all supported particle counts and expose reservoir levels`: phân bố 100–2000 hạt, mức nước và mã vùng chứa, không tọa độ hạt nước riêng |
| `surface selects highest occupied particle independently per column` | `test/heat.test.js`: bốc hơi trên đúng mặt nước 3D, vùng hết nước ngừng phát; `test/reservoirs.test.js`: bỏ biểu diễn cột, dùng mực nước theo số hạt |
| `return fills lowest vacancy then nearest column with left tie break` | `pond dry state recovers on return and snapshots cannot modify stored water`; `test/precipitation.test.js`: mưa vào đúng vùng chứa/lưu vực |
| `full lake rejects extra particles without changing occupancy` | `overflow releases precisely the excess at lake and pond drainage outlets within one step`: sức chứa mới cho phép nhận rồi tràn đúng cửa thoát |
| `a heat ray heats only the surface of its target column` | `evaporation integrates surface area for 300 seconds when supplies are replenished` |
| `water cools to baseline and only hot surface particles evaporate` | `new vapor starts hot on the correct 3D water surface without penetrating banks` |
| `sun zero prevents evaporation and removes rays already in flight` | `sun zero prevents evaporation and immediately clears rays after a step` |
| `heat emission is seeded and proportional to sunlight` | `3D evaporation is seeded, scales with sunlight and resets its fractional credits` |
| Va sườn 2D bị chặn | `clouds slide up the windward slope without penetration and cool at the lifted altitude` |
| Cụm liên thông qua ô băm 2D | `cloud components use transitive 3D distance across hash cells` |
| 10.000 hạt va đường địa hình/hồ 2D | `test/precipitation.test.js`: 10.000 giọt trên bản đồ 3D, đúng vùng chứa và lưu vực |
| Runoff về hồ từ mọi hoành độ trong 40 giây | `test/precipitation.test.js`: runoff từ mọi ô đất về đúng vùng chứa trong 60 giây |
| URL miền hạt cũ | `particle URL bounds support the new 3D population` và `test/core.test.js`: miền 100–2000 |
| Ổn định 2D 600 giây và lưới tham số | `test/stability*.test.js`: mặc định 600 giây, chín tổ hợp 300 giây, mưa theo gió và mép tây |

Các ý nghĩa tiếp tục được kiểm tra: RNG tất định, URL sai dùng mặc định, bước thời gian cố định/tạm dừng/tốc độ/kẹp tab ẩn/reset và snapshot chỉ đọc (`core`, `foundation`); ngưng tụ theo nhiệt, gió chỉ tác động không khí, ngưỡng mây/mưa có trễ và mưa dần (`air`); mưa rơi thẳng và bảo toàn khi vận chuyển (`precipitation`); bảo toàn, miền hữu hạn và tính liên tục của chu trình khi tắt Mặt Trời (`stability`). Các module legacy 2D và test lưới hồ 2D đã được gỡ sau khi có kiểm tra tương đương 3D.

## Hiệu chỉnh vật lý

Số đo chốt sau khi sửa khoảng lặng gió: seed mặc định 1, Mặt Trời 50, đếm mưa chạm bề mặt trong khoảng giây 60–300:

| Gió | Núi | Đồng bằng | Biển | Hồ | Ao | Tỷ lệ núi |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 2416 | 0 | 0 | 0% |
| 40 | 1611 | 117 | 5 | 2 | 0 | 92,85% |
| 100 | 2477 | 0 | 0 | 0 | 0 | 100% |

Giảm `windShelterDistance` từ 100 xuống 80: đường gió lặng cũ có đoạn cách mép tây chỉ 15 đơn vị, khiến tỷ lệ mây trong dải 20 đơn vị vượt 5%. Đường mới cách mép ít nhất 35 đơn vị. Không nới tiêu chí AC-9/AC-10. Cụm mây vẫn là thành phần liên thông khoảng cách 3D; khóa ô băm đổi từ chuỗi sang số nguyên, so sánh bình phương khoảng cách để giảm chi phí mỗi bước, giữ thứ tự duyệt và RNG.


Mặc định 600 giây: bốc hơi đầu ở 0,05 giây; mây nhìn thấy đầu ở 28,07 giây; mưa đầu ở 33,30 giây; giọt đã chạm đất rồi về vùng chứa đầu ở 36,85 giây. Hồ ít nhất còn 179 hạt; 152 lần suối vào hồ và 108 lần sông ra biển. Lưới 9 tổ hợp kiểm tra mỗi bước: tổng hạt/trạng thái/vùng chứa, giá trị hữu hạn, biên thế giới, không xuyên đất, mây sát mép tây. Test riêng giữ ý nghĩa tăng bốc hơi khi tăng Mặt Trời và chu trình trên không tiếp tục khi tắt nắng.

Kiểm thử chốt bước 7: `node --test` đạt 39/39, 81,02 giây, không cần trình duyệt hoặc mạng. Số test giảm do gỡ các test 2D đã có bản thay thế, không phải bỏ các ý nghĩa bảo toàn/ngưng tụ/mưa/thời gian. Chưa chạy e2e hoặc đo FPS ở mốc này.
