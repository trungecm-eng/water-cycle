# REQ-005 — Tiến độ build

## Phiên 2026-10-27 — Bước 1 hoàn tất

Đã tách nội dung ra `src/content.js`, biến phong cách ra `src/ui/theme.css`, chuyển canvas toàn cửa sổ và bảng phủ bên phải. Ba nhóm gập/mở bằng `details`; nút thu gọn và phím B, nhớ bảng/nhóm trong `sessionStorage`, có `__sim.panel` chỉ đọc. Nhãn bản đồ và lỗi WebGL2 lấy nội dung từ file chung. Giữ nguyên id điều khiển và `data-hud`; không sửa World hoặc quy luật.

Kiểm tra: `node --test` đạt 39/39 trong 112,25 giây. Các kịch bản `core-3d`, `scenery`, `scene` và `panel-foundation` đều đạt. Chạy server bằng `python3 -m http.server 8000`; Playwright hiện có và dùng được trực tiếp qua `e2e/browser.mjs`, không cần cài dependency trong repo. Báo cáo chi tiết và thay đổi kiểm tra bố cục cũ ở `build-report.md`.

Tiếp theo: bước 2 trong `plan.md`, viết các module số liệu thuần và test. `activeStages` vẫn ở `src/ui/hud.js`, chuyển sang `src/stats/stages.js` ở bước 2. Các thẻ và điều khiển hiện vẫn giữ nội dung cũ để bước 3–4 thay tiếp. Nội dung khung HTML nằm trong `panelMarkup` của `content.js`, được `createPanel` chèn trước khi main tìm canvas. Không dùng Tab để thu gọn; Tab dành cho focus theo spec. Đã đổi nhãn bản đồ trong `map-data.js` thành id + position; chữ lấy từ `content.regions`. Chưa làm các bước 2–8, chưa có ảnh nghiệm thu hay đo FPS REQ-005, chưa kết luận AC-12 kiểm tay.

## Phiên 2026-10-27 — Bước 2 hoàn tất

Đã thêm `src/stats/water-distribution.js`, `rain-tally.js`, `level-trend.js`, `stages.js`. Phân bố trả `{ counts, percentages, total }`, sáu khóa `sea/lake/pond/airborne/rain/runoff`; phần trăm dùng phần dư lớn nhất. `RainTally` có `clear(world)` và `read(world)`, trừ mốc chụp từ `rainLandings`, không sửa World. Khi World thay mảng hạt do reset, mốc trở về 0; vẫn đếm được mưa sau reset ngay cả khi giao diện không đọc ở thời gian 0. `LevelTrend.update(time, count, level)` trả mực hiện tại, mực ban đầu, `direction` (`up/down/null`), `dry`; `reset()` cho lúc đặt lại. Lưu cửa sổ 10 giây, ngưỡng vào 3 hạt/ra 1 hạt ở `config.stats`. HUD dùng hàm giai đoạn đã tách và tiếp tục export hàm cũ để tương thích. Không đổi World hoặc hằng số vật lý.

Kiểm tra: `node --test` đạt 44/44, thời gian thực 122,517 giây (log ở `/tmp/req005-all-tests.log`, không phải artifact bền vững). Test số liệu riêng đạt 5/5, kiểm phân bố từng bước trong 300 giây mặc định, bộ đếm từng vùng kể cả suối/sông, không đếm lặp, hai World song song, tỷ lệ mưa núi với gió 0/100 từ giây 60 đến 300, ngưỡng trễ và ao cạn. Sau khi bổ sung xử lý reset giữa hai lần đọc, chạy lại ba test liên quan đạt 3/3. `node e2e/panel-foundation.e2e.mjs` và `node e2e/core-3d.e2e.mjs` đạt với server `python3 -m http.server 8000`. Môi trường không có `/usr/bin/time`; dùng từ khóa shell `time`.

Tiếp theo: bước 3, nối các module vào các thẻ Số liệu và Chú giải, bổ sung `__sim.rainTally`, `__sim.waterDistribution`. Nhớ gọi `RainTally.clear(world)` khi xóa bộ đếm, `LevelTrend.reset()` khi đặt lại (đặc biệt reset khi thời gian vẫn bằng 0), và cập nhật xu hướng sau mỗi bước mô phỏng để cửa sổ chính xác khi tăng tốc. Mọi chữ mới vẫn phải đặt trong `src/content.js`. Các bước 3–8 chưa làm; chưa kết luận nghiệm thu toàn REQ-005.

## Phiên 2026-10-27 — Bước 3 hoàn tất

Đã thêm `src/ui/statistics.js` nối các module bước 2 vào các thẻ: phân bố sáu đoạn, cột mực hồ/ao có vạch ban đầu và xu hướng, mưa năm vùng + xóa độc lập, bốn giai đoạn đang diễn ra. Chú giải đủ năm loại hạt với câu mô tả và bảy vùng với màu; chữ mới ở `src/content.js`. Giữ các trường `data-hud` cũ; dòng giai đoạn cũ ẩn vì thẻ mới đã thay thế. `__sim.rainTally` và `__sim.waterDistribution` đóng băng cả counts/percentages. Không sửa World hay quy luật.

Xu hướng được lấy mẫu sau từng bước Clock, không chỉ sau mỗi khung hình. Callback của bindControls gọi sample ngay sau reset để giữ mực ban đầu chính xác trước khi World bước tiếp; nhận biết reset bằng thay mảng particles, kể cả thời gian vẫn bằng 0. Render gọi sample khi tạm dừng nhưng module không thêm mẫu cùng thời gian. Cột dùng khoảng từ bottom đến capacity để quy đổi độ cao, chữ hiển thị mực thật.

Kiểm tra: `node --test` đạt 44/44 trong 159,89 giây. `node e2e/ui-statistics.e2e.mjs`, `node e2e/panel-foundation.e2e.mjs`, `node e2e/core-3d.e2e.mjs`, `node e2e/cycle-flow.e2e.mjs` đều đạt; cycle-flow gồm ×1, gián đoạn và URL. Không có lỗi console. Test mới xóa khi tạm dừng để so hạt/thời gian chính xác; sau reset phải bấm pause cùng một lượt JS vì Clock.reset mặc định tiếp tục chạy. Server dùng `python3 -m http.server 8000`. `git diff --check` đạt.

Tiếp theo: bước 4 (thanh trượt có SVG, hai mô tả đầu/cuối, về mặc định riêng, hàng thời gian và nút nhãn). Bước 5–8 còn nguyên, chưa có góc nhìn sẵn, chọn chất lượng, ảnh/FPS REQ-005 hay nghiệm thu AC-12. Không coi bước 3 là hoàn tất toàn yêu cầu.


## Phiên 2026-10-27 — Bước 4 hoàn tất

Đã đưa hàng thời gian lên đầu nhóm Điều khiển; hai thanh trượt có SVG nội tuyến, output và mô tả hai đầu được liên kết bằng aria-describedby. Nút “Về mặc định” chỉ đưa sun/wind về config.defaults (50/40), cập nhật thanh và giá trị; giữ nguyên World, thời gian, trạng thái tạm dừng, tốc độ, camera và bộ đếm. Nút “Nhãn bản đồ” đồng bộ aria-pressed với phím L. Space trên nút thực hiện phím tắt mô phỏng đúng một lần (preventDefault ngăn click mặc định); Enter kích hoạt nút, shortcut tiếp tục bỏ qua thanh trượt. Không đổi World hay hằng số vật lý, không sửa test cũ.

Kiểm tra: node --test đạt 44/44 trong 127,824 giây. Các kịch bản ui-controls (mới), core-3d, panel-foundation, ui-statistics, scenery và scene đều đạt, không lỗi console. ui-controls kiểm về mặc định không đổi mô phỏng khi tạm dừng, input slider, Enter, Space trên nút, L, tốc độ chọn một và bỏ qua shortcut trên slider. Server: python3 -m http.server 8000; không cần npm install. git diff --check đạt. Báo cáo build đã ghi thay đổi phím Space theo AC-7.

Tiếp theo: bước 5 trong plan.md, thêm views ở map-data.js, module chuyển camera, target thay đổi được, nút góc nhìn, URL và __sim.view. Bước 5–8 chưa làm; chưa có chất lượng cao/thấp, ảnh nghiệm thu hay FPS REQ-005; chưa kết luận AC-12 kiểm tay. Phiên này dừng ở commit hoàn chỉnh bước 4, kết quả continue.

Lưu ý môi trường commit: chưa có danh tính Git trong cấu hình. Dùng biến môi trường cho riêng lệnh commit, theo danh tính commit trước: GIT_AUTHOR_NAME='Dev Agent', GIT_AUTHOR_EMAIL='dev-agent@example.com', GIT_COMMITTER_NAME='Dev Agent', GIT_COMMITTER_EMAIL='dev-agent@example.com'. Không sửa .git/config.

## Phiên 2026-10-27 — Bước 5 hoàn tất

Đã thêm bốn góc nhìn trong mapData.views, Camera.target thay đổi được, module thuần ViewTransition và parseView trong src/sim/views.js. Chuyển kéo dài 1 giây thời gian thực với smoothstep và góc phương vị theo đường ngắn nhất; dùng Camera.snapshot để kẹp mắt trên địa hình/mặt nước. Chọn tiếp góc nhìn lấy tư thế hiện tại làm đầu đường chuyển. Pointerdown, lăn chuột và phím camera ngắt chuyển, giữ tư thế đã vẽ và đặt __sim.view thành free; sau đó nhận điều khiển bình thường. Chuyển vẫn chạy khi mô phỏng tạm dừng. Bốn nút, nút mặc định, trạng thái aria-pressed và tên góc nhìn nằm trong nhóm Điều khiển; chữ ở content.js, kiểu fieldset dùng biến CSS. Không sửa World, quy luật, tham số mô phỏng hoặc test cũ.

Kiểm tra: node --test đạt 47/47 trong 127,131 giây. Test mới lấy 1.001 mẫu cho từng cặp trong 16 cặp góc nhìn: giới hạn, địa hình/mặt nước, đích chính xác ở 1 giây; kiểm ngắt, chọn liên tiếp, đường góc ngắn và URL hợp lệ/sai. Các e2e ui-views (mới), core-3d, ui-controls và panel-foundation đều đạt, console không lỗi. ui-views kiểm URL river/sea/sai, cả bốn đích, ngắt bằng chuột không nhảy, kéo tiếp, mặc định và phím mũi tên. Server: python3 -m http.server 8000. git diff --check đạt.

Tiếp theo: bước 6, module quality thuần, hai mức vẽ và gợi ý FPS; rồi bước 7–8 (luồng đầy đủ, ảnh, FPS, README và chạy toàn bộ). Chưa có chất lượng cao/thấp, ảnh/FPS REQ-005 hay kết luận nghiệm thu AC-12. parseView độc lập parseParams để view không đi vào options của World; nên áp dụng cách tương tự cho quality. ViewTransition nhận thời gian tính bằng giây, main đổi performance.now()/timestamp từ mili giây. Phiên này dừng ở commit hoàn chỉnh bước 5, kết quả continue.

## Phiên 2026-10-27 — Bước 6 hoàn tất

Đã thêm src/quality.js với parseQuality, qualityLevels và QualityMonitor thuần. Hằng số mới nằm trong config. Cao: 18.432 tam giác, sóng, bóng Mặt Trời cho địa hình/mây, tối đa 9 khối/cụm; Thấp: 4.608 tam giác, ẩn sóng, tắt bóng, tối đa 4 khối/cụm, pixel ratio ≤ 1. Hai nút chất lượng và gợi ý có nút chuyển/đóng; chữ ở content.js. __sim.quality trả level/slowHint; __sim.scene thêm terrainTriangles, shadows, pixelRatio và effects.wavesVisible/cloudBlocks. Không sửa World hoặc tham số vật lý; đổi mức giữ nguyên hạt, thời gian và camera.

FPS lấy mẫu theo cửa sổ 1 giây thực; 5 giây chậm liên tiếp (<30 FPS) ở Cao hiện gợi ý, không tự đổi mức. Đúng 30 FPS không hiện (có sai số số thực nhỏ). Tab ẩn/đổi mức/đóng đều xóa cửa sổ, đóng rồi không hiện lại trong phiên trang. Chuyển chất lượng vô hiệu hóa cache mây để dựng lại ngay cả khi mô phỏng tạm dừng. Số khối mây giới hạn cho cả cụm, không nhân thêm số cloudOffsets như trước.

Kiểm tra: node --test đạt 51/51 trong 143,257 giây; log tạm /tmp/req005-step6-tests.log. Sau lần gom hằng số vào config và thêm test đúng 30 FPS, chạy lại test/quality.test.js đạt 4/4 và ui-quality đạt. E2e core-3d, scenery, scene, ui-views, ui-controls, panel-foundation đều đạt, console không lỗi; không sửa test cũ. git diff --check đạt. Server python3 -m http.server 8000, không cần npm install.

Tiếp theo: bước 7 trong plan.md — ui-flow, ui-panel (gồm tương phản), ui-screenshots tám ảnh, cập nhật measure-fps cho hai mức và README; ui-quality.e2e.mjs đã tạo/kiểm ở bước 6, tiếp tục dùng và mở rộng nếu cần. Sau đó bước 8 chạy toàn bộ và ghi báo cáo. Chưa có ảnh/FPS REQ-005 hay kết luận AC-12 kiểm tay. Phiên này dừng ở commit hoàn chỉnh bước 6, kết quả continue. Commit dùng biến môi trường danh tính Dev Agent/dev-agent@example.com như phiên trước, không sửa .git/config.
