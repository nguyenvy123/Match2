# Round 8 — "🙃 Lật ly": thiết kế

**Ngày:** 2026-09-14 · **Sửa:** 2026-09-15
**Trạng thái:** ✅ Đã triển khai xong (2026-09-15). Xem docs/rounds.md mục 1b.

> **Sửa ngày 2026-09-15 sau khi mô phỏng độ khó.** Bản đầu đặt 6 ly với chiều
> tung đồng xu độc lập từng ô. Mô phỏng 200 000 ván cho ra **24.0 lần đặt** —
> gần gấp đôi round khó nhất hiện tại (round 4: 13.5) và làm mất hẳn phần suy
> luận (xem mục 3.3). Đã đổi thành **3 ly, đúng 1 úp + 2 ngửa**.

## 1. Bối cảnh

Match 2 hiện có 7 round, hai kịch bản (xem [docs/rounds.md](../../rounds.md)):

- Round 1–4: **đặt ly** — kéo ly từ khay vào ô, phản hồi ĐÚNG/SAI tức thì cho từng ô.
- Round 5–7: **hoán đổi** — bàn đầy sẵn ly bị xáo, đổi chỗ rồi bấm Kiểm tra, chỉ biết số lượng đúng.

Cả hai kịch bản đều chỉ có **một** ẩn số mỗi ô: loại ly nào nằm ở đó. Round 8 thêm ẩn số thứ hai: **chiều của ly** (úp hay ngửa).

Chiều bị ràng buộc **đúng 1 ly úp trong 3 ly** — không phải mỗi ô tung đồng xu riêng. Ràng buộc này giữ cho luật loại trừ còn tác dụng: đặt đúng một ly úp rồi thì hai ô còn lại chắc chắn ngửa.

Ý tưởng gốc từ người dùng: *"ly ở dưới bàn là ly úp thì muốn đặt đúng thì phải úp ly"* — mỗi ô trên bàn cần đúng cả loại ly lẫn chiều úp/ngửa của nó.

## 2. Quyết định thiết kế đã chốt (qua hỏi-đáp)

| Câu hỏi | Quyết định |
|---|---|
| Chiều có được tiết lộ trước không? | **Không** — ẩn hoàn toàn, phải thử-sai như màu ly, không có gợi ý thị giác nào. |
| Áp dụng ở đâu? | **Round mới riêng** (round 8), không đụng tới round 1–4 hiện có. |
| Vị trí trong chuỗi? | **Sau cùng** — sau khi hoàn thành cả 3 round hoán đổi (5–7). Đây là thử thách cuối. |
| Cách lật ly? | **Nút/biểu tượng lật riêng** (⟲) cạnh ly đang chọn trong khay. |
| Phản hồi khi đúng ly, đúng ô, sai chiều? | **Gộp chung thành SAI** — không phân biệt lý do sai (giữ đúng tinh thần "SAI không tiết lộ gì thêm" của round 1–4). |
| Có kết hợp Đặt đôi (2 ly/lượt) không? | **Không** — giữ đơn giản, 1 ly/lượt, để không dồn hai độ khó mới cùng lúc. |
| Số ly / kích thước bàn | **3 ly** (palette A–C) — bàn nhỏ nhất, vì cơ chế mới đã đủ tải. Mỗi lần thử giờ kiểm hai thứ nên số lượt tăng nhanh theo số ly (xem mục 3.3). |
| Số ly úp | **Đúng 1 úp + 2 ngửa**, cố định. Không phải tung đồng xu độc lập từng ô. |
| Có nói trước "đúng 1 ly úp" không? | **Có** — ghi rõ trong màn giới thiệu round. Đây là *luật của round*, không phải gợi ý về lời giải cụ thể. |
| Phím tắt lật chiều | `↑` = đặt chiều ngửa, `↓` = đặt chiều úp (set trực tiếp, không phải toggle). |

## 3. Kiến trúc

### 3.1 Data model (`game.js`)

Thêm hằng số kịch bản thứ ba:

```js
export const MODE_FLIP = 'FLIP';   // round 8: đặt ly đúng cả loại lẫn chiều
```

Theo đúng khuôn mẫu `SWAP_ROUNDS` đã có (round → số ly), thêm:

```js
const FLIP_ROUNDS = { 8: 3 };   // round → số ly, giống hệt shape của SWAP_ROUNDS
const FLIP_UPSIDE_DOWN = 1;     // số ly úp trong lời giải, cố định
```

`roundMode()` và `roundSize()` kiểm tra `FLIP_ROUNDS` trước, rồi mới tới `SWAP_ROUNDS`, cuối cùng rơi về công thức PLACE mặc định — cùng cấu trúc `??`-chain đang dùng, chỉ thêm một tầng.

`TOTAL_ROUNDS` tăng 7 → 8.

`createRound(8, rng)` trả về state có thêm trường mới:

```js
{
  round: 8,
  mode: MODE_FLIP,
  size: 3,
  palette: ['A','B','C'],
  solution: [...],          // hoán vị 3 ly — giống hệt cơ chế round đặt ly
  orientation: [...],       // MỚI: mảng 3 phần tử 'UP' | 'DOWN', ĐÚNG 1 phần tử 'UP'
  board: Array(3 ô trống),  // { status: SLOT_EMPTY, cup: null } — giống PLACE
  available: Set(palette),
  upLeft: 1,                // MỚI: số ly úp chưa đặt, để UI hiện bộ đếm
  attempts: 0,
  canDouble: false,
  cleared: false,
}
```

`orientation` **không phải tung đồng xu độc lập từng ô** — nó có đúng `FLIP_UPSIDE_DOWN` phần tử `'UP'`, vị trí ngẫu nhiên. Sinh bằng cách chọn ngẫu nhiên 1 chỉ số trong 3, không phải `rng() < 0.5` cho từng ô.

Không gian lời giải: `3! × C(3,1) = 6 × 3 =` **18 tổ hợp**.

> **Vì sao ràng buộc số ly úp thay vì tung đồng xu.** Với chiều độc lập từng ô, chiều không phải tài nguyên dùng chung nên **không loại trừ được** — biết ô 1 úp không nói gì về ô 2. Mô phỏng bản đầu (6 ly, đồng xu độc lập) cho thấy người chơi "dò cạn" và người chơi "biết suy luận loại trừ" tốn **y hệt nhau: 24.0 lần đặt**. Phần suy luận — kỹ năng cốt lõi của game — bị vô hiệu hoàn toàn. Ràng buộc "đúng 1 úp" khôi phục điều đó.

### 3.2 Phán xử (`judge()`)

`judge(round, placements)` hiện nhận `placements: [{ slot, cup }]`. Với `MODE_FLIP`, mỗi placement cần thêm `orientation: 'UP' | 'DOWN'`.

```js
function isCorrect(round, { slot, cup, orientation }) {
  const cupMatch = round.solution[slot] === cup;
  if (round.mode !== MODE_FLIP) return cupMatch;
  return cupMatch && round.orientation[slot] === orientation;
}
```

Không thêm verdict thứ ba — `ONE`/`NO` như cũ, đúng theo quyết định "gộp chung thành SAI". `round.board[slot]` khi khóa (ONE) cần lưu luôn `orientation` đã đặt (để UI vẽ đúng chiều vĩnh viễn):

```js
round.board[slot] = { status: SLOT_LOCKED, cup, orientation };
```

Các round khác (`MODE_PLACE`, `MODE_SWAP`) không có trường `orientation` trong board — giữ nguyên shape cũ, không phá test hiện có.

### 3.3 Độ khó & `optimalAverage`

**Đã đo bằng mô phỏng** (200 000 ván, 3 ly / 1 úp):

| Lối chơi | TB lần đặt | Xấu nhất |
|---|---|---|
| Tối ưu (lọc dần 18 tổ hợp) | 6.8 | 11 |
| Thực tế (nhớ ly đã khóa + đếm ly úp còn lại) | **6.5** | 10 |
| Không biết luật "đúng 1 úp" | 7.0 | 10 |

Lấy `FLIP_OPTIMAL = { 3: 6.5 }` — con số của lối chơi thực tế, nhất quán với cách `SWAP_OPTIMAL` được đo.

So với các round hiện có:

| Round | Kịch bản | Số ly | TB |
|---|---|---|---|
| 1 | Đặt ly | 3 | 4.5 |
| 4 | Đặt ly | 6 | 13.5 |
| 5 | Hoán đổi | 3 | 2.9 |
| 7 | Hoán đổi | 6 | 5.7 |
| **8** | **Lật ly** | **3** | **6.5** |

Round 8 nặng hơn round 1 (cùng 3 ly) đúng 1.4× — hợp lý cho một cơ chế mới, và không vượt round 4 nên chuỗi độ khó không bị gãy.

> **Ô cuối vẫn miễn phí, khác với bản spec đầu.** Nhờ ràng buộc "đúng 1 úp": khi đã khóa 2 ô, ly còn lại và chiều còn lại đều xác định. Đây chính là thứ ràng buộc số ly úp mang lại.

> **Chênh lệch "biết luật" và "không biết luật" chỉ 0.5 lần đặt** (6.5 vs 7.0) — nhỏ, nhưng đủ để việc nói trước "đúng 1 ly úp" là có ích chứ không phải thông tin thừa. Quan trọng hơn: không nói thì người chơi không biết mình đang chơi luật gì, dễ tưởng chiều là ngẫu nhiên hoàn toàn.

### 3.4 UI (`ui.js`)

**Trạng thái mới cần thêm** vào `mountGame()`:
- `selectedOrientation` — chiều đang định đặt cho ly đang chọn (`'UP'` mặc định khi vừa chọn ly, đổi bằng nút lật hoặc phím mũi tên).

**Render ly trong khay**: khi ly đang được chọn (`selectedCup === cupId`), thêm:
- Nút nhỏ (⟲) hiện cạnh ly, bấm để đảo `selectedOrientation`.
- Hình ly trong khay xoay 180° khi `selectedOrientation === 'DOWN'` (feedback tức thì).

> ⚠️ **Lỗi trong bản spec đầu:** câu này từng ghi *"tái dùng transform đã có trong `renderHiddenCup()`"*. Hàm đó **không còn transform xoay nào** — đã bỏ khi thống nhất hình ly úp/ngửa (phiên 2026-09-15). Phải tự thêm `transform` mới.

**Render ly đã khóa trên bàn**: bọc `renderCup()` trong transform `rotate(180 ...)` nếu `slot.orientation === 'DOWN'`. Cân nhắc tách một hàm `renderCup(cupId, seed, { orientation })` thay vì viết hàm riêng, để tái dùng toàn bộ logic vẽ + fill offset hiện có.

**Ô trống**: giữ nguyên `renderHiddenCup()`, không đổi theo `mode`.

> ⚠️ **Lỗi trong bản spec đầu:** ô trống giờ vẽ ly **ngửa**, không phải úp (đổi ở phiên 2026-09-15 để thống nhất với ly trong khay). Rủi ro hiểu lầm vẫn còn nhưng đảo chiều: người chơi dễ tưởng ô trống đang gợi ý *"đặt ngửa"*. Màn giới thiệu round 8 phải nói rõ: *"Hình ly mờ ở ô trống chỉ là chỗ đặt — không phải gợi ý chiều."*

**Bộ đếm ly úp còn lại**: hiện ở đâu đó dễ thấy (cạnh bộ đếm lượt), ví dụ `🙃 Còn 1 ly úp`. Đây là thứ khiến luật loại trừ dùng được — không có nó thì người chơi phải tự đếm, và mục 3.3 cho thấy đó là khác biệt giữa 6.5 và 7.0 lần đặt.

**Bàn phím**: thêm xử lý `ArrowUp`/`ArrowDown` khi `game.active.mode === MODE_FLIP` và có ly đang chọn — set `selectedOrientation` trực tiếp (không toggle).

**Màn giới thiệu round 8**: tự kích hoạt trong `showRoundCleared()` giống cách round 5 (hoán đổi) và round 3 (Đặt đôi) đã làm — cần đoạn text mới giải thích luật lật ly, ví dụ tương tự các đoạn `entersSwap`/`unlocksDouble` hiện có.

### 3.5 Accessibility

`aria-label` của ly trong khay và ly đã khóa cần nêu rõ chiều: `"Ly A màu Đỏ, chiều ngửa"` / `"Ly A màu Đỏ, chiều úp, đã chốt"`. Không dựa riêng vào hình xoay — người dùng screen reader phải biết chiều qua text.

## 4. Testing

Theo đúng pattern test hiện có (`src/game.test.js`, chạy bằng `node`, không framework ngoài):

- `createRound(8)` sinh `orientation` có **đúng 1 phần tử `'UP'`** — test qua nhiều seed: `orientation.filter(o => o === 'UP').length === 1`, và vị trí ly úp phân bố đều qua 3 ô (không lệch về một ô nào).
- `judge()` với `MODE_FLIP`: đúng ly + đúng ô + sai chiều → `NO`; đúng cả ba → `ONE` và board lưu đúng `orientation`.
- Round 8 không có Đặt đôi: `canDouble(8) === false`.
- Chuỗi 8 round chạy hết, `TOTAL_ROUNDS = 8`, `roundMode(8) === MODE_FLIP`.
- `optimalAverage(8) === 6.5` (đã đo, xem mục 3.3 — không cần đo lại).
- **Ô cuối miễn phí**: khi đã khóa 2 ô, ly và chiều của ô thứ ba đều xác định — test rằng chơi tối ưu không bao giờ tốn quá 1 lần đặt cho ô cuối.

Smoke test UI (`test/smoke.mjs`, Playwright) cần thêm:
- Chọn ly, bấm nút lật, kiểm tra hình ly trong khay xoay.
- Đặt đúng ly sai chiều → nhận SAI, ô không khóa.
- Đặt đúng cả hai → ô khóa, ly hiển thị đúng chiều.
- Phím `↑`/`↓` đổi chiều đang chọn.
- Cập nhật số nút cheat nhảy round (7 → 8) và chuỗi giải-round-tự-động tới cuối game.
- Bộ đếm "còn N ly úp" giảm đúng khi khóa được một ly úp.

## 5. Cập nhật tài liệu

- `docs/rounds.md` — thêm round 8 vào mọi bảng (tổng quan, chi tiết kịch bản, thang sao).
- `docs/game-design.md` — mục 3 (cấu trúc round), mục về kịch bản mới (giống mục 6b đã viết cho hoán đổi).
- `README.md` — bảng round, số lượng test, phím tắt (`↑`/`↓` mới).

Ghi chú "ly G chưa dùng tới" ở `docs/rounds.md` và `src/game.js` **vẫn đúng** — round 8 chỉ dùng A–C.

## 6. Rủi ro / điểm cần cẩn thận khi triển khai

- ~~Không đoán `FLIP_OPTIMAL`~~ — **đã đo xong**: `6.5` cho 3 ly / 1 úp (mục 3.3). Nếu sau này đổi số ly hoặc số ly úp thì **phải đo lại**, đừng ngoại suy.
- **Không phá vỡ shape dữ liệu của `MODE_PLACE`/`MODE_SWAP`** — `orientation` chỉ xuất hiện trong state của `MODE_FLIP`, các round khác giữ nguyên contract cũ để không phải sửa lại toàn bộ test đã có.
- **Ô trống dùng chung `renderHiddenCup()`** — ly ở ô trống giờ vẽ **ngửa**, người chơi dễ tưởng đó là gợi ý "hãy đặt ngửa". Màn giới thiệu phải nói rõ đó chỉ là chỗ đặt.
- **Ràng buộc "đúng 1 úp" là trụ cột của thiết kế, không phải chi tiết phụ.** Bỏ nó đi (quay về tung đồng xu độc lập) thì suy luận loại trừ mất tác dụng hoàn toàn và số lượt tăng vọt — mục 3.1 và 3.3 giải thích vì sao.
- **Phím `↑`/`↓` không được xung đột** với hành vi cuộn trang mặc định của trình duyệt khi đang focus vào nút — cần `e.preventDefault()` giống cách `Enter`/`Space` đã xử lý trong overlay hiện tại.
