import { generateDrainage } from '../src/sim/drainage.js';
import { auditChannelBanks } from '../src/art/water-audit.js';
const map = generateDrainage();
console.log(JSON.stringify({
  description: 'Đo khoảng cách thẳng đứng từ đỉnh biên dải nước tới mặt đất; số dương là nước cao hơn đất. Đây là chẩn đoán, không phải kết luận nghiệm thu. Số đỉnh bao gồm các đỉnh trùng và cửa nối vùng nước.',
  levels: [80, 160].map(cells => auditChannelBanks(map, cells))
}, null, 2));
