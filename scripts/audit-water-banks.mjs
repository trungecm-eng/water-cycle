import { generateDrainage } from '../src/sim/drainage.js';
import { auditChannelBanks } from '../src/art/water-audit.js';
const map = generateDrainage();
console.log(JSON.stringify({
  description: 'legacyLevels đo dải gốc để so hồi quy; levels đo mặt nước thực sự được tải lên GPU (sông và suối đều cắt theo tam giác đất). Đo khoảng cách thẳng đứng từ các đỉnh tam giác nước tới mặt đất; số dương là nước cao hơn đất. Đây là chẩn đoán, không phải kết luận nghiệm thu. Số đỉnh bao gồm các đỉnh trùng và cửa nối vùng nước. Mục interior lấy mẫu ba đỉnh, ba trung điểm cạnh và tâm mỗi tam giác; đây là phép lấy mẫu hữu hạn, không chứng minh toàn mặt không xuyên đất.',
  legacyLevels: [80, 160].map(cells => auditChannelBanks(map, cells)),
  levels: [80, 160].map(cells => auditChannelBanks(map, cells, { actualSurface: true }))
}, null, 2));
