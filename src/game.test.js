/**
 * Test logic game — chạy bằng: node src/game.test.js
 * Không dùng framework ngoài để giữ dự án zero-dependency.
 */

import {
  CUPS, TOTAL_ROUNDS, roundSize, canDouble, optimalAverage, rankFor,
  createRound, createGame, judge, advanceRound, finalRank, buildExclusions,
  roundMode, swapSlots, checkArrangement, currentArrangement, countHits,
  MODE_PLACE, MODE_SWAP, MODE_FLIP, ORIENT_UP, ORIENT_DOWN,
  SLOT_EMPTY, SLOT_LOCKED, VERDICT_ONE, VERDICT_NO,
} from './game.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL ${name}`);
    console.log(`       ${err.message}`);
  }
}

function eq(actual, expected, msg = '') {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg} — nhận ${a}, mong đợi ${e}`);
}

function ok(cond, msg) {
  if (!cond) throw new Error(msg || 'điều kiện sai');
}

/** RNG tất định để test lặp lại được. */
function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Đặt lời giải cố định để test khỏi phụ thuộc random. */
function roundWithSolution(solution) {
  const r = createRound(solution.length - 2);
  r.solution = [...solution];
  return r;
}

console.log('\n--- Thiết lập round ---');

test('round 1 có 3 ô, round 4 có 6 ô — bàn đặt ly rộng nhất', () => {
  eq(roundSize(1), 3);
  eq(roundSize(4), 6);
});

test('Đặt đôi khóa ở round 1-2, mở từ round 3', () => {
  eq([1, 2, 3, 4].map(canDouble), [false, false, true, true]);
});

test('số loại ly luôn bằng số ô', () => {
  for (let r = 1; r <= TOTAL_ROUNDS; r++) {
    const round = createRound(r);
    eq(round.palette.length, round.size, `round ${r}`);
    eq(round.solution.length, round.size, `round ${r}`);
  }
});

test('bộ ly cộng dồn — round sau giữ nguyên ly cũ', () => {
  const r3 = createRound(3).palette;
  const r4 = createRound(4).palette;
  eq(r4.slice(0, r3.length), r3);
});

test('lời giải là hoán vị, không lặp ly', () => {
  for (let r = 1; r <= TOTAL_ROUNDS; r++) {
    const { solution, palette } = createRound(r, seededRng(r * 77));
    eq(new Set(solution).size, solution.length, `round ${r} có ly lặp`);
    eq([...solution].sort(), [...palette].sort(), `round ${r} lệch bộ ly`);
  }
});

test('bàn khởi tạo toàn ô trống', () => {
  const r = createRound(3);
  ok(r.board.every((s) => s.status === SLOT_EMPTY && s.cup === null));
  eq(r.attempts, 0);
});

console.log('\n--- Phán xử ONE / NO ---');

test('đặt đúng ly đúng ô → ONE, ô bị khóa', () => {
  const r = roundWithSolution(['C', 'A', 'B']);
  const { results } = judge(r, [{ slot: 0, cup: 'C' }]);
  eq(results[0].verdict, VERDICT_ONE);
  eq(r.board[0], { status: SLOT_LOCKED, cup: 'C' });
});

test('đặt sai ly → NO, ô trở lại trống', () => {
  const r = roundWithSolution(['C', 'A', 'B']);
  const { results } = judge(r, [{ slot: 0, cup: 'A' }]);
  eq(results[0].verdict, VERDICT_NO);
  eq(r.board[0], { status: SLOT_EMPTY, cup: null });
});

test('ly khóa bị gỡ khỏi bộ dự phòng', () => {
  const r = roundWithSolution(['C', 'A', 'B']);
  judge(r, [{ slot: 0, cup: 'C' }]);
  ok(!r.available.has('C'), 'ly C vẫn còn trong bộ dự phòng');
  eq(r.available.size, 2);
});

test('mỗi lần đặt tăng attempts, kể cả khi NO', () => {
  const r = roundWithSolution(['C', 'A', 'B']);
  judge(r, [{ slot: 0, cup: 'A' }]);
  judge(r, [{ slot: 0, cup: 'B' }]);
  judge(r, [{ slot: 0, cup: 'C' }]);
  eq(r.attempts, 3);
  eq(r.turns, 3);
});

test('khóa hết ô → round cleared', () => {
  const r = roundWithSolution(['C', 'A', 'B']);
  judge(r, [{ slot: 0, cup: 'C' }]);
  judge(r, [{ slot: 1, cup: 'A' }]);
  ok(!r.cleared, 'chưa xong mà đã cleared');
  const last = judge(r, [{ slot: 2, cup: 'B' }]);
  ok(last.cleared, 'khóa đủ 3 ô mà chưa cleared');
});

console.log('\n--- Luật sửa sai ---');

test('đổi ly khác, giữ nguyên ô', () => {
  const r = roundWithSolution(['C', 'A', 'B']);
  eq(judge(r, [{ slot: 1, cup: 'B' }]).results[0].verdict, VERDICT_NO);
  eq(judge(r, [{ slot: 1, cup: 'C' }]).results[0].verdict, VERDICT_NO);
  eq(judge(r, [{ slot: 1, cup: 'A' }]).results[0].verdict, VERDICT_ONE);
});

test('đổi ô, giữ nguyên ly', () => {
  const r = roundWithSolution(['C', 'A', 'B']);
  eq(judge(r, [{ slot: 0, cup: 'B' }]).results[0].verdict, VERDICT_NO);
  eq(judge(r, [{ slot: 2, cup: 'B' }]).results[0].verdict, VERDICT_ONE);
});

console.log('\n--- Nước đi sai luật ---');

test('không đặt được vào ô đã khóa', () => {
  const r = roundWithSolution(['C', 'A', 'B']);
  judge(r, [{ slot: 0, cup: 'C' }]);
  const res = judge(r, [{ slot: 0, cup: 'A' }]);
  ok(res.rejected, 'lẽ ra phải bị từ chối');
  eq(r.attempts, 1, 'nước sai luật không được tính attempts');
});

test('không đặt được ly đã bị khóa ở ô khác', () => {
  const r = roundWithSolution(['C', 'A', 'B']);
  judge(r, [{ slot: 0, cup: 'C' }]);
  ok(judge(r, [{ slot: 1, cup: 'C' }]).rejected);
});

test('ô ngoài phạm vi bị từ chối', () => {
  const r = roundWithSolution(['C', 'A', 'B']);
  ok(judge(r, [{ slot: 9, cup: 'A' }]).rejected);
  ok(judge(r, [{ slot: -1, cup: 'A' }]).rejected);
});

console.log('\n--- Đặt đôi ---');

test('round 1-2 chưa mở Đặt đôi', () => {
  const r = roundWithSolution(['C', 'A', 'B']);
  const res = judge(r, [{ slot: 0, cup: 'C' }, { slot: 1, cup: 'A' }]);
  ok(res.rejected, 'round 3 ô lẽ ra chưa cho đặt đôi');
});

test('round 3 đặt đôi được, trả 2 phán xử', () => {
  const r = roundWithSolution(['C', 'A', 'B', 'E', 'D']);
  const { results } = judge(r, [{ slot: 0, cup: 'C' }, { slot: 1, cup: 'D' }]);
  eq(results.length, 2);
  eq(results[0].verdict, VERDICT_ONE);
  eq(results[1].verdict, VERDICT_NO);
});

test('đặt đôi tính 2 attempts nhưng chỉ 1 turn', () => {
  const r = roundWithSolution(['C', 'A', 'B', 'E', 'D']);
  judge(r, [{ slot: 0, cup: 'C' }, { slot: 1, cup: 'D' }]);
  eq(r.attempts, 2);
  eq(r.turns, 1);
});

test('đặt đôi cùng ô bị từ chối', () => {
  const r = roundWithSolution(['C', 'A', 'B', 'E', 'D']);
  ok(judge(r, [{ slot: 1, cup: 'C' }, { slot: 1, cup: 'A' }]).rejected);
});

test('đặt đôi cùng loại ly bị từ chối', () => {
  const r = roundWithSolution(['C', 'A', 'B', 'E', 'D']);
  ok(judge(r, [{ slot: 0, cup: 'A' }, { slot: 1, cup: 'A' }]).rejected);
});

test('đặt đôi mà một ô sai luật thì huỷ cả lượt', () => {
  const r = roundWithSolution(['C', 'A', 'B', 'E', 'D']);
  judge(r, [{ slot: 0, cup: 'C' }]);           // khóa ô 0
  const before = r.attempts;
  const res = judge(r, [{ slot: 0, cup: 'A' }, { slot: 1, cup: 'A' }]);
  ok(res.rejected);
  eq(r.attempts, before, 'ly hợp lệ trong lượt bị huỷ vẫn bị tính');
});

console.log('\n--- Chuỗi round ---');

test('advanceRound trả null khi round chưa xong', () => {
  const g = createGame(seededRng(1));
  eq(advanceRound(g), null);
});

test('qua round thì tăng currentRound và tạo bàn mới', () => {
  const g = createGame(seededRng(5));
  g.active.solution.forEach((cup, slot) => judge(g.active, [{ slot, cup }]));
  const rec = advanceRound(g);
  eq(rec.round, 1);
  eq(rec.attempts, 3);
  eq(g.currentRound, 2);
  eq(g.active.size, 4);
  ok(!g.finished);
});

/** Giải một round bằng cách đặt/xếp thẳng theo lời giải đã biết. */
function playRoundPerfectly(round) {
  if (round.mode === MODE_SWAP) {
    for (let i = 0; i < round.size; i++) {
      const arr = currentArrangement(round);
      if (arr[i] !== round.solution[i]) swapSlots(round, i, arr.indexOf(round.solution[i]));
    }
    checkArrangement(round);
    return;
  }
  if (round.mode === MODE_FLIP) {
    round.solution.forEach((cup, slot) => {
      judge(round, [{ slot, cup, orientation: round.orientation[slot] }]);
    });
    return;
  }
  round.solution.forEach((cup, slot) => judge(round, [{ slot, cup }]));
}

test('chơi hết 8 round thì game kết thúc', () => {
  const g = createGame(seededRng(99));
  for (let r = 1; r <= TOTAL_ROUNDS; r++) {
    playRoundPerfectly(g.active);
    advanceRound(g);
  }
  ok(g.finished, 'game chưa kết thúc sau round 8');
  eq(g.roundResults.length, 8);
  // Round 1–4 đặt ly: mỗi ô 1 lần đặt. Round 5–7 hoán đổi: mỗi round 1 lượt
  // kiểm tra. Round 8 lật ly: 3 ô, mỗi ô 1 lần đặt (biết sẵn lời giải).
  eq(g.totalAttempts, 3 + 4 + 5 + 6 + 1 + 1 + 1 + 3);
});

console.log('\n--- Xếp hạng ---');

test('trung bình tối ưu khớp mô phỏng trong tài liệu', () => {
  const expected = [4.5, 7, 10, 13.5];
  [1, 2, 3, 4].forEach((r, i) => {
    eq(Math.round(optimalAverage(r) * 10) / 10, expected[i], `round ${r}`);
  });
});

test('giải hoàn hảo được 5 sao', () => {
  eq(rankFor(1, 3).stars, 5);
  eq(rankFor(4, 6).stars, 5);
});

test('giải đúng mức tối ưu được 3 sao', () => {
  eq(rankFor(3, 10).stars, 3);
});

test('giải tệ nhất được 1 sao', () => {
  eq(rankFor(3, 15).stars, 1);
});

test('xếp hạng giảm dần khi đặt nhiều lần hơn', () => {
  const stars = [5, 7, 9, 11, 14, 20].map((a) => rankFor(3, a).stars);
  for (let i = 1; i < stars.length; i++) {
    ok(stars[i] <= stars[i - 1], `sao tăng ngược ở vị trí ${i}: ${stars}`);
  }
});

console.log('\n--- Bảng loại trừ ---');

test('gom các ly đã trượt theo từng ô', () => {
  const history = [
    { slot: 0, cup: 'A', verdict: VERDICT_NO },
    { slot: 0, cup: 'B', verdict: VERDICT_NO },
    { slot: 1, cup: 'A', verdict: VERDICT_NO },
    { slot: 2, cup: 'C', verdict: VERDICT_ONE },
  ];
  const ex = buildExclusions(history);
  eq([...ex.get(0)].sort(), ['A', 'B']);
  eq([...ex.get(1)], ['A']);
  ok(!ex.has(2), 'lần ONE không được tính là loại trừ');
});

console.log('\n--- Bất biến qua mô phỏng ---');

/** Chơi hết round hiện tại bằng chiến thuật phù hợp với kịch bản của nó. */
function playRound(r) {
  if (r.mode === MODE_SWAP) {
    for (let i = 0; i < r.size; i++) {
      const arr = currentArrangement(r);
      if (arr[i] !== r.solution[i]) swapSlots(r, i, arr.indexOf(r.solution[i]));
    }
    checkArrangement(r);
    return;
  }
  if (r.mode === MODE_FLIP) {
    // Dò cạn: mỗi ly thử chiều ngửa trước rồi úp. Tận dụng luật "đúng 1 úp" —
    // hết quota ly úp thì chỉ còn thử chiều ngửa.
    for (let slot = 0; slot < r.size && !r.cleared; slot++) {
      let done = false;
      for (const cup of [...r.available]) {
        const orientations = r.upLeft > 0 ? [ORIENT_DOWN, ORIENT_UP] : [ORIENT_DOWN];
        for (const orientation of orientations) {
          if (judge(r, [{ slot, cup, orientation }]).results?.[0].verdict === VERDICT_ONE) {
            done = true;
            break;
          }
        }
        if (done) break;
      }
    }
    return;
  }
  // Kịch bản đặt ly — dò cạn từng ô, chỉ thử các ly chưa khóa.
  for (let slot = 0; slot < r.size && !r.cleared; slot++) {
    for (const cup of [...r.available]) {
      if (judge(r, [{ slot, cup }]).results?.[0].verdict === VERDICT_ONE) break;
    }
  }
}

test('1000 ván ngẫu nhiên: luôn giải được, attempts nằm trong biên lý thuyết', () => {
  for (let seed = 1; seed <= 1000; seed++) {
    const g = createGame(seededRng(seed));
    let guard = 0;
    while (!g.finished) {
      ok(guard++ < TOTAL_ROUNDS + 2, `seed ${seed}: vòng lặp không kết thúc`);
      const r = g.active;
      playRound(r);
      const rec = advanceRound(g);
      ok(rec, `seed ${seed} round ${r.round} không giải được`);

      const n = roundSize(rec.round);
      if (roundMode(rec.round) === MODE_SWAP) {
        // Giải bằng hoán đổi rồi kiểm tra một lần duy nhất.
        eq(rec.attempts, 1, `seed ${seed} round ${rec.round}`);
      } else if (roundMode(rec.round) === MODE_FLIP) {
        // Xấu nhất: mỗi ô thử hết ly còn lại × 2 chiều.
        const worst = n * (n + 1);
        ok(rec.attempts >= n, `seed ${seed}: attempts ${rec.attempts} < ${n}`);
        ok(rec.attempts <= worst, `seed ${seed}: attempts ${rec.attempts} > ${worst}`);
      } else {
        const worst = (n * (n + 1)) / 2; // xấu nhất theo tài liệu mục 9.1
        ok(rec.attempts >= n, `seed ${seed}: attempts ${rec.attempts} < ${n}`);
        ok(rec.attempts <= worst, `seed ${seed}: attempts ${rec.attempts} > ${worst}`);
      }
    }
    eq(g.roundResults.length, TOTAL_ROUNDS, `seed ${seed} thiếu round`);
  }
});

test('trung bình mô phỏng khớp lý thuyết cho kịch bản đặt ly (sai số < 3%)', () => {
  const PLACE_ROUNDS = [1, 2, 3, 4];
  const totals = PLACE_ROUNDS.map(() => 0);
  const TRIALS = 2000;
  for (let seed = 1; seed <= TRIALS; seed++) {
    const g = createGame(seededRng(seed * 31));
    while (!g.finished) {
      playRound(g.active);
      advanceRound(g);
    }
    PLACE_ROUNDS.forEach((round, i) => {
      totals[i] += g.roundResults.find((rec) => rec.round === round).attempts;
    });
  }
  totals.forEach((sum, i) => {
    const avg = sum / TRIALS;
    const theory = optimalAverage(PLACE_ROUNDS[i]);
    const drift = Math.abs(avg - theory) / theory;
    ok(drift < 0.03, `round ${PLACE_ROUNDS[i]}: TB ${avg.toFixed(2)} vs lý thuyết ${theory} (lệch ${(drift * 100).toFixed(1)}%)`);
  });
});


console.log('\n--- Kịch bản hoán đổi ---');

test('round 1-4 là đặt ly, round 5-7 là hoán đổi', () => {
  eq([1, 2, 3, 4].map(roundMode), Array(4).fill(MODE_PLACE));
  eq([5, 6, 7].map(roundMode), [MODE_SWAP, MODE_SWAP, MODE_SWAP]);
});

/** Round 5 là bàn tập 3 ly — cửa vào kịch bản hoán đổi, xem game-design.md mục 6b. */
test('round hoán đổi mở bằng bàn tập 3 ly rồi lên 5 và 6 ly', () => {
  eq(roundSize(5), 3);
  eq(roundSize(6), 5);
  eq(roundSize(7), 6);
});

test('round hoán đổi không có Đặt đôi', () => {
  eq([5, 6, 7].map(canDouble), [false, false, false]);
});

test('bàn đầy ly ngay từ đầu, khay rỗng', () => {
  const r = createRound(6, seededRng(11));
  eq(r.board.filter((s) => s.cup !== null).length, 5);
  eq(r.available.size, 0);
});

test('xếp ban đầu là hoán vị đủ của bộ ly', () => {
  for (const round of [5, 6, 7]) {
    for (let seed = 1; seed <= 200; seed++) {
      const r = createRound(round, seededRng(seed));
      eq([...currentArrangement(r)].sort(), [...r.palette].sort(), `round ${round} seed ${seed}`);
    }
  }
});

// Bàn tập 3 ly là chỗ dễ vỡ nhất của startingArrangement: vùng chấp nhận chỉ
// còn hits ≤ 1, nên phải soi cả nó chứ không chỉ các bàn lớn.
test('xếp ban đầu không trùng lời giải và không quá nửa số ly đúng', () => {
  for (const round of [5, 6, 7]) {
    for (let seed = 1; seed <= 300; seed++) {
      const r = createRound(round, seededRng(seed));
      const hits = countHits(currentArrangement(r), r.solution);
      ok(hits < r.size, `round ${round} seed ${seed}: trùng luôn lời giải`);
      ok(hits <= Math.floor(r.size / 2), `round ${round} seed ${seed}: ${hits}/${r.size} đúng sẵn, quá dễ`);
    }
  }
});

test('hoán đổi hai ô đổi chỗ đúng', () => {
  const r = createRound(6, seededRng(7));
  const before = currentArrangement(r);
  swapSlots(r, 0, 3);
  const after = currentArrangement(r);
  eq(after[0], before[3]);
  eq(after[3], before[0]);
  eq(after[1], before[1], 'ô không liên quan bị đụng');
});

test('hoán đổi KHÔNG tính lượt', () => {
  const r = createRound(6, seededRng(7));
  swapSlots(r, 0, 1);
  swapSlots(r, 2, 3);
  swapSlots(r, 1, 4);
  eq(r.turns, 0);
  eq(r.attempts, 0);
});

test('hoán đổi cùng một ô bị từ chối', () => {
  const r = createRound(6, seededRng(7));
  ok(swapSlots(r, 2, 2).rejected);
});

test('hoán đổi ô ngoài phạm vi bị từ chối', () => {
  const r = createRound(6, seededRng(7));
  ok(swapSlots(r, 0, 9).rejected);
  ok(swapSlots(r, -1, 2).rejected);
});

test('không hoán đổi được ở round đặt ly', () => {
  const r = createRound(3, seededRng(7));
  ok(swapSlots(r, 0, 1).rejected);
});

test('kiểm tra chỉ trả về SỐ LƯỢNG đúng, không chỉ ra ly nào', () => {
  const r = createRound(6, seededRng(7));
  const res = checkArrangement(r);
  eq(typeof res.hits, 'number');
  eq(res.total, 5);
  ok(res.slots === undefined, 'lộ thông tin ô nào đúng');
  ok(res.cups === undefined, 'lộ thông tin ly nào đúng');
});

test('mỗi lần kiểm tra tính 1 lượt', () => {
  const r = createRound(6, seededRng(7));
  checkArrangement(r);
  swapSlots(r, 0, 1);
  checkArrangement(r);
  eq(r.turns, 2);
  eq(r.attempts, 2);
});

test('số ly đúng khớp với lời giải', () => {
  const r = createRound(6, seededRng(21));
  const arr = currentArrangement(r);
  const expected = arr.filter((cup, i) => cup === r.solution[i]).length;
  eq(checkArrangement(r).hits, expected);
});

/** Sắp xếp bàn về đúng lời giải bằng các bước hoán đổi. */
function solveBySwaps(r) {
  for (let i = 0; i < r.size; i++) {
    const arr = currentArrangement(r);
    if (arr[i] !== r.solution[i]) swapSlots(r, i, arr.indexOf(r.solution[i]));
  }
}

test('xếp đúng hết thì round hoàn thành và mọi ô khóa', () => {
  const r = createRound(6, seededRng(9));
  solveBySwaps(r);
  const res = checkArrangement(r);
  eq(res.hits, r.size);
  ok(res.cleared);
  ok(r.board.every((s) => s.status === SLOT_LOCKED));
});

test('lặp lại cách xếp đã thử bị từ chối, không tốn lượt', () => {
  const r = createRound(6, seededRng(13));
  checkArrangement(r);
  const turnsAfterFirst = r.turns;
  const res = checkArrangement(r);
  ok(res.rejected, 'lẽ ra phải từ chối');
  eq(r.turns, turnsAfterFirst, 'nước lặp lại vẫn bị tính lượt');
});

test('quay về cách xếp cũ sau vài lần đổi cũng bị từ chối', () => {
  const r = createRound(6, seededRng(13));
  checkArrangement(r);
  swapSlots(r, 0, 1);
  checkArrangement(r);
  swapSlots(r, 0, 1);
  ok(checkArrangement(r).rejected);
});

test('không kiểm tra được sau khi round đã xong', () => {
  const r = createRound(6, seededRng(9));
  solveBySwaps(r);
  checkArrangement(r);
  ok(checkArrangement(r).rejected);
  ok(swapSlots(r, 0, 1).rejected);
});

test('lịch sử ghi lại đủ các lượt đã thử', () => {
  const r = createRound(6, seededRng(31));
  checkArrangement(r);
  swapSlots(r, 1, 2);
  checkArrangement(r);
  eq(r.history.length, 2);
  eq(r.history[0].turn, 1);
  eq(r.history[1].turn, 2);
  ok(typeof r.history[0].hits === 'number');
});

test('chơi được xuyên suốt 8 round, ba kịch bản nối nhau', () => {
  const g = createGame(seededRng(77));
  while (!g.finished) {
    const r = g.active;
    playRoundPerfectly(r);
    ok(advanceRound(g), `round ${r.round} không qua được`);
  }
  eq(g.roundResults.length, 8);
  eq(g.roundResults.map((x) => x.round), [1, 2, 3, 4, 5, 6, 7, 8]);
  eq(g.roundResults.map((x) => x.mode),
    ['PLACE', 'PLACE', 'PLACE', 'PLACE', 'SWAP', 'SWAP', 'SWAP', 'FLIP']);
});

test('500 ván hoán đổi ngẫu nhiên: luôn giải được', () => {
  for (let seed = 1; seed <= 500; seed++) {
    for (const round of [5, 6, 7]) {
      const r = createRound(round, seededRng(seed * 13 + round));
      solveBySwaps(r);
      checkArrangement(r);
      ok(r.cleared, `seed ${seed} round ${round} không giải được`);
    }
  }
});

console.log('\n--- Xếp hạng kịch bản hoán đổi ---');

test('trung bình tối ưu của round hoán đổi khớp mô phỏng', () => {
  eq(optimalAverage(5), 2.9);
  eq(optimalAverage(6), 4.7);
  eq(optimalAverage(7), 5.7);
});

test('giải nhanh hơn tối ưu được sao cao', () => {
  ok(rankFor(6, 3).stars >= 4, `3 lượt ở round 6 chỉ được ${rankFor(6, 3).stars} sao`);
});

test('giải chậm bị hạ sao', () => {
  ok(rankFor(6, 12).stars <= 2);
});

/**
 * Bàn tập 3 ly không bao giờ trùng sẵn lời giải, nên 2 lượt là ván hoàn hảo —
 * phải được 5 sao. Đây là lý do trung bình tối ưu đặt 2.9 chứ không phải 2.8
 * như mô phỏng thuần: ở 2.8 thì ván hoàn hảo chỉ được 4 sao.
 */
test('ván hoàn hảo ở bàn tập được 5 sao, và thang sao không có hố', () => {
  eq(rankFor(5, 2).stars, 5);
  eq(rankFor(5, 3).stars, 3);
  eq(rankFor(5, 4).stars, 2);
});


console.log('\n--- Kịch bản lật ly (round 8) ---');

test('round 8 là kịch bản lật ly, 3 ly', () => {
  eq(roundMode(8), MODE_FLIP);
  eq(roundSize(8), 3);
  eq(TOTAL_ROUNDS, 8);
});

test('round 8 không có Đặt đôi', () => {
  eq(canDouble(8), false);
});

test('bàn khởi tạo trống, khay đủ 3 ly', () => {
  const r = createRound(8, seededRng(5));
  ok(r.board.every((s) => s.status === SLOT_EMPTY && s.cup === null));
  eq(r.available.size, 3);
  eq(r.palette, ['A', 'B', 'C']);
});

test('chiều ly có ĐÚNG 1 ô úp, không phải tung đồng xu từng ô', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const r = createRound(8, seededRng(seed));
    const ups = r.orientation.filter((o) => o === ORIENT_UP).length;
    eq(ups, 1, `seed ${seed}: có ${ups} ly úp`);
    eq(r.orientation.length, 3);
    ok(r.orientation.every((o) => o === ORIENT_UP || o === ORIENT_DOWN));
  }
});

test('vị trí ly úp phân bố đều qua 3 ô', () => {
  const counts = [0, 0, 0];
  const TRIALS = 3000;
  for (let seed = 1; seed <= TRIALS; seed++) {
    const r = createRound(8, seededRng(seed * 7));
    counts[r.orientation.indexOf(ORIENT_UP)] += 1;
  }
  counts.forEach((c, i) => {
    const share = c / TRIALS;
    ok(share > 0.25 && share < 0.42, `ô ${i + 1}: ly úp rơi vào ${(share * 100).toFixed(0)}%`);
  });
});

test('upLeft khởi tạo bằng số ly úp', () => {
  const r = createRound(8, seededRng(9));
  eq(r.upLeft, 1);
});

test('đúng ly + đúng chiều → ONE, board lưu cả chiều', () => {
  const r = createRound(8, seededRng(11));
  const res = judge(r, [{ slot: 0, cup: r.solution[0], orientation: r.orientation[0] }]);
  eq(res.results[0].verdict, VERDICT_ONE);
  eq(r.board[0], { status: SLOT_LOCKED, cup: r.solution[0], orientation: r.orientation[0] });
});

test('đúng ly + SAI chiều → NO, ô không khóa', () => {
  const r = createRound(8, seededRng(11));
  const wrong = r.orientation[0] === ORIENT_UP ? ORIENT_DOWN : ORIENT_UP;
  const res = judge(r, [{ slot: 0, cup: r.solution[0], orientation: wrong }]);
  eq(res.results[0].verdict, VERDICT_NO);
  eq(r.board[0].status, SLOT_EMPTY);
  ok(r.available.has(r.solution[0]), 'ly đúng bị gỡ khỏi khay dù đặt sai chiều');
});

test('sai ly + đúng chiều → NO', () => {
  const r = createRound(8, seededRng(13));
  const otherCup = r.palette.find((c) => c !== r.solution[0]);
  const res = judge(r, [{ slot: 0, cup: otherCup, orientation: r.orientation[0] }]);
  eq(res.results[0].verdict, VERDICT_NO);
});

test('SAI không phân biệt lý do — sai ly và sai chiều cùng một verdict', () => {
  const r1 = createRound(8, seededRng(17));
  const r2 = createRound(8, seededRng(17));
  const wrongOri = r1.orientation[0] === ORIENT_UP ? ORIENT_DOWN : ORIENT_UP;
  const otherCup = r2.palette.find((c) => c !== r2.solution[0]);

  const bySideways = judge(r1, [{ slot: 0, cup: r1.solution[0], orientation: wrongOri }]);
  const byCup = judge(r2, [{ slot: 0, cup: otherCup, orientation: r2.orientation[0] }]);
  eq(bySideways.results[0].verdict, byCup.results[0].verdict);
});

test('upLeft giảm khi khóa được ly úp, không đổi khi khóa ly ngửa', () => {
  const r = createRound(8, seededRng(23));
  const upSlot = r.orientation.indexOf(ORIENT_UP);
  const downSlot = r.orientation.indexOf(ORIENT_DOWN);

  judge(r, [{ slot: downSlot, cup: r.solution[downSlot], orientation: ORIENT_DOWN }]);
  eq(r.upLeft, 1, 'khóa ly ngửa không được đụng vào upLeft');

  judge(r, [{ slot: upSlot, cup: r.solution[upSlot], orientation: ORIENT_UP }]);
  eq(r.upLeft, 0);
});

test('khóa đủ 3 ô → round hoàn thành', () => {
  const r = createRound(8, seededRng(29));
  r.solution.forEach((cup, slot) => {
    judge(r, [{ slot, cup, orientation: r.orientation[slot] }]);
  });
  ok(r.cleared);
  ok(r.board.every((s) => s.status === SLOT_LOCKED));
});

test('không đặt đôi được ở round lật ly', () => {
  const r = createRound(8, seededRng(31));
  const res = judge(r, [
    { slot: 0, cup: r.palette[0], orientation: ORIENT_DOWN },
    { slot: 1, cup: r.palette[1], orientation: ORIENT_DOWN },
  ]);
  ok(res.rejected);
});

test('ô cuối miễn phí: khóa 2 ô thì ly và chiều ô thứ ba đều xác định', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const r = createRound(8, seededRng(seed * 3));
    // Khóa 2 ô đầu
    for (const slot of [0, 1]) {
      judge(r, [{ slot, cup: r.solution[slot], orientation: r.orientation[slot] }]);
    }
    // Ô cuối: chỉ còn 1 ly và chiều suy ra được từ quota upLeft
    eq(r.available.size, 1, `seed ${seed}`);
    const lastCup = [...r.available][0];
    const lastOri = r.upLeft > 0 ? ORIENT_UP : ORIENT_DOWN;
    const res = judge(r, [{ slot: 2, cup: lastCup, orientation: lastOri }]);
    eq(res.results[0].verdict, VERDICT_ONE, `seed ${seed}: suy luận ô cuối sai`);
  }
});

test('500 ván lật ly ngẫu nhiên: luôn giải được', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const r = createRound(8, seededRng(seed * 19));
    r.solution.forEach((cup, slot) => {
      judge(r, [{ slot, cup, orientation: r.orientation[slot] }]);
    });
    ok(r.cleared, `seed ${seed} không giải được`);
  }
});

test('trung bình tối ưu round 8 khớp mô phỏng', () => {
  eq(optimalAverage(8), 6.5);
});

test('mô phỏng dò cạn: số lần đặt nằm trong biên lý thuyết', () => {
  const TRIALS = 5000;
  let total = 0;
  let worst = 0;
  for (let seed = 1; seed <= TRIALS; seed++) {
    const r = createRound(8, seededRng(seed * 11));
    playRound(r);
    ok(r.cleared, `seed ${seed} không giải được`);
    total += r.attempts;
    worst = Math.max(worst, r.attempts);
  }
  const avg = total / TRIALS;
  // Dò cạn kém hơn người chơi tối ưu (6.5) nhưng không được vượt quá xa.
  ok(avg >= 5 && avg <= 9, `TB dò cạn ${avg.toFixed(2)} nằm ngoài khoảng hợp lý`);
  ok(worst <= 12, `xấu nhất ${worst} > 12`);
});


console.log('\n--- Dữ liệu ly ---');

test('đủ 7 ly, id duy nhất', () => {
  eq(CUPS.length, 7);
  eq(new Set(CUPS.map((c) => c.id)).size, 7);
});

test('mọi cặp ly đủ khác biệt về màu để phân biệt bằng mắt', () => {
  // Màu giờ là tín hiệu DUY NHẤT phân biệt ly (không còn chữ cái in trên ly),
  // nên hai ly bất kỳ phải cách nhau đủ xa trong không gian màu.
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  /** Khoảng cách màu có trọng số theo độ nhạy của mắt người. */
  const distance = (h1, h2) => {
    const [r1, g1, b1] = rgb(h1);
    const [r2, g2, b2] = rgb(h2);
    const rMean = (r1 + r2) / 2;
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return Math.sqrt(
      (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db,
    );
  };

  const MIN_DISTANCE = 100;
  for (let i = 0; i < CUPS.length; i++) {
    for (let j = i + 1; j < CUPS.length; j++) {
      const d = distance(CUPS[i].hex, CUPS[j].hex);
      ok(d >= MIN_DISTANCE,
        `${CUPS[i].name} vs ${CUPS[j].name}: khoảng cách màu ${d.toFixed(0)} < ${MIN_DISTANCE}`);
    }
  }
});

test('mọi ly đủ tương phản với nền giấy trắng', () => {
  // Viền mực đen giúp ly nổi lên, nhưng mảng màu cũng nên tách khỏi nền trắng
  // để người chơi nhận ra ly ngay cả khi nhìn lướt.
  const lum = (hex) => {
    const v = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  CUPS.forEach((cup) => {
    const ratio = (1.0 + 0.05) / (lum(cup.hex) + 0.05);
    ok(ratio >= 1.3, `${cup.name}: tương phản với nền trắng ${ratio.toFixed(2)} < 1.3`);
  });
});

console.log(`\n${'='.repeat(46)}`);
console.log(`  ${passed} pass, ${failed} fail`);
console.log('='.repeat(46));
process.exit(failed > 0 ? 1 : 0);
