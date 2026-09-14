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

export const TOTAL_ROUNDS = 7;
const FIRST_ROUND_SIZE = 3;
const DOUBLE_UNLOCK_SIZE = 5;

/** Hai kịch bản chơi. */
export const MODE_PLACE = 'PLACE';   // round 1–5: lấy ly từ khay đặt vào ô
export const MODE_SWAP = 'SWAP';     // round 6–7: hoán đổi các ly có sẵn

const SWAP_ROUNDS = { 6: 5, 7: 6 };  // round → số ly

export const SLOT_EMPTY = 'EMPTY';
export const SLOT_LOCKED = 'LOCKED';

export const VERDICT_ONE = 'ONE';
export const VERDICT_NO = 'NO';

/** Kịch bản của một round. */
export function roundMode(round) {
  return round in SWAP_ROUNDS ? MODE_SWAP : MODE_PLACE;
}

/**
 * Số ô của một round. Round 1 → 3 ô, round 5 → 7 ô.
 * Round hoán đổi lùi lại còn 5–6 ly: kịch bản đó khó hơn hẳn ở cùng số ly,
 * vì phản hồi chỉ là một con số chứ không chỉ ra ly nào đúng.
 */
export function roundSize(round) {
  return SWAP_ROUNDS[round] ?? FIRST_ROUND_SIZE + (round - 1);
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
 */
const SWAP_OPTIMAL = { 5: 4.7, 6: 5.7 };

export function optimalAverage(round) {
  const n = roundSize(round);
  if (roundMode(round) === MODE_SWAP) return SWAP_OPTIMAL[n];
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
  const results = placements.map(({ slot, cup }) => {
    round.attempts += 1;
    const correct = round.solution[slot] === cup;
    if (correct) {
      round.board[slot] = { status: SLOT_LOCKED, cup };
      round.available.delete(cup);
    }
    return { slot, cup, verdict: correct ? VERDICT_ONE : VERDICT_NO };
  });

  round.cleared = round.board.every((s) => s.status === SLOT_LOCKED);
  return { results, cleared: round.cleared };
}

// --- Kịch bản hoán đổi (round 6–7) ---

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
