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

## Bước 8 — Bấm nhãn, lượn camera và gió

Nhãn vùng trở thành button HTML có thể bấm bằng chuột hoặc bàn phím. Nhãn giai đoạn chụp bản sao vị trí 3D đang vẽ ngay lúc bấm. Cả hai gọi `ViewTransition.focus`: giữ phương vị/góc cao, khoảng cách 500, target là vị trí đã chụp, dùng cùng nội suy một giây của các góc nhìn sẵn; tên góc là `free`. Chọn nhãn mới thay chuyển cảnh đang chạy, thao tác xoay/thu phóng ngắt ngay qua cơ chế sẵn có. `Camera.snapshot` tiếp tục nâng mắt cao hơn địa hình/nước để không xuyên đất.

`wind-arrow.js` thuần sinh 25 điểm cong ở trên trời từ x = 900 phía biển sang phía tây, độ dài tăng chặt theo Gió, opacity tăng đơn điệu. UI chiếu các điểm thành SVG cùng chữ “Gió đưa mây vào đất liền”; không thêm draw call WebGL hay dùng RNG. Gió 0 ẩn ngay cả khi tạm dừng; N/nút nhãn giai đoạn bật tắt cả mũi tên, L vẫn độc lập. `__sim.scene.windArrow` công khai trạng thái chỉ đọc. Các chip vùng/giai đoạn được xếp tránh giao nhau sau phép chiếu; target lúc bấm vẫn giữ tọa độ thế giới, không lấy vị trí dịch trên màn hình.

Thêm test logic về hướng/độ dài/độ đậm gió và bất biến World, test chuyển camera từ mọi góc sẵn tới mọi nhãn vùng, sao chép target, độ cao an toàn và ngắt giữa chừng. Thêm sớm `e2e/art-labels.e2e.mjs` của bước 9 để kiểm sản phẩm bước 8. Không sửa kỳ vọng test cũ. Ảnh thử `/tmp/req006-step8.png` đã xem, chưa thay bộ ảnh nghiệm thu; các vấn đề QA hình ảnh đã bàn giao ở các bước trước vẫn cần rà trong bước 9–10.

Kiểm thử bước 8: `node --test` đạt **76/76** trong **135,175 giây** (shell 135,208 giây; có trình duyệt chạy đồng thời nên không dùng số này làm đo FPS). E2e art-labels đạt ở **1280 × 800 và 1920 × 1080**, kiểm không chồng nhãn sau 65 giây mô phỏng, N/L độc lập, gió 0, camera tới đúng vị trí nhãn lúc bấm và thao tác chuột ngắt chuyển cảnh. Các e2e ui-views, art-stage-labels, scenery và cycle-flow đều đạt; cycle-flow gồm chính, gián đoạn và URL, console sạch. `git diff --check` sạch. Bộ e2e tổng thể, ảnh nghiệm thu, FPS và ngân sách vẫn thuộc bước 9–10.

## Bước 9 — Kịch bản nghiệm thu và tài liệu

Bổ sung `art-flow.e2e.mjs`: mở mặc định Cao ×1, bấm nhãn, tạm dừng/tiếp tục, N/L, chuột xoay/zoom, đổi chất lượng; biến thể resize, bấm nhãn vùng trong lúc lượn; dùng Thấp ×8 riêng cho chờ mưa núi trong 120 giây và mưa biển Gió 0. `art-budget.e2e.mjs` đo `renderer.info` khi đủ bốn giai đoạn, chuyển mức trong cùng trạng thái tạm dừng, so hạt, kiểm Mặt Trời trong khung ở bốn góc mỗi mức và bóng đáy. Snapshot chỉ đọc thêm `renderInfo` và `sunScreen`, không thêm API điều khiển mô phỏng.

Ngân sách đo thử tại 67,717 giây mô phỏng, 1280 × 800: Cao **65 calls / 223.156 triangles**, Thấp **64 / 83.956**, đều đạt. Đây là số đo một trạng thái; bước 10 chạy lại cùng toàn bộ kiểm thử/FPS sản phẩm.

`art-screenshots.e2e.mjs` tạo chín ảnh Cao 1920 × 1080 và `evidence.json`, ghi camera, thời gian, gió, số khối/nhãn/ngân sách, phiên bản trình duyệt và lỗi console. Chờ hoạt động bằng Thấp ×8, tạm dừng và chuyển Cao trước chụp. Chờ opacity nhãn đạt 0,95 để tránh tạm dừng đúng khung đầu hiện nhãn rồi đóng băng ở opacity 0. Không sửa ảnh REQ-004/005. README bổ sung phong cách, địa hình một lớp, cây, hai ý mô hình đơn giản hóa, bấm nhãn, gió, N/L, ngân sách và lệnh kiểm thử.

Các cặp điều chỉnh e2e cũ trong bước này (không bỏ phép kiểm):

| Tệp | Trước → sau |
| --- | --- |
| core-3d | n=2000, paused → thêm quality=low, speed=8; vẫn 2000 hạt và kiểm reset |
| panel-foundation | paused → thêm quality=low, speed=8; giữ kiểm trạng thái phiên, phím và độc lập mô phỏng |
| scenery | Cao paused ×8 → Thấp paused ×8; giữ kiểm chuyển động/freeze sóng và dòng chảy |
| scene | URL từng trường hợp paused → thêm quality=low; giữ tốc độ mặc định/sai là 1 để kiểm parser |
| ui-controls | paused, sun=0, wind=100 → thêm quality=low, speed=8; vẫn kiểm các nút tốc độ riêng và reset ×1 |
| ui-statistics | paused → thêm quality=low, speed=8; giữ kiểm tỷ lệ/bộ đếm |
| ui-views | URL view paused → thêm quality=low, speed=8; giữ các kỳ vọng camera |
| ui-flow | mặc định ×1 → Thấp ×8; kiểm speed 1 → 8 theo URL, luồng mặc định ×1 được giữ trong art-flow; reset vẫn ×1 |
| ui-panel | mặc định ×1 → Thấp ×8; giới hạn delta thời gian mỗi khung min(0,25, elapsed) + 1/60 → min(0,25, elapsed) × 8 + 1/60 theo Clock; giữ kiểm không dừng/nhảy thời gian |

Các script chụp ảnh cũ, measure-fps, kiểm URL mặc định/tốc độ sai và ui-quality giữ cấu hình riêng cần cho mục đích kiểm tra.

### Bảng QA hình ảnh — cập nhật mốc 10b-6 (chưa nghiệm thu đạt)

Đã chụp và xem lại đủ chín ảnh Cao 1920 × 1080 ở mốc 10b-6, sau sửa 10a–10b-5; `evidence.json` là bằng chứng của bộ ảnh mới. **AC-13 vẫn chưa đạt** vì mục 1 và 2 còn “không”. Các ghi chép bước 9/phiên cũ phía dưới là lịch sử, không phải kết luận cho bộ ảnh mới.

| Mục | Có/không | Ảnh và nhận xét |
| --- | --- | --- |
| 1. Núi gồ ghề, không dạng nón | Không | 01-overview, 02-sea, 03-mountain: chân núi đã nối nhau, sườn có nếp nhưng sáu đỉnh vẫn giống chóp cao hẹp; chưa tạo sống/phụ đỉnh đủ rõ |
| 2. Hồ/ao lòng chảo, không nổi, hồ liền sông | Không | 03-mountain, 04-river, 07-forest-fields: có bờ lòng chảo và đường nối, nhưng hồ còn như đĩa trên ụ đất; ao có mép đất dựng, cửa hồ xuống sông quá dốc. Cần sửa tiếp mặt vẽ và kiểm mực thấp–đầy |
| 3. Không tia nắng dài tỏa khắp cảnh | Có | 01-overview, 02-sea: chỉ vài nét ngắn trên nước |
| 4. Mây bông và màn mưa rõ | Có | 03-mountain, 05-mountain-rain, 06-sea-rain: khối mây bông, màn nét xanh từ đáy mây xuống núi/biển nhìn rõ; ảnh toàn cảnh vẫn thấy mưa núi |
| 5. Nhãn đúng chỗ, không che nhau | Có | 01-overview, 05-mountain-rain, 06-sea-rain, 09-four-stages: chip Mưa sát cụm đang mưa, ở biển khi Gió 0; đủ bốn chip rõ ở 09, không chồng nhau hoặc bị panel che ở góc mặc định. Đây là QA bộ ảnh, không khẳng định mọi khung chuyển động đều đạt |
| 6. Đỉnh trắng | Có | 01-overview, 03-mountain |
| 7. Rừng chân núi và đồng bằng | Có | 01-overview, 03-mountain, 07-forest-fields |
| 8. Ô ruộng | Có | 01-overview, 07-forest-fields |
| 9. Hai sắc xanh/gợn đồng bằng | Có | 01-overview, 04-river, 07-forest-fields |
| 10. Biển chuyển màu và bọt bờ | Có | 01-overview, 02-sea, 04-river; chuyển màu nhẹ, bọt mảnh |
| 11. Mặt Trời và chùm ngắn xuống nước | Có | 01-overview, 06-sea-rain; chùm rất nhạt, có test logic điểm kết thúc |
| 12. Mặt cắt nhiều lớp | Có | 01-overview, 08-cutaway; logic kiểm cả bốn cạnh |
| 13. Trời xanh–kem | Có | 01-overview, 02-sea |
| 14. Mũi tên theo Gió | Có | 01-overview/05-mountain-rain có mũi tên, 06-sea-rain Gió 0 ẩn; tăng chiều dài/độ đậm kiểm bằng test thuần |

Ưu tiên còn lại bước 10 sau mốc 10b-6: sửa hai mục bắt buộc 1–2, QA lòng chảo/cửa thoát ở nhiều mực, rồi chạy lại bộ ảnh và bảng này. Không trả `done` dù mọi test tự động đang xanh khi các mục bắt buộc hình ảnh còn “không”. Không cần hỏi người để sửa các vấn đề đã xác định trong phạm vi.

Điều chỉnh thêm khi chạy lại e2e cũ:

- `ui-flow`: ở ×8, thao tác chuẩn bị camera có thể tiêu thụ nhiều thời gian mô phỏng, làm cửa sổ đo Gió 0 đầu tiên không còn như kịch bản gốc. Khởi đầu `paused=1`, chỉ tiếp tục ngay trước đo mưa, giữ nguyên cửa sổ 60 giây và ngưỡng mưa. Lượt thử đầu chạy tự do báo 0 mưa đã bị loại; không hạ kỳ vọng kiểm tra. Thông báo log “default x1” đổi thành “default x8” đúng cấu hình.
- `ui-panel`: vòng Tab `expected.length + 5` trước đây không đủ vì nhãn vùng/giai đoạn đã là button. Nay duyệt số phần tử focusable đang hiện + 2, vẫn yêu cầu từng native control của panel xuất hiện trong Tab order, không bỏ assertion “Unreachable control”.

Kết quả kiểm thử bước 9: `node --test` **76/76**, 0 fail/skip, **164,411 giây** (shell 164,450 giây; có trình duyệt chạy đồng thời, không dùng làm so FPS). E2e core-3d, panel-foundation, scene (gồm scenery), scenery, ui-controls, ui-flow (chính và gián đoạn), ui-panel (108 mục chữ đạt contrast), ui-statistics, ui-views, art-labels (hai kích thước), art-flow (mặc định ×1 và gián đoạn), art-budget, ui-quality và cycle-flow (chính, gián đoạn, URL) đạt; console sạch. Chưa chạy toàn bộ nhóm art-atmosphere/art-stage-labels/art-trees/art-strata hoặc các script ảnh cũ/FPS trong phiên này; chúng thuộc lượt tổng thể bước 10.

Ngân sách lần chạy lại tại **77,85 giây**, cùng hạt tạm dừng: Cao **65 calls / 224.032 triangles**, Thấp **64 / 84.832**; Mặt Trời trong khung ở cả bốn góc mỗi mức. Package contract và `git diff --check` đạt. Chưa đo FPS toàn cảnh sản phẩm trong bước 9.

Ảnh mưa riêng không đòi opacity 0,95: thử ngưỡng đó có thể không gặp trạng thái đủ lâu ở ×8 (timeout), nên chụp khi nhãn đang hiện ≥ 0,25 và có centroid cụm **đang mưa thật** trên núi/biển đúng trường hợp. Ảnh bốn giai đoạn vẫn đòi cả bốn nhãn ≥ 0,95. Kịch bản kiểm và bấm pause trong cùng callback để không lỡ khung; không thay mô phỏng hoặc dựng dữ liệu giả. Bảng QA vẫn đánh dấu lỗi độ rõ/vị trí, không dùng việc script chụp thành công để kết luận đạt.

Lượt `art-screenshots` cuối hoàn tất đủ chín ảnh Cao và evidence, console sạch; đã xem lại ảnh bốn góc, rừng/ruộng, mặt cắt và hai ảnh mưa. Ảnh 09 có đủ bốn chip rõ; ảnh 05 thấy mưa núi còn thưa và nhãn Mưa ở xa cụm, ảnh 06 có nhãn Mưa mờ trên biển và màn mưa xuống nước. Bảng QA “không” ở mục 1, 2, 4, 5 vẫn giữ, cần sửa ở bước 10. Đây là hoàn thành **bộ công cụ/bằng chứng bước 9**, không phải kết luận AC-13 hoặc toàn REQ đạt.


## Bước 10a — Giới hạn hiển thị nhãn khi đổi mục tiêu xa

Bước 10 được chia thành các mốc 10a–10c để lưu commit hoàn chỉnh cho từng sửa lỗi QA. Bước 10 tổng thể vẫn chưa hoàn tất.

Nguyên nhân nhãn Mưa có thể cách xa mây: khi cụm đang bám tan hoặc một cụm khác vượt ngưỡng trễ, vị trí cũ vẫn được làm trơn với bước tối đa 12 đơn vị, trong khi opacity tiếp tục tăng. Nhãn vì thế có thể hiện rõ trong lúc đi ngang bầu trời tới cụm mới. Giữ nguyên cách chọn mục tiêu, ngưỡng trễ và giới hạn chuyển động; thêm `config.art.labelAnchorDistance = 60`. Khi còn cách mục tiêu hơn 60 đơn vị, nhãn mờ đi trong 0,4 giây và không nhận bấm; đến gần mới mờ hiện lại. Áp dụng chung cho bốn nhãn. Không đổi World, RNG, địa hình, vật lý hoặc vị trí click khi nhãn đã hiện.

Thêm test hồi quy cụm mưa cũ ở x=150 biến mất, cụm mới ở x=880: nhãn mờ hết khi còn di chuyển xa, mọi bước ≤ 12, hiện đủ opacity khi đến gần. Cặp kỳ vọng test `cloud labels keep close competitors with hysteresis and bound movement and fades`: sau đổi sang cụm xa, opacity **0,75 → 0,25** (đang mờ đi); sau mất hết cụm, **0,5 → 0**. Giữ các assertion chọn đối tượng, trễ và khoảng cách; đây là cập nhật theo hành vi sản phẩm mới, không bỏ phép kiểm. E2E art-stage-labels bổ sung khoảng cách nhãn tới centroid cụm đang hoạt động ≤ 60; tạm dừng trong cùng callback phát hiện mưa để không lỡ trạng thái ngắn ở ×8.

Chưa chụp lại bộ ảnh nghiệm thu; bảng QA bước 9 vẫn giữ các mục chưa đạt. Sửa lần này xử lý đường đi khi đổi mục tiêu, chưa chứng minh mục 5 đã đạt đầy đủ vì còn bố trí chip/panel sau phép chiếu. Các lỗi dáng núi, lòng chảo/mép nước và độ rõ màn mưa thuộc 10b; kiểm tổng thể/FPS/ngân sách cuối thuộc 10c.

Kiểm thử mốc 10a: `node --test` **77/77**, không fail/skip, **107,231 giây**, chạy riêng không có trình duyệt. E2E `art-stage-labels`, `art-labels` (1280 × 800, 1920 × 1080) và `cycle-flow` (chính, gián đoạn, URL) đạt, console sạch. `git diff --check` sạch. Chưa chạy toàn bộ e2e hoặc đo FPS/ngân sách sau sửa lần này.


## Mốc 10b-1 — Độ rõ màn mưa

Tách phần màn mưa thành commit riêng trong 10b; chưa đánh dấu 10b hoặc bước 10 tổng thể hoàn tất. Tăng cột màn mưa 24 → 32, bề rộng nét 1,2 → 2,2, opacity 0,52 → 0,72, độ dài nét 7 → 11. Thông số màn mưa nằm riêng trong `config.art`; hạt mưa mô phỏng vẫn dùng `scenery.rainLength=7`. Không đổi World, RNG, địa hình, vật lý hoặc số draw call của mesh màn mưa. Vẫn dùng một InstancedMesh và khoảng cách nét 19 đơn vị.

Thay đổi kiểm thử:
- `test/atmosphere.test.js`: giới hạn nét màn mưa chuyển từ `config.scenery.rainLength` sang `config.art.rainCurtainLength`, vẫn kiểm mọi nét ngắn, trên mặt đất/nước, chỉ có dưới cụm đang mưa và không đổi World/RNG.
- `e2e/art-atmosphere.e2e.mjs`: phát hiện mưa và bấm pause trong cùng callback, tránh ảnh chụp sau khi mưa đã hết ở ×8. Ảnh tạm Cao `/tmp/req006-rain-curtain.png` đã xem: thấy rõ cột nét xanh dưới mây tại góc toàn cảnh 1280 × 800. Không thay bộ chín ảnh nghiệm thu và chưa kết luận QA mưa núi/biển đạt.
- `e2e/art-budget.e2e.mjs`: trước chờ bốn nhãn cùng visible; sau chờ đủ hạt vapor/cloud/rain/runoff và có cụm đang mưa, rồi pause ngay trong callback. Đây là kiểm hoạt động thật cho AC-12; nhãn có thể tạm ẩn khi chuyển mục tiêu theo 10a. Không đổi giới hạn 150/400.000 và 80/150.000, kiểm bất biến hạt hoặc Mặt Trời bốn góc. Lượt điều kiện cũ timeout 120 giây, lượt thử lại bị dừng; không dùng hai lượt này làm bằng chứng đạt.

Kiểm thử: Node **77/77**, không fail/skip, **108,538 giây**, chạy riêng với trình duyệt. E2e atmosphere sau sửa và art-budget đạt, console sạch. Ngân sách cùng trạng thái **81,7167 giây**: Cao **67 calls / 225.584 triangles**, Thấp **66 / 86.384**. Không phải phép đo FPS cuối; không thay số đo bóng ở bước 4.

Bảng QA bước 9 vẫn giữ trạng thái chưa đạt; ảnh tạm chỉ chứng minh màn mưa dễ thấy hơn trong một trạng thái. Tiếp theo sửa dáng núi, lòng chảo/mép nước và lòng dẫn răng cưa, đo AC-2 trên bề mặt vẽ, chụp lại chín ảnh và đánh giá cả mưa núi/biển, nhãn/panel. Sau đó 10c kiểm tổng thể và FPS.

- Kiểm hồi quy `e2e/scenery.e2e.mjs` đạt, console sạch; `git diff --check` sạch. Server đã dừng cuối phiên.

## Mốc 10b-2 — Chuyển tiếp bờ lòng dẫn

Thay hai ngưỡng cắt cứng của `waterBedHeight` (14 đơn vị quanh dải nối, 18 quanh sông/suối) bằng nội suy smoothstep: giữ đáy trong bán kính 9, trở lại địa hình gốc liên tục ở bán kính 34. Lấy giá trị thấp nhất của các mặt cắt từ cùng địa hình gốc, tránh hạ đất nhiều lần tại đoạn giao nhau. Không đổi World, độ cao mô phỏng, RNG hoặc dải nước. Cây lấy độ cao từ `waterBedHeight` để thân không lơ lửng trên phần bờ mới hạ; vị trí ngang, số lượng, seed và thứ tự cây giữ nguyên.

Hai test mới kiểm bước nhảy của phần hạ lòng dẫn ở các ngưỡng cũ/mới và nội suy tam giác lưới 80/160 không che đỉnh dải nước. Đo đối chứng bằng mã HEAD trước sửa và cùng bản đồ: chênh lệch lớn nhất giữa hai điểm cách nhau 0,002 đơn vị tại các ngưỡng giảm **46,56657 → 0,009878**. Đây là số đo độ liên tục, không phải kết luận hồ/ao hoặc núi đạt QA.

Cặp kỳ vọng test thay đổi: `test/trees.test.js`, độ cao thân **terrainSample.height → waterBedHeight(map,x,z)**; thêm kiểm không nâng cao hơn mặt mô phỏng. Giữ các kiểm số lượng, vùng cấm, tất định, mật độ và bất biến World/RNG.

Ảnh thử Cao 1920 × 1080, góc dọc sông, paused ×1 ở `/tmp/req006-smooth-banks.png` đã xem: bờ dọc sông dịu hơn, nhưng hồ vẫn như đĩa cao và núi vẫn là các chóp rời. Không thay bộ chín ảnh hoặc bảng QA chưa đạt bằng ảnh thử này.

**Phát hiện cần xử lý tiếp ở 10b:** đo lại chỉ số AC-2 bằng cách lấy mẫu `waterBedHeight` trên tọa độ lưới 96 cho thấy **5 đỉnh**, không phải 6; cả HEAD trước sửa và code mới đều mất đỉnh gần (208,292) do lòng dẫn cắt qua. Test hiện có đo địa hình mô phỏng nên chưa phát hiện. Bản vẽ mới có độ lệch chuẩn dốc núi **2,188804**, độ cao tối đa **293,903890**, độ lệch chuẩn phần dư đồng bằng **1,980108** (2.950 mẫu theo cùng phép loại vùng của test hiện có). Thử tạm chuyển test AC-2 sang mặt vẽ đã báo fail đúng 5 đỉnh, sau đó hoàn nguyên thay đổi thử; không hạ ngưỡng 6 hoặc commit test hỏng. Cần sửa dáng núi/vị trí lòng dẫn và đưa phép đo mặt vẽ cuối vào test đạt trước khi đánh dấu 10b/10 hoàn tất. Bảng QA bước 9 vẫn giữ nguyên trạng thái chưa đạt.

Kiểm thử cuối mốc 10b-2: `node --test` **79/79**, 0 fail/skip, **106,597 giây** (wrapper **106,633 giây**, exit 0). E2e art-trees, art-strata, scenery, art-budget và cycle-flow (chính, gián đoạn, URL) đạt, console sạch. Budget tại **81,7167 giây**: Cao **67 calls / 225.584 triangles**, Thấp **66 / 86.384**, hạt giữ nguyên giữa hai mức. Lượt e2e đầu server đã dừng nên connection refused; lượt chạy lại dùng wrapper quản lý server đạt exit 0. Chưa đo FPS hoặc chạy toàn bộ e2e, chưa chụp lại chín ảnh. Không đánh dấu 10b/10 hoặc AC-2/7/13 đạt. `git diff --check` sạch.

## Mốc 10b-3 — Giữ đỉnh núi khi hạ lòng dẫn

Dịch riêng đỉnh (208,292) sang (240,260), giữ chiều cao và hai bán kính. Đỉnh cũ nằm gần đường suối phía nam; bờ hạ khi vẽ làm mất độ nổi bật của đỉnh dù test mặt mô phỏng vẫn đếm sáu. Không đổi đường suối, thuật toán World, RNG hoặc hằng số vật lý. Đây là chỉnh dữ liệu địa hình trong phạm vi yêu cầu, nên phải chạy lại toàn bộ kiểm thử mô phỏng.

`terrain-art.test.js` nay chạy cùng phép đo đỉnh/độ dốc và đồng bằng cho cả mặt mô phỏng lẫn mẫu `waterBedHeight` trên lưới 96. Giữ các ngưỡng cũ, không thay phép so nổi bật 15 trong bán kính 40 hay mốc dốc REQ-004 0,765818758. Mã bản đồ HEAD trước sửa chạy với test mặt vẽ mới thất bại đúng **5 đỉnh**; dữ liệu mới đạt **6 đỉnh** ở cả hai mặt. Độ lệch chuẩn dốc: mô phỏng **2,154392215**, mặt vẽ **2,146258984** (đều ≥ 1,531637516). Độ cao tối đa **293,903890045**. Độ lệch chuẩn phần dư đồng bằng: mô phỏng **1,980437579**, mặt vẽ **1,980107837**, cùng **2.950 mẫu**. Nhóm test địa hình đạt **5/5**.

Các cặp test thay đổi: hai test `drained terrain…` và `plain relief…` trước chỉ đo mặt mô phỏng; nay mỗi test chạy cho `simulation` và `rendered`, giữ toàn bộ assertion và thêm hai ca mặt vẽ. Test nhiễu không đổi. Đây chưa phải kết luận dáng núi đẹp hoặc toàn AC-13 đạt: núi còn dạng chóp rời, hồ/ao còn cần QA, chín ảnh chưa cập nhật.

Đã thử cắt mặt hồ theo `waterBedHeight` thay viền bán kính nhân tạo: test mép nước đạt nhưng ảnh góc dọc sông lộ mép hình chữ nhật ở giới hạn vùng lấy mẫu. **Đã bỏ toàn bộ thử nghiệm đó**, không thay mã nước/test nước. Phiên sau cần xử lý lòng chảo và chuyển tiếp cửa thoát đồng thời; không chỉ thay hàm cắt mặt nước. Các số Node/budget của thử nghiệm đã bỏ không phải bằng chứng cho commit này.

Kiểm thử Node sau chỉnh bản đồ: **81/81**, không fail/skip, **106,412 giây** (wrapper **106,444 giây**, exit 0), chạy riêng không có trình duyệt. Toàn bộ nhóm bản đồ/thoát nước/nhịp/ổn định/gió/bảo toàn vẫn đạt; không hiệu chỉnh hằng số vật lý hoặc hạ ngưỡng test. Chưa hoàn tất 10b/10c hoặc QA chín ảnh.

- E2e cuối trên bản đồ mới: **art-trees, art-budget, cycle-flow** (chính, gián đoạn và URL) đều đạt, console sạch, wrapper exit 0. Cây 2.200/400 và hạt không đổi khi chuyển mức. Ngân sách cùng trạng thái **81,3167 giây**: Cao **67 calls / 225.640 triangles**, Thấp **66 / 86.440**; Mặt Trời trong khung ở cả bốn góc mỗi mức. Không phải số đo FPS cuối. Đã đánh dấu riêng 10b-3; 10b/10c/10 giữ mở. Server đã dừng; `git diff --check` sạch.


## Mốc 10b-4 — Chung lòng chảo cho mặt đất và mặt nước

Đường viền cũ dùng `max(địa hình, level + (bán kính - viền) × 20)`, nên phần viền nhân tạo không có mặt đất tương ứng và phụ thuộc ngay vào mực nước. Nay `reservoirBowl` tạo lòng chảo cố định với viền biến thiên theo góc/seed, đáy theo dữ liệu vùng chứa, mép cao hơn mực đầy 3 đơn vị. `reservoirBedHeight` dùng cùng lòng chảo để tạo mặt đất, chuyển smoothstep về địa hình cũ từ bán kính chuẩn hóa 1,1 đến 1,65. Mặt nước cắt theo lòng chảo này tại mực thật; vùng lấy mẫu bao quanh toàn viền, không lan tới các vùng đất thấp hạ lưu. Lòng dẫn và cửa thoát vẫn khắc sau lòng chảo. Không thay địa hình mô phỏng, World, RNG hay lượng nước.

Test hồi quy mới kiểm các cạnh biên của mặt hồ/ao ở ba mực (thấp, ban đầu, đầy) trùng lòng chảo trong sai số 0,00001, diện tích tăng theo mực và bản đồ mô phỏng không bị sửa. Hai cặp kỳ vọng được đổi vì lòng chảo vẽ có thể nâng mép bờ: test cây **y ≤ độ cao mô phỏng → y ≤ mặt lòng chảo trước khắc kênh**, vẫn giữ y bằng mặt vẽ cuối; test liên tục bờ kênh **phần hạ so với heightAt → phần hạ so với basinTerrainHeight**, giữ ngưỡng bước nhảy < 0,1 và phần khắc không nâng đất. Các kiểm vùng cấm/số cây/tất định/bất biến World và nước kênh không bị lưới che giữ nguyên.

Ảnh thử Cao 1920 × 1080 góc dọc sông khi tạm dừng ban đầu: `screenshots/10-basin-river.png`. Đã xem: hồ/ao có thành lòng chảo quanh mặt nước rõ hơn, không còn mảng mặt hồ thừa tràn xuống đồng bằng như lượt thử mở rộng vùng lấy mẫu ban đầu (đã sửa trước kiểm thử cuối). Ảnh vẫn cho thấy núi là các chóp rời và cửa thoát/hồ cần QA bốn góc ở nhiều mực; **không đánh dấu 10b, AC-7 hoặc bảng QA 14 mục đạt**. Chín ảnh/evidence bước 9 chưa thay; ảnh 10 chỉ là bằng chứng sửa lỗi cục bộ, không dùng thay bộ nghiệm thu.

Kiểm thử Node mốc 10b-4: **82/82**, 0 fail/skip, **105,133 giây** (wrapper **105,168 giây**, exit 0), chạy riêng với trình duyệt. Mặt mô phỏng vẫn có 6 đỉnh, độ lệch chuẩn dốc 2,154392215; mặt vẽ 6 đỉnh, dốc **2,146393580**, phần dư đồng bằng **1,983465802** / 2.950 mẫu. README đã nói rõ lòng chảo chỉ điều chỉnh mặt vẽ; package.json giữ nguyên hợp đồng.

E2e cuối: **art-trees, art-strata, scenery, art-budget, cycle-flow** (chính, gián đoạn và URL) đạt, console sạch, wrapper exit 0. Ngân sách cùng trạng thái **70,65 giây**: Cao **67 calls / 223.416 triangles**, Thấp **66 / 84.216**; hạt không đổi khi chuyển mức, Mặt Trời trong khung ở bốn góc mỗi mức. Chưa đo FPS hoặc chạy toàn bộ e2e, chưa chụp lại chín ảnh. Đánh dấu riêng 10b-4; 10b/10c/10 vẫn mở.

## Mốc 10b-5 — Khối chân núi liên kết và nếp sườn

Địa hình trước đây lấy max của sáu bao đỉnh có bán kính nhỏ, nên khoảng giữa các đỉnh trở về nền thấp và nhìn như sáu chóp riêng. Bổ sung khối chân núi bằng tổng các bao Gaussian rộng, có ridged noise và giảm về 0 trước đồng bằng. Bao từng đỉnh biến thiên theo góc với hai tần số, tạo các sườn/sống bất đối xứng thay vì tiết diện elip đều. Vẫn dùng một lớp địa hình mô phỏng, không sửa World/RNG/hằng số vật lý, vị trí nước hoặc dữ liệu đỉnh.

Lượt thử khối nền hệ số 68 làm độ lệch chuẩn dốc giảm dưới ngưỡng AC-2 (mô phỏng 1,502065, vẽ 1,516374); đã bỏ. Hệ số cuối 56 và nếp sườn giữ sáu đỉnh, độ cao lớn nhất **293,826346043**, độ lệch chuẩn dốc mô phỏng **1,758658666**, mặt vẽ **1,756684043** (ngưỡng 1,531637516). Phần dư đồng bằng không đổi: mô phỏng **1,980437579**, vẽ **1,983465802** / 2.950 mẫu. Không hạ bất kỳ ngưỡng test cũ nào.

Thêm test `mountain shoulders form a continuous elevated range between summits`: mặt cắt x=150, z=300…800 cách nhau 10 phải cao hơn 85, để bắt hồi quy khoảng nền thấp giữa các chóp. Đối chứng bằng source HEAD cũ nạp trong bộ nhớ (không sửa working tree): cả 51 mẫu đều không đạt, thấp nhất **29,804915992**. Các test cũ giữ nguyên assertion. Toàn bộ **82/82 test hiện có đạt**, không fail/skip, **109,591 giây** (wrapper **109,623 giây**, exit 0); sau khi thêm test mới, nhóm địa hình **6/6** đạt. Lượt toàn bộ đã nạp file trước khi thêm test mới, nên không báo nhầm là 83/83.

Ảnh thử Cao 1920 × 1080, góc toàn cảnh, tạm dừng ban đầu: `screenshots/11-mountain-mass.png`. Đã xem: chân núi tạo dãy liên kết, sườn có nếp và các đỉnh không còn tiết diện đều. Phần đỉnh vẫn cao nhọn; ảnh này chưa đủ đánh dấu mục 1 hoặc toàn bộ bảng QA đạt. Không thay chín ảnh/evidence nghiệm thu cũ. Cần rà thêm góc núi/biển/dọc sông, cửa thoát và nhiều mực hồ/ao; chụp lại chín ảnh và đánh giá mưa/nhãn/panel trước khi đóng 10b. Mốc 10c và bước 10 tổng thể vẫn mở.

- E2e cuối: **art-trees, art-stage-labels, art-labels** (1280 × 800 và 1920 × 1080), **scenery, art-budget, cycle-flow** (chính, gián đoạn, URL) đều đạt, console sạch, wrapper exit 0. Cây 2.200/400; budget cùng trạng thái **70,65 giây**: Cao **67 calls / 223.416 triangles**, Thấp **66 / 84.216**; hạt bất biến khi đổi mức, Mặt Trời trong khung bốn góc mỗi mức. Không phải FPS cuối. Đã đánh dấu riêng 10b-5; 10b/10c/10 giữ mở. Server đã dừng, `git diff --check` sạch.


## Mốc 10b-6 — chụp lại bộ ảnh và cập nhật QA

Không thay World, RNG, dữ liệu địa hình hay mã vẽ. Cập nhật kịch bản ảnh để quan sát đúng sản phẩm sau 10a: tiến nhanh ở Thấp ×8 trong viewport 1280 × 800, khi cả bốn nhãn có đối tượng bám thì chuyển ×1, giữ nguyên điều kiện cả bốn visible và opacity ≥ 0,95, pause ngay trong callback. Chỉ sau đó đổi viewport 1920 × 1080 và Cao để chụp. Mọi ảnh cuối vẫn ở Cao/1920 × 1080; không thay bằng ảnh Thấp hoặc trạng thái mô phỏng giả.

Cặp kiểm ảnh mưa đổi từ “bất kỳ cụm mưa trong vùng + opacity ≥ 0,25” thành “đúng cụm mà `rain.target` bám + centroid và nhãn cùng thuộc vùng yêu cầu + cách neo ≤ 60 + opacity ≥ 0,95”. Khi có đối tượng trong vùng ở ×8, chuyển ×1 để giữ nhãn kịp mờ hiện; không giảm ngưỡng hoặc bỏ phép kiểm. `evidence.json` bổ sung snapshot `reservoirs` ở mỗi ảnh để đối chiếu mực nước. Log tên từng ảnh giúp phân biệt đang chờ hoạt động với đang chụp trên WebGL phần mềm.

Lượt gốc chờ bốn nhãn opaque ở ×8 timeout 120 giây. Lượt thử chỉ thêm ×1 nhưng giữ viewport lớn đã bị dừng trong khi chụp ảnh; không dùng ảnh/evidence dở của lượt đó làm bằng chứng. Lượt cuối với script hiện tại **đạt đủ chín ảnh**, Chromium 140.0.7339.16, console sạch; bảy ảnh đầu cùng thời điểm **134,9333 giây**, mưa núi **89,5833 giây**, mưa biển Gió 0 **28,2333 giây**. Thời điểm 134,9333 của ảnh bốn nhãn không phải bằng chứng luồng ×1 có mưa trong 120 giây; luồng đó vẫn do art-flow kiểm riêng.

Đã xem đủ chín ảnh, cập nhật bảng 14 mục phía trên theo thực tế: mục 4/5 chuyển Có; mục 1/2 vẫn Không. Cây/ruộng, màu đồng bằng, đỉnh trắng, bọt, trời và mặt cắt thấy được; biển chuyển màu nhẹ như trước. Mặt Trời có trong bốn góc. Chưa kết luận AC-7/13 hoặc toàn REQ đạt.

Chẩn đoán mặt vẽ ở ao (x=560,z=280): theo hướng +x, bán kính chuẩn hóa 1,3, mặt mô phỏng **5,853650741** nhưng mặt vẽ **21,185907653**; tại 1,1 là **7,585762308 / 18,622181593**. Lòng chảo bình phương tiếp tục tăng ngoài mép rồi mới hòa về nền, tạo ụ đất cao. Phần sửa sau cần xử lý cả hình dáng bờ ngoài và cửa thoát; không chỉ clip lại mặt nước. Chưa thay thuật toán từ phép đo này.

Kiểm thử Node mốc 10b-6: **83/83**, 0 fail/skip/cancelled, **111,368 giây** (wrapper **111,401 giây**, exit 0), chạy riêng không trình duyệt. Các test mô phỏng/thoát nước/nhịp/gió/bảo toàn và đo mặt vẽ vẫn đạt; số đo địa hình không đổi so với 10b-5. Đây là lần đầu lượt tổng thể đã bao gồm test khối chân núi mới (83 test). Không đổi assertion Node hoặc mã sản phẩm.

E2e hồi quy cuối mốc 10b-6: **art-stage-labels** và **art-labels** (1280 × 800, 1920 × 1080) đều đạt, console sạch, wrapper exit 0. Bao gồm bám cụm, N/L, không giao hộp nhãn, bấm nhãn giai đoạn/vùng, chuyển và ngắt camera, Gió 0. Không chạy mọi e2e/FPS/ngân sách cuối ở mốc này; vẫn thuộc 10c. Server đã dừng.


## Mốc 10b-7: giới hạn bờ ngoài lòng chảo

- Chặn bán kính trong công thức độ cao lòng chảo ở 1 trước khi hòa về địa hình nền. Trước đây parabol tiếp tục tăng ngoài mép và tạo ụ cao; nay bờ ngoài nằm giữa độ cao mép và nền gốc. Không đổi World/RNG, địa hình mô phỏng, mực nước, viền mặt nước hoặc thông số hòa bờ. Test mới lấy mẫu toàn vòng hồ/ao từ bán kính chuẩn hóa 1 đến 1,8 để bắt phần bờ vượt cao; giữ toàn bộ assertion cũ.
- Điểm ao hướng +x tại r/radiusX=1,3 giảm từ **21,185907653 xuống 17,000404901**; tại 1,1 từ **18,622181593 xuống 18,2**. Đây chỉ sửa phần bờ đội cao, chưa giải quyết toàn bộ cảm giác hồ nổi/cửa thoát dốc. Ảnh Cao 1920 × 1080 paused ban đầu `screenshots/12-capped-banks.png` đã xem: hồ vẫn có mép cao và núi vẫn nhọn. Giữ nguyên bảng QA chưa đạt, chín ảnh/evidence cũ và các mục 10b/10c/10 mở.
- Toàn bộ `node --test` đạt **84/84**, không fail/skip/cancelled, **111,972 giây** (wrapper **112,005**, exit 0), không chạy cùng trình duyệt. Nhóm nước/địa hình/cây đạt **15/15**. Mặt vẽ giữ **6 đỉnh**, độ lệch chuẩn dốc **1,756618097**, phần dư đồng bằng **1,980239985** / 2.950 mẫu. E2e **art-strata**, **art-trees** và chụp ảnh dọc sông đạt, console sạch; server đã dừng. Chưa chạy toàn bộ e2e/FPS/ngân sách cuối.
- Tiếp theo: tiếp tục 10b sửa dáng sáu chóp hẹp, xử lý mép hồ/ao và chuyển tiếp cửa thoát còn cao dốc (không chỉ giới hạn parabol). QA bốn góc và mực thấp–đầy; chụp lại chín ảnh, cập nhật bảng đúng thực tế. Sau đó 10c chạy đầy đủ Node/e2e REQ-004/005/006, FPS hai mức riêng, ngân sách cuối, rà README/package. **Trả continue**, chưa hoàn tất REQ-006.
- Không có notes.md hoặc eval REQ-006. Lệnh vẫn `node --test`, server `python3 -m http.server 8000`, `node e2e/<name>.e2e.mjs`; dùng wrapper Python quản lý server trong try/finally. Playwright toàn cục qua browser.mjs. Commit dùng `git -c user.name='Dev Agent' -c user.email='dev-agent@example.com' commit ...`, không sửa cấu hình .git. Script chụp thử /tmp không bền vững; ảnh đã lưu trong repo. Không sửa tài liệu cấm hoặc ảnh REQ-004/005.


## Mốc 10b-8: hạ mép lòng chảo

- Hạ mép lòng chảo từ mực đầy +3 xuống +0,5 đơn vị. Bờ vẫn cao hơn mực đầy, giảm thành đất không cần thiết. Giữ đáy, bán kính, nhiễu viền, khoảng hòa bờ và mọi dữ liệu/thuật toán mô phỏng. Viền mặt nước tự mở rộng theo giao tuyến với cùng lòng chảo mới; không sửa lượng nước hoặc mực nước.
- Test mới lấy mẫu toàn vòng bờ hai vùng chứa, bắt buộc cao hơn mực đầy và không vượt +0,5. Test bờ ngoài trước đây dùng giới hạn mực đầy +3 được cập nhật thành +0,5 (cả cận trên và dưới); vẫn kiểm bờ nằm giữa mép và địa hình gốc. Không đổi các assertion đường bờ, diện tích theo mực, độ liên tục và lưới không che kênh.
- Nhóm nước/địa hình/cây đạt **16/16**. Toàn bộ `node --test` đạt **85/85**, 0 fail/skip/cancelled, **110,691 giây** (wrapper **110,723**, exit 0), chạy riêng không trình duyệt. Mặt vẽ giữ **6 đỉnh**, độ lệch chuẩn dốc **1,756537637**, phần dư đồng bằng **1,980082834** / 2.950 mẫu. World/RNG và các kiểm thoát nước/nhịp/bảo toàn vẫn đạt.
- E2e **art-strata** và **art-trees** đạt, console sạch, cây 2.200/400 và hạt bất biến khi đổi mức. Đã chụp/xem bốn góc sẵn Cao 1920 × 1080 ở trạng thái ban đầu paused (hồ **20**, ao **11,6**). Lưu ảnh dọc sông riêng `screenshots/13-lower-rims.png`; các ảnh góc khác là ảnh thử /tmp. Bờ thấp hơn nhưng hồ/cửa thoát vẫn có cảm giác nổi, núi vẫn chóp hẹp; chưa kiểm ảnh mực thấp–đầy. Giữ bảng QA mục 1/2 là Không, không thay bộ chín ảnh/evidence nghiệm thu. Chưa chạy mọi e2e, FPS hoặc ngân sách cuối.


## Mốc 10b-9: mở rộng sườn giữa

- Thay bao chóp đơn bằng tổng có trọng số của sườn rộng và chóp hẹp. Giữ nhiễu sống núi, nếp sườn theo góc, khối chân núi liên tục, dữ liệu bản đồ và mọi quy luật/hằng số của World. Đây vẫn là một lớp địa hình; thay đổi có ảnh hưởng hình dạng địa hình mô phỏng nên đã chạy toàn bộ test mô phỏng ngay. Hai thử nghiệm ban đầu (giảm số mũ chóp xuống 0,85; thêm bướu sin trên sườn) mất sáu đỉnh nổi bật, đã loại bỏ trước kiểm thử cuối. Không hạ assertion AC-2.
- Test mới đo diện tích trên đường đồng mức 120 trong cửa sổ riêng của khối núi phía bắc (x=0…198, z=50…248, bước 2). Diện tích tăng từ **8.228 lên 12.532 đơn vị vuông**; ngưỡng hồi quy **11.000** bắt được bao chóp cũ. Test kiểm hình dạng đo được, không kiểm công thức nội bộ. Không đổi assertion của test cũ.
- Nhóm địa hình **7/7**. Cả mặt mô phỏng/mặt vẽ giữ **6 đỉnh**, cao nhất **293,838221629**; độ lệch chuẩn dốc **1,672614053 / 1,667175017**, vượt ngưỡng **1,531637516**. Phần dư đồng bằng **2,642840243 / 2,642425414**, 2.950 mẫu.
- Lượt toàn bộ cuối có đủ test mới: **86/86**, không fail/skip/cancelled, **109,638 giây**, exit 0; chạy riêng không trình duyệt. Lượt trước 85/85 đạt 115,446 giây nhưng có chụp thử cùng lúc; không dùng lượt đó làm số đo cuối.
- Đã chụp và xem bốn góc Cao 1920 × 1080, paused ban đầu (hồ 20/ao 11,6), console sạch. Lưu riêng ảnh dọc sông `screenshots/14-broad-flanks.png`. Sườn rộng hơn nhưng các đỉnh vẫn có dáng chóp; hồ/cửa thoát vẫn còn cảm giác nổi. **Không đánh dấu mục QA 1/2, 10b, AC-7 hoặc AC-13 đạt**; giữ nguyên chín ảnh/evidence nghiệm thu. Chưa QA mực thấp–đầy.
- Chẩn đoán cần xử lý tiếp ở nước: `channelRibbon` vẽ nửa rộng 4…6 cho sông, trong khi `recessedBank` khắc một đáy phẳng đến bán kính 9 rồi mới hòa ra 34. Trên bản đồ mới, toàn bộ đỉnh biên dải sông cao hơn `waterBedHeight` tại cùng x/z **4…4,559441460** đơn vị. Vì vậy chỉ kiểm “đáy thấp hơn nước” chưa đủ chứng minh mép nước tiếp đất. Cần kiểm giao tuyến mép nước với **lưới đất thực tế ở cả 80/160**, xử lý đồng thời bờ kênh và cửa hồ; tránh lặp lại việc chỉ hạ mép lòng chảo. Đây là phép đo chẩn đoán, **chưa thay thuật toán nước hoặc assertion nước**.

- E2e cuối **art-trees, art-budget, cycle-flow** (chính, gián đoạn, URL) đều đạt, console sạch, wrapper exit 0. Cây **2.200/400**, hạt không đổi khi chuyển chất lượng. Budget cùng trạng thái **75,7167 giây**: Cao **67 calls / 223.472 triangles**, Thấp **66 / 84.272**; Mặt Trời trong khung bốn góc ở cả hai mức. Đây không phải FPS cuối. Server đã dừng. Lượt e2e đầu lỗi kết nối do server PTY đã dừng; lượt cuối dùng wrapper quản lý server trong try/finally, chạy đầy đủ ba script đạt.

## Mốc 10b-10 — Chẩn đoán khe hở mép nước trên lưới vẽ

Hoàn tất công cụ đo, **chưa sửa hình ảnh và chưa đóng 10b/10c/10**. `src/art/water-audit.js` lấy mẫu Float32 cùng lưới 80/160 và nội suy đúng hai tam giác mỗi ô như `terrainGeometry`. Đo khoảng cách thẳng đứng từ từng đỉnh dải nước tới mặt đất tính toán và mặt đất thực sự được vẽ. Số dương nghĩa là nước cao hơn đất; báo cáo đếm cả đỉnh trùng của tam giác và đỉnh tại cửa nối vùng nước, nên không tự coi mọi số dương là lỗi nghiệm thu. Ngưỡng phân loại là 0,05 đơn vị. Công cụ chỉ đọc bản đồ; không dùng World/RNG hoặc đổi mã dựng cảnh.

Tái lập bằng `node scripts/audit-water-banks.mjs > specs/REQ-006/water-bank-audit.json`. Báo cáo hiện tại:

| Lưới | Khoảng cách mép sông tới mặt vẽ | Khoảng cách lớn nhất ở từng suối |
| --- | --- | --- |
| 80 | 3,257442–4,499125 | 27,937914 / 51,741519 / 80,694126 |
| 160 | 3,994792–4,525581 | 28,277714 / 47,758443 / 61,536848 |

Cả 1.098 lượt đỉnh biên sông đều cao hơn mặt vẽ quá 0,05. Mặt đất tính toán tại mép sông thấp hơn nước khoảng 4,000000–4,559441. Khoảng cách ở suối lớn hơn nhiều: cần rà cả đường tâm làm trơn qua các sườn núi, không chỉ thay độ rộng lòng dẫn. Đây là chẩn đoán, chưa xác nhận nguyên nhân của từng đỉnh suối.

Đã thử mở dải nước tới giao tuyến mặt đất ở mỗi mức. Kiểm số học đạt nhưng ảnh dọc sông cho thấy suối thành dải răng cưa lớn và nước phủ vị trí cây. **Đã bỏ toàn bộ thử nghiệm sản phẩm và ảnh thử**, trả `water-shapes.js`, `render.js`, test nước cũ về đúng HEAD đầu phiên. Không dùng e2e/ngân sách của thử nghiệm này làm bằng chứng cho phiên bản cuối. Không thay chín ảnh/evidence hoặc bảng QA bắt buộc 1/2 chưa đạt.

Kiểm tra phiên bản cuối: `node --test` **89/89**, 0 fail/skip/cancelled, **111,723 giây**, exit 0, chạy riêng không trình duyệt. Ba test mới kiểm nội suy hai tam giác khác nội suy song tuyến, phân biệt nước cao hơn/thấp hơn/chạm đất với dữ liệu biết trước, tính tái lập hai độ phân giải và không sửa bản đồ. Không đổi assertion cũ. Chỉ số mặt vẽ vẫn 6 đỉnh, độ lệch chuẩn dốc **1,667175017**, phần dư đồng bằng **2,642425414** / 2.950 mẫu. E2e cuối sau khi bỏ thử nghiệm: **art-strata, art-trees** đạt, console sạch, cây 2.200/400 và hạt không đổi khi chuyển chất lượng. Server đã dừng. Chưa chạy toàn bộ e2e hoặc FPS/ngân sách cuối; những việc này vẫn thuộc 10c.


## Mốc 10b-11 — Kiểm chứng mặt hồ/ao theo lưới vẽ

Hai commit được hệ thống lưu sau các lần chạy gián đoạn (`6945355`, `3f7b20a`) có thay đổi sản phẩm chưa được ghi trong bàn giao 10b-10: đường tâm kênh làm trơn được giới hạn bởi độ cao địa hình tại vị trí mới và truyền giới hạn xuống hạ lưu; mặt hồ/ao dùng `renderedBasinSurface` để cắt theo đúng tam giác đất Float32 tại 80/160 ô. Renderer sử dụng mặt này cả khi dựng cảnh và khi mực nước đổi. Không dùng mô phỏng giả, không đổi World/RNG.

Phiên này bổ sung kiểm chứng cho mặt hồ/ao: giữ các mực kiểm cũ, thêm đúng mực một hạt và mực đầy từ dữ liệu; kiểm diện tích tăng chặt theo mực nước, tâm mỗi tam giác không nằm trên đất khô, tính tất định và không sửa bản đồ. Ngưỡng số giao điểm >20 vẫn giữ cho các mực kiểm cũ; mực một hạt chỉ yêu cầu có giao tuyến vì diện tích rất nhỏ. Nhóm nước đạt 10/10.

Đã xem ảnh `15-mesh-shorelines.png` có sẵn trong HEAD: hồ/ao tiếp đất tốt hơn nhưng suối còn dải gấp/răng cưa và đỉnh núi còn nhọn. Ảnh này chỉ là ảnh chẩn đoán; không thay bộ chín ảnh nghiệm thu và không đánh dấu bảng QA 1/2 đạt. Chưa kiểm ảnh bốn góc ở mực thấp–đầy, chưa chạy toàn bộ e2e/FPS/ngân sách cuối. **10b/10c/10 tiếp tục mở.**

Kiểm tra cuối mốc 10b-11: toàn bộ `node --test` **91/91**, không fail/skip/cancelled, **109,185 giây**, exit 0, chạy riêng không trình duyệt. E2e **art-strata** và **art-trees** đạt, console sạch; cây 2.200/400 và hạt bất biến khi đổi chất lượng. Server đã dừng. Lượt Node đầu bị kết thúc exit 143, không dùng làm bằng chứng; lượt cuối chạy tách phiên tiến trình và hoàn tất đầy đủ.


## Mốc 10b-12 — Lòng sông nông hơn

Giảm độ sâu khắc riêng sông từ 4 xuống 1 đơn vị; suối giữ 4. Không đổi World/RNG, địa hình mô phỏng, đường tâm, độ rộng hoặc mực nước. Test mới đo mép sông trên lưới Float32 80/160: không bị đất che và khoảng hở lớn nhất <4,1; bản khắc sâu cũ vượt ngưỡng ở cả hai mức. Đây là giới hạn hồi quy của sửa cục bộ, **không phải ngưỡng nghiệm thu giao tuyến bờ**.

Đã tái lập `water-bank-audit.json` sau cả thay đổi đường tâm phiên trước và sửa này: khoảng hở mép sông Thấp **0,427145–3,768914**, Cao **0,994792–4,035716**. Các suối vẫn có khoảng hở cực đại tới **69,222263** ở Thấp / **55,746342** ở Cao. Chưa giải quyết được giao tuyến bờ suối/cửa thoát tổng thể. Ảnh chẩn đoán `16-shallow-river.png` (Cao, 1920 × 1080, dọc sông, paused ban đầu) đã xem: núi còn nhọn, suối còn gấp/răng cưa. Giữ bảng QA bắt buộc 1/2 chưa đạt, không thay bộ chín ảnh/evidence nghiệm thu.

Nhóm nước/địa hình/cây **19/19**; toàn bộ Node **91/91**, 0 fail/skip/cancelled, **110,670 giây** trên mã sản phẩm cuối. Test audit mới được thêm sau khi lượt toàn bộ bắt đầu; nhóm audit cuối chạy riêng **4/4**, không tuyên bố lượt toàn bộ 92/92. Phép đo Node có trùng ảnh thử lúc đầu, chưa dùng làm thời gian cuối 10c. Mặt vẽ vẫn 6 đỉnh, độ lệch chuẩn dốc **1,625597639**, phần dư đồng bằng **2,642467559**. Không đổi assertion cũ.

E2e cuối **art-strata, art-trees, art-budget** đạt, console sạch, hạt bất biến khi đổi mức. Cây 2.200/400; budget cùng thời điểm 76,1167 giây: Cao **67 calls / 224.280 triangles**, Thấp **66 / 84.122**; Mặt Trời trong khung bốn góc mỗi mức. Server đã dừng. Chưa chạy toàn bộ e2e/FPS cuối hoặc QA bốn góc ở mực thấp–đầy. **10b/10c/10 vẫn mở.**


## Mốc 10b-13: hạn chế khắc bờ ngoài suối

- Lỗi công suất mô hình của lần trước không tái diễn. Đọc lại tài liệu; không có notes.md hoặc eval REQ-006. Bờ ngoài suối tăng độ cao đáy mục tiêu 0,5 đơn vị cho mỗi đơn vị khoảng cách vượt 9. Giữ độ sâu/độ rộng nước, đường tâm, World/RNG và địa hình mô phỏng. Chỉ sửa mặt vẽ. Thử chọn đoạn gần nhất hoặc nâng bờ hệ số 2 làm nước bị che ở lưới Thấp, đã bỏ; không hạ assertion.
- Test hồi quy mới kiểm mọi suối không có đỉnh nước bị đất che ở cả 80/160 và khoảng hở cực đại của suối đầu <26 trên cả mặt tính toán/mặt lưới. Báo cáo audit tái lập: suối đầu Thấp **23,935829**, Cao **25,111318** (trước **26,779112 / 27,228599**). Suối thứ hai **53,715413 / 41,668566**; suối thứ ba vẫn **69,222263 / 55,746342**. Đây là cải thiện cục bộ, chưa phải giao tuyến mép đạt QA.
- Toàn bộ `node --test` cuối **93/93**, 0 fail/skip/cancelled, **109,656 giây**, chạy riêng trước trình duyệt. Mọi assertion cũ giữ nguyên. E2e **art-strata**, **art-trees** đạt, console sạch; cây **2.200/400**, hạt bất biến khi chuyển chất lượng. Server wrapper Python đã dừng.
- Đã chụp và xem `screenshots/17-stream-banks.png`, Cao 1920 × 1080, dọc sông, paused ban đầu. Núi vẫn nhọn, suối còn gấp khúc và mép nước chưa tự nhiên; không thay chín ảnh/evidence hoặc bảng QA 1/2 chưa đạt. Chưa QA bốn góc/mực thấp–đầy, chưa đo FPS/ngân sách cuối hoặc mọi e2e.
- Chỉ đóng mốc **10b-13**; **10b/10c/10 còn mở, trả continue**. Tiếp theo cần sửa tổng thể hình khối núi và giao tuyến bờ kênh/cửa hồ, đặc biệt hai suối còn khoảng hở lớn. Giữ sáu đỉnh, mọi test mô phỏng và kiểm nước không bị che; không tăng bờ tùy ý vì lưới Thấp sẽ che suối. Sau đó QA ảnh theo yêu cầu rồi chạy đầy đủ 10c.
- Lệnh: `node --test`, `node scripts/audit-water-banks.mjs > specs/REQ-006/water-bank-audit.json`, `node e2e/art-strata.e2e.mjs`, `node e2e/art-trees.e2e.mjs`. Server `python3 -m http.server 8000` quản lý bằng Python try/finally. Commit dùng danh tính tạm qua `git -c user.name='Dev Agent' -c user.email='dev-agent@example.com' commit ...`. Không sửa tệp cấm. Log/script thử /tmp không bền vững; số đo và ảnh đã lưu repo.


## Mốc 10b-14 — nâng dốc bờ ngoài suối

Tăng hệ số nâng đáy mục tiêu ngoài khoảng cách 9 từ 0,5 lên 1,5. Giữ độ sâu/độ rộng nước, đường tâm, lưới, World/RNG và địa hình mô phỏng. Không đổi assertion cũ; thêm test khoảng hở hai suối đầu dưới 24 và dưới 53/37 (Thấp/Cao), mọi suối không bị che. Các thử nghiệm thu hẹp vùng khắc và nâng khối núi làm hỏng kiểm nước/chỉ số AC-2 đã bỏ hoàn toàn.

Báo cáo audit tái lập bằng `node scripts/audit-water-banks.mjs > specs/REQ-006/water-bank-audit.json`: khoảng hở cực đại suối đầu Thấp/Cao **20,546828 / 23,017695** (trước **23,935829 / 25,111318**); suối thứ hai **52,613190 / 36,514694** (trước **53,715413 / 41,668566**). Suối thứ ba vẫn **69,222263 / 55,746342**. Đây là số đo chẩn đoán, không phải nghiệm thu giao tuyến bờ nước.

Toàn bộ `node --test` cuối **94/94**, 0 fail/skip/cancelled, **108,127 giây**, chạy riêng trước trình duyệt. Giữ sáu đỉnh; dốc mặt vẽ **1,622160492**, phần dư đồng bằng **2,642467559** / 2.950 mẫu. E2e **art-strata**, **art-trees** đạt, console sạch, cây **2.200/400**, hạt bất biến khi đổi mức. Server đã dừng.

Đã chụp/xem `screenshots/18-steeper-stream-banks.png`, Cao 1920 × 1080, dọc sông, paused ban đầu, hồ 20/ao 11,6. Núi vẫn nhọn, suối vẫn gấp/răng cưa; không thay chín ảnh/evidence hoặc bảng QA bắt buộc 1/2 chưa đạt. Chưa QA bốn góc/mực thấp–đầy, chưa chạy mọi e2e/FPS/ngân sách cuối. **10b/10c/10 còn mở; trả continue.** Cần sửa tổng thể giao tuyến kênh (đặc biệt suối thứ ba) và dáng núi; không tiếp tục tăng hệ số tùy ý vì khoảng hở nhỏ nhất trên lưới Thấp hiện chỉ khoảng 0,35–0,38 ở hai suối sau.


## Mốc 10b-15 — giảm nhẹ độ sâu khắc suối

Giảm độ sâu khắc mặt vẽ suối từ 4 xuống 3,7 đơn vị. Không đổi World, RNG, bản đồ mô phỏng, đường tâm, độ rộng nước hoặc sông. Thử nghiệm độ sâu 3 làm nước bị che trên lưới Thấp, đã bỏ; giữ nguyên mọi assertion cũ. Test mới kiểm tất cả suối còn khoảng hở >0,05 trên lưới 80/160, đáy tính toán nông hơn 3,75 và cực đại suối đầu <20,4/22,8. Đây là cải thiện cục bộ, không phải nghiệm thu giao tuyến bờ.

Audit tái lập: suối đầu có khoảng hở cực đại Thấp/Cao **20,261271 / 22,717849**; suối thứ hai **52,467390 / 36,257185**; suối thứ ba **69,222263 / 55,631194**. Khoảng hở nhỏ nhất trên lưới Thấp của hai suối sau chỉ **0,060212 / 0,108243**, vì vậy không tiếp tục giảm độ sâu tùy ý. Cực đại lớn ở suối thứ ba gần như không thay đổi: cần xử lý hình học đường tâm/bờ tổng thể.

Toàn bộ Node **95/95**, 0 fail/skip/cancelled, **112,119 giây**, chạy riêng không trình duyệt. E2e **art-strata, art-trees** đạt, console sạch, cây 2.200/400 và hạt bất biến khi đổi mức. Mặt vẽ còn 6 đỉnh, độ lệch chuẩn dốc **1,622273730**, phần dư đồng bằng **2,642467559**. Chụp/xem `screenshots/19-shallower-streams.png`, Cao 1920 × 1080, dọc sông, paused ban đầu. Núi còn nhọn và suối còn gấp khúc; giữ bảng QA bắt buộc 1/2 chưa đạt và bộ chín ảnh/evidence cũ. Chưa QA bốn góc/mực thấp–đầy, chưa chạy mọi e2e/FPS/ngân sách cuối. **10b/10c/10 tiếp tục mở.**


## Mốc 10b-16 — khắc bờ sông theo độ dốc thượng lưu

Phép khắc trước đây chặn tham số chiếu vào từng đoạn ở [0, 1], vì vậy đầu đoạn hạ lưu khắc cùng độ cao thấp vào phần bờ phía thượng lưu. Với riêng sông, ngoại suy độ dốc về phía trước đầu đoạn để giảm phần khắc thấp sai vị trí. Không đổi đường tâm, độ rộng, độ sâu, World/RNG hay bản đồ mô phỏng. Áp dụng ngoại suy cho suối (kể cả bản giới hạn 0,5 hoặc chỉ ngoài bán kính 9) gây che nước trên lưới Thấp, đã bỏ hoàn toàn; giữ nguyên mọi assertion cũ.

Audit tái lập bằng `node scripts/audit-water-banks.mjs > specs/REQ-006/water-bank-audit.json`: sông Thấp có khoảng hở **0,315779–3,204882**, Cao **0,934411–3,492402** (cực đại cũ **3,768914 / 4,035716**). Test mới chặn cực đại dưới 3,3/3,6 và khoảng hở nhỏ nhất trên 0,05. Suối giữ nguyên: cực đại **20,261271 / 22,717849**, **52,467390 / 36,257185**, **69,222263 / 55,631194** (Thấp/Cao). Đây là cải thiện cục bộ sông, chưa phải nghiệm thu AC-7.

Toàn bộ `node --test` **96/96**, 0 fail/skip/cancelled, **108,238 giây**, exit 0, chạy riêng trước trình duyệt. E2e **art-strata, art-trees** đạt, console sạch, cây **2.200/400**, hạt bất biến khi chuyển chất lượng. Mặt vẽ vẫn **6 đỉnh**, độ lệch chuẩn dốc **1,622273730**, phần dư đồng bằng **2,642467559** / 2.950 mẫu. Server Python đã dừng sau kiểm thử.

Đã chụp/xem `screenshots/20-river-slope-banks.png`, Cao 1920 × 1080, dọc sông, paused ban đầu. Núi vẫn quá nhọn, suối còn gấp/răng cưa; giữ bảng QA bắt buộc 1/2 chưa đạt và chín ảnh/evidence cũ. Chưa QA bốn góc/mực thấp–đầy, chưa chạy mọi e2e/FPS/ngân sách cuối. **10b/10c/10 tiếp tục mở; trả continue.**


## Mốc 10b-17 — Định vị cực trị mép nước

Báo cáo `water-bank-audit.json` bổ sung `extrema.analytic` và `extrema.rendered` cho từng kênh/mức: chỉ số đỉnh trong dải tam giác, tọa độ Float32, độ cao đất và khoảng hở. Cực trị hòa chọn đỉnh đầu tiên; dữ liệu rỗng trả null. Không đổi hình ảnh, World, RNG hoặc assertion cũ. Test kiểm cực trị trùng min/max tổng hợp và đầu vào không bị sửa.

Phát hiện quan trọng: suối thứ ba có khoảng hở lớn nhất tại **đỉnh 1, [164,898895; 207,522614; 241,351105]**, ngay đầu nguồn, trên cả hai lưới. Đất Thấp cao **138,300350**, Cao **151,891420**; khoảng hở **69,222263 / 55,631194**. Suối thứ hai cực đại tại [208,045319; 199,773758; 518,780212] ở Thấp và [204,781601; 202,763107; 517,997192] ở Cao. Cần xét mặt dải nước đầu nguồn và mặt đất tại tọa độ ngang tương ứng, không chỉ cửa hồ hoặc phần bờ xa.

Thử ngoại suy độ dốc suối chỉ ngoài khoảng cách 16 không đổi cực đại; áp dụng từ khoảng cách 6 làm che một đỉnh nước ở Thấp. Đã bỏ toàn bộ thử nghiệm sản phẩm. Giữ QA 1/2 chưa đạt; không chụp ảnh mới vì hình ảnh không đổi. Các bước 10b, 10c và 10 chưa hoàn tất.

Kiểm thử cuối mốc 10b-17: `node --test` đạt **97/97**, 0 fail/skip/cancelled, **111,091 giây**, exit 0. Không chạy e2e/ảnh/FPS vì không đổi mã dựng cảnh hoặc mô phỏng; không dùng kết quả cũ thay lượt kiểm cuối 10c.


## Mốc 10b-18 — Kiểm chứng đầu nguồn thu nhọn

- Lần chạy trước bị lỗi dịch vụ mô hình, nhưng commit tự động `9037e04` đã giữ thay đổi sản phẩm và hai test: đầu nguồn suối bắt đầu tại một điểm, mở dần trong 40 đơn vị theo chiều dài đường tâm. Phiên này kiểm chứng phần việc đó trước; không đổi thêm code hoặc hạ assertion. Không có notes.md/eval REQ-006; nhánh đúng `req/REQ-006`.
- Chạy lại audit và so byte với `water-bank-audit.json`: khớp hoàn toàn. Khoảng hở cực đại suối thứ ba Thấp/Cao **66,766681 / 51,833836**, trước thu nhọn **69,222263 / 55,631194**. Suối thứ hai **49,142002 / 36,230414**; suối đầu **20,261271 / 22,717849**. Không đỉnh nước suối nào bị che; min Thấp hai suối sau vẫn **0,060212 / 0,108243**. Đây chỉ là cải thiện cục bộ, không coi AC-7 đạt.
- Toàn bộ `node --test`: **99/99**, 0 fail/skip/cancelled, **111,681 giây**, exit 0, chạy riêng trước trình duyệt. E2e `art-strata` và `art-trees` đạt, console sạch; cây 2.200/400 và hạt bất biến khi chuyển mức.
- Chụp và xem `screenshots/21-tapered-headwaters.png`: Cao, 1920 × 1080, dọc sông, paused ban đầu, console sạch. Đầu nguồn gọn hơn nhưng núi vẫn nhọn, bờ suối còn răng cưa và có đoạn nước hở cao hơn đất. Giữ nguyên bảng QA bắt buộc 1/2 chưa đạt; không thay chín ảnh/evidence nghiệm thu. Chưa kiểm bốn góc/mực thấp–đầy, mọi e2e hoặc FPS/ngân sách cuối.
- Đóng mốc kiểm chứng **10b-18**; **10b/10c/10 còn mở; trả continue**. Tiếp theo cần sửa tổng thể dáng núi và giao tuyến bờ, không tiếp tục coi giảm vài đơn vị khoảng hở là nghiệm thu. Bảo toàn sáu đỉnh và các test mô phỏng; sau khi hình ảnh đạt mới chụp lại bộ chín ảnh, cập nhật QA, rồi chạy đầy đủ 10c.
- Lệnh: `node --test`, `node scripts/audit-water-banks.mjs`, `node e2e/art-strata.e2e.mjs`, `node e2e/art-trees.e2e.mjs`; server `python3 -m http.server 8000`, đã dừng sau kiểm thử. Script chụp tạm /tmp không bền vững; ảnh giữ trong repo. Commit dùng danh tính từng lệnh `git -c user.name='Dev Agent' -c user.email='dev-agent@example.com' commit ...`, không sửa git config/tệp cấm.


## Mốc 10b-19: đường tâm suối theo mặt tam giác

- Giới hạn độ cao đường tâm suối bởi cả địa hình song tuyến và mặt tam giác **chưa khắc** của hai lưới 80/160. Dùng cả hai mức từ config cho mọi lần dựng, nên đổi chất lượng không đổi đường nước. Truyền giới hạn xuống hạ lưu để giữ nước không chảy ngược. Độ sâu đáy suối thêm cục bộ 5% độ hạ đường tâm; chỉ hạ đường tâm mà không thêm khoảng hở làm che nước ở Thấp, còn tăng độ sâu đồng loạt làm rộng khe ở cả mạng sông. Không đổi World/RNG, địa hình mô phỏng, tọa độ ngang hoặc độ rộng nước.
- Audit tái lập: cực đại ba suối Thấp **20,143233 / 37,106160 / 32,724173**, Cao **21,178304 / 36,230883 / 32,775815**. Suối thứ ba trước sửa **66,766681 / 51,833836**. Không đỉnh nước nào bị đất che; min ba suối Thấp **2,884063 / 0,199177 / 0,718484**. Sông giữ **0,315779–3,204882 / 0,934411–3,492402**. Đây vẫn là giới hạn hồi quy, chưa phải nghiệm thu giao tuyến bờ.
- Thêm hai test kiểm nguồn suối không vượt mặt tam giác chưa khắc và khoảng hở suối thứ ba <33 trên hai lưới. Giữ mọi assertion cũ. Toàn bộ `node --test` **101/101**, 0 fail/skip/cancelled, **110,889 giây**, exit 0, chạy riêng trước trình duyệt. Sau đó chỉ sửa tên test cho mô tả đúng; nhóm audit chạy lại **11/11**. Mặt vẽ vẫn **6 đỉnh**, dốc **1,614933271**, phần dư đồng bằng **2,642467559** / 2.950 mẫu.
- E2e **art-strata, art-trees** đạt, console sạch; cây **2.200/400**, hạt bất biến khi đổi chất lượng. Chụp và xem `screenshots/22-triangle-aware-streams.png`, Cao 1920 × 1080, dọc sông, tạm dừng ở **3,966667 giây**, hồ **19,96**, ao **11,6**. Đường nước bám sườn tốt hơn nhưng núi vẫn nhọn, mép suối còn gấp/răng cưa; giữ QA bắt buộc 1/2 chưa đạt và chín ảnh/evidence cũ. Server đã dừng.
- Đóng mốc **10b-19**, giữ **10b/10c/10 mở; trả continue**. Tiếp theo cần sửa dáng núi và giao tuyến bờ tổng thể, giữ sáu đỉnh và mọi test mô phỏng. Nguồn suối hiện không chỉ theo nội suy song tuyến: mọi sửa tiếp phải kiểm cả hai mặt tam giác. Sau khi hình ảnh đạt, QA bốn góc ở mực thấp–đầy, chụp lại chín ảnh/bảng QA rồi chạy đầy đủ 10c (mọi e2e, FPS, budget, README/package); chưa chạy các phép kiểm cuối này trong phiên.
- Không có notes.md/eval REQ-006. Lệnh: `node --test`, `node scripts/audit-water-banks.mjs > specs/REQ-006/water-bank-audit.json`, `node e2e/art-strata.e2e.mjs`, `node e2e/art-trees.e2e.mjs`; server `python3 -m http.server 8000`, quản lý bằng Python try/finally. URL tạm dừng đúng là `paused=1`; `paused=true` không dừng ban đầu, nên ảnh phiên này đã bấm dừng sau tải. Script/log /tmp không bền vững. Commit dùng danh tính từng lệnh; không sửa git config/tệp cấm.


## Mốc 10b-20 — kiểm tra bên trong tam giác nước

- Mở rộng audit sang bảy mẫu mỗi tam giác: ba đỉnh, ba trung điểm cạnh và tâm. Giữ nguyên báo cáo đỉnh cũ; thêm `interior.rendered` và `interior.extrema`. Test tổng hợp chứng minh chỉ kiểm đỉnh có thể bỏ sót đất xuyên mặt nước; kiểm số mẫu, cực trị, đầu vào rỗng/sai và không sửa dữ liệu. Đây là lấy mẫu hữu hạn, không phải chứng minh toàn mặt không xuyên đất.
- Phát hiện mới ở **suối thứ ba, lưới 80**: một mẫu bị đất che **0,284112400** đơn vị, tọa độ **[215,495101929; 129,655792236; 284,504898071]**. Trong khi đó mọi đỉnh vẫn có khoảng hở dương. Sông Thấp có min **-0,006965385**, nằm trong dung sai 0,05; sông Cao có max **3,716840216**, lớn hơn cực đại chỉ đo đỉnh **3,492402**. Báo cáo JSON lưu số liệu đầy đủ cho hai mức.
- Thử chỉ khắc theo đoạn gần nhất trong từng kênh làm che 15 đỉnh suối ở Thấp, đã bỏ toàn bộ. `water-shapes.js` giữ nguyên HEAD; không đổi sản phẩm, World/RNG hoặc assertion cũ. Không chụp ảnh/chạy e2e vì hình ảnh không đổi; không dùng kết quả cũ thay kiểm cuối 10c.
- Toàn bộ `node --test` **103/103**, 0 fail/skip/cancelled, exit 0, **109,507 giây**. Nhóm audit riêng **13/13**. Đóng mốc chẩn đoán 10b-20; **10b/10c/10 còn mở, trả continue**. QA bắt buộc 1/2 vẫn chưa đạt, giữ bộ ảnh nghiệm thu hiện có.


## Mốc 10b-21 — bỏ mẫu đất xuyên nội thất suối

Tăng riêng phần khắc bù cục bộ theo độ hạ đường tâm từ 5% lên 7%. Không đổi độ sâu cơ sở, đường tâm, độ rộng, World/RNG hoặc địa hình mô phỏng. Giữ mọi assertion cũ; thêm test kiểm tất cả bảy mẫu mỗi tam giác suối không bị che trên cả lưới 80/160. Đây vẫn là kiểm lấy mẫu hữu hạn, không phải chứng minh toàn mặt không xuyên đất.

Audit tái lập: min nội thất suối thứ ba Thấp **1,171967089**, trước sửa **-0,284112400**; Cao **3,050068129**. Cực đại đỉnh ba suối Thấp **20,172110 / 37,142057 / 32,729309**, Cao **21,208746 / 36,231071 / 32,788749**. Phần khắc thêm làm các cực đại tăng nhẹ; giữ toàn bộ giới hạn hồi quy. Sông không đổi, min nội thất Thấp **-0,006965385** vẫn trong dung sai 0,05. Không coi các khoảng hở hàng chục đơn vị là đạt giao tuyến bờ AC-7.

Toàn bộ `node --test` **104/104**, 0 fail/skip/cancelled, exit 0, **109,752 giây**, chạy riêng trước trình duyệt. Mặt vẽ còn **6 đỉnh**, độ lệch chuẩn dốc **1,615399415**, phần dư đồng bằng **2,642467559** / 2.950 mẫu. E2e **art-strata, art-trees** đạt, console sạch; cây **2.200/400**, hạt không đổi khi chuyển mức. Server Python đã dừng.

Đã chụp/xem `screenshots/23-stream-interior-clearance.png`, Cao 1920 × 1080, dọc sông, paused từ **0 giây**, hồ **20**, ao **11,6**, console sạch. Núi vẫn nhọn, mép suối còn gấp và lộ khoảng hở; giữ QA bắt buộc 1/2 chưa đạt và bộ chín ảnh/evidence cũ. Chưa QA bốn góc/mực thấp–đầy, chưa chạy đầy đủ e2e/FPS/ngân sách cuối. **10b/10c/10 còn mở.**


## Mốc 10b-22 — Ngoại suy bờ suối với chuyển tiếp tại cửa

Áp dụng ngoại suy độ dốc thượng lưu cho cả suối, tránh lấy độ cao đoạn hạ lưu khắc ngang sườn thượng lưu. Giảm dần hiệu chỉnh trong bán kính 34 đơn vị quanh cửa suối để giữ phần lõm chung ở hợp lưu trên lưới Thấp. Ngoại suy đầy đủ đến cửa làm che một đỉnh nước tại [319,73468; 12,35; 607,34863] khoảng 0,084 đơn vị; chuyển tiếp này giữ min trên hai lưới lớn hơn 0,05. Không đổi đường tâm, độ rộng nước, độ sâu cơ sở, địa hình mô phỏng hoặc World/RNG.

Audit cực đại ba suối Thấp **13,538889 / 27,928957 / 32,385044**, Cao **17,589106 / 32,204466 / 29,753139**. Trước sửa: Thấp **20,172110 / 37,142057 / 32,729309**, Cao **21,208746 / 36,231071 / 32,788749**. Min nội thất suối thứ hai Thấp **0,128805**, suối thứ ba Thấp **1,171967**; không mẫu đỉnh/nội thất nào của suối bị che. Giữ mọi assertion cũ và thêm giới hạn hồi quy mới. Các khoảng hở còn hàng chục đơn vị, chưa đủ xác nhận AC-7 hoặc đóng QA tổng thể.

Kiểm thử cuối: toàn bộ `node --test` **105/105**, không fail/skip/cancelled, exit 0, **110,552 giây**, chạy riêng trước trình duyệt. Mặt vẽ giữ **6 đỉnh**, độ lệch chuẩn dốc **1,614770856**, phần dư đồng bằng **2,642467559** trên 2.950 mẫu. E2e `art-strata` và `art-trees` đạt, console sạch, cây **2.200/400**, hạt bất biến khi chuyển mức.

Ảnh `screenshots/24-upstream-stream-banks.png`: Cao, 1920 × 1080, dọc sông, tạm dừng từ thời gian 0, hồ 20, ao 11,6. Khung ảnh đo 64 lần vẽ, 221.000 tam giác; đây chỉ là khung tạm dừng, không thay kiểm ngân sách lúc đủ giai đoạn. Đã xem ảnh: mép suối vẫn có chỗ gấp/hở, núi vẫn nhọn; giữ QA bắt buộc 1/2 chưa đạt và không thay bộ chín ảnh nghiệm thu. Bước 10b/10c/10 còn mở. Server đã dừng.
