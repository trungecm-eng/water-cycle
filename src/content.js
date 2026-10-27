const icon = paths => `<svg class="control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false">${paths}</svg>`;
const sunIcon = icon('<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>');
const windIcon = icon('<path d="M2 8h14a3 3 0 1 0-3-3M2 12h18a2 2 0 1 1-2 2M2 16h8a3 3 0 1 1-3 3"/>');

export const panelMarkup = `  <main>
    <div class="simulation-panel">
    <button id="panel-toggle" type="button" aria-expanded="true" aria-controls="panel-body">Thu gọn</button><div id="panel-body"><h1>Vòng tuần hoàn nước</h1>
    <p class="intro">Khám phá nước bốc hơi, ngưng tụ thành giọt mây, rơi xuống và trở về biển.</p>
    <details data-group="controls" open><summary>Điều khiển</summary><section class="controls" aria-label="Điều khiển mô phỏng">
      <div class="buttons">
        <button id="pause" type="button" aria-pressed="false">Tạm dừng</button>
        <button id="reset" type="button">Đặt lại</button>
        <div class="speeds" role="group" aria-label="Tốc độ mô phỏng">
          <span>Tốc độ</span>
          <button type="button" data-speed="0.5" aria-pressed="false">×0,5</button>
          <button type="button" data-speed="1" aria-pressed="true">×1</button>
          <button type="button" data-speed="2" aria-pressed="false">×2</button>
          <button type="button" data-speed="4" aria-pressed="false">×4</button>
        </div>
      </div>
      <label for="sun"><span>${sunIcon}Nhiệt độ Mặt Trời</span><output id="sun-value" for="sun">50</output>
        <input id="sun" type="range" min="0" max="100" value="50" aria-describedby="sun-ends">
        <span id="sun-ends" class="slider-ends"><span>Tắt nắng</span><span>Nắng gắt</span></span>
      </label>
      <label for="wind"><span>${windIcon}Gió</span><output id="wind-value" for="wind">40</output>
        <input id="wind" type="range" min="0" max="100" value="40" aria-describedby="wind-ends wind-direction">
        <span id="wind-ends" class="slider-ends"><span>Lặng gió</span><span>Gió mạnh</span></span>
        <span id="wind-direction" class="hint">Từ biển vào đất liền ←</span>
      </label>
      <button id="default-controls" type="button">Về mặc định</button>
      <fieldset><legend>Góc nhìn</legend>
        <button type="button" data-view="overview">Toàn cảnh</button>
        <button type="button" data-view="sea">Từ biển nhìn vào núi</button>
        <button type="button" data-view="mountain">Cận cảnh núi</button>
        <button type="button" data-view="river">Dọc sông</button>
        <button type="button" id="default-view">Góc nhìn mặc định</button>
        <output id="view-name" aria-live="polite"></output>
      </fieldset>
      <button id="toggle-labels" type="button" aria-pressed="true">Nhãn bản đồ</button>
    </section>
    <p class="hint">Phím tắt: Space — tạm dừng / tiếp tục; 1–4 — tốc độ; R — đặt lại; kéo chuột / mũi tên — xoay; lăn chuột / + / − — thu phóng; L — bật / tắt nhãn; B — thu gọn / mở bảng.</p>
    </details><details data-group="statistics" open><summary>Số liệu</summary><section class="information" aria-label="Thông tin mô phỏng">
      <div>
        <h2>Thời gian mô phỏng</h2>
        <dl class="metrics">
          <div><dt>Thời gian</dt><dd data-hud="time">0.0 giây</dd></div>
          <div><dt>Tốc độ</dt><dd data-hud="speed">×1</dd></div>
          <div><dt>Trạng thái</dt><dd data-hud="status">Đang chạy</dd></div>
          <div><dt>Mực nước hồ</dt><dd data-hud="level">0.0 đơn vị</dd></div>
          <div><dt>Số lần nước về vùng chứa</dt><dd data-hud="returns">0</dd></div>
          <div><dt>Nhiệt độ Mặt Trời</dt><dd data-hud="sun">50</dd></div>
          <div><dt>Gió</dt><dd data-hud="wind">40</dd></div>
        </dl>
        <article class="stat-card"><h2>Nước đang ở đâu</h2><div id="water-bar" class="water-bar" aria-hidden="true"></div><dl id="water-distribution" class="stat-list"></dl></article>
        <article class="stat-card"><h2>Hồ và ao</h2><div id="reservoir-levels"></div><p class="hint">Vạch ngang: mực ban đầu · ↑ tăng · ↓ giảm trong 10 giây gần nhất</p></article>
        <article class="stat-card"><h2>Mưa rơi ở đâu</h2><dl id="rain-tally" class="stat-list"></dl><button id="clear-rain" type="button">Xóa bộ đếm</button></article>
        <article class="stat-card"><h2>Đang diễn ra</h2><ul id="active-stages"></ul></article>
        <p class="legacy-stages"><strong>Đang diễn ra:</strong> <span data-hud="stages">Nước đang ở trong hồ</span></p>
        <p class="empty" data-hud="empty" role="status"></p>
        <dl class="counts" aria-label="Số hạt theo trạng thái">
          <div><dt>water</dt><dd data-hud="water">1000</dd></div>
          <div><dt>vapor</dt><dd data-hud="vapor">0</dd></div>
          <div><dt>cloud</dt><dd data-hud="cloud">0</dd></div>
          <div><dt>rain</dt><dd data-hud="rain">0</dd></div>
          <div><dt>runoff</dt><dd data-hud="runoff">0</dd></div>
        </dl>
      </div>
    </section></details><details data-group="legend" open>
        <summary>Chú giải</summary>
        <ul id="legend"></ul>
        <p>Hơi nước thật không nhìn thấy được; ở đây vẽ mờ để em theo dõi.</p>
        <ul id="region-legend"></ul>
      </details>
    </div></div>
    <canvas tabindex="0" id="world" width="1000" height="800" aria-label="Sa bàn 3D vòng tuần hoàn nước"></canvas>
  </main>
`;

export const content = {
  views: { overview: 'Toàn cảnh', sea: 'Từ biển nhìn vào núi', mountain: 'Cận cảnh núi', river: 'Dọc sông', free: 'Tự do' },
  title: 'Vòng tuần hoàn nước', collapse: 'Thu gọn', expand: 'Mở bảng',
  pause: 'Tạm dừng', resume: 'Tiếp tục', running: 'Đang chạy',
  seconds: 'giây', units: 'đơn vị', idle: 'Nước đang ở trong các vùng chứa', emptyPond: 'Ao đã cạn',
  webglError: 'Không thể khởi tạo WebGL2. Hãy bật tăng tốc đồ họa hoặc mở bằng trình duyệt hỗ trợ WebGL2.',
  states: { water: 'Nước trong vùng chứa', vapor: 'Hơi nước', cloud: 'Giọt mây', rain: 'Giọt mưa', runoff: 'Nước chảy trên đất' },
  stages: { vapor: 'Bốc hơi', cloud: 'Ngưng tụ thành mây', rain: 'Mưa rơi', runoff: 'Chảy về vùng chứa' },
  distribution: { sea: 'Biển', lake: 'Hồ', pond: 'Ao', airborne: 'Trên không', rain: 'Đang rơi', runoff: 'Đang chảy' },
  descriptions: { water: 'Nước được giữ trong biển, hồ hoặc ao.', vapor: 'Nước bốc hơi và bay lên khi được làm nóng.', cloud: 'Hơi nước gặp lạnh ngưng tụ thành giọt mây.', rain: 'Giọt nước từ mây rơi xuống mặt đất.', runoff: 'Nước theo sông, suối và mặt đất về vùng chứa.' },
  initialLevel: 'Mực ban đầu', currentLevel: 'Mực hiện tại', total: 'Tổng',
  regions: { mountain: 'Núi', plain: 'Đồng bằng', stream: 'Suối', river: 'Sông', lake: 'Hồ', pond: 'Ao', sea: 'Biển' }
};
