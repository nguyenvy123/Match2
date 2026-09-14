/**
 * Sinh SVG path kiểu vẽ tay.
 * Xem docs/art-style.md mục 4 — ngôn ngữ nét vẽ.
 *
 * Nguyên tắc: không dùng `border` CSS cho hình dạng chính. Border trông như
 * máy vẽ ngay lập tức. Mọi hình đều là path có toạ độ lệch nhẹ khỏi vị trí
 * "đúng", và mỗi instance dùng một seed khác nhau để không cái nào giống cái nào.
 */

/** RNG tất định — cùng seed luôn cho cùng hình, tránh nhấp nháy khi render lại. */
function rngFrom(seed) {
  let s = (seed * 2654435761) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Lệch ngẫu nhiên trong khoảng ±amount. */
const jitter = (rng, amount) => (rng() - 0.5) * 2 * amount;

/**
 * Đường cong nhẹ giữa 2 điểm, phình ra một bên như nét bút thật.
 * Bút thật không bao giờ kẻ được đường thẳng tuyệt đối.
 */
function wobblyLine(x1, y1, x2, y2, rng, bow = 1.4) {
  const mx = (x1 + x2) / 2 + jitter(rng, bow);
  const my = (y1 + y2) / 2 + jitter(rng, bow);
  return `Q ${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

/**
 * Chữ nhật vẽ tay. Bốn góc lệch khỏi vị trí đúng, bốn cạnh hơi cong.
 * Dùng cho ô trên bàn, khung phán xử, nút bấm.
 */
export function handRect(w, h, seed, { wobble = 2.2, inset = 3 } = {}) {
  const rng = rngFrom(seed);
  const j = () => jitter(rng, wobble);

  const x0 = inset + j();
  const y0 = inset + j();
  const x1 = w - inset + j();
  const y1 = inset + j();
  const x2 = w - inset + j();
  const y2 = h - inset + j();
  const x3 = inset + j();
  const y3 = h - inset + j();

  return [
    `M ${x0.toFixed(1)},${y0.toFixed(1)}`,
    wobblyLine(x0, y0, x1, y1, rng),
    wobblyLine(x1, y1, x2, y2, rng),
    wobblyLine(x2, y2, x3, y3, rng),
    wobblyLine(x3, y3, x0, y0, rng),
    'Z',
  ].join(' ');
}

/**
 * Chiếc ly nhìn ngang — miệng rộng dưới, thân thon lên trên, có vành đáy.
 * Xem art-style.md mục 5.1.
 *
 * Vẽ thành MỘT path liền (thân + chân nối nhau) chứ không phải hai mảnh rời.
 * Hai path riêng sẽ bị lớp fill lệch kéo ra hai hướng khác nhau, làm chiếc ly
 * trông như bị đứt ngang.
 */
export function handCup(w, h, seed, { wobble = 1.8 } = {}) {
  const rng = rngFrom(seed);
  const j = () => jitter(rng, wobble);

  const topY = h * 0.09;
  const topInset = w * 0.24;
  const bodyBottomY = h * 0.72;
  const sideInset = w * 0.09;

  // Thân: miệng trên hẹp, loe dần xuống dưới.
  const tl = { x: topInset + j(), y: topY + j() };
  const tr = { x: w - topInset + j(), y: topY + j() };
  const br = { x: w - sideInset + j(), y: bodyBottomY + j() };
  const bl = { x: sideInset + j(), y: bodyBottomY + j() };

  // Cuống nối thân với chân đế.
  const stemTop = bodyBottomY;
  const stemBottom = h * 0.82;
  const stemInset = w * 0.34;
  const sr = { x: w - stemInset + j(), y: stemBottom + j() };
  const sl = { x: stemInset + j(), y: stemBottom + j() };

  // Chân đế loe ra.
  const footY = h * 0.93;
  const footInset = w * 0.17;
  const fr = { x: w - footInset + j(), y: footY + j() };
  const fl = { x: footInset + j(), y: footY + j() };

  const body = [
    `M ${tl.x.toFixed(1)},${tl.y.toFixed(1)}`,
    // miệng ly cong nhẹ xuống, thấy được vành
    `Q ${(w / 2).toFixed(1)},${(topY - 3 + j()).toFixed(1)} ${tr.x.toFixed(1)},${tr.y.toFixed(1)}`,
    wobblyLine(tr.x, tr.y, br.x, br.y, rng, 2.4),   // sườn phải
    wobblyLine(br.x, br.y, sr.x, sr.y, rng, 1.2),   // thắt vào cuống
    wobblyLine(sr.x, sr.y, fr.x, fr.y, rng, 1.2),   // loe ra chân
    `Q ${(w / 2).toFixed(1)},${(footY + 3 + j()).toFixed(1)} ${fl.x.toFixed(1)},${fl.y.toFixed(1)}`,
    wobblyLine(fl.x, fl.y, sl.x, sl.y, rng, 1.2),
    wobblyLine(sl.x, sl.y, bl.x, bl.y, rng, 1.2),
    wobblyLine(bl.x, bl.y, tl.x, tl.y, rng, 2.4),   // sườn trái
    'Z',
  ].join(' ');

  // Nét ngang ngăn thân với cuống — chi tiết trang trí, vẽ bằng nét mảnh hơn.
  const waist = [
    `M ${(bl.x + 1).toFixed(1)},${(bodyBottomY + j()).toFixed(1)}`,
    wobblyLine(bl.x + 1, bodyBottomY, br.x - 1, bodyBottomY, rng, 1.1),
  ].join(' ');

  return { body, waist };
}

/**
 * Các nét gạch chéo đè lên ly đã bị khóa trong khay — như gạch bỏ trong sổ tay.
 */
export function handStrikes(w, h, seed, count = 2) {
  const rng = rngFrom(seed);
  return Array.from({ length: count }, (_, i) => {
    const offset = (i - (count - 1) / 2) * (w * 0.22);
    const x1 = w * 0.12 + offset + jitter(rng, 3);
    const y1 = h * 0.16 + jitter(rng, 4);
    const x2 = w * 0.88 + offset + jitter(rng, 3);
    const y2 = h * 0.84 + jitter(rng, 4);
    return `M ${x1.toFixed(1)},${y1.toFixed(1)} ${wobblyLine(x1, y1, x2, y2, rng, 2.4)}`;
  });
}

/**
 * Gạch chân nguệch ngoạc dưới tiêu đề — 2 nét chồng nhau lệch nhau.
 */
export function handUnderline(w, seed) {
  const rng = rngFrom(seed);
  return [0, 1].map((i) => {
    const y = 4 + i * 3.5 + jitter(rng, 1.2);
    const x1 = 2 + jitter(rng, 4);
    const x2 = w - 2 + jitter(rng, 4);
    const mx = (x1 + x2) / 2;
    return `M ${x1.toFixed(1)},${y.toFixed(1)} Q ${mx.toFixed(1)},${(y + jitter(rng, 3)).toFixed(1)} ${x2.toFixed(1)},${(y + jitter(rng, 1.5)).toFixed(1)}`;
  });
}

/**
 * Độ lệch của lớp màu so với lớp viền — art-style.md mục 4.2 kỹ thuật ②.
 * Trong ảnh gốc, mảng màu không nằm khít trong nét viền mà lệch ra 1–3px.
 */
export function fillOffset(seed) {
  const rng = rngFrom(seed + 9001);
  return { x: jitter(rng, 2.2), y: jitter(rng, 1.8) };
}

/** Xoay rất nhẹ để phá sự đều đặn khi xếp nhiều ly cạnh nhau. */
export function tilt(seed, max = 1.6) {
  return jitter(rngFrom(seed + 4242), max);
}
