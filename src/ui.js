/**
 * MATCH 2 — lớp giao diện.
 * Logic game nằm ở game.js, hình vẽ tay ở doodle.js. File này chỉ nối hai phần
 * đó với DOM và xử lý tương tác.
 */

import {
  CUPS, TOTAL_ROUNDS, createGame, createRound, judge, advanceRound, finalRank,
  optimalAverage, roundSize,
  roundMode, swapSlots, checkArrangement, currentArrangement, countHits,
  MODE_SWAP,
  SLOT_LOCKED, VERDICT_ONE, VERDICT_NO,
} from './game.js';

import {
  handRect, handCup, handTableTop, handStrikes, handUnderline, fillOffset, tilt,
} from './doodle.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CUP_BY_ID = new Map(CUPS.map((c) => [c.id, c]));

/** Thời gian ly nằm trên bàn trước khi bay về khay khi bị "Sai". */
const NO_RETURN_MS = 520;

/** Chờ bao lâu sau phán xử rồi mới lật ly ẩn ở hàng dưới. */
const REVEAL_DELAY_MS = 620;
/** Giãn cách giữa hai lần lật khi đặt đôi cùng đúng. */
const REVEAL_STAGGER_MS = 260;
/** Độ dài animation lật, phải khớp với `cup-reveal` trong style.css. */
const REVEAL_ANIM_MS = 700;

// --- Tiện ích DOM ---

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (v === null || v === undefined || v === false) return;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v === true ? '' : v);
  });
  children.filter(Boolean).forEach((c) => node.append(c));
  return node;
}

function svg(tag, props = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(props).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    node.setAttribute(k, v);
  });
  children.filter(Boolean).forEach((c) => node.append(c));
  return node;
}

// --- Thành phần vẽ ---

/**
 * Vẽ một chiếc ly. Lớp màu được dịch lệch khỏi lớp viền 1–3px —
 * xem art-style.md mục 4.2, đây là thứ tạo cảm giác "tô màu vội".
 */
function renderCup(cupId, seed, { width = 88, height = 110 } = {}) {
  const cup = CUP_BY_ID.get(cupId);
  const { body, waist } = handCup(width, height, seed);
  const off = fillOffset(seed);
  const shift = `translate(${off.x.toFixed(1)}, ${off.y.toFixed(1)})`;

  return svg('svg', {
    class: 'cup',
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': `Ly màu ${cup.name}`,
  }, [
    // Lớp màu, lệch khỏi viền
    svg('g', { transform: shift }, [
      svg('path', { class: 'cup__fill', d: body, fill: cup.hex }),
    ]),
    // Lớp viền, vẽ đè lên
    svg('path', { class: 'cup__outline', d: body }),
    svg('path', { class: 'cup__waist', d: waist }),
    // Không in chữ cái lên ly — người chơi phân biệt bằng màu. Tên màu vẫn
    // nằm trong `aria-label` để trình đọc màn hình đọc được.
  ]);
}

/**
 * Vẽ chỗ trống chờ đặt ly — dùng cho ô chưa có ly. Cùng hình và CÙNG CHIỀU
 * với ly thật, chỉ khác: nét đứt, không tô màu, không chữ cái. Người chơi
 * nhìn ra ngay đây là chỗ để đặt một chiếc ly vào.
 */
function renderHiddenCup(seed, { width = 88, height = 110 } = {}) {
  const { body, waist } = handCup(width, height, seed);
  return svg('svg', {
    class: 'cup cup--hidden',
    viewBox: `0 0 ${width} ${height}`,
    'aria-hidden': 'true',
  }, [
    svg('path', { class: 'cup__outline', d: body }),
    svg('path', { class: 'cup__waist', d: waist }),
  ]);
}

function renderFrame(className, w, h, seed, opts) {
  return svg('svg', {
    class: className,
    viewBox: `0 0 ${w} ${h}`,
    preserveAspectRatio: 'none',
    'aria-hidden': 'true',
  }, [svg('path', { d: handRect(w, h, seed, opts) })]);
}

function handButton(label, onClick, { variant = '', seed = 1, disabled = false, title = null } = {}) {
  const btn = el('button', {
    class: `btn ${variant}`.trim(),
    type: 'button',
    disabled,
    title,
    'aria-label': title,
    onclick: onClick,
  }, [
    renderFrame('btn__bg', 200, 60, seed, { wobble: 2.6, inset: 4 }),
    el('span', { text: label }),
  ]);
  return btn;
}

// --- Ứng dụng ---

export function mountGame(root) {
  let game = createGame();
  let selectedCup = null;     // ly đang cầm trên tay
  let pending = null;         // cặp thứ nhất đang chờ khi ghép đôi
  let verdicts = [];          // phán xử của lượt vừa rồi, để hiển thị
  let busy = false;           // khoá tương tác trong lúc animation chạy
  let seedCounter = 0;        // đổi seed để hình ly vẽ lại khác nhau mỗi round
  let panelObserver = null;   // theo dõi kích thước panel để vẽ lại khung
  let swapPick = null;        // ô đầu đã chọn để hoán đổi (kịch bản round 5–7)
  // Các ô vừa chốt nhưng chưa được phép lật ly ẩn ở hàng dưới. Ly chỉ lật sau
  // khi người chơi đã kịp đọc phán xử — nếu lật ngay thì mất hẳn nhịp chờ.
  let pendingReveal = new Set();

  const dom = buildShell();
  root.append(dom.app, dom.overlay);
  renderAll();
  showIntro();

  // ---- Khung giao diện ----

  function buildShell() {
    const brand = el('h1', { class: 'brand' }, [
      el('span', { class: 'brand__name' }, [
        document.createTextNode('Match 2'),
        svg('svg', { class: 'brand__underline', viewBox: '0 0 220 12', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
          handUnderline(220, 7).map((d) => svg('path', {
            d, fill: 'none', stroke: 'var(--cup-c)', 'stroke-width': 3, 'stroke-linecap': 'round',
          }))),
      ]),
    ]);

    const roundStat = el('div', { class: 'stat' }, [
      el('span', { text: 'Round ' }),
      el('span', { class: 'stat__value', id: 'round-value' }),
    ]);
    const attemptStat = el('div', { class: 'stat' }, [
      el('span', { class: 'stat__label', text: 'Lần đặt ' }),
      el('span', { class: 'stat__value', id: 'attempt-value' }),
    ]);

    const table = el('div', { class: 'table', role: 'group', 'aria-label': 'Bàn chơi' });
    const verdictRow = el('div', {
      class: 'verdicts',
      role: 'status',
      'aria-live': 'assertive',
      'aria-atomic': 'true',
    });

    const trayCups = el('div', { class: 'tray__cups', role: 'group', 'aria-label': 'Bộ ly dự phòng' });

    // Đặt đôi là bắt buộc từ round 3, không phải tuỳ chọn — đây chỉ là nhãn
    // báo trạng thái, không bấm được.
    const toggle = el('div', {
      class: 'mode-badge',
      hidden: true,
      role: 'status',
    }, [
      el('span', { class: 'toggle__bolt', text: '⚡', 'aria-hidden': 'true' }),
      el('span', { class: 'mode-badge__text' }),
    ]);

    const pairing = el('div', { class: 'pairing', hidden: true });
    const swapBar = el('section', { class: 'swap-bar', hidden: true });

    const tray = el('section', { class: 'tray' }, [
      svg('svg', { class: 'tray__rule', viewBox: '0 0 800 10', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
        handUnderline(800, 12).map((d) => svg('path', { d }))),
      el('div', { class: 'tray__head' }, [
        el('h2', { class: 'tray__title', text: 'Bộ ly dự phòng' }),
        toggle,
      ]),
      trayCups,
    ]);

    const app = el('div', { class: 'app' }, [
      el('header', { class: 'topbar' }, [
        brand,
        el('div', { class: 'stats' }, [
          roundStat,
          attemptStat,
          handButton('Chơi lại ván', askResetRound, { variant: 'btn--ghost btn--small', seed: 57 }),
          handButton('⚡', openCheat, {
            variant: 'btn--ghost btn--small btn--icon', seed: 58, title: 'Cheat — nhảy round (C)',
          }),
        ]),
      ]),
      el('main', { class: 'table-wrap' }, [
        el('div', { class: 'table-scroll' }, [table]),
        verdictRow,
        pairing,
        swapBar,
      ]),
      tray,
    ]);

    const overlay = el('div', { class: 'overlay', hidden: true, role: 'dialog', 'aria-modal': 'true' });

    return {
      app, overlay, table, tray, trayCups, verdictRow, pairing, swapBar, toggle,
      roundValue: roundStat.querySelector('#round-value'),
      attemptValue: attemptStat.querySelector('#attempt-value'),
      attemptLabel: attemptStat.querySelector('.stat__label'),
    };
  }

  // ---- Render ----

  function renderAll() {
    const round = game.active;
    const swapping = round.mode === MODE_SWAP;

    dom.roundValue.textContent = `${round.round}/${TOTAL_ROUNDS}`;
    // Kịch bản hoán đổi đo bằng số LƯỢT kiểm tra, không phải số lần đặt ly.
    dom.attemptLabel.textContent = swapping ? 'Lượt ' : 'Lần đặt ';
    dom.attemptValue.textContent = swapping ? round.turns : round.attempts;

    renderTable();
    renderVerdicts();
    renderSwapControls();

    // Khay dự phòng và Đặt đôi chỉ thuộc kịch bản đặt ly.
    dom.tray.hidden = swapping;
    if (!swapping) {
      renderTray();
      renderPairing();
    } else {
      dom.pairing.hidden = true;
    }

    dom.toggle.hidden = swapping || !round.canDouble;
    if (!swapping && round.canDouble) {
      const pairable = openSlotCount() >= 2;
      dom.toggle.querySelector('.mode-badge__text').textContent =
        pairable ? 'Đặt đôi — bắt buộc 2 ly mỗi lượt' : 'Ô cuối — đặt 1 ly';
      dom.toggle.dataset.active = String(pairable);
    }
  }

  function renderTable() {
    const round = game.active;
    if (round.mode === MODE_SWAP) { renderSwapTable(); return; }

    // Hai hàng: ly người chơi đặt nằm TRÊN mặt bàn, ly quản trò giấu nằm dưới.
    // Mỗi vị trí là một cặp dọc để người chơi đối chiếu trực tiếp.
    const topRow = el('div', { class: 'table__row table__row--play' });
    const bottomRow = el('div', { class: 'table__row table__row--hidden' });

    round.board.forEach((slot, i) => {
      const locked = slot.status === SLOT_LOCKED;
      const isArmed = pending?.slot === i;
      const seed = seedCounter * 100 + i * 7 + 13;

      // Ly đang chờ ghép cặp hiện ngay trên ô — người chơi cần thấy rõ mình
      // đã đặt gì ở đâu khi chọn ly thứ hai.
      const heldCup = isArmed ? pending.cup : null;
      const shownCup = locked ? slot.cup : heldCup;

      const frame = el('div', { class: 'slot__frame' }, [
        renderFrame('slot__outline', 100, 132, seed, { wobble: 2.4, inset: 4 }),
        shownCup ? renderCup(shownCup, seed + 500) : null,
        locked
          ? svg('svg', { class: 'slot__ticks', viewBox: '0 0 30 22', 'aria-hidden': 'true' },
              handStrikes(30, 22, seed + 77, 2).map((d) => svg('path', { d })))
          : null,
      ]);
      frame.querySelector('.cup')?.classList.add('slot__cup');

      const label = locked
        ? `Ô ${i + 1}, đã chốt với ly ${slot.cup}`
        : heldCup
          ? `Ô ${i + 1}, đang giữ ly ${heldCup}, chưa gửi đi`
          : `Ô ${i + 1}, còn trống`;

      // Cố ý KHÔNG hiển thị các ly đã thử và trượt ở ô này — người chơi phải
      // tự nhớ. Trí nhớ chính là kỹ năng cốt lõi của game, xem game-design.md
      // mục 9.3.
      topRow.append(el('button', {
        class: 'slot',
        type: 'button',
        'data-status': slot.status,
        'data-armed': String(isArmed),
        'data-slot': i,
        disabled: locked || busy,
        'aria-label': label,
        onclick: () => onSlotClick(i),
        // Ly đang giữ trên ô kéo được sang ô khác nếu người chơi đổi ý.
        onpointerdown: heldCup ? (e) => onHeldPointerDown(e, i, heldCup) : null,
      }, [frame]));

      // Hàng dưới chỉ để nhìn, không bấm được — đây là ly quản trò đang giấu.
      // Đặt đúng thì ly ẩn lật lên thành ly thật cùng màu — xác nhận trực quan
      // rằng đó đúng là chiếc ly quản trò đang giấu ở vị trí này. Nhưng chỉ lật
      // SAU khi người chơi đã đọc xong phán xử (xem `pendingReveal`).
      const readyToReveal = locked && !pendingReveal.has(i);
      const revealed = readyToReveal
        ? renderCup(slot.cup, seed + 640)
        : renderHiddenCup(seed + 500);
      if (readyToReveal) revealed.classList.add('is-revealing');

      bottomRow.append(el('div', {
        class: 'hidden-slot',
        'data-solved': String(readyToReveal),
        'aria-hidden': 'true',
      }, [
        el('div', { class: 'hidden-slot__frame' }, [
          renderFrame('slot__outline', 100, 132, seed + 40, { wobble: 2.4, inset: 4 }),
          revealed,
        ]),
        el('span', { class: 'slot__index', text: `Vị trí ${i + 1}` }),
      ]));
    });

    dom.table.replaceChildren(
      topRow,
      renderTableSurface(),
      bottomRow,
    );
  }

  /** Mặt bàn — dải có độ dày, ngăn giữa hàng đặt ly và hàng ly ẩn. */
  function renderTableSurface() {
    const w = 600;
    const h = 20;
    const rng = seedCounter * 3 + 17;
    return svg('svg', {
      class: 'table__surface',
      viewBox: `0 0 ${w} ${h}`,
      preserveAspectRatio: 'none',
      'aria-hidden': 'true',
    }, [
      svg('path', { d: handTableTop(w, h, rng) }),
    ]);
  }

  /**
   * Bàn của kịch bản hoán đổi (round 5–7). Bàn đã đầy ly ngay từ đầu, người
   * chơi đổi chỗ chúng rồi bấm kiểm tra. Không có khay dự phòng.
   */
  function renderSwapTable() {
    const round = game.active;
    // Cùng bố cục hai hàng như kịch bản đặt ly: ly đang xếp nằm trên mặt bàn,
    // ô ly ẩn của quản trò nằm dưới.
    //
    // Khác biệt: phản hồi ở đây chỉ là con số `n/N`, KHÔNG nói ô nào đúng —
    // nên hàng dưới không lật từng ly được. Chỉ lật hết một lượt khi round
    // hoàn thành, lúc đó mọi ô đều đúng nên không lộ thông tin gì thêm.
    const topRow = el('div', { class: 'table__row table__row--play' });
    const bottomRow = el('div', { class: 'table__row table__row--hidden' });

    topRow.append(...round.board.map((slot, i) => {
      const locked = slot.status === SLOT_LOCKED;
      const picked = swapPick === i;
      const seed = seedCounter * 100 + i * 7 + 13;

      const frame = el('div', { class: 'slot__frame' }, [
        renderFrame('slot__outline', 100, 132, seed, { wobble: 2.4, inset: 4 }),
        renderCup(slot.cup, seed + 500),
        locked
          ? svg('svg', { class: 'slot__ticks', viewBox: '0 0 30 22', 'aria-hidden': 'true' },
              handStrikes(30, 22, seed + 77, 2).map((d) => svg('path', { d })))
          : null,
      ]);
      frame.querySelector('.cup')?.classList.add('slot__cup');

      return el('button', {
        class: 'slot',
        type: 'button',
        'data-status': locked ? 'LOCKED' : 'FILLED',
        'data-picked': String(picked),
        'data-slot': i,
        disabled: locked || busy,
        'aria-label': picked
          ? `Ô ${i + 1} giữ ly ${slot.cup}, đang chọn để đổi chỗ`
          : `Ô ${i + 1} giữ ly ${slot.cup}`,
        'aria-pressed': String(picked),
        onclick: () => onSwapSlotClick(i),
        onpointerdown: locked ? null : (e) => onSwapPointerDown(e, i, slot.cup),
      }, [frame]);
    }));

    round.board.forEach((slot, i) => {
      const locked = slot.status === SLOT_LOCKED;
      const seed = seedCounter * 100 + i * 7 + 13;
      const revealed = locked
        ? renderCup(slot.cup, seed + 640)
        : renderHiddenCup(seed + 500);
      if (locked) revealed.classList.add('is-revealing');

      bottomRow.append(el('div', {
        class: 'hidden-slot',
        'data-solved': String(locked),
        'aria-hidden': 'true',
      }, [
        el('div', { class: 'hidden-slot__frame' }, [
          renderFrame('slot__outline', 100, 132, seed + 40, { wobble: 2.4, inset: 4 }),
          revealed,
        ]),
        el('span', { class: 'slot__index', text: `Vị trí ${i + 1}` }),
      ]));
    });

    dom.table.replaceChildren(topRow, renderTableSurface(), bottomRow);
  }

  /**
   * Thanh điều khiển của kịch bản hoán đổi: nút kiểm tra + lịch sử các lượt.
   * Lịch sử là thứ BẮT BUỘC phải hiển thị ở kịch bản này — phản hồi chỉ là một
   * con số, nếu người chơi không thấy lại các lượt trước thì không thể suy luận
   * gì, chỉ còn dò mò thuần.
   */
  function renderSwapControls() {
    const round = game.active;
    if (round.mode !== MODE_SWAP) {
      dom.swapBar.hidden = true;
      return;
    }
    dom.swapBar.hidden = false;

    const canCheck = !round.cleared && !busy;
    // `replaceChildren` không lọc null như helper el() — phải tự lọc, nếu không
    // chuỗi "null" bị render thành text khi lịch sử còn rỗng.
    const parts = [
      el('div', { class: 'swap-bar__head' }, [
        el('p', { class: 'swap-bar__hint', text: swapPick === null
          ? 'Bấm hai ô để đổi chỗ hai ly. Xong thì bấm Kiểm tra.'
          : `Đang chọn ô ${swapPick + 1} — bấm ô thứ hai để đổi chỗ.` }),
        handButton('Kiểm tra', onCheck, { seed: 91, disabled: !canCheck }),
      ]),
    ];

    if (round.history.length) {
      parts.push(el('div', { class: 'swap-log' }, [
        el('h3', { class: 'swap-log__title', text: 'Đã thử' }),
        el('ul', { class: 'swap-log__list' }, round.history.map((h) =>
          el('li', { class: 'swap-log__row' }, [
            el('span', { class: 'swap-log__turn', text: `L${h.turn}` }),
            el('span', { class: 'swap-log__cups' },
              h.arrangement.map((cupId) => renderCupChip(cupId))),
            el('span', {
              class: 'swap-log__hits',
              'data-full': String(h.hits === round.size),
              text: `${h.hits}/${round.size}`,
            }),
          ]))),
      ]));
    }

    dom.swapBar.replaceChildren(...parts);
  }

  /** Ly cỡ nhỏ dùng trong bảng lịch sử — chỉ ô màu, không chữ. */
  function renderCupChip(cupId) {
    const cup = CUP_BY_ID.get(cupId);
    return el('span', {
      class: 'cup-chip',
      style: `background:${cup.hex}`,
      title: cup.name,
      'aria-label': cup.name,
    });
  }

  // ---- Tương tác kịch bản hoán đổi ----

  function onSwapSlotClick(slotIndex) {
    if (busy) return;

    if (swapPick === null) {
      swapPick = slotIndex;
      renderTable();
      renderSwapControls();
      return;
    }

    // Bấm lại chính ô đang chọn = bỏ chọn.
    if (swapPick === slotIndex) {
      swapPick = null;
      renderTable();
      renderSwapControls();
      return;
    }

    doSwap(swapPick, slotIndex);
  }

  function doSwap(a, b) {
    const res = swapSlots(game.active, a, b);
    swapPick = null;
    if (res.rejected) {
      flashHint(res.rejected);
      renderTable();
      renderSwapControls();
      return;
    }
    // Xoá kết quả cũ: cách xếp đã đổi nên con số trước đó không còn đúng nữa.
    verdicts = [];
    renderTable();
    renderVerdicts();
    renderSwapControls();
    [a, b].forEach((i) => {
      dom.table.querySelector(`[data-slot="${i}"] .slot__cup`)?.classList.add('is-dropping');
    });
  }

  function onCheck() {
    if (busy) return;
    const round = game.active;
    const res = checkArrangement(round);

    if (res.rejected) {
      flashHint(res.rejected);
      return;
    }

    busy = true;
    swapPick = null;
    verdicts = [{ kind: 'COUNT', hits: res.hits, total: res.total }];
    renderTable();
    renderVerdicts();
    renderSwapControls();
    dom.attemptValue.textContent = round.turns;

    window.setTimeout(() => {
      busy = false;
      if (res.cleared) {
        showRoundCleared();
      } else {
        // Không gọi renderAll(): nó vẽ lại bảng "n/N" dù không đổi, làm
        // animation chạy lại và trông như giật/reload ngay sau khi vừa hiện.
        renderTable();
        renderSwapControls();
      }
    }, res.cleared ? 520 : 360);
  }

  /** Kéo ly từ ô này sang ô khác để đổi chỗ. */
  function onSwapPointerDown(e, slotIndex, cupId) {
    if (busy || e.button !== 0) return;
    beginDrag(e, cupId, e.currentTarget, slotIndex);
  }


  function renderTray() {
    const round = game.active;
    dom.trayCups.replaceChildren(...round.palette.map((cupId, i) => {
      // Ly đang giữ trên ô (chờ ghép cặp) cũng phải vô hiệu trong khay, nếu
      // không người chơi chọn lại chính nó làm ly thứ hai và lách được luật
      // "hai ly phải khác loại".
      const held = pending?.cup === cupId;
      const used = !round.available.has(cupId) || held;
      const seed = seedCounter * 100 + i * 11 + 3;
      const node = el('button', {
        class: 'tray-cup',
        type: 'button',
        'data-cup': cupId,
        'data-used': String(used),
        'data-held': String(held),
        'data-selected': String(selectedCup === cupId),
        disabled: used || busy,
        'aria-label': `Ly màu ${CUP_BY_ID.get(cupId).name}${
          held ? ', đang giữ trên bàn' : used ? ', đã chốt trên bàn' : ''}`,
        'aria-pressed': String(selectedCup === cupId),
        onclick: () => onCupClick(cupId),
        onpointerdown: (e) => onCupPointerDown(e, cupId),
      }, [
        renderCup(cupId, seed),
        used && !held
          ? svg('svg', { class: 'tray-cup__strikes', viewBox: '0 0 88 110', 'aria-hidden': 'true' },
              handStrikes(88, 110, seed + 41, 2).map((d) => svg('path', { d })))
          : null,
        el('span', { class: 'tray-cup__key', text: cupId }),
      ]);
      node.style.transform = used ? '' : `rotate(${tilt(seed).toFixed(2)}deg)`;
      return node;
    }));
  }

  function renderVerdicts() {
    // Kịch bản hoán đổi: một bảng duy nhất báo số ly đúng, không chỉ ra ly nào.
    const countCard = verdicts.find((v) => v.kind === 'COUNT');
    if (countCard) {
      const { hits, total } = countCard;
      const seed = seedCounter * 50 + hits + 3;
      dom.verdictRow.replaceChildren(el('div', {
        class: 'verdict verdict--count',
        'data-kind': hits === total ? 'ONE' : hits === 0 ? 'NO' : 'PARTIAL',
      }, [
        renderFrame('verdict__frame', 300, 110, seed, { wobble: 3, inset: 5 }),
        renderFrame('verdict__inner', 300, 110, seed + 60, { wobble: 2, inset: 11 }),
        el('div', {}, [
          el('div', { class: 'verdict__text', text: `${hits}/${total}` }),
          el('div', { class: 'verdict__note', text: hits === total ? 'đúng hết!' : 'ly đúng vị trí' }),
        ]),
      ]));
      return;
    }

    dom.verdictRow.replaceChildren(...verdicts.map(({ slot, verdict }, i) => {
      const isOne = verdict === VERDICT_ONE;
      const seed = seedCounter * 50 + slot * 3 + i + 5;
      return el('div', {
        class: 'verdict',
        'data-kind': verdict,
      }, [
        renderFrame('verdict__frame', 240, 96, seed, { wobble: 3, inset: 5 }),
        renderFrame('verdict__inner', 240, 96, seed + 60, { wobble: 2, inset: 11 }),
        el('div', {}, [
          verdicts.length > 1
            ? el('div', { class: 'verdict__slot', text: `Ô ${slot + 1}` })
            : null,
          el('div', {
            class: 'verdict__text',
            text: isOne ? 'Đúng' : 'Sai',
            style: `color:${isOne ? 'var(--verdict-one)' : 'var(--verdict-no)'}`,
          }),
        ]),
      ]);
    }));
  }

  function renderPairing() {
    if (!pending) {
      dom.pairing.hidden = true;
      dom.pairing.replaceChildren();
      return;
    }
    dom.pairing.hidden = false;
    // Ly đã hiện ngay trên ô rồi, nên chip chỉ cần nhắc việc còn phải làm.
    dom.pairing.replaceChildren(
      el('span', { text: 'Chọn ly thứ hai cho một ô khác' }),
      handButton('Huỷ', cancelPairing, { variant: 'btn--ghost', seed: 88 }),
    );
  }

  // ---- Kéo thả ----

  /**
   * Kéo ly bằng Pointer Events, không dùng HTML5 drag-and-drop vì cái đó
   * không chạy trên cảm ứng. Một bản sao của chiếc ly bám theo con trỏ,
   * thả lên ô nào thì đặt vào ô đó.
   *
   * Vẫn giữ nguyên lối bấm-chọn-rồi-bấm-ô: kéo dưới ngưỡng DRAG_THRESHOLD
   * được coi là một cú bấm bình thường.
   */
  const DRAG_THRESHOLD = 6;
  let drag = null;

  function onCupPointerDown(e, cupId) {
    if (busy || e.button !== 0) return;
    if (!game.active.available.has(cupId)) return;
    beginDrag(e, cupId, e.currentTarget, null);
  }

  /** Nhấc ly đang chờ ghép cặp ra khỏi ô để mang sang ô khác. */
  function onHeldPointerDown(e, slotIndex, cupId) {
    if (busy || e.button !== 0) return;
    e.stopPropagation();
    beginDrag(e, cupId, e.currentTarget, slotIndex);
  }

  function beginDrag(e, cupId, source, fromSlot) {
    drag = {
      cupId,
      fromSlot,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      ghost: null,
      hoverSlot: null,
      source,
      moved: false,
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', cancelDrag);
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      startGhost();
    }

    e.preventDefault();
    drag.ghost.style.transform =
      `translate(${e.clientX - drag.offsetX}px, ${e.clientY - drag.offsetY}px) rotate(-4deg)`;
    highlightSlotUnder(e.clientX, e.clientY);
  }

  function startGhost() {
    const rect = drag.source.getBoundingClientRect();
    drag.offsetX = rect.width / 2;
    drag.offsetY = rect.height / 2;

    const ghost = el('div', { class: 'drag-ghost' }, [
      renderCup(drag.cupId, seedCounter * 100 + 3),
    ]);
    ghost.style.width = `${rect.width}px`;
    document.body.append(ghost);
    drag.ghost = ghost;
    drag.source.dataset.dragging = 'true';
    document.body.classList.add('is-dragging');
  }

  /** Ô nằm dưới con trỏ, nếu ô đó còn thả được. */
  function slotAt(x, y) {
    const node = document.elementFromPoint(x, y)?.closest('.slot');
    if (!node || node.disabled) return null;
    return Number(node.dataset.slot);
  }

  function highlightSlotUnder(x, y) {
    const idx = slotAt(x, y);
    if (idx === drag.hoverSlot) return;
    dom.table.querySelectorAll('.slot[data-hover="true"]')
      .forEach((n) => { n.dataset.hover = 'false'; });
    drag.hoverSlot = idx;
    if (idx !== null) {
      const node = dom.table.querySelector(`[data-slot="${idx}"]`);
      if (node) node.dataset.hover = 'true';
    }
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { moved: wasDrag, cupId, fromSlot } = drag;
    const target = wasDrag ? slotAt(e.clientX, e.clientY) : null;

    cleanupDrag();

    if (!wasDrag) return;   // cú bấm thường — để onclick xử lý

    // Kịch bản hoán đổi: kéo ly từ ô này sang ô khác = đổi chỗ hai ly.
    if (game.active.mode === MODE_SWAP) {
      if (fromSlot === null || target === null || target === fromSlot) {
        swapPick = null;
        renderTable();
        renderSwapControls();
        return;
      }
      doSwap(fromSlot, target);
      return;
    }

    // Kéo ly đang chờ ghép cặp
    if (fromSlot !== null) {
      if (target === null || target === fromSlot) {
        // Thả ra ngoài bàn hoặc về chính ô cũ: trả ly về khay, huỷ chờ cặp.
        cancelPairing();
        return;
      }
      // Chuyển sang ô khác, vẫn ở trạng thái chờ cặp thứ hai.
      pending = { slot: target, cup: cupId };
      selectedCup = null;
      renderTable();
      renderTray();
      renderPairing();
      return;
    }

    if (target === null) {
      // Thả ra ngoài bàn: coi như chỉ nhấc ly lên rồi bỏ xuống.
      selectedCup = null;
      renderTray();
      return;
    }

    selectedCup = cupId;
    renderTray();
    onSlotClick(target);
  }

  function cancelDrag() {
    if (!drag) return;
    cleanupDrag();
    renderTray();
  }

  function cleanupDrag() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', cancelDrag);
    drag?.ghost?.remove();
    if (drag?.source) delete drag.source.dataset.dragging;
    dom.table.querySelectorAll('.slot[data-hover="true"]')
      .forEach((n) => { n.dataset.hover = 'false'; });
    document.body.classList.remove('is-dragging');
    drag = null;
  }

  // ---- Tương tác ----

  /** Số ô chưa khóa. Còn dưới 2 ô thì không ghép đôi được nữa. */
  function openSlotCount() {
    return game.active.board.filter((s) => s.status !== SLOT_LOCKED).length;
  }

  function onCupClick(cupId) {
    if (busy) return;
    selectedCup = selectedCup === cupId ? null : cupId;
    renderTray();
  }

  function onSlotClick(slotIndex) {
    if (busy) return;

    // Bấm lại chính ô đang giữ ở cặp thứ nhất = rút lại lựa chọn đó.
    // Không có lối thoát này thì người chơi bấm nhầm sẽ kẹt cứng, vì mọi
    // lần bấm sau đều rơi vào nhánh "hai ô phải khác nhau".
    if (pending && pending.slot === slotIndex) {
      selectedCup = pending.cup;
      pending = null;
      renderTable();
      renderTray();
      renderPairing();
      return;
    }

    if (!selectedCup) {
      flashHint(pending ? 'Chọn chiếc ly thứ hai' : 'Chọn một chiếc ly trước');
      return;
    }

    const placement = { slot: slotIndex, cup: selectedCup };
    const pairingActive = game.active.canDouble && openSlotCount() >= 2;

    if (pairingActive && !pending) {
      // Cặp đầu tiên: giữ lại, chờ cặp thứ hai.
      pending = placement;
      selectedCup = null;
      renderTable();
      renderTray();
      renderPairing();
      return;
    }

    if (pending) {
      if (pending.cup === selectedCup) {
        // Không thể xảy ra vì ly đang giữ đã bị vô hiệu trong khay, nhưng nếu
        // có thì phải từ chối — gửi đi 1 ly sẽ lách luật bắt buộc đặt đôi.
        flashHint('Hai ly phải khác loại');
        return;
      }
      const pair = [pending, placement];
      pending = null;
      submit(pair);
      return;
    }

    submit([placement]);
  }

  function submit(placements) {
    const round = game.active;
    const outcome = judge(round, placements);

    if (outcome.rejected) {
      flashHint(outcome.rejected);
      return;
    }

    selectedCup = null;
    verdicts = outcome.results;
    busy = true;

    // Các ô vừa đặt đúng: giữ ly ẩn ở hàng dưới chưa lật, để người chơi kịp
    // đọc phán xử trước. Ô đặt sai không vào đây — ly dưới giữ nguyên nét đứt.
    const justSolved = outcome.results
      .filter((r) => r.verdict === VERDICT_ONE)
      .map((r) => r.slot);
    justSolved.forEach((slot) => pendingReveal.add(slot));

    // Ly "NO" nằm lại trên bàn một nhịp rồi mới rung và bay về khay,
    // để người chơi kịp thấy mình vừa đặt gì ở đâu.
    renderTransient(placements, outcome.results);
    renderTray();
    renderVerdicts();
    renderPairing();
    dom.attemptValue.textContent = round.attempts;

    const anyMiss = outcome.results.some((r) => r.verdict === VERDICT_NO);
    const wait = anyMiss ? NO_RETURN_MS : 380;

    // Lật ly ẩn sau khi phán xử đã hiện đủ lâu để đọc. Lật lần lượt từng ô
    // khi đặt đôi, để hai ly không bật lên cùng lúc.
    justSolved.forEach((slot, order) => {
      window.setTimeout(() => {
        pendingReveal.delete(slot);
        revealHiddenCup(slot);
      }, REVEAL_DELAY_MS + order * REVEAL_STAGGER_MS);
    });

    // Không khoá tương tác suốt animation lật: ly lật ở hàng dưới chỉ để xem,
    // không cản người chơi đặt ly tiếp. Chỉ khi round đã xong mới chờ lật hết
    // rồi mở màn chuyển round.
    const lastReveal = justSolved.length
      ? REVEAL_DELAY_MS + (justSolved.length - 1) * REVEAL_STAGGER_MS + REVEAL_ANIM_MS
      : 0;

    window.setTimeout(() => {
      busy = false;
      // Không gọi renderAll() ở đây: nó vẽ lại cả bảng phán xử dù verdicts
      // không đổi, làm animation "verdict-pop" chạy lại và trông như màn hình
      // bị giật/reload ngay sau khi vừa hiện phán xử. Chỉ vẽ lại phần cần
      // cập nhật — nút bấm quay lại trạng thái enabled (busy=false).
      if (!outcome.cleared) {
        renderTable();
        renderTray();
        renderPairing();
      }
    }, wait);

    if (outcome.cleared) {
      window.setTimeout(showRoundCleared, Math.max(wait, lastReveal));
    }
  }

  /**
   * Lật ly ẩn ở một ô hàng dưới, thay tại chỗ thay vì vẽ lại cả bàn — vẽ lại
   * sẽ làm mất animation đang chạy ở các ô khác.
   */
  function revealHiddenCup(slotIndex) {
    const round = game.active;
    const slot = round.board[slotIndex];
    if (!slot || slot.status !== SLOT_LOCKED) return;

    const node = dom.table.querySelectorAll('.hidden-slot')[slotIndex];
    if (!node) return;

    const seed = seedCounter * 100 + slotIndex * 7 + 13;
    const cupNode = renderCup(slot.cup, seed + 640);
    cupNode.classList.add('is-revealing');

    node.dataset.solved = 'true';
    node.querySelector('.cup')?.replaceWith(cupNode);
  }

  /**
   * Hiển thị tạm các ly vừa đặt ngay trên bàn — ly đúng thì đã khóa qua
   * renderTable, ly sai thì chèn vào ô và cho rung trước khi biến mất.
   */
  function renderTransient(placements, results) {
    renderTable();
    results.forEach(({ slot, cup, verdict }) => {
      const slotNode = dom.table.querySelector(`[data-slot="${slot}"]`);
      if (!slotNode) return;
      const frame = slotNode.querySelector('.slot__frame');

      if (verdict === VERDICT_ONE) {
        frame.querySelector('.cup')?.classList.add('is-dropping');
        return;
      }

      // Ô ở hàng đặt ly giờ trống hẳn khi chưa có ly — chèn thẳng ly sai vào
      // frame để người chơi kịp thấy mình vừa đặt gì ở đâu trước khi nó bay đi.
      const cupNode = renderCup(cup, seedCounter * 100 + slot * 7 + 13 + 500);
      cupNode.classList.add('slot__cup', 'is-shaking');
      frame.append(cupNode);
    });
  }

  function cancelPairing() {
    pending = null;
    selectedCup = null;
    renderTable();
    renderTray();
    renderPairing();
  }

  let hintTimer = 0;
  function flashHint(message) {
    dom.verdictRow.replaceChildren(el('div', {
      class: 'verdict',
      'data-kind': 'NO',
    }, [
      renderFrame('verdict__frame', 240, 96, 404, { wobble: 3, inset: 5 }),
      el('div', { class: 'verdict__text', text: message, style: 'font-size:var(--text-label)' }),
    ]));
    window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => renderVerdicts(), 1600);
  }

  // ---- Lớp phủ ----

  /** Vẽ lại khung viền theo đúng số đo hiện tại của panel. */
  function fitFrame(frameSvg, panel, seed) {
    const { width, height } = panel.getBoundingClientRect();
    if (!width || !height) return;
    const w = Math.round(width);
    const h = Math.round(height);
    // Không cache số đo ở đây: panel được đo lần đầu lúc vừa tạo, trước khi
    // nội dung dài (bảng điểm cuối game) render xong. Cache lần đó lại sẽ giữ
    // mãi viewBox nhỏ và nét viền bị nén vào trong so với nội dung.
    frameSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    frameSvg.querySelector('path').setAttribute('d', handRect(w, h, seed, { wobble: 4, inset: 7 }));
  }

  function openPanel(title, bodyNodes, actions, { compact = false } = {}) {
    const frame = svg('svg', { class: 'panel__bg', 'aria-hidden': 'true' }, [svg('path', {})]);
    const panel = el('div', { class: `panel${compact ? ' panel--compact' : ''}` }, [
      frame,
      // Nút hành động nằm NGOÀI vùng cuộn, luôn nhìn thấy trong khung. Để nó
      // bên trong thì với nội dung dài (bảng điểm cuối game) nút bị cuộn ra
      // ngoài mép và trông như tràn khỏi viền.
      el('div', { class: 'panel__inner' }, [
        el('div', { class: 'panel__scroll' }, [
          el('h2', { class: 'panel__title', text: title }),
          el('div', { class: 'panel__body' }, bodyNodes),
        ]),
        el('div', { class: 'panel__actions' }, actions),
      ]),
    ]);
    dom.overlay.replaceChildren(panel);
    dom.overlay.hidden = false;

    // Khung phải vẽ theo kích thước thật của panel. Dùng viewBox cố định rồi
    // kéo giãn bằng preserveAspectRatio='none' sẽ bóp méo độ run tay thành
    // đường thẳng đều — mất hẳn chất vẽ tay.
    // Chiều cao panel còn đổi sau lần đo đầu: Amatic SC tải qua mạng, và
    // animation `verdict-pop` vẫn đang chạy. ResizeObserver một mình không đủ
    // vì nó gắn sau khi phần thay đổi đầu tiên đã xảy ra — nên đo lại qua vài
    // frame đầu cho tới khi số đo ổn định.
    const refit = () => fitFrame(frame, panel, seedCounter + 7);
    refit();

    let lastH = 0;
    let settleFrames = 0;
    const settle = () => {
      if (!panel.isConnected) return;
      const h = Math.round(panel.getBoundingClientRect().height);
      if (h !== lastH) {
        lastH = h;
        settleFrames = 0;
        refit();
      } else if (++settleFrames > 3) {
        return;   // ổn định 4 frame liền — dừng
      }
      requestAnimationFrame(settle);
    };
    requestAnimationFrame(settle);
    document.fonts?.ready.then(refit);

    const ro = new ResizeObserver(refit);
    ro.observe(panel);
    ro.observe(panel.querySelector('.panel__inner'));
    panelObserver?.disconnect();
    panelObserver = ro;

    // Focus nút hành động chính (trong .panel__actions), không phải nút đầu
    // tiên trong DOM — panel cheat có cả dãy nút round ở phần nội dung, focus
    // vào đó thì bấm Enter sẽ nhảy round ngoài ý muốn.
    //
    // `preventScroll` là bắt buộc: nút hành động nằm cuối panel, focus bình
    // thường sẽ cuộn vùng nội dung xuống để nút vào tầm nhìn, đẩy tiêu đề lên
    // trên khỏi khung viền.
    const primary = panel.querySelector('.panel__actions .btn') ?? panel.querySelector('.btn');
    primary?.focus({ preventScroll: true });
  }

  function closePanel() {
    panelObserver?.disconnect();
    panelObserver = null;
    dom.overlay.hidden = true;
    dom.overlay.replaceChildren();
  }

  function showIntro() {
    openPanel('Cách chơi', [
      el('p', { html: 'Quản trò đã giấu một bộ ly úp kín trên bàn. Nhiệm vụ của bạn là tìm ra <strong>ly nào nằm ở ô nào</strong>.' }),
      el('p', { html: 'Bộ ly dự phòng có <strong>đúng những ly</strong> mà quản trò đã giấu — không thừa, không thiếu. Bạn chỉ cần tìm đúng thứ tự.' }),
      el('ul', {}, [
        el('li', { html: '<strong>Kéo</strong> một ly từ khay lên ô muốn đặt — hoặc bấm ly rồi bấm ô.' }),
        el('li', { html: '<strong style="color:var(--verdict-one)">ĐÚNG</strong> — đúng ly đúng ô. Ly bị khóa cố định.' }),
        el('li', { html: '<strong style="color:var(--verdict-no)">SAI</strong> — thử ly khác, hoặc mang ly đó sang ô khác.' }),
        el('li', { html: 'Ly đã khóa sẽ bị gạch khỏi khay.' }),
      ]),
      el('p', { html: '<strong>Game không ghi lại những lần đoán sai.</strong> Bạn đã thử ly nào ở ô nào — phải tự nhớ lấy.' }),
      el('p', { html: '<strong>Round 1–4:</strong> bàn rộng dần từ 3 lên 6 ô. Từ round 3 chuyển sang <strong>⚡ Đặt đôi</strong> — mỗi lượt <em>bắt buộc</em> đặt 2 ly vào 2 ô, chọn cả hai trước khi biết kết quả nào.' }),
      el('p', { html: '<strong>Round 5–7:</strong> đổi kịch bản. Bàn có sẵn ly bị xáo trộn, bạn <strong>đổi chỗ</strong> chúng rồi bấm Kiểm tra. Quản trò chỉ nói <strong>số ly đúng vị trí</strong>, không nói ly nào. Round 5 chỉ 3 ly — bàn tập để làm quen luật mới.' }),
      el('p', { class: 'hint', text: 'Bàn phím: A–F chọn ly theo thứ tự trong khay · 1–6 chọn ô · Esc huỷ · R chơi lại ván' }),
    ], [
      handButton('Bắt đầu', () => closePanel(), { seed: 12 }),
    ]);
  }

  function showRoundCleared() {
    const record = advanceRound(game);
    seedCounter += 1;
    // Xoá phán xử — bỏ sót sẽ khiến bảng Đúng/Sai của round trước treo lại
    // trên bàn mới khi bộ đếm đã về 0.
    verdicts = [];
    swapPick = null;

    if (game.finished) {
      showGameOver();
      return;
    }

    const nextRound = game.active.round;
    const nextSize = roundSize(nextRound);
    const nextMode = game.active.mode;
    const unlocksDouble = game.active.canDouble && !canDoubleAt(nextRound - 1);
    // Round 6 đổi hẳn kịch bản — phải giải thích luật mới, không chỉ báo số ô.
    // Đây cũng là bàn tập 3 ly, nên màn này đóng luôn vai hướng dẫn.
    const entersSwap = nextMode === MODE_SWAP && roundMode(nextRound - 1) !== MODE_SWAP;

    const spent = record.mode === MODE_SWAP
      ? `Bạn dùng <strong>${record.turns}</strong> lượt (trung bình tối ưu là ${optimalAverage(record.round).toFixed(1)}).`
      : `Bạn đặt <strong>${record.attempts}</strong> lần (trung bình tối ưu là ${optimalAverage(record.round).toFixed(1)}).`;

    const nextIntro = entersSwap
      ? [
          el('p', { html: '🔄 <strong>Kịch bản mới bắt đầu từ đây.</strong>' }),
          el('ul', {}, [
            el('li', { html: `Bàn đã có sẵn <strong>${nextSize} ly</strong>, nhưng thứ tự bị xáo trộn.` }),
            el('li', { html: 'Bạn <strong>đổi chỗ</strong> các ly cho nhau — đổi bao nhiêu lần cũng được, không tốn lượt.' }),
            el('li', { html: 'Xong thì bấm <strong>Kiểm tra</strong>. Quản trò chỉ nói <strong>số ly đúng vị trí</strong>, KHÔNG nói ly nào.' }),
          ]),
          el('p', { html: `👉 Round này chỉ <strong>${nextSize} ly</strong> — bàn tập để bạn quen tay. Hai round sau mới là bàn thật (5 rồi 6 ly).` }),
          el('p', { class: 'hint', text: 'Mỗi lần Kiểm tra tính 1 lượt. Bảng "Đã thử" bên dưới ghi lại các lượt trước để bạn suy luận.' }),
        ]
      : [
          el('p', { html: nextMode === MODE_SWAP
            ? `Tiếp theo: <strong>Round ${nextRound}</strong> — hoán đổi <strong>${nextSize} ly</strong>.`
            : `Tiếp theo: <strong>Round ${nextRound}</strong> với <strong>${nextSize} ô</strong> và ${nextSize} loại ly.` }),
          unlocksDouble
            ? el('p', { html: '⚡ <strong>Đặt đôi bắt đầu từ đây.</strong> Mỗi lượt bạn phải đặt 2 ly vào 2 ô khác nhau, chọn cả hai trước khi biết kết quả nào. Ô cuối cùng còn lẻ thì đặt 1 ly.' })
            : null,
        ];

    openPanel(`Round ${record.round} xong`, [
      el('div', { class: 'stars', text: '⭐'.repeat(record.rank.stars) }),
      el('div', { class: 'rank-label', text: record.rank.label }),
      el('p', { html: spent }),
      el('p', { text: 'Lời giải:' }),
      el('div', { class: 'solution-row' },
        record.solution.map((cupId, i) => renderCup(cupId, 700 + i * 13))),
      ...nextIntro,
    ], [
      handButton(`Vào round ${nextRound}`, () => { closePanel(); renderAll(); }, { seed: 20 + nextRound }),
    ]);
  }

  function canDoubleAt(round) {
    return round >= 1 && roundSize(round) >= 5;
  }

  function showGameOver() {
    const final = finalRank(game);
    // Round 1–4 đo bằng số lần đặt ly, round 5–7 bằng số lượt kiểm tra. Hai
    // đơn vị khác nhau nên cột phải ghi trung tính và có chú thích riêng.
    const rows = game.roundResults.map((r) => el('tr', {
      'data-skipped': String(Boolean(r.skipped)),
    }, [
      el('td', { text: `Round ${r.round}` }),
      el('td', { text: r.mode === MODE_SWAP ? '🔄 Hoán đổi' : 'Đặt ly' }),
      el('td', { text: r.skipped ? '—' : '⭐'.repeat(r.rank.stars) }),
      el('td', { text: r.skipped ? 'bỏ qua' : String(r.scored) }),
    ]));

    openPanel('Hoàn thành!', [
      el('div', { class: 'stars', text: '⭐'.repeat(final.stars) }),
      el('div', { class: 'rank-label', text: final.label }),
      el('table', { class: 'score-table' }, [
        el('thead', {}, [el('tr', {}, [
          el('th', { text: 'Round' }), el('th', { text: 'Kịch bản' }),
          el('th', { text: 'Hạng' }), el('th', { text: 'Điểm' }),
        ])]),
        el('tbody', {}, rows),
        el('tfoot', {}, [el('tr', {}, [
          el('td', { text: 'Tổng' }), el('td', { text: '' }), el('td', { text: '' }),
          el('td', { text: String(final.totalAttempts) }),
        ])]),
      ]),
      el('p', { class: 'hint', html: `Điểm là số lần đặt ly (round 1–4) và số lượt kiểm tra (round 5–7). Người chơi tối ưu cần khoảng <strong>${final.optimal}</strong> điểm cho cả ${TOTAL_ROUNDS} round.` }),
    ], [
      handButton('Chơi lại', restart, { seed: 33 }),
    ]);
  }

  /**
   * Chơi lại ván hiện tại. Các round đã hoàn thành được giữ nguyên, chỉ round
   * đang chơi bị dựng lại. Hỏi xác nhận trước nếu đã đặt ly.
   */
  function askResetRound() {
    const round = game.active;
    if (round.attempts === 0) return;   // chưa làm gì, không có gì để mất

    const spent = round.mode === MODE_SWAP
      ? `Bạn đã dùng <strong>${round.turns}</strong> lượt kiểm tra ở round này.`
      : `Bạn đã đặt <strong>${round.attempts}</strong> lần ở round này.`;

    openPanel(`Chơi lại round ${game.currentRound}?`, [
      el('p', { html: spent }),
      el('p', { text: 'Bàn sẽ được dựng lại với lời giải mới, bộ đếm về 0. Các round đã xong vẫn giữ nguyên.' }),
    ], [
      handButton('Chơi lại round', resetRound, { seed: 71 }),
      handButton('Tiếp tục', () => closePanel(), { variant: 'btn--ghost', seed: 72 }),
    ], { compact: true });
  }

  /**
   * Dựng lại round hiện tại với lời giải MỚI, không giữ lời giải cũ. Giữ nguyên
   * thì người chơi ghi nhớ hết các ly đã trượt rồi reset để xoá bộ đếm —
   * lách được toàn bộ thử thách trí nhớ.
   */
  function resetRound() {
    game.active = createRound(game.currentRound, game.rng);
    selectedCup = null;
    pending = null;
    swapPick = null;
    verdicts = [];
    busy = false;
    seedCounter += 1;
    closePanel();
    renderAll();
  }

  // ---- Cheat (công cụ thử nghiệm) ----

  /**
   * Bảng cheat để nhảy thẳng tới round bất kỳ, hoặc xem lời giải.
   * Dùng khi thử nghiệm — không phải tính năng dành cho người chơi thật.
   */
  function openCheat() {
    if (busy) return;
    const round = game.active;

    const roundButtons = Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
      const target = i + 1;
      const swap = roundMode(target) === MODE_SWAP;
      return handButton(
        `${target}${swap ? ' 🔄' : ''}`,
        () => jumpToRound(target),
        {
          seed: 200 + target,
          variant: target === game.currentRound ? 'btn--small' : 'btn--ghost btn--small',
          title: `Round ${target} — ${swap ? 'hoán đổi' : 'đặt ly'} ${roundSize(target)} ly`,
        },
      );
    });

    openPanel('⚡ Cheat', [
      el('p', { class: 'hint', text: 'Công cụ thử nghiệm. Nhảy round sẽ xoá điểm của các round chưa chơi.' }),

      el('h3', { class: 'cheat__label', text: 'Nhảy tới round' }),
      el('div', { class: 'cheat__rounds' }, roundButtons),

      el('h3', { class: 'cheat__label', text: `Lời giải round ${round.round}` }),
      el('div', { class: 'solution-row' },
        round.solution.map((cupId, i) => renderCup(cupId, 900 + i * 17))),

      round.mode === MODE_SWAP
        ? el('p', { class: 'hint', html: `Đang đúng <strong>${countHits(currentArrangement(round), round.solution)}/${round.size}</strong> ly.` })
        : null,
    ], [
      handButton('Giải luôn round này', solveCurrentRound, { seed: 61 }),
      handButton('Đóng', () => closePanel(), { variant: 'btn--ghost', seed: 62 }),
    ]);
  }

  /**
   * Nhảy tới round chỉ định. Các round bị bỏ qua được điền bản ghi rỗng để
   * bảng điểm cuối game không bị thiếu dòng, và đánh dấu `skipped` để phân
   * biệt với round chơi thật.
   */
  function jumpToRound(target) {
    game.roundResults = Array.from({ length: target - 1 }, (_, i) => {
      const r = i + 1;
      const existing = game.roundResults.find((rec) => rec.round === r);
      if (existing) return existing;
      return {
        round: r,
        mode: roundMode(r),
        attempts: 0,
        turns: 0,
        scored: 0,
        skipped: true,
        solution: [],
        rank: { stars: 0, label: 'Bỏ qua' },
      };
    });
    game.totalAttempts = game.roundResults.reduce((sum, rec) => sum + rec.scored, 0);
    game.currentRound = target;
    game.finished = false;
    game.active = createRound(target, game.rng);

    selectedCup = null;
    pending = null;
    swapPick = null;
    verdicts = [];
    busy = false;
    seedCounter += 1;
    closePanel();
    renderAll();
  }

  /** Giải xong round hiện tại ngay — để xem màn chuyển round và tổng kết. */
  function solveCurrentRound() {
    const round = game.active;
    closePanel();

    if (round.mode === MODE_SWAP) {
      for (let i = 0; i < round.size; i++) {
        const arr = currentArrangement(round);
        if (arr[i] !== round.solution[i]) swapSlots(round, i, arr.indexOf(round.solution[i]));
      }
      checkArrangement(round);
    } else {
      round.solution.forEach((cup, slot) => judge(round, [{ slot, cup }]));
    }

    verdicts = [];
    renderAll();
    showRoundCleared();
  }


  /** Chơi lại toàn bộ từ round 1 — dùng ở màn tổng kết cuối game. */
  function restart() {
    game = createGame();
    selectedCup = null;
    pending = null;
    swapPick = null;
    verdicts = [];
    busy = false;
    seedCounter += 1;
    closePanel();
    renderAll();
  }

  // ---- Bàn phím ----

  document.addEventListener('keydown', (e) => {
    if (!dom.overlay.hidden) {
      if (e.key === 'Enter' || e.key === ' ') {
        const btn = dom.overlay.querySelector('.panel__actions .btn')
          ?? dom.overlay.querySelector('.btn');
        if (btn && document.activeElement !== btn) { e.preventDefault(); btn.click(); }
      }
      return;
    }
    if (busy) return;

    const key = e.key.toUpperCase();

    if (key === 'ESCAPE') {
      selectedCup = null;
      pending = null;
      swapPick = null;
      renderAll();
      return;
    }

    // R và C trước A-G: cả hai không phải mã ly nào trong bộ A-G... C thì có.
    // Nên C chỉ mở cheat khi bấm kèm Shift để không xung đột với việc chọn ly C.
    if (key === 'R') {
      askResetRound();
      return;
    }
    if (key === 'C' && e.shiftKey) {
      openCheat();
      return;
    }

    if (game.active.mode === MODE_SWAP) {
      if (e.key === 'Enter') { onCheck(); return; }
      if (/^[1-6]$/.test(key)) {
        const idx = Number(key) - 1;
        if (idx < game.active.size) onSwapSlotClick(idx);
      }
      return;
    }

    // Phím A–F chọn ly theo THỨ TỰ trong khay (A = ly đầu tiên), không phải
    // theo chữ in trên ly — ly giờ không in chữ nữa.
    if (/^[A-F]$/.test(key)) {
      if (game.active.available.has(key)) onCupClick(key);
      else flashHint(`Ly ${CUP_BY_ID.get(key)?.name ?? key} đã chốt trên bàn`);
      return;
    }

    if (/^[1-6]$/.test(key)) {
      const idx = Number(key) - 1;
      if (idx < game.active.size) onSlotClick(idx);
    }
  });

  return { restart, showIntro };
}
