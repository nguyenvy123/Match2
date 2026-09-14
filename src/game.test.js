/**
 * Test logic game — chạy bằng: node src/game.test.js
 * Không dùng framework ngoài để giữ dự án zero-dependency.
 */

import {
  CUPS, TOTAL_ROUNDS, roundSize, canDouble, optimalAverage, rankFor,
  createRound, createGame, judge, advanceRound, finalRank, buildExclusions,
  roundMode, swapSlots, checkArrangement, currentArrangement, countHits,
  MODE_PLACE, MODE_SWAP,
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

test('round 1 có 3 ô, round 5 có 7 ô', () => {
  eq(roundSize(1), 3);
  eq(roundSize(5), 7);
});

test('Đặt đôi khóa ở round 1-2, mở từ round 3', () => {
  eq([1, 2, 3, 4, 5].map(canDouble), [false, false, true, true, true]);
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

test('chơi hết 7 round thì game kết thúc', () => {
  const g = createGame(seededRng(99));
  for (let r = 1; r <= TOTAL_ROUNDS; r++) {
    const round = g.active;
    if (round.mode === MODE_SWAP) {
      for (let i = 0; i < round.size; i++) {
        const arr = currentArrangement(round);
        if (arr[i] !== round.solution[i]) swapSlots(round, i, arr.indexOf(round.solution[i]));
      }
      checkArrangement(round);
    } else {
      round.solution.forEach((cup, slot) => judge(round, [{ slot, cup }]));
    }
    advanceRound(g);
  }
  ok(g.finished, 'game chưa kết thúc sau round 7');
  eq(g.roundResults.length, 7);
  // Round 1–5 đặt ly: mỗi ô 1 lần đặt. Round 6–7 hoán đổi: mỗi round 1 lượt kiểm tra.
  eq(g.totalAttempts, 3 + 4 + 5 + 6 + 7 + 1 + 1);
});

console.log('\n--- Xếp hạng ---');

test('trung bình tối ưu khớp mô phỏng trong tài liệu', () => {
  const expected = [4.5, 7, 10, 13.5, 17.5];
  [1, 2, 3, 4, 5].forEach((r, i) => {
    eq(Math.round(optimalAverage(r) * 10) / 10, expected[i], `round ${r}`);
  });
});

test('giải hoàn hảo được 5 sao', () => {
  eq(rankFor(1, 3).stars, 5);
  eq(rankFor(5, 7).stars, 5);
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
  const PLACE_ROUNDS = [1, 2, 3, 4, 5];
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

test('round 1-5 là đặt ly, round 6-7 là hoán đổi', () => {
  eq([1, 2, 3, 4, 5].map(roundMode), Array(5).fill(MODE_PLACE));
  eq([6, 7].map(roundMode), [MODE_SWAP, MODE_SWAP]);
});

test('round hoán đổi lùi về 5 rồi 6 ly', () => {
  eq(roundSize(6), 5);
  eq(roundSize(7), 6);
});

test('round hoán đổi không có Đặt đôi', () => {
  eq([6, 7].map(canDouble), [false, false]);
});

test('bàn đầy ly ngay từ đầu, khay rỗng', () => {
  const r = createRound(6, seededRng(11));
  eq(r.board.filter((s) => s.cup !== null).length, 5);
  eq(r.available.size, 0);
});

test('xếp ban đầu là hoán vị đủ của bộ ly', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const r = createRound(6, seededRng(seed));
    eq([...currentArrangement(r)].sort(), [...r.palette].sort(), `seed ${seed}`);
  }
});

test('xếp ban đầu không trùng lời giải và không quá nửa số ly đúng', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const r = createRound(6, seededRng(seed));
    const hits = countHits(currentArrangement(r), r.solution);
    ok(hits < r.size, `seed ${seed}: trùng luôn lời giải`);
    ok(hits <= Math.floor(r.size / 2), `seed ${seed}: ${hits}/${r.size} đúng sẵn, quá dễ`);
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

test('chơi được xuyên suốt 7 round, hai kịch bản nối nhau', () => {
  const g = createGame(seededRng(77));
  while (!g.finished) {
    const r = g.active;
    if (r.mode === MODE_SWAP) {
      solveBySwaps(r);
      checkArrangement(r);
    } else {
      r.solution.forEach((cup, slot) => judge(r, [{ slot, cup }]));
    }
    ok(advanceRound(g), `round ${r.round} không qua được`);
  }
  eq(g.roundResults.length, 7);
  eq(g.roundResults.map((x) => x.round), [1, 2, 3, 4, 5, 6, 7]);
});

test('500 ván hoán đổi ngẫu nhiên: luôn giải được', () => {
  for (let seed = 1; seed <= 500; seed++) {
    for (const round of [6, 7]) {
      const r = createRound(round, seededRng(seed * 13 + round));
      solveBySwaps(r);
      checkArrangement(r);
      ok(r.cleared, `seed ${seed} round ${round} không giải được`);
    }
  }
});

console.log('\n--- Xếp hạng kịch bản hoán đổi ---');

test('trung bình tối ưu của round hoán đổi khớp mô phỏng', () => {
  eq(optimalAverage(6), 4.7);
  eq(optimalAverage(7), 5.7);
});

test('giải nhanh hơn tối ưu được sao cao', () => {
  ok(rankFor(6, 3).stars >= 4, `3 lượt ở round 6 chỉ được ${rankFor(6, 3).stars} sao`);
});

test('giải chậm bị hạ sao', () => {
  ok(rankFor(6, 12).stars <= 2);
});


console.log('\n--- Dữ liệu ly ---');

test('đủ 7 ly, id duy nhất', () => {
  eq(CUPS.length, 7);
  eq(new Set(CUPS.map((c) => c.id)).size, 7);
});

test('mọi ly có màu chữ tương phản đủ với nền', () => {
  const lum = (hex) => {
    const v = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  CUPS.forEach((cup) => {
    const [a, b] = [lum(cup.hex), lum(cup.ink)].sort((x, y) => y - x);
    const ratio = (a + 0.05) / (b + 0.05);
    ok(ratio >= 4.5, `ly ${cup.id}: tương phản ${ratio.toFixed(2)} < 4.5`);
  });
});

console.log(`\n${'='.repeat(46)}`);
console.log(`  ${passed} pass, ${failed} fail`);
console.log('='.repeat(46));
process.exit(failed > 0 ? 1 : 0);
