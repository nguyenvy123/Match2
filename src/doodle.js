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
 * Chiếc ly nhìn ngang — cốc hình thang, miệng rộng ngửa lên, đáy hẹp đặt bàn.
 * Xem art-style.md mục 5.1.
 *
 * Vẽ thành MỘT path liền. Chia thành nhiều path rời sẽ bị lớp fill lệch kéo ra
 * các hướng khác nhau, làm chiếc ly trông như bị đứt ngang.
 *
 * Ô trống cũng dùng chính hình này (nét đứt, không tô màu) — xem
 * `renderHiddenCup` trong ui.js.
 */
export function handCup(w, h, seed, { wobble = 1.8 } = {}) {
  const rng = rngFrom(seed);
  const j = () => jitter(rng, wobble);

  // Cốc hình thang: miệng rộng ngửa lên, đáy hẹp đặt xuống bàn. Đây chính là
  // hình ly ẩn lật ngược lại — hai kiểu phải khớp nhau, vì chúng là cùng một
  // chiếc ly ở hai trạng thái úp và ngửa.
  const rimY = h * 0.13;
  const rimInset = w * 0.07;
  const baseY = h * 0.87;
  const baseInset = w * 0.26;

  const tl = { x: rimInset + j(), y: rimY + j() };
  const tr = { x: w - rimInset + j(), y: rimY + j() };
  const br = { x: w - baseInset + j(), y: baseY + j() };
  const bl = { x: baseInset + j(), y: baseY + j() };

  const body = [
    `M ${tl.x.toFixed(1)},${tl.y.toFixed(1)}`,
    // vành miệng cong nhẹ xuống — nhìn nghiêng thấy lòng cốc
    `Q ${(w / 2).toFixed(1)},${(rimY + 4 + j()).toFixed(1)} ${tr.x.toFixed(1)},${tr.y.toFixed(1)}`,
    wobblyLine(tr.x, tr.y, br.x, br.y, rng, 2.4),   // sườn phải thu vào
    // đáy cốc hơi vồng xuống
    `Q ${(w / 2).toFixed(1)},${(baseY + 3 + j()).toFixed(1)} ${bl.x.toFixed(1)},${bl.y.toFixed(1)}`,
    wobblyLine(bl.x, bl.y, tl.x, tl.y, rng, 2.4),   // sườn trái
    'Z',
  ].join(' ');

  // Nét vành miệng, vẽ ngay dưới mép trên — cùng chi tiết với ly úp, chỉ đổi
  // đầu. Đó là thứ giúp người chơi nhận ra hai hình là cùng một chiếc ly.
  const waist = [
    `M ${(tl.x + 2).toFixed(1)},${(rimY + h * 0.07 + j()).toFixed(1)}`,
    wobblyLine(tl.x + 2, rimY + h * 0.07, tr.x - 2, rimY + h * 0.07, rng, 1.2),
  ].join(' ');

  return { body, waist };
}

/**
 * Mặt bàn — dải ngang có độ dày, ngăn giữa hàng đặt ly và hàng ly ẩn.
 * Mép trên hơi vồng, mép dưới cong ngược lại một chút để trông như tấm ván
 * nhìn hơi chếch, không phải một thanh chữ nhật phẳng.
 */
export function handTableTop(w, h, seed) {
  const rng = rngFrom(seed);
  const j = (a = 1.6) => jitter(rng, a);

  const topY = h * 0.12;
  const botY = h * 0.9;

  return [
    `M ${(2 + j()).toFixed(1)},${(topY + j()).toFixed(1)}`,
    `Q ${(w * 0.3).toFixed(1)},${(topY - 3 + j()).toFixed(1)} ${(w * 0.62).toFixed(1)},${(topY + j()).toFixed(1)}`,
    `T ${(w - 2 + j()).toFixed(1)},${(topY - 1 + j()).toFixed(1)}`,
    `L ${(w - 3 + j()).toFixed(1)},${(botY + j()).toFixed(1)}`,
    `Q ${(w * 0.55).toFixed(1)},${(botY + 3.5 + j()).toFixed(1)} ${(w * 0.24).toFixed(1)},${(botY + j()).toFixed(1)}`,
    `T ${(3 + j()).toFixed(1)},${(botY + 1 + j()).toFixed(1)}`,
    'Z',
  ].join(' ');
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
