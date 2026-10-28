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

### Bảng QA hình ảnh bước 9 (chưa phải nghiệm thu đạt)

Các ảnh trong `screenshots/` là bằng chứng thực tế; không suy ra đạt hình ảnh từ số đếm mesh hoặc test logic. **AC-13 hiện chưa đạt**: còn các mục bắt buộc cần sửa trong bước 10 trước khi kết luận hoàn thành.

| Mục | Có/không | Ảnh và nhận xét |
| --- | --- | --- |
| 1. Núi gồ ghề, không dạng nón | Không | 01-overview, 02-sea, 03-mountain: sáu đỉnh vẫn quá cao hẹp, rời nhau, sườn chưa tạo cảm giác dãy núi có sống/phụ đỉnh |
| 2. Hồ/ao lòng chảo, không nổi, hồ liền sông | Không | 03-mountain, 04-river: hồ nối sông nhưng mép trước còn như mặt đĩa cao, lòng dẫn cạnh sông có vách/răng cưa; cần sửa mặt vẽ, không đổi vật lý tùy tiện |
| 3. Không tia nắng dài tỏa khắp cảnh | Có | 01-overview, 02-sea: chỉ vài nét ngắn trên nước |
| 4. Mây bông và màn mưa rõ | Không | 05-mountain-rain, 06-sea-rain: mây có khối, mưa biển thấy các nét xanh nhưng mưa núi quá khó thấy ở toàn cảnh, cần tăng độ rõ mà giữ ngân sách |
| 5. Nhãn đúng chỗ, không che nhau | Không | 06-sea-rain, 09-four-stages: logic chọn cụm đúng nhưng cần rà nhãn Mưa với vị trí mây trong ảnh, độ trễ khi speed=8 và nguy cơ panel che nhãn; art-labels chỉ chứng minh không giao hộp chip, chưa chứng minh điều này |
| 6. Đỉnh trắng | Có | 01-overview, 03-mountain |
| 7. Rừng chân núi và đồng bằng | Có | 01-overview, 03-mountain, 07-forest-fields |
| 8. Ô ruộng | Có | 01-overview, 07-forest-fields |
| 9. Hai sắc xanh/gợn đồng bằng | Có | 01-overview, 04-river, 07-forest-fields |
| 10. Biển chuyển màu và bọt bờ | Có | 01-overview, 02-sea, 04-river; chuyển màu nhẹ, bọt mảnh |
| 11. Mặt Trời và chùm ngắn xuống nước | Có | 01-overview, 06-sea-rain; chùm rất nhạt, có test logic điểm kết thúc |
| 12. Mặt cắt nhiều lớp | Có | 01-overview, 08-cutaway; logic kiểm cả bốn cạnh |
| 13. Trời xanh–kem | Có | 01-overview, 02-sea |
| 14. Mũi tên theo Gió | Có | 01-overview/05-mountain-rain có mũi tên, 06-sea-rain Gió 0 ẩn; tăng chiều dài/độ đậm kiểm bằng test thuần |

Ưu tiên đầu bước 10: sửa bốn mục bắt buộc trên, bổ sung bằng chứng kiểm phần vẽ cuối cùng (đặc biệt địa hình/nước và nhãn với mây), chạy lại ảnh và bảng này. Không trả `done` dù mọi test tự động đang xanh khi các mục bắt buộc hình ảnh còn “không”. Không cần hỏi người để sửa các vấn đề đã xác định trong phạm vi.

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
