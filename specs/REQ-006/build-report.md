# REQ-006 — Báo cáo build

## Bước 1 — Địa hình

Dùng **một lớp địa hình**, dùng chung cho mô phỏng và dựng hình. Không đổi quy luật hoặc hằng số vật lý của `World`. Sáu khối núi lệch nhau được kết hợp với ridged noise theo seed bản đồ; đồng bằng có value noise tần số thấp. Khe suối vẫn được khắc bằng `generateDrainage`, sau đó priority-flood giữ mọi ô đất có đường thoát nước. Không cần phương án hai lớp: toàn bộ test mô phỏng hồi quy đã đạt, không cần hiệu chỉnh hằng số.

Đo trên bản đồ mặc định:

| Chỉ số | Giá trị |
|---|---:|
| Độ lệch chuẩn độ dốc vùng núi REQ-004, trước sửa | 0,7658187580460225 |
| Độ lệch chuẩn độ dốc địa hình mới sau thoát nước | 2,1947851036867845 |
| Đỉnh nổi bật, cao hơn mọi mẫu khác trong bán kính 40 ít nhất 15 | 6 |
| Độ cao lớn nhất | 293,9038900452372 |
| Độ lệch chuẩn gợn đồng bằng sau hồi quy mặt phẳng | 1,9804375788621464 |

Mốc cũ được đo bằng sai phân tiến theo hai trục trên `generateHeightmap()` trước thay đổi, seed mặc định 404; lưu thành hằng số trong `test/terrain-art.test.js`. Chỉ số mới đo trên lưới sau khắc khe và thoát nước, là lưới renderer đang sử dụng. Test đồng bằng loại vùng nước, lòng kênh và vùng lân cận hai ô trước khi hồi quy.

Các kiểm thử mới: nhiễu có seed và bị chặn trong [0, 1], sáu đỉnh/độ dốc/độ cao tối đa, gợn đồng bằng. Không sửa kỳ vọng test REQ-004/005.

Kiểm thử bước 1: toàn bộ 51 test hiện có đạt trong 150,274 giây; ba test địa hình mới đạt riêng. `e2e/core-3d.e2e.mjs` và `e2e/scenery.e2e.mjs` đạt. Chu kỳ mặc định đạt bốc hơi 0,05 giây, mây 28,067 giây, mưa 41,367 giây, nước quay về 45,967 giây; hồ không cạn trong 600 giây. Tỷ lệ mưa núi tăng theo Gió (0/40/100): 0, khoảng 94,9%, 100%.

### Thay đổi kiểm thử hồi quy

- `e2e/cycle-flow.e2e.mjs`: trước đây luồng chính chạy Cao ×1, luồng gián đoạn Cao ×8; nay cả hai chạy Thấp ×8 theo quy định cho kiểm thử không đánh giá ảnh. Giữ nguyên kiểm tra mốc thời gian mô phỏng. Lần chạy Cao trước chuyển đổi: luồng chính đạt; luồng gián đoạn lỗi do `quality.slowHint` chuyển từ false sang true trong phép so snapshot khi tạm dừng. Các URL riêng vẫn giữ tốc độ cần kiểm tra và thêm `quality=low`.

Chạy lại `e2e/cycle-flow.e2e.mjs` ở Thấp ×8: cả luồng chính, luồng gián đoạn và các URL đều đạt, console không lỗi.

## Bước 2 — Lưới, màu, ruộng và bọt bờ

Lưới vẽ nội suy từ lưới mô phỏng: Cao 160 × 160 (51.200 tam giác), Thấp 80 × 80 (12.800 tam giác). Chuyển chất lượng chỉ thay geometry, không tạo lại `World`. `terrainSample` tính độ cao, vùng và độ dốc; `terrainColor` chọn màu từ bảng dữ liệu theo thứ tự nước → cát → tuyết → sườn dốc → ruộng → chân núi/đồng bằng. Value noise theo seed riêng chọn hai sắc xanh cho vùng đất thoải. Tuyết là màu trắng ngà ở độ cao từ 230, không có vật lý tuyết.

36 ô ruộng hình chữ nhật đặt bằng RNG riêng của bản đồ; kiểm tra toàn bộ diện tích và vùng đệm 12 đơn vị, loại nước/kênh/cát/dốc. Ruộng chỉ tô màu đỉnh, không thêm mesh. Bọt là một dải mảnh men theo đường giao giữa địa hình và mực biển tìm bằng chia đôi, tránh đặt dưới phần đất bờ. `__sim.scene.fields` cho biết số ô ruộng.

Bốn test mới kiểm màu theo độ cao/độ dốc/nhiễu và vùng nước/cát, ruộng tất định không đè vùng cấm, bọt bám đường mực nước, trạng thái và RNG World giống nhau sau khi tính đồ họa ở hai mức. Ảnh xem thử ở `/tmp/req006-step2.png` chỉ phục vụ rà trong phiên; chưa phải bộ ảnh nghiệm thu bước 9. Cây, nước mới, mặt cắt mới và các hiệu ứng còn lại chưa được thực hiện.

Thay đổi test của bước 2:

- `test/quality.test.js`: trước kiểm `terrainStep=2`, nay kiểm trực tiếp `terrainCells=160/80` vì renderer đã dùng lưới nội suy riêng thay vì bỏ cách đỉnh lưới mô phỏng.
- `e2e/ui-quality.e2e.mjs`: giữ kiểm tỷ lệ tam giác 4:1 và bất biến khi chuyển mức; bổ sung số tam giác chính xác 51.200/12.800, số ruộng không đổi và đối tượng `shore-foam`.

Kiểm thử bước 2: toàn bộ `node --test` đạt **58/58** trong **137,906 giây**. Sau khi thay cấu hình từ `terrainStep` sang `terrainCells`, chạy lại nhóm `test/quality.test.js` + `test/terrain-colors.test.js`: 8/8 đạt. `e2e/ui-quality.e2e.mjs`, `e2e/scenery.e2e.mjs` và `e2e/cycle-flow.e2e.mjs` đều đạt, gồm luồng gián đoạn và URL; console không lỗi. Chưa chạy toàn bộ e2e khác hoặc đánh giá hình ảnh AC-13/AC-15; dành cho các bước 9–10.

## Bước 3 — Mặt nước và lòng dẫn

Thêm module thuần `water-shapes.js`: cắt tam giác mặt nước theo giao tuyến địa hình với mực nước, giới hạn hồ/ao bằng viền có nhiễu góc tất định. Viền co/giãn theo `reservoirs.level`; chỉ dựng lại geometry khi mực nước đổi. Không có thành đứng của hồ/ao. Biển dùng cùng phép cắt theo địa hình, màu chuyển từ nhạt tới đậm theo khoảng cách tới đường bờ thực tế; sóng vẫn chỉ bật ở Cao.

Sông/suối dùng dải rộng dần, bo các góc bậc thang bằng hai lượt corner cutting. Dải nối hồ tới đầu sông nội suy từ mực hồ xuống đầu sông. Lòng dẫn **khi vẽ** được hạ cục bộ để lưới Thấp không che mất nước; đây là chỉnh lòng dẫn đồ họa, không thêm lớp nhiễu địa hình và không thay đổi dữ liệu World, thoát nước hay hằng số vật lý. Các chỉ số núi/đồng bằng của bước 1 tiếp tục đo trên lưới mô phỏng; cần rà lại chỉ số trên bề mặt vẽ cuối cùng ở bước 10 nếu các bước sau còn chỉnh hình dạng. Dải sáng nay nội suy liên tục giữa các ô theo thời gian, thay vì nhảy từng ô.

Ba test mới: mặt nước tất định, khớp mực và nằm trong lòng chảo; kênh rộng dần và lòng dẫn thấp hơn mặt nước; nối hồ tới đúng đầu sông, không sửa mảng độ cao mô phỏng. Toàn bộ `node --test` đạt 61/61 trong 154,702 giây; sau tinh chỉnh bo kênh và giới hạn viền đã chạy lại ba test nước, đều đạt. Không đổi kỳ vọng kiểm thử cũ.

`e2e/scenery.e2e.mjs`, `e2e/core-3d.e2e.mjs`, `e2e/cycle-flow.e2e.mjs` đạt (luồng chính, gián đoạn và URL). Chụp thử bốn góc nhìn Thấp vào `/tmp/req006-water-{overview,sea,mountain,river}.png`, console sạch. Rà ảnh phát hiện kênh bị lưới Thấp che; đã sửa bằng bo kênh và hạ lòng dẫn. Các ảnh tạm không thay bộ ảnh nghiệm thu Cao/Thấp hoặc xác nhận AC-7/AC-13 cuối cùng ở bước 9–10.

## Bước 4 — Mặt cắt, trời và ánh sáng

`strata.js` sinh thuần bốn cạnh, mỗi cạnh bốn lớp đá tối → đất nâu → đất sáng → cỏ mỏng. Ranh giới dùng chung độ cao tại từng cột, có nhiễu seed riêng và uốn theo độ cao bề mặt vẽ; không hở giữa các lớp hoặc ở bốn góc. Renderer gộp mỗi lớp của bốn cạnh thành một mesh (bốn draw call). Mặt cắt nước được cắt tại giao tuyến với mực biển, ôm sát đáy biển ở cả các cạnh bên, thay cho hình chữ nhật có độ sâu cố định. Bóng đáy là một mặt phẳng trong suốt với gradient sinh bằng shader, tên `base-shadow`, giữ ở cả hai mức chất lượng; không dùng texture hay tài nguyên bên ngoài.

Trời chuyển từ xanh nhạt ở phía trên sang kem phía xa; tâm vòm đi theo camera và dải chuyển màu được mở xuống dưới đường chân trời để vẫn thấy gradient ở góc nhìn sa bàn từ trên xuống. Shader xuất đúng không gian màu. Sương xa dùng cùng màu kem; giữ ánh sáng môi trường dịu và một nguồn sáng hướng. Bóng mức Cao dùng `PCFSoftShadowMap`; mức Thấp tắt bóng chiếu nhưng giữ bóng đáy.

**Giữ bóng mềm ở mức Cao.** Đo riêng trên Chromium 140.0.7339.16/WebGL phần mềm, cửa sổ 1280 × 800, 1000 hạt, cùng trạng thái mô phỏng ở đúng 46 giây, tạm dừng, mỗi mẫu 8 giây sau 1,5 giây làm nóng: bật bóng **8,572 FPS**, tắt bóng **11,601 FPS**, tỷ lệ **73,9%** (trên ngưỡng 50% của spec). Phép đo dùng Playwright chặn phản hồi `main.js` để chạy đúng 2760 bước trước khung hình đầu và chặn `config.js` ở mẫu tắt bóng; không ghi các thay đổi này vào sản phẩm. Hai mẫu console sạch. Đây là đo riêng tác động bóng ở bước 4, không thay phép đo FPS sản phẩm đầy đủ ở bước 10 sau khi thêm cây/mây/nhãn. Phép đo đầu tiên chạy cùng test nặng và ở hai thời điểm khác nhau đã bị loại, không dùng để quyết định.

Hai test logic mới kiểm tính tất định, không sửa dữ liệu mô phỏng, bốn lớp dày dương/liền nhau/uốn theo mặt đất, khớp góc, mặt cắt nước khớp đáy và không lấn lên đất. `e2e/art-strata.e2e.mjs` kiểm bốn lớp, mặt cắt biển, tên bóng đáy, chuyển chất lượng và trạng thái hạt không đổi. Không sửa kỳ vọng test cũ trong bước này. Ảnh thử `/tmp/req006-step4-shadows-{true,false}.png` đã được xem; chưa phải ảnh nghiệm thu bước 9.

Kiểm thử bước 4: toàn bộ `node --test` đạt **63/63** trong **106,816 giây** khi chạy riêng. Lượt đầu chạy song song với trình duyệt bị SIGTERM trước tổng kết nên không dùng làm bằng chứng đạt. `e2e/art-strata.e2e.mjs`, `e2e/ui-quality.e2e.mjs`, `e2e/scenery.e2e.mjs`, `e2e/core-3d.e2e.mjs`, `e2e/cycle-flow.e2e.mjs` đều đạt; cycle-flow gồm luồng chính, gián đoạn và URL, console sạch. Chưa chạy toàn bộ e2e REQ-005 hoặc QA ảnh tổng thể; các mục đó thuộc bước 9–10.

## Bước 5 — Rừng thông

`trees.js` dùng lưới điểm xê dịch và value noise có seed riêng để xếp hạng vị trí theo cụm; trọng số vùng núi cao hơn đồng bằng. Loại nước/kênh/cát, độ dốc ≥ 1,1, độ cao ≥ 230 và ô ruộng. Mức Cao có 2.200 cây, Thấp 400 cây là tập con giữ nguyên vị trí. Cỡ, sắc xanh và góc quay thay đổi tất định. Không dùng RNG World, không thêm va chạm hoặc vật lý cây.

Renderer dùng đúng hai `InstancedMesh`: tán gồm ba tầng nón sáu cạnh gộp geometry, thân trụ năm cạnh. Chuyển chất lượng chỉ đổi số instance và bóng; không dựng lại rừng. `__sim.scene.trees` và `treeMeshes` hỗ trợ kiểm tra. Hai test logic kiểm số lượng, vùng cấm, tất định, tập con, đa dạng cỡ/màu, mật độ và bất biến snapshot/hạt/RNG khi bật/tắt cây. Định nghĩa vùng chân núi trong phép đo là ô `mountain` dưới ngưỡng tuyết; tính cả ô dốc trong mẫu số: 2.702 ô so với 3.876 ô đồng bằng. Cao: 1.719/481 cây, tỷ lệ mật độ 5,127; Thấp: 319/81, tỷ lệ 5,649 (đều ≥ 2).

Kiểm thử: `node --test` đạt **65/65** trong **105,637 giây**; `e2e/art-trees.e2e.mjs`, `ui-quality`, `scenery`, `core-3d`, `cycle-flow` đều đạt, gồm luồng gián đoạn và URL. Không đổi kỳ vọng test cũ. Ảnh thử Cao `/tmp/req006-step5-forest.png` đã xem, console sạch; thấy rừng chân núi và cây thưa đồng bằng, ruộng còn trống cây. Ảnh này chưa phải ảnh nghiệm thu. Hình tổng thể vẫn cần QA cuối: núi còn dáng cao nhọn và mép hồ nhìn khá cao so với đất phía trước; cần rà lại tiêu chí hình ảnh/nước khi làm bộ ảnh bước 9–10, không suy ra AC-7/13 đã đạt từ test logic.

## Bước 6 — Mây, màn mưa và Mặt Trời

`clouds.js` chỉ đọc cụm và hạt của World: số khối tăng từ 5 tới 12 (Cao), Thấp kẹp ở 7 nhưng vẫn ít nhất 5; bán kính tăng theo kích thước cụm, độ xám tăng đơn điệu. Mỗi cụm dùng các khối icosahedron chồng nhau, vật liệu có ánh sáng nên mặt trên sáng hơn mặt dưới. Toàn bộ mây dùng một InstancedMesh, màn mưa dùng một InstancedMesh riêng: 24 cột nét ngắn mỗi cụm đang mưa, phủ từ đáy mây tới mặt đất hoặc mặt nước, dịch xuống theo thời gian mô phỏng. Giữ các hạt mưa riêng hiện có để thấy giọt còn rơi sau khi cụm ngừng mưa. Không gọi RNG, không đổi World hoặc hằng số vật lý.

`sunbeams.js` lấy thưa mỗi ba mẫu trong `world.rays`, tối đa 30 chùm; chùm thẳng đứng dài 105 đơn vị (nhỏ hơn 600/3), kết thúc tại mực vùng chứa có nước và loại điểm bị địa hình che. Chùm mờ dần lên đầu trên bằng shader. Bỏ các đoạn dài từ một điểm sáng cũ. Mặt Trời là một đĩa cầu sáng có quầng gradient sinh bằng shader; quầng giảm độ đậm khi thanh Mặt Trời về 0, chùm sáng biến mất ngay. Đĩa được đặt trên vòm trời tương đối camera ở góc trái trên để vẫn nằm trong khung khi đổi góc nhìn và tránh bảng điều khiển bên phải. Đây là đồ họa minh họa; không thêm chuyển động thiên văn hay thay hướng nguồn sáng vật lý.

Snapshot bổ sung `cloudBlocks`, `rainStreaks`, `rainingClusters`, `sunbeams`, `sun.position` và `sun.haloOpacity`. Cấu hình chất lượng đổi khóa `cloudBlocks` cũ thành `cloudBlocksMax` (12/7); bỏ thông số dựng mây và opacity tia cũ không còn được đọc. Không đổi kỳ vọng test cũ; thêm bốn test logic và `e2e/art-atmosphere.e2e.mjs`. Ảnh thử `/tmp/req006-step6-rain.png` đã xem: có mây bông và Mặt Trời không bị panel che; ảnh chụp ngay lúc bắt đầu mưa, không thay ảnh mưa trên núi hoặc bộ ảnh nghiệm thu bước 9–10. Cần QA độ rõ màn mưa ở xa và ngân sách/FPS cảnh đầy đủ tại các bước đó.

Kiểm thử bước 6: toàn bộ `node --test` đạt **69/69** trong **105,129 giây** (shell `time`: 105,160 giây). `e2e/art-atmosphere.e2e.mjs` đạt, gồm đổi Cao/Thấp khi tạm dừng lúc có mây mưa, số khối cập nhật và hạt không đổi; Mặt Trời 0 vẫn tắt chùm ngay cả khi tạm dừng. Các e2e ui-quality, scenery, core-3d và cycle-flow đều đạt, console sạch; cycle-flow gồm chính, gián đoạn và URL. Chưa chạy toàn bộ e2e REQ-005 hoặc bộ ảnh/FPS/ngân sách cuối, tiếp tục ở bước 9–10.

## Bước 7 — Tên, màu và nhãn giai đoạn

`content.stages` là nguồn tên chung: Bốc hơi, Ngưng tụ, Mưa, Dòng chảy. Bốn màu `stageVapor`, `stageCloud`, `stageRain`, `stageRunoff` trong dữ liệu config được dùng qua `stageColors` cho nhãn, thẻ “Đang diễn ra” và chú giải. Chú giải vẫn có năm hàng để giải thích hạt nước trong vùng chứa và bốn giai đoạn; không đổi màu hạt vật lý.

`StageLabels` là bộ quan sát thuần, có lịch sử riêng lấy mẫu sau mỗi bước World: đếm chênh lệch bốc hơi theo vùng chứa, lấy mẫu hạt runoff theo kênh trong 10 giây mô phỏng gần nhất. Cụm mây chọn riêng nhóm đang mưa/chưa mưa; theo dõi thành viên giao nhau khi giọt có ID nhỏ nhất rời cụm. Ngưỡng đổi cụm là 20%, đổi vùng chứa/kênh là thêm ít nhất 3 lần đếm. Vị trí làm trơn mũ theo thời gian thực, tối đa 12 đơn vị/khung, hiện/ẩn trong 0,4 giây. Reset xóa lịch sử; không dùng RNG World. Nhãn HTML chiếu từ vị trí 3D, có số tròn và tên; nút “Nhãn giai đoạn”/N độc lập với nhãn bản đồ/L. Snapshot thêm `stageLabels` và `stageLabelsEnabled`.

Tạm dừng đóng băng chuyển động/mờ dần nhãn; nếu người dùng đổi thanh Mặt Trời khi tạm dừng thì vẫn cập nhật hiệu ứng nhãn trong 0,5 giây để ẩn Bốc hơi khi tắt nắng. Lượt cycle-flow đầu phát hiện làm trơn còn chạy khi tạm dừng; đã sửa sản phẩm, giữ nguyên phép so snapshot tạm dừng của test cũ. Việc bấm nhãn/lượn camera, mũi tên gió và bố trí tránh chồng ở hai kích thước thuộc bước 8, chưa kết luận AC-11 hoàn tất.

Thay đổi kỳ vọng test: `e2e/cycle-flow.e2e.mjs` đổi bảng tên “Ngưng tụ thành mây” → “Ngưng tụ”, “Mưa rơi” → “Mưa”, “Chảy về vùng chứa” → “Dòng chảy”; “Bốc hơi” giữ nguyên. Không bỏ kiểm tra nào. Thêm năm test logic về tên/màu, cửa sổ lịch sử/reset, chọn đối tượng, gió 0/mưa biển, trễ/làm trơn/mờ dần và bất biến World/RNG. Với World thật seed 1/Gió 0, mưa đầu ở 27,467 giây có nhãn tại x ≈ 851 trên biển.

Kiểm thử trên code cuối: toàn bộ `node --test` đạt **74/74** trong **107,553 giây** (shell `time`: 107,579 giây). E2e art-stage-labels (kèm reset), ui-statistics, core-3d, ui-quality và cycle-flow đều đạt; cycle-flow gồm chính, gián đoạn và URL. Chưa chạy toàn bộ e2e REQ-005/006 hoặc QA ảnh/FPS/ngân sách cuối; dành cho bước 9–10.
