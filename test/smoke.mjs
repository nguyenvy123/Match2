/**
 * Kiểm thử giao diện bằng trình duyệt thật.
 * Chạy: node test/smoke.mjs   (cần dev server ở cổng 8123)
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = 'http://localhost:8123/';
const SHOTS = 'test/shots';
mkdirSync(SHOTS, { recursive: true });

let failed = 0;
const check = (cond, label) => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${label}`);
  if (!cond) failed++;
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(URL, { waitUntil: 'networkidle' });

console.log('\n--- Khởi động ---');
await page.waitForSelector('.overlay:not([hidden])');
check(await page.locator('.panel__title').textContent() === 'Cách chơi', 'hiện màn hướng dẫn');
await page.screenshot({ path: `${SHOTS}/01-intro.png` });

await page.click('.panel .btn');
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.slot').count() === 3, 'round 1 có 3 ô');

// Bố cục hai hàng: ly người chơi đặt ở trên mặt bàn, ly quản trò giấu ở dưới.
check(await page.locator('.table__row--play .slot').count() === 3, 'hàng trên có 3 ô đặt ly');
check(await page.locator('.hidden-slot').count() === 3, 'hàng dưới có 3 ly ẩn');
check(await page.locator('.table__surface').count() === 1, 'có mặt bàn ngăn giữa hai hàng');
const rowsOrder = await page.evaluate(() => {
  const play = document.querySelector('.table__row--play').getBoundingClientRect();
  const surf = document.querySelector('.table__surface').getBoundingClientRect();
  const hid = document.querySelector('.table__row--hidden').getBoundingClientRect();
  return play.bottom <= surf.bottom && surf.top <= hid.top;
});
check(rowsOrder, 'thứ tự dọc đúng: hàng đặt ly → mặt bàn → hàng ly ẩn');
check(await page.locator('.tray-cup').count() === 3, 'round 1 có 3 ly');
check(await page.locator('.mode-badge').isHidden(), 'round 1 ẩn nhãn Đặt đôi');
await page.screenshot({ path: `${SHOTS}/02-round1.png` });

console.log('\n--- Đặt ly ---');
// Lấy lời giải để chủ động tạo tình huống ONE và NO.
const solution = await page.evaluate(() => window.__peek?.() ?? null);

// Đặt ly A vào ô 1 rồi đọc phán xử.
await page.click('.tray-cup[data-cup="A"]');
check(await page.locator('.tray-cup[data-cup="A"]').getAttribute('data-selected') === 'true', 'ly được chọn có trạng thái selected');
await page.click('.slot[data-slot="0"]');
await page.waitForSelector('.verdict');
const firstVerdict = await page.locator('.verdict').getAttribute('data-kind');
check(['ONE', 'NO'].includes(firstVerdict), `nhận phán xử hợp lệ (${firstVerdict})`);
const verdictText = (await page.locator('.verdict__text').first().textContent()).trim();
check(['Đúng', 'Sai'].includes(verdictText), `phán xử hiển thị tiếng Việt ("${verdictText}")`);
check(await page.locator('.stat__value').nth(1).textContent() === '1', 'bộ đếm lần đặt tăng lên 1');
await page.screenshot({ path: `${SHOTS}/03-verdict.png` });

await page.waitForTimeout(700);

if (firstVerdict === 'ONE') {
  check(await page.locator('.slot[data-slot="0"]').getAttribute('data-status') === 'LOCKED', 'ô đúng bị khóa');
  check(await page.locator('.tray-cup[data-cup="A"]').getAttribute('data-used') === 'true', 'ly đã chốt bị gạch khỏi khay');
  // Đặt đúng thì ly ẩn ở hàng dưới lật lên thành ly thật cùng màu.
  const pair = await page.evaluate(() => {
    const top = document.querySelector('.slot[data-status="LOCKED"] .cup');
    const bot = document.querySelector('.hidden-slot[data-solved="true"] .cup');
    return {
      same: top?.getAttribute('aria-label') === bot?.getAttribute('aria-label'),
      stillHidden: bot?.classList.contains('cup--hidden'),
    };
  });
  check(pair.same, 'ly ẩn hàng dưới lật lên khớp với ly vừa đặt đúng');
  check(pair.stillHidden === false, 'ly hàng dưới không còn ở dạng nét đứt');
  check(await page.locator('.slot__lock').count() === 0, 'không còn icon ổ khóa');
  check(await page.locator('.slot[data-status="LOCKED"] .slot__ticks').count() === 1, 'ô đã chốt vẫn có nét đánh dấu');
} else {
  check(await page.locator('.slot[data-slot="0"]').getAttribute('data-status') === 'EMPTY', 'ô sai trở lại trống');
  check(await page.locator('.tray-cup[data-cup="A"]').isEnabled(), 'ly sai vẫn dùng được');
  check(await page.locator('.miss').count() === 0, 'KHÔNG hiển thị dấu vết đoán sai — người chơi phải tự nhớ');

  // Đặt sai thì ly ẩn ở hàng dưới phải giữ nguyên nét đứt, không lật.
  await page.waitForTimeout(1400);
  const wrongPair = await page.evaluate(() => {
    const bot = document.querySelectorAll('.hidden-slot')[0];
    return {
      solved: bot?.dataset.solved,
      hidden: bot?.querySelector('.cup')?.classList.contains('cup--hidden'),
    };
  });
  check(wrongPair.solved === 'false', 'đặt sai thì ô hàng dưới không đánh dấu đã giải');
  check(wrongPair.hidden === true, 'đặt sai thì ly hàng dưới giữ nguyên nét đứt');
}

console.log('\n--- Bàn phím ---');
await page.keyboard.press('b');
check(await page.locator('.tray-cup[data-cup="B"]').getAttribute('data-selected') === 'true', 'phím chữ chọn được ly');
await page.keyboard.press('Escape');
check(await page.locator('.tray-cup[data-cup="B"]').getAttribute('data-selected') === 'false', 'Escape bỏ chọn');

console.log('\n--- Chơi lại ván ---');
check(await page.locator('.stats .btn:not(.btn--icon)').isVisible(), 'nút Chơi lại ván hiện trên thanh trạng thái');

// Reset ván là mất tiến độ của round hiện tại nên phải hỏi lại trước.
const attemptsAtReset = await page.locator('.stat__value').nth(1).textContent();
const roundAtReset = await page.locator('.stat__value').first().textContent();
await page.click('.stats .btn:not(.btn--icon)');
await page.waitForTimeout(240);
check(await page.locator('.overlay').isVisible(), 'bấm Chơi lại ván thì hỏi xác nhận');
check((await page.locator('.panel__title').textContent()).includes('Chơi lại round'), 'hộp thoại nói rõ là chơi lại round');
check(await page.locator('.panel .btn').count() === 2, 'có 2 lựa chọn');
await page.screenshot({ path: `${SHOTS}/13-reset-round.png` });

// "Tiếp tục" giữ nguyên tiến độ.
await page.locator('.panel .btn').nth(1).click();
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.stat__value').nth(1).textContent() === attemptsAtReset,
  'chọn Tiếp tục thì giữ nguyên tiến độ');

// Reset thật: bộ đếm về 0 nhưng VẪN Ở ROUND CŨ.
await page.click('.stats .btn:not(.btn--icon)');
await page.waitForTimeout(220);
await page.locator('.panel .btn').first().click();
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.stat__value').nth(1).textContent() === '0', 'reset ván đưa bộ đếm về 0');
check(await page.locator('.stat__value').first().textContent() === roundAtReset,
  'reset ván KHÔNG đổi round hiện tại');
check(await page.locator('.slot[data-status="LOCKED"]').count() === 0, 'bàn được dựng lại sạch');

// Phím R cũng mở được hộp thoại (chưa đặt gì thì không hỏi, nên đặt 1 ly trước).
await page.click('.tray-cup:not([data-used="true"])');
await page.click('.slot[data-status="EMPTY"]');
await page.waitForTimeout(700);
await page.keyboard.press('r');
await page.waitForTimeout(240);
check(await page.locator('.overlay').isVisible(), 'phím R mở hộp thoại chơi lại ván');
await page.locator('.panel .btn').nth(1).click();
await page.waitForSelector('.overlay', { state: 'hidden' });
await page.keyboard.press('Escape');

console.log('\n--- Chơi tự động tới round 3 ---');
/**
 * Giải round hiện tại. Vì game không còn hiển thị dấu vết đoán sai, solver
 * tự ghi nhớ những gì đã thử — đúng như người chơi phải làm.
 *
 * Từ round 3 mỗi lượt bắt buộc đặt 2 ly, nên solver gom nước đi theo cặp.
 */
async function solveRound() {
  const tried = new Map();   // slot -> Set các ly đã trượt ở đó
  const missed = (slot) => tried.get(slot) ?? new Set();

  for (let guard = 0; guard < 120; guard++) {
    const state = await page.evaluate(() => ({
      open: [...document.querySelectorAll('.slot[data-status="EMPTY"]')].map((s) => Number(s.dataset.slot)),
      cups: [...document.querySelectorAll('.tray-cup:not([data-used="true"])')].map((c) => c.dataset.cup),
      mustPair: document.querySelector('.mode-badge')?.dataset.active === 'true',
    }));
    if (!state.open.length) return true;

    // Chọn ly chưa từng trượt ở ô đó.
    const pick = (slot, taken) =>
      state.cups.find((c) => !missed(slot).has(c) && !taken.includes(c));

    const taken = [];
    const moves = [];
    const needed = state.mustPair && state.open.length >= 2 ? 2 : 1;

    for (const slot of state.open) {
      if (moves.length === needed) break;
      const cup = pick(slot, taken);
      if (!cup) continue;
      taken.push(cup);
      moves.push({ slot, cup });
    }
    if (moves.length < needed) return false;

    for (const mv of moves) {
      await page.click(`.tray-cup[data-cup="${mv.cup}"]`);
      await page.click(`.slot[data-slot="${mv.slot}"]`);
    }
    // Đủ dài để animation lật ly ẩn hoàn tất khi lượt này giải xong round
    // (620ms delay + 700ms animation = 1320ms) — round chỉ mở màn chuyển tiếp
    // sau mốc đó, không phải ngay khi phán xử vừa hiện.
    await page.waitForTimeout(1360);

    // Ghi nhớ ô nào vẫn còn trống sau lượt này = ly đó trượt.
    const stillOpen = await page.evaluate(() =>
      [...document.querySelectorAll('.slot[data-status="EMPTY"]')].map((s) => Number(s.dataset.slot)));
    moves.forEach(({ slot, cup }) => {
      if (stillOpen.includes(slot)) {
        if (!tried.has(slot)) tried.set(slot, new Set());
        tried.get(slot).add(cup);
      }
    });
  }
  return false;
}

await solveRound();
await page.waitForSelector('.overlay:not([hidden])', { timeout: 12000 });
check((await page.locator('.panel__title').textContent()).includes('Round 1'), 'hiện màn kết thúc round 1');
check(await page.locator('.stars').count() === 1, 'có xếp hạng sao');
await page.screenshot({ path: `${SHOTS}/04-round-cleared.png` });

await page.click('.panel .btn');
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.slot').count() === 4, 'round 2 có 4 ô');
check(await page.locator('.tray-cup').count() === 4, 'round 2 có 4 ly');
check(await page.locator('.verdict').count() === 0, 'round mới không treo lại phán xử cũ');

await solveRound();
await page.waitForSelector('.overlay:not([hidden])', { timeout: 12000 });
const unlockText = await page.locator('.panel__body').textContent();
check(unlockText.includes('Đặt đôi bắt đầu từ đây'), 'báo Đặt đôi bắt buộc trước round 3');
await page.screenshot({ path: `${SHOTS}/05-unlock.png` });

await page.click('.panel .btn');
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.slot').count() === 5, 'round 3 có 5 ô');
check(await page.locator('.mode-badge').isVisible(), 'round 3 hiện nhãn Đặt đôi');

console.log('\n--- Đặt đôi ---');
check(await page.locator('.mode-badge').getAttribute('data-active') === 'true', 'round 3 ở chế độ bắt buộc đặt đôi');

await page.click('.tray-cup[data-cup="A"]');
await page.click('.slot[data-slot="0"]');
check(await page.locator('.pairing').isVisible(), 'hiện vùng ghép đôi sau cặp đầu');
check(await page.locator('.slot[data-slot="0"]').getAttribute('data-armed') === 'true', 'ô đầu được đánh dấu armed');
// Ly phải hiện ngay trên ô, không chỉ là chip chữ ở dưới bàn.
check(await page.locator('.slot[data-slot="0"] .slot__cup').count() === 1, 'ly đang chờ hiện ngay trên ô');
check(await page.locator('.slot[data-slot="0"] .slot__ghost').count() === 0, 'ô đang giữ ly không còn dấu ?');
// Ly đang giữ phải vô hiệu trong khay, nếu không người chơi chọn lại chính nó
// làm ly thứ hai và lách được luật bắt buộc đặt đôi.
// Ly không còn in chữ cái — tra data-cup qua khớp aria-label (tên màu) với
// các ly trong khay, thay vì trích mã từ nhãn.
const heldLabel = await page.locator('.slot[data-slot="0"] .slot__cup').getAttribute('aria-label');
const heldCupId = await page.evaluate((label) => {
  const match = [...document.querySelectorAll('.tray-cup')]
    .find((t) => t.getAttribute('aria-label').startsWith(label));
  return match?.dataset.cup;
}, heldLabel);
check(await page.locator(`.tray-cup[data-cup="${heldCupId}"]`).isDisabled(), 'ly đang giữ bị vô hiệu trong khay');
check(await page.locator(`.tray-cup[data-cup="${heldCupId}"]`).getAttribute('data-held') === 'true', 'ly đang giữ được đánh dấu held');
await page.screenshot({ path: `${SHOTS}/06-pairing.png` });

// Bấm lại chính ô đang giữ phải rút được lựa chọn, nếu không người chơi kẹt cứng.
await page.click('.slot[data-slot="0"]');
check(await page.locator('.pairing').isHidden(), 'bấm lại ô đang giữ thì rút được lựa chọn');
check(await page.locator('.tray-cup[data-cup="A"]').getAttribute('data-selected') === 'true', 'ly được trả lại tay sau khi rút');

// Chọn lại cặp đầu để test tiếp phần gửi đi.
await page.click('.slot[data-slot="0"]');
check(await page.locator('.pairing').isVisible(), 'chọn lại được cặp đầu');

const attemptsBefore = Number(await page.locator('.stat__value').nth(1).textContent());
await page.click('.tray-cup[data-cup="B"]');
await page.click('.slot[data-slot="1"]');
await page.waitForSelector('.verdict');
check(await page.locator('.verdict').count() === 2, 'đặt đôi trả về 2 phán xử');
const attemptsAfter = Number(await page.locator('.stat__value').nth(1).textContent());
check(attemptsAfter === attemptsBefore + 2, 'đặt đôi tính 2 lần đặt');
await page.screenshot({ path: `${SHOTS}/07-double-verdict.png` });
await page.waitForTimeout(700);

console.log('\n--- Kéo thả ---');
// Mô phỏng chuột thật chứ không dùng API drag của Playwright, vì game dùng
// Pointer Events để chạy được cả trên cảm ứng.
const cupBox = await page.locator('.tray-cup:not([data-used="true"])').first().boundingBox();
const slotBox = await page.locator('.slot[data-status="EMPTY"]').first().boundingBox();
const attemptsPreDrag = Number(await page.locator('.stat__value').nth(1).textContent());

await page.mouse.move(cupBox.x + cupBox.width / 2, cupBox.y + cupBox.height / 2);
await page.mouse.down();
await page.mouse.move(cupBox.x + cupBox.width / 2 + 40, cupBox.y - 30, { steps: 6 });
check(await page.locator('.drag-ghost').count() === 1, 'hiện bản sao ly bám theo con trỏ');
check(await page.evaluate(() => document.body.classList.contains('is-dragging')), 'body vào trạng thái đang kéo');

await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2, { steps: 8 });
check(await page.locator('.slot[data-hover="true"]').count() === 1, 'ô dưới con trỏ được làm nổi');
await page.screenshot({ path: `${SHOTS}/12-dragging.png` });

await page.mouse.up();
await page.waitForTimeout(340);
check(await page.locator('.drag-ghost').count() === 0, 'bản sao biến mất sau khi thả');
check(await page.evaluate(() => !document.body.classList.contains('is-dragging')), 'body thoát trạng thái kéo');
// Ở round 3 đang bắt buộc đặt đôi, nên thả ly đầu chỉ giữ lại chờ cặp thứ hai
// — bộ đếm chưa tăng. Kéo ly thứ hai vào ô khác mới thành một lượt hoàn chỉnh.
check(await page.locator('.pairing').isVisible(), 'thả ly đầu thì vào trạng thái chờ cặp');
check(Number(await page.locator('.stat__value').nth(1).textContent()) === attemptsPreDrag,
  'ly đầu của cặp chưa tính lần đặt');

const cupB = await page.locator('.tray-cup:not([data-used="true"])').nth(1).boundingBox();
const slotB = await page.locator('.slot[data-status="EMPTY"]').nth(1).boundingBox();
await page.mouse.move(cupB.x + cupB.width / 2, cupB.y + cupB.height / 2);
await page.mouse.down();
await page.mouse.move(slotB.x + slotB.width / 2, slotB.y + slotB.height / 2, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(340);
check(Number(await page.locator('.stat__value').nth(1).textContent()) === attemptsPreDrag + 2,
  'kéo đủ cặp thì tính 2 lần đặt');
check(await page.locator('.verdict').count() === 2, 'kéo đủ cặp thì nhận 2 phán xử');

// Kéo rồi thả ra ngoài bàn thì không đặt gì.
await page.waitForTimeout(760);
const cupBox2 = await page.locator('.tray-cup:not([data-used="true"])').first().boundingBox();
const beforeStray = Number(await page.locator('.stat__value').nth(1).textContent());
await page.mouse.move(cupBox2.x + cupBox2.width / 2, cupBox2.y + cupBox2.height / 2);
await page.mouse.down();
await page.mouse.move(24, 420, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(280);
check(Number(await page.locator('.stat__value').nth(1).textContent()) === beforeStray,
  'thả ra ngoài bàn không tính lần đặt');

// Kéo ly đang chờ ghép cặp từ ô này sang ô khác.
await page.waitForTimeout(700);
const cupC = await page.locator('.tray-cup:not([data-used="true"])').first().boundingBox();
const slotFrom = await page.locator('.slot[data-status="EMPTY"]').first().boundingBox();
const fromIdx = await page.locator('.slot[data-status="EMPTY"]').first().getAttribute('data-slot');
await page.mouse.move(cupC.x + cupC.width / 2, cupC.y + cupC.height / 2);
await page.mouse.down();
await page.mouse.move(slotFrom.x + slotFrom.width / 2, slotFrom.y + slotFrom.height / 2, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(320);
check(await page.locator(`.slot[data-slot="${fromIdx}"]`).getAttribute('data-armed') === 'true',
  'ly đầu vào trạng thái chờ trên ô');

// Giờ nhấc chính ly đó mang sang ô khác.
const heldBox = await page.locator(`.slot[data-slot="${fromIdx}"]`).boundingBox();
const otherSlot = page.locator('.slot[data-status="EMPTY"]:not([data-armed="true"])').first();
const otherIdx = await otherSlot.getAttribute('data-slot');
const otherBox = await otherSlot.boundingBox();
const attemptsBeforeMove = Number(await page.locator('.stat__value').nth(1).textContent());

await page.mouse.move(heldBox.x + heldBox.width / 2, heldBox.y + heldBox.height * 0.35);
await page.mouse.down();
await page.mouse.move(otherBox.x + otherBox.width / 2, otherBox.y + otherBox.height / 2, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(320);
check(await page.locator(`.slot[data-slot="${otherIdx}"]`).getAttribute('data-armed') === 'true',
  'ly chuyển sang ô mới');
check(await page.locator(`.slot[data-slot="${fromIdx}"]`).getAttribute('data-armed') === 'false',
  'ô cũ không còn giữ ly');
check(Number(await page.locator('.stat__value').nth(1).textContent()) === attemptsBeforeMove,
  'chuyển ô khi đang chờ không tính lần đặt');
check(await page.locator('.pairing').isVisible(), 'vẫn ở trạng thái chờ cặp sau khi chuyển ô');

// Kéo ly đang giữ ra ngoài bàn thì huỷ chờ cặp.
await page.mouse.move(otherBox.x + otherBox.width / 2, otherBox.y + otherBox.height * 0.35);
await page.mouse.down();
await page.mouse.move(20, 430, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(300);
check(await page.locator('.pairing').isHidden(), 'kéo ly đang giữ ra ngoài bàn thì huỷ chờ cặp');
check(await page.locator('.slot[data-armed="true"]').count() === 0, 'không còn ô nào giữ ly');

// Bấm chọn kiểu cũ vẫn phải dùng được song song với kéo.
await page.click('.tray-cup:not([data-used="true"])');
check(await page.locator('.tray-cup[data-selected="true"]').count() === 1, 'lối bấm-chọn vẫn hoạt động');
await page.keyboard.press('Escape');

console.log('\n--- Responsive ---');
for (const [w, h, name] of [[375, 780, 'mobile'], [768, 900, 'tablet'], [1440, 900, 'desktop']]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(220);
  const scrollsX = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  check(!scrollsX, `${name} (${w}px): body không cuộn ngang`);
  await page.screenshot({ path: `${SHOTS}/08-${name}.png`, fullPage: true });
}

console.log('\n--- Round 4, bàn đặt ly rộng nhất ---');
await page.setViewportSize({ width: 1280, height: 860 });
await solveRound();
await page.waitForSelector('.overlay:not([hidden])', { timeout: 16000 });
await page.click('.panel .btn');
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.slot').count() === 6, 'round 4 có 6 ô');
await page.screenshot({ path: `${SHOTS}/09-round4.png` });

await page.setViewportSize({ width: 375, height: 780 });
await page.waitForTimeout(240);
const bodyScrollsAt375 = await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
check(!bodyScrollsAt375, 'round 4 trên mobile: body vẫn không cuộn ngang');
const tableScrolls = await page.evaluate(() => {
  const t = document.querySelector('.table-scroll');
  return t.scrollWidth > t.clientWidth;
});
check(tableScrolls, 'round 4 trên mobile: bàn cuộn ngang trong container riêng');
await page.screenshot({ path: `${SHOTS}/10-round4-mobile.png`, fullPage: true });

console.log('\n--- Kịch bản hoán đổi (round 5-7) ---');

// Phần trước đổi viewport sang mobile — trả về desktop trước khi tiếp tục,
// nếu không các ô nằm ngoài viewport và không click được.
await page.setViewportSize({ width: 1280, height: 900 });
await page.waitForTimeout(260);

// Chơi hết các round đặt ly còn lại để tới round 5.
while (Number((await page.locator('.stat__value').first().textContent()).split('/')[0]) < 5) {
  await solveRound();
  await page.waitForSelector('.overlay:not([hidden])', { timeout: 16000 });
  const body = await page.locator('.panel__body').textContent();
  if (body.includes('Kịch bản mới')) {
    check(true, 'màn chuyển round 5 giới thiệu kịch bản mới');
    check(body.includes('số ly đúng vị trí'), 'giải thích rõ chỉ báo số lượng');
  }
  await page.click('.panel .btn');
  await page.waitForSelector('.overlay', { state: 'hidden' });
}

check(await page.locator('.slot').count() === 3, 'round 5 là bàn tập 3 ô');

// .table dùng flex-column cho bố cục 2 hàng của kịch bản đặt ly — kịch bản
// hoán đổi chỉ có 1 hàng nên các ô phải được bọc trong .table__row, nếu
// không chúng bị xếp dọc theo trục chính thay vì nằm ngang.
const swapTops = await page.evaluate(() =>
  [...document.querySelectorAll('.slot')].map((s) => Math.round(s.getBoundingClientRect().top)));
check(swapTops.every((t) => Math.abs(t - swapTops[0]) < 5),
  'các ô kịch bản hoán đổi nằm cùng một hàng ngang');

// Kịch bản hoán đổi cũng dùng bố cục hai hàng + mặt bàn như kịch bản đặt ly.
check(await page.locator('.table__surface').count() === 1, 'round hoán đổi có mặt bàn');
check(await page.locator('.hidden-slot').count() === 3, 'round hoán đổi có hàng ly ẩn ở dưới');
check(await page.locator('.hidden-slot[data-solved="true"]').count() === 0,
  'ly ẩn chưa lật khi round chưa giải xong');
check(await page.locator('.slot .slot__cup').count() === 3, 'bàn đã đầy ly ngay từ đầu');
check(await page.locator('.tray').isHidden(), 'khay dự phòng bị ẩn ở kịch bản hoán đổi');
check(await page.locator('.swap-bar').isVisible(), 'hiện thanh điều khiển hoán đổi');
check((await page.locator('.stat__label').textContent()).trim() === 'Lượt', 'bộ đếm đổi sang đơn vị Lượt');
await page.screenshot({ path: `${SHOTS}/14-swap-start.png` });

// Đổi chỗ hai ly bằng cách bấm — không được tốn lượt.
const arrBefore = await page.evaluate(() =>
  [...document.querySelectorAll('.slot')].map((s) => s.querySelector('.cup')?.getAttribute('aria-label')));
await page.click('.slot[data-slot="0"]');
check(await page.locator('.slot[data-slot="0"]').getAttribute('data-picked') === 'true', 'ô đầu được đánh dấu đang chọn');
await page.click('.slot[data-slot="2"]');
await page.waitForTimeout(280);
const arrAfter = await page.evaluate(() =>
  [...document.querySelectorAll('.slot')].map((s) => s.querySelector('.cup')?.getAttribute('aria-label')));
check(arrBefore[0] === arrAfter[2] && arrBefore[2] === arrAfter[0], 'hai ly đổi chỗ đúng');
check(await page.locator('.stat__value').nth(1).textContent() === '0', 'hoán đổi KHÔNG tốn lượt');
check(await page.locator('.slot[data-picked="true"]').count() === 0, 'bỏ đánh dấu sau khi đổi xong');

// Bấm lại chính ô đang chọn = bỏ chọn.
await page.click('.slot[data-slot="1"]');
await page.click('.slot[data-slot="1"]');
check(await page.locator('.slot[data-picked="true"]').count() === 0, 'bấm lại ô đang chọn thì bỏ chọn');

// Kiểm tra: chỉ báo số lượng, không chỉ ra ly nào.
await page.click('.swap-bar .btn');
await page.waitForTimeout(620);
check(await page.locator('.stat__value').nth(1).textContent() === '1', 'Kiểm tra tính 1 lượt');
const countText = (await page.locator('.verdict__text').textContent()).trim();
check(/^\d+\/3$/.test(countText), `bảng phán xử ở dạng số (${countText})`);
check(await page.locator('.verdict').count() === 1, 'chỉ một bảng phán xử, không chỉ ra từng ô');
check(await page.locator('.swap-log__row').count() === 1, 'lịch sử ghi lại lượt vừa thử');
await page.screenshot({ path: `${SHOTS}/15-swap-check.png` });

// Lặp lại y nguyên cách xếp phải bị từ chối.
const turnsBeforeRepeat = await page.locator('.stat__value').nth(1).textContent();
await page.click('.swap-bar .btn');
await page.waitForTimeout(320);
check(await page.locator('.stat__value').nth(1).textContent() === turnsBeforeRepeat,
  'lặp lại cách xếp đã thử không tốn lượt');

// Kéo ly giữa hai ô cũng đổi chỗ được.
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const boxA = await page.locator('.slot[data-slot="0"]').boundingBox();
const boxB = await page.locator('.slot[data-slot="2"]').boundingBox();
const dragBefore = await page.evaluate(() =>
  [...document.querySelectorAll('.slot')].map((s) => s.querySelector('.cup')?.getAttribute('aria-label')));
await page.mouse.move(boxA.x + boxA.width / 2, boxA.y + boxA.height * 0.35);
await page.mouse.down();
await page.mouse.move(boxB.x + boxB.width / 2, boxB.y + boxB.height * 0.35, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(320);
const dragAfter = await page.evaluate(() =>
  [...document.querySelectorAll('.slot')].map((s) => s.querySelector('.cup')?.getAttribute('aria-label')));
check(dragBefore[0] === dragAfter[2] && dragBefore[2] === dragAfter[0], 'kéo ly giữa hai ô đổi chỗ được');

// Giải nốt round 5, 6, 7 để chắc chuỗi round chạy hết.
/** Giải round hoán đổi: đưa từng ly về đúng chỗ rồi kiểm tra một lần. */
async function solveSwapRound() {
  for (let guard = 0; guard < 30; guard++) {
    const done = await page.evaluate(() => document.querySelectorAll('.slot[data-status="FILLED"]').length === 0);
    if (done) return true;
    // Không biết lời giải từ ngoài, nên thử mọi cặp tới khi số đúng tăng lên.
    const size = await page.locator('.slot').count();
    let improved = false;
    const baseline = await readHits();
    for (let i = 0; i < size && !improved; i++) {
      for (let j = i + 1; j < size && !improved; j++) {
        await page.click(`.slot[data-slot="${i}"]`);
        await page.click(`.slot[data-slot="${j}"]`);
        await page.waitForTimeout(150);
        await page.click('.swap-bar .btn');
        await page.waitForTimeout(420);
        const hits = await readHits();
        if (hits === null) return true;          // round đã xong
        if (hits > baseline) { improved = true; break; }
        // Không tốt hơn thì đổi lại.
        await page.click(`.slot[data-slot="${i}"]`);
        await page.click(`.slot[data-slot="${j}"]`);
        await page.waitForTimeout(150);
      }
    }
    if (!improved) return false;
  }
  return false;
}

async function readHits() {
  if (await page.locator('.overlay').isVisible()) return null;
  const t = await page.locator('.verdict__text').textContent().catch(() => null);
  if (!t) return -1;
  const m = t.trim().match(/^(\d+)\//);
  return m ? Number(m[1]) : -1;
}

const solved5 = await solveSwapRound();
check(solved5, 'giải được round 5 bằng hoán đổi');
await page.waitForSelector('.overlay:not([hidden])', { timeout: 20000 });
check((await page.locator('.panel__title').textContent()).includes('Round 5'), 'hiện màn kết thúc round 5');
await page.screenshot({ path: `${SHOTS}/16-swap-cleared.png` });
await page.click('.panel .btn');
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.slot').count() === 5, 'round 6 có 5 ô');

await page.setViewportSize({ width: 1280, height: 860 });
const solved6 = await solveSwapRound();
check(solved6, 'giải được round 6 bằng hoán đổi');
await page.waitForSelector('.overlay:not([hidden])', { timeout: 24000 });
check((await page.locator('.panel__title').textContent()).includes('Round 6'), 'hiện màn kết thúc round 6');
await page.click('.panel .btn');
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.slot').count() === 6, 'round 7 có 6 ô');


const solved7 = await solveSwapRound();
check(solved7, 'giải được round 7 bằng hoán đổi');
await page.waitForSelector('.overlay:not([hidden])', { timeout: 24000 });
const flipIntro = await page.locator('.panel__body').textContent();
check(flipIntro.includes('Lật ly'), 'màn chuyển round 8 giới thiệu kịch bản lật ly');
check(flipIntro.includes('đúng 1 ly úp'), 'nói rõ luật đúng 1 ly úp');
check(flipIntro.includes('không phải gợi ý chiều'), 'cảnh báo ô trống không phải gợi ý');
await page.click('.panel .btn');
await page.waitForSelector('.overlay', { state: 'hidden' });

console.log('\n--- Kịch bản lật ly (round 8) ---');

check(await page.locator('.slot').count() === 3, 'round 8 có 3 ô');
check(await page.locator('.tray-cup').count() === 3, 'round 8 có 3 ly trong khay');
check(await page.locator('.flip-bar').isVisible(), 'hiện thanh điều khiển chiều ly');
check((await page.locator('.flip-bar__counter').textContent()).includes('Còn 1 ly úp'),
  'bộ đếm báo còn 1 ly úp');
check(await page.locator('.flip-bar .btn').isDisabled(),
  'nút lật bị vô hiệu khi chưa chọn ly');
await page.screenshot({ path: `${SHOTS}/19-flip-start.png` });

// Chọn ly → nút lật bật, ly vẽ chiều ngửa mặc định.
await page.click('.tray-cup:not([data-used="true"])');
await page.waitForTimeout(220);
check(!(await page.locator('.flip-bar .btn').isDisabled()), 'chọn ly thì nút lật bật');
check((await page.locator('.flip-bar .btn').textContent()).includes('ngửa'),
  'mặc định là chiều ngửa');
check(await page.locator('.tray-cup[data-selected="true"] .cup--flipped').count() === 0,
  'ly đang chọn chưa xoay khi ở chiều ngửa');

// Bấm nút lật → ly xoay, nhãn đổi.
await page.click('.flip-bar .btn');
await page.waitForTimeout(320);
check((await page.locator('.flip-bar .btn').textContent()).includes('úp'), 'nút lật đổi sang úp');
check(await page.locator('.tray-cup[data-selected="true"] .cup--flipped').count() === 1,
  'ly đang chọn xoay 180° khi ở chiều úp');
const flipAria = await page.locator('.tray-cup[data-selected="true"]').getAttribute('aria-label');
check(flipAria.includes('chiều úp'), `aria-label nêu rõ chiều ("${flipAria}")`);
await page.screenshot({ path: `${SHOTS}/20-flip-selected.png` });

// Phím mũi tên đặt chiều trực tiếp, không toggle.
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(220);
check((await page.locator('.flip-bar .btn').textContent()).includes('ngửa'), 'phím ↑ đặt chiều ngửa');
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(160);
check((await page.locator('.flip-bar .btn').textContent()).includes('ngửa'),
  'phím ↑ lần hai vẫn ngửa — đặt trực tiếp chứ không toggle');
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(220);
check((await page.locator('.flip-bar .btn').textContent()).includes('úp'), 'phím ↓ đặt chiều úp');

// Đặt đúng ly nhưng SAI chiều phải nhận SAI.
const flipSolution = await readFlipSolution();
const wrongOriSlot = flipSolution.findIndex((s) => !s.up);   // ô cần ngửa
if (wrongOriSlot !== -1) {
  await selectFlipCup(flipSolution[wrongOriSlot].cup, true);   // cố tình đặt úp
  await page.click(`.slot[data-slot="${wrongOriSlot}"]`);
  await page.waitForTimeout(700);
  const verdict = (await page.locator('.verdict__text').textContent()).trim();
  check(verdict === 'Sai', `đúng ly nhưng sai chiều → SAI (nhận "${verdict}")`);
  check(await page.locator(`.slot[data-slot="${wrongOriSlot}"]`).getAttribute('data-status') === 'EMPTY',
    'ô không khóa khi sai chiều');
  await page.waitForTimeout(900);
}

// Giải trọn round 8: đặt đúng cả ly lẫn chiều.
for (let i = 0; i < flipSolution.length; i++) {
  const already = await page.locator(`.slot[data-slot="${i}"]`).getAttribute('data-status');
  if (already === 'LOCKED') continue;
  await selectFlipCup(flipSolution[i].cup, flipSolution[i].up);
  await page.click(`.slot[data-slot="${i}"]`);
  await page.waitForTimeout(1500);
}
check(await page.locator('.slot[data-status="LOCKED"]').count() === 3, 'giải được round 8');

/** Đọc lời giải round lật ly (ly + chiều) qua bảng cheat. */
async function readFlipSolution() {
  await page.click('.btn--icon');
  await page.waitForTimeout(320);
  const labels = await page.locator('.solution-row .cup')
    .evaluateAll((ns) => ns.map((n) => n.getAttribute('aria-label')));
  await page.locator('.panel__actions .btn').nth(1).click();
  await page.waitForSelector('.overlay', { state: 'hidden' });
  await page.waitForTimeout(200);

  const byName = await page.evaluate(() => {
    const m = {};
    document.querySelectorAll('.tray-cup').forEach((t) => {
      m[t.getAttribute('aria-label').split(',')[0]] = t.dataset.cup;
    });
    return m;
  });
  return labels.map((label) => ({
    cup: byName[label.split(',')[0]],
    up: label.includes('chiều úp'),
  }));
}

/** Chọn ly trong khay và đặt chiều mong muốn. */
async function selectFlipCup(cupId, wantUp) {
  // Chờ nút lật hết disabled — nó bị khoá trong lúc `busy` của lượt trước.
  await page.locator('.tray-cup[data-cup="' + cupId + '"]').waitFor({ state: 'visible' });
  await page.click(`.tray-cup[data-cup="${cupId}"]`);
  await page.waitForFunction(
    () => !document.querySelector('.flip-bar .btn')?.disabled,
    null,
    { timeout: 8000 },
  );
  const isUp = await page.locator('.tray-cup[data-selected="true"] .cup--flipped').count() === 1;
  if (isUp !== wantUp) {
    await page.click('.flip-bar .btn');
    await page.waitForTimeout(260);
  }
}

console.log('\n--- Kết thúc game ---');
await page.waitForSelector('.overlay:not([hidden])', { timeout: 24000 });
check((await page.locator('.panel__title').textContent()).includes('Hoàn thành'), 'hiện màn tổng kết');
check(await page.locator('.score-table tbody tr').count() === 8, 'bảng điểm đủ 8 round');
await page.waitForTimeout(500);   // chờ animation vào panel xong mới chụp
await page.screenshot({ path: `${SHOTS}/11-game-over.png` });

await page.click('.panel .btn');
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.slot').count() === 3, 'chơi lại quay về round 1');

console.log('\n--- Cheat ---');
check(await page.locator('.btn--icon').isVisible(), 'nút cheat hiện trên thanh trạng thái');

await page.click('.btn--icon');
await page.waitForTimeout(280);
check((await page.locator('.panel__title').textContent()).includes('Cheat'), 'mở được bảng cheat');
check(await page.locator('.cheat__rounds .btn').count() === 8, 'có 8 nút nhảy round');
check(await page.locator('.solution-row .cup').count() > 0, 'bảng cheat hiện lời giải');
// Focus phải ở nút hành động, không phải nút round — bấm Enter mà nhảy round
// ngoài ý muốn thì rất dễ mất tiến độ.
check(await page.evaluate(() => document.activeElement?.closest('.panel__actions') !== null),
  'focus vào nút hành động, không phải nút round');
await page.screenshot({ path: `${SHOTS}/17-cheat.png` });

// Nhảy tới round 5 (kịch bản hoán đổi) để kiểm tra cheat đổi cả kịch bản.
await page.locator('.cheat__rounds .btn').nth(4).click();
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.stat__value').first().textContent() === '5/8', 'nhảy được tới round 5');
check(await page.locator('.slot').count() === 3, 'round 5 là bàn tập 3 ô');
check(await page.locator('.swap-bar').isVisible(), 'cheat đổi đúng sang kịch bản hoán đổi');

// Giải luôn round hiện tại.
await page.click('.btn--icon');
await page.waitForTimeout(260);
await page.locator('.panel__actions .btn').first().click();
await page.waitForTimeout(820);
check(await page.locator('.overlay').isVisible(), 'giải luôn thì hiện màn kết thúc round');
check((await page.locator('.panel__title').textContent()).includes('Round 5'), 'đúng round vừa giải');
await page.click('.panel .btn');
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.stat__value').first().textContent() === '6/8', 'sang round 6');

// Giải nốt round 6 để tới round cuối.
await page.click('.btn--icon');
await page.waitForTimeout(260);
await page.locator('.panel__actions .btn').first().click();
await page.waitForTimeout(900);
check((await page.locator('.panel__title').textContent()).includes('Round 6'), 'giải luôn được round 6');
await page.click('.panel .btn');
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.stat__value').first().textContent() === '7/8', 'sang round 7');

// Giải nốt round 7 để tới round lật ly.
await page.click('.btn--icon');
await page.waitForTimeout(260);
await page.locator('.panel__actions .btn').first().click();
await page.waitForTimeout(900);
check((await page.locator('.panel__title').textContent()).includes('Round 7'), 'giải luôn được round 7');
await page.click('.panel .btn');
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.stat__value').first().textContent() === '8/8', 'sang round 8');
check(await page.locator('.flip-bar').isVisible(), 'cheat đổi đúng sang kịch bản lật ly');

// Bảng điểm phải đánh dấu các round bị bỏ qua, không lẫn với round chơi thật.
await page.click('.btn--icon');
await page.waitForTimeout(260);
await page.locator('.panel__actions .btn').first().click();
// Round 8 giải luôn phải đặt 3 ly, mỗi ly có độ trễ lật ly ~1.3s.
await page.waitForSelector('.overlay:not([hidden])', { timeout: 20000 });
await page.waitForFunction(
  () => document.querySelector('.panel__title')?.textContent?.includes('Hoàn thành'),
  null,
  { timeout: 20000 },
);
check(true, 'hiện màn tổng kết');
check(await page.locator('.score-table tbody tr').count() === 8, 'bảng điểm vẫn đủ 8 dòng');
check(await page.locator('.score-table tr[data-skipped="true"]').count() === 4,
  'các round bị cheat bỏ qua được đánh dấu riêng');
await page.screenshot({ path: `${SHOTS}/18-cheat-score.png` });

// Về lại round 1 để các phần test sau chạy trên trạng thái sạch.
await page.click('.panel .btn');
await page.waitForSelector('.overlay', { state: 'hidden' });
check(await page.locator('.slot').count() === 3, 'chơi lại quay về round 1');


console.log('\n--- Lỗi console ---');
check(errors.length === 0, `không có lỗi console${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);

await browser.close();

console.log(`\n${'='.repeat(46)}`);
console.log(failed === 0 ? '  TẤT CẢ ĐỀU PASS' : `  ${failed} LỖI`);
console.log('='.repeat(46));
process.exit(failed > 0 ? 1 : 0);
