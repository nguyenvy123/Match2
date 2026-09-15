/**
 * MATCH 2 — logic game thuần, không phụ thuộc DOM.
 * Xem docs/game-design.md mục 8 (máy trạng thái) và mục 9 (cân bằng).
 */

// --- Hằng số ---

export const CUPS = [
  { id: 'A', name: 'Đỏ', hex: '#EE5742', ink: '#000000' },
  { id: 'B', name: 'Xanh dương', hex: '#3C53A1', ink: '#FFFFFF' },
  { id: 'C', name: 'Vàng', hex: '#F8D867', ink: '#000000' },
  { id: 'D', name: 'Xanh ngọc', hex: '#6ACADA', ink: '#000000' },
  { id: 'E', name: 'Hồng', hex: '#DB5CA1', ink: '#000000' },
  { id: 'F', name: 'Cam', hex: '#F2934A', ink: '#000000' },
  { id: 'G', name: 'Xanh lá', hex: '#7FBF6A', ink: '#000000' },
];

export const TOTAL_ROUNDS = 8;
const FIRST_ROUND_SIZE = 3;
const DOUBLE_UNLOCK_SIZE = 5;

/** Ba kịch bản chơi. */
export const MODE_PLACE = 'PLACE';   // round 1–4: lấy ly từ khay đặt vào ô
export const MODE_SWAP = 'SWAP';     // round 5–7: hoán đổi các ly có sẵn
export const MODE_FLIP = 'FLIP';     // round 8: đặt ly đúng cả loại lẫn chiều

// round → số ly. Round 5 chỉ 3 ly: đây là bàn tập để làm quen với luật hoán
// đổi trước khi vào bàn thật, vì phản hồi ở kịch bản này chỉ là một con số —
// khó hơn hẳn kịch bản đặt ly nếu ném thẳng người chơi vào bàn 5 ly.
//
// Bàn đặt ly dừng ở 6 ô, nên ly G (Xanh lá) hiện không round nào dùng tới.
// Giữ lại trong CUPS để sẵn sàng nếu thêm bàn rộng hơn về sau.
const SWAP_ROUNDS = { 5: 3, 6: 5, 7: 6 };

// Round 8 chỉ 3 ly: mỗi lần thử phải đúng CẢ loại ly lẫn chiều, nên số lượt
// tăng nhanh theo số ly. Mô phỏng cho thấy 6 ly tốn tới 24 lần đặt — gần gấp
// đôi round khó nhất hiện tại.
const FLIP_ROUNDS = { 8: 3 };

/**
 * Số ly úp trong lời giải round 8, CỐ ĐỊNH — không phải mỗi ô tung đồng xu.
 *
 * Ràng buộc này là trụ cột của thiết kế, không phải chi tiết phụ. Nếu chiều
 * độc lập từng ô thì nó không phải tài nguyên dùng chung, luật loại trừ mất
 * tác dụng hoàn toàn: mô phỏng cho thấy người chơi dò cạn và người chơi biết
 * suy luận tốn y hệt nhau. Với "đúng 1 úp", khóa được ly úp rồi thì các ô còn
 * lại chắc chắn ngửa — và ô cuối lại miễn phí như các round đặt ly khác.
 */
const FLIP_UPSIDE_DOWN = 1;

export const ORIENT_UP = 'UP';       // ly úp
export const ORIENT_DOWN = 'DOWN';   // ly ngửa (chiều thường)

export const SLOT_EMPTY = 'EMPTY';
export const SLOT_LOCKED = 'LOCKED';

export const VERDICT_ONE = 'ONE';
export const VERDICT_NO = 'NO';

/** Kịch bản của một round. */
export function roundMode(round) {
  if (round in FLIP_ROUNDS) return MODE_FLIP;
  if (round in SWAP_ROUNDS) return MODE_SWAP;
  return MODE_PLACE;
}

/**
 * Số ô của một round. Round 1 → 3 ô, round 4 → 6 ô.
 * Round hoán đổi lùi lại còn 3–6 ly: kịch bản đó khó hơn hẳn ở cùng số ly,
 * vì phản hồi chỉ là một con số chứ không chỉ ra ly nào đúng.
 */
export function roundSize(round) {
  return FLIP_ROUNDS[round] ?? SWAP_ROUNDS[round] ?? FIRST_ROUND_SIZE + (round - 1);
}

/** Round có mở quyền Đặt đôi không (chỉ áp dụng cho kịch bản đặt ly). */
export function canDouble(round) {
  return roundMode(round) === MODE_PLACE && roundSize(round) >= DOUBLE_UNLOCK_SIZE;
}

/**
 * Trung bình số lượt của người chơi tối ưu.
 *
 * Kịch bản đặt ly: ô còn k ứng viên tốn trung bình (k+1)/2 lần; ô cuối chỉ
 * tốn 1 lần để khóa.
 *
 * Kịch bản hoán đổi: số đo từ mô phỏng 300 ván với người chơi lọc dần tập
 * hoán vị còn khả dĩ sau mỗi phản hồi (chiến thuật kiểu Knuth).
 *
 * Bàn tập 3 ly là ngoại lệ có chủ đích: mô phỏng cho 2.8, nhưng con số đó
 * khiến ván hoàn hảo (2 lượt — ít nhất có thể, vì bàn đầu không bao giờ trùng
 * sẵn lời giải) chỉ được 4 sao, và 4 lượt rơi thẳng từ 3 sao xuống 1 sao.
 * Nới lên 2.9 để ván hoàn hảo được 5 sao và thang sao không có hố — đúng ý đồ
 * một bàn tập dễ thở.
 */
const SWAP_OPTIMAL = { 3: 2.9, 5: 4.7, 6: 5.7 };

/**
 * Kịch bản lật ly (round 8) — đo bằng mô phỏng 200 000 ván với người chơi
 * thực tế (nhớ ly đã khóa + đếm ly úp còn lại). Người chơi tối ưu tuyệt đối
 * tốn 6.8; không biết luật "đúng 1 úp" tốn 7.0.
 */
const FLIP_OPTIMAL = { 3: 6.5 };

export function optimalAverage(round) {
  const n = roundSize(round);
  const mode = roundMode(round);
  if (mode === MODE_SWAP) return SWAP_OPTIMAL[n];
  if (mode === MODE_FLIP) return FLIP_OPTIMAL[n];
  let total = 0;
  for (let i = 0; i < n - 1; i++) total += (n - i + 1) / 2;
  return total + 1;
}

const RANKS = [
  { maxRatio: 0.70, stars: 5, label: 'Hoàn hảo' },
  { maxRatio: 0.88, stars: 4, label: 'Xuất sắc' },
  { maxRatio: 1.12, stars: 3, label: 'Giỏi' },
  { maxRatio: 1.40, stars: 2, label: 'Khá' },
  { maxRatio: Infinity, stars: 1, label: 'Cần luyện thêm' },
];

/**
 * Xếp hạng sao dựa trên số lần đặt so với trung bình tối ưu của round.
 * Ngưỡng 5 sao là 0.70 chứ không chặt hơn: ván hoàn hảo của round 1 tốn
 * 3 lần đặt trên trung bình 4.5, tức tỉ lệ 0.667 — ngưỡng chặt hơn sẽ
 * khiến ván hoàn hảo tuyệt đối không bao giờ đạt 5 sao.
 */
export function rankFor(round, attempts) {
  const ratio = attempts / optimalAverage(round);
  return RANKS.find((r) => ratio <= r.maxRatio);
}

// --- Khởi tạo ---

function shuffled(list, rng) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Số ly đứng đúng vị trí giữa hai cách sắp xếp. */
export function countHits(arrangement, solution) {
  return arrangement.reduce((n, cup, i) => n + (cup === solution[i] ? 1 : 0), 0);
}

/**
 * Xếp ly ban đầu cho round hoán đổi.
 *
 * Tránh hai trường hợp hỏng ván: trùng luôn lời giải (thắng ngay khi chưa
 * chơi), và có sẵn quá nửa số ly đúng chỗ (gần như xong từ đầu). Thử lại
 * tối đa 50 lần rồi chấp nhận kết quả — với n ≥ 5 thì xác suất trượt cả 50
 * lần là không đáng kể.
 */
function startingArrangement(palette, solution, rng) {
  const limit = Math.floor(palette.length / 2);
  let best = shuffled(palette, rng);
  for (let i = 0; i < 50; i++) {
    const candidate = shuffled(palette, rng);
    const hits = countHits(candidate, solution);
    if (hits <= limit) return candidate;
    if (hits < countHits(best, solution)) best = candidate;
  }
  return best;
}

/**
 * Sinh chiều ly cho round lật: đúng `upCount` ô úp, còn lại ngửa.
 *
 * KHÔNG tung đồng xu từng ô — nếu làm vậy, chiều không phải tài nguyên dùng
 * chung và luật loại trừ mất tác dụng hoàn toàn. Xem `FLIP_UPSIDE_DOWN`.
 */
function randomOrientation(size, upCount, rng) {
  const slots = shuffled([...Array(size).keys()], rng).slice(0, upCount);
  const upSlots = new Set(slots);
  return Array.from({ length: size }, (_, i) => (upSlots.has(i) ? ORIENT_UP : ORIENT_DOWN));
}

/** Tạo state cho một round. Bộ ly cộng dồn: round n dùng n loại đầu tiên. */
export function createRound(round, rng = Math.random) {
  const size = roundSize(round);
  const palette = CUPS.slice(0, size).map((c) => c.id);
  const solution = shuffled(palette, rng);
  const mode = roundMode(round);

  if (mode === MODE_SWAP) {
    const arrangement = startingArrangement(palette, solution, rng);
    return {
      round,
      mode,
      size,
      palette,
      solution,
      // Bàn đã đầy ly ngay từ đầu, người chơi chỉ hoán đổi vị trí.
      board: arrangement.map((cup) => ({ status: SLOT_EMPTY, cup })),
      available: new Set(),      // không có khay dự phòng ở kịch bản này
      attempts: 0,
      turns: 0,
      canDouble: false,
      cleared: false,
      lastHits: null,            // số ly đúng của lần kiểm tra gần nhất
      history: [],               // [{ turn, arrangement, hits }]
    };
  }

  if (mode === MODE_FLIP) {
    return {
      round,
      mode,
      size,
      palette,
      solution,
      orientation: randomOrientation(size, FLIP_UPSIDE_DOWN, rng),
      board: Array.from({ length: size }, () => ({ status: SLOT_EMPTY, cup: null })),
      available: new Set(palette),
      upLeft: FLIP_UPSIDE_DOWN,   // số ly úp chưa đặt được, để UI hiện bộ đếm
      attempts: 0,
      turns: 0,
      canDouble: false,
      cleared: false,
    };
  }

  return {
    round,
    mode,
    size,
    palette,
    solution,
    board: Array.from({ length: size }, () => ({ status: SLOT_EMPTY, cup: null })),
    available: new Set(palette),
    attempts: 0,
    turns: 0,
    canDouble: canDouble(round),
    cleared: false,
  };
}

export function createGame(rng = Math.random) {
  return {
    currentRound: 1,
    roundResults: [],
    totalAttempts: 0,
    finished: false,
    rng,
    active: createRound(1, rng),
  };
}

// --- Phán xử ---

class RejectedMove extends Error {}

function assertPlayable(round, { slot, cup }) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= round.size) {
    throw new RejectedMove(`Ô ${slot + 1} không tồn tại`);
  }
  if (round.board[slot].status === SLOT_LOCKED) {
    throw new RejectedMove(`Ô ${slot + 1} đã khóa`);
  }
  if (!round.available.has(cup)) {
    throw new RejectedMove(`Ly ${cup} đã bị khóa ở ô khác`);
  }
}

/**
 * Quản trò kiểm tra các ly vừa đặt và trả lời ONE/NO cho từng ô.
 *
 * `placements` có 1 phần tử khi đặt đơn, 2 khi đặt đôi.
 * Mutate `round` tại chỗ và trả về kết quả, hoặc { rejected } nếu nước đi sai luật.
 */
/**
 * Nước đặt có đúng không.
 *
 * Round lật ly đòi hỏi đúng CẢ loại ly lẫn chiều. Sai chiều vẫn trả về SAI
 * y như sai ly — không phân biệt lý do, giữ đúng tinh thần "SAI không tiết lộ
 * gì thêm" của các round đặt ly.
 */
function isCorrectPlacement(round, { slot, cup, orientation }) {
  const cupMatch = round.solution[slot] === cup;
  if (round.mode !== MODE_FLIP) return cupMatch;
  return cupMatch && round.orientation[slot] === orientation;
}

export function judge(round, placements) {
  try {
    if (round.cleared) throw new RejectedMove('Round đã hoàn thành');

    if (placements.length === 2) {
      if (!round.canDouble) throw new RejectedMove('Round này chưa mở Đặt đôi');
      if (placements[0].slot === placements[1].slot) {
        throw new RejectedMove('Hai ô phải khác nhau');
      }
      if (placements[0].cup === placements[1].cup) {
        throw new RejectedMove('Hai ly phải khác loại');
      }
    } else if (placements.length !== 1) {
      throw new RejectedMove('Mỗi lượt đặt 1 hoặc 2 ly');
    }

    // Kiểm tra toàn bộ trước khi thay đổi state — một nước sai thì huỷ cả lượt.
    placements.forEach((p) => assertPlayable(round, p));
  } catch (err) {
    if (err instanceof RejectedMove) return { rejected: err.message };
    throw err;
  }

  round.turns += 1;
  const results = placements.map(({ slot, cup, orientation }) => {
    round.attempts += 1;
    const correct = isCorrectPlacement(round, { slot, cup, orientation });
    if (correct) {
      // Round lật ly lưu luôn chiều vào board để UI vẽ đúng chiều vĩnh viễn.
      round.board[slot] = round.mode === MODE_FLIP
        ? { status: SLOT_LOCKED, cup, orientation }
        : { status: SLOT_LOCKED, cup };
      round.available.delete(cup);
      if (round.mode === MODE_FLIP && orientation === ORIENT_UP) round.upLeft -= 1;
    }
    return { slot, cup, verdict: correct ? VERDICT_ONE : VERDICT_NO };
  });

  round.cleared = round.board.every((s) => s.status === SLOT_LOCKED);
  return { results, cleared: round.cleared };
}

// --- Kịch bản hoán đổi (round 5–7) ---

/**
 * Đổi chỗ hai ly trên bàn. Không tính lượt và không gọi quản trò — người chơi
 * sắp xếp thoải mái rồi mới bấm kiểm tra.
 */
export function swapSlots(round, a, b) {
  if (round.mode !== MODE_SWAP) return { rejected: 'Round này không hoán đổi được' };
  if (round.cleared) return { rejected: 'Round đã hoàn thành' };
  if (a === b) return { rejected: 'Phải chọn hai ô khác nhau' };

  const valid = (i) => Number.isInteger(i) && i >= 0 && i < round.size;
  if (!valid(a) || !valid(b)) return { rejected: 'Ô không tồn tại' };

  const board = round.board;
  [board[a], board[b]] = [board[b], board[a]];
  return { swapped: [a, b] };
}

/** Cách sắp xếp hiện tại trên bàn. */
export function currentArrangement(round) {
  return round.board.map((slot) => slot.cup);
}

/**
 * Quản trò kiểm tra cách sắp xếp hiện tại và **chỉ báo số ly đúng vị trí**,
 * không chỉ ra ly nào. Đây là điểm khiến kịch bản này khó hơn hẳn kịch bản
 * đặt ly: mỗi lượt chỉ thu được một con số.
 */
export function checkArrangement(round) {
  if (round.mode !== MODE_SWAP) return { rejected: 'Round này không dùng kiểm tra' };
  if (round.cleared) return { rejected: 'Round đã hoàn thành' };

  const arrangement = currentArrangement(round);

  // Lặp lại một cách sắp xếp đã thử là lãng phí lượt mà không thu được gì mới.
  const repeated = round.history.find(
    (h) => h.arrangement.every((cup, i) => cup === arrangement[i]),
  );
  if (repeated) {
    return { rejected: `Cách xếp này đã thử ở lượt ${repeated.turn} — vẫn ${repeated.hits} ly đúng` };
  }

  round.turns += 1;
  round.attempts += 1;
  const hits = countHits(arrangement, round.solution);
  round.lastHits = hits;
  round.history = [...round.history, { turn: round.turns, arrangement, hits }];

  if (hits === round.size) {
    round.cleared = true;
    round.board = round.board.map((slot) => ({ ...slot, status: SLOT_LOCKED }));
  }

  return { hits, total: round.size, cleared: round.cleared };
}

/**
 * Chốt round vừa xong và chuyển sang round kế tiếp.
 * Trả về bản ghi kết quả, hoặc null nếu round chưa hoàn thành.
 */
export function advanceRound(game) {
  const finished = game.active;
  if (!finished.cleared) return null;

  // Kịch bản hoán đổi chấm điểm theo số LƯỢT kiểm tra; kịch bản đặt ly theo
  // số lần đặt ly. Hai đơn vị khác nhau nên phải chọn đúng cái để xếp hạng.
  const scored = finished.mode === MODE_SWAP ? finished.turns : finished.attempts;

  const record = {
    round: finished.round,
    mode: finished.mode,
    attempts: finished.attempts,
    turns: finished.turns,
    scored,
    solution: [...finished.solution],
    // Chỉ round lật ly mới có chiều — các round khác để undefined.
    orientation: finished.orientation ? [...finished.orientation] : undefined,
    rank: rankFor(finished.round, scored),
  };
  game.roundResults.push(record);
  game.totalAttempts += scored;

  if (finished.round >= TOTAL_ROUNDS) {
    game.finished = true;
  } else {
    game.currentRound = finished.round + 1;
    game.active = createRound(game.currentRound, game.rng);
  }
  return record;
}

/** Xếp hạng chung cuộc, so tổng số lần đặt với tổng trung bình tối ưu. */
export function finalRank(game) {
  let optimal = 0;
  for (let r = 1; r <= TOTAL_ROUNDS; r++) optimal += optimalAverage(r);
  const ratio = game.totalAttempts / optimal;
  return {
    ...RANKS.find((r) => ratio <= r.maxRatio),
    totalAttempts: game.totalAttempts,
    optimal: Math.round(optimal * 10) / 10,
  };
}

// --- Gợi ý suy luận (dùng cho bảng ghi chú) ---

/**
 * Ly nào đã bị loại khỏi ô nào, suy ra từ các lần "NO" đã nhận.
 * Trả về Map: slot index → Set các ly đã thử và trượt.
 */
export function buildExclusions(history) {
  const map = new Map();
  history
    .filter((h) => h.verdict === VERDICT_NO)
    .forEach(({ slot, cup }) => {
      if (!map.has(slot)) map.set(slot, new Set());
      map.get(slot).add(cup);
    });
  return map;
}
