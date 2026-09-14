# Round 8 — "🙃 Lật ly": thiết kế

**Ngày:** 2026-09-14
**Trạng thái:** Đã duyệt bởi người dùng qua chat, chờ viết plan triển khai.

## 1. Bối cảnh

Match 2 hiện có 7 round, hai kịch bản (xem [docs/rounds.md](../../rounds.md)):

- Round 1–4: **đặt ly** — kéo ly từ khay vào ô, phản hồi ĐÚNG/SAI tức thì cho từng ô.
- Round 5–7: **hoán đổi** — bàn đầy sẵn ly bị xáo, đổi chỗ rồi bấm Kiểm tra, chỉ biết số lượng đúng.

Cả hai kịch bản đều chỉ có **một** ẩn số mỗi ô: loại ly nào nằm ở đó. Round 8 thêm ẩn số thứ hai: **chiều của ly** (úp hay ngửa), độc lập với loại ly.

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
| Số ly / kích thước bàn | **6 ly** (bằng round 4, dùng palette A–F hiện có) — không cộng dồn "bàn lớn hơn" với "cơ chế mới" cùng lúc. Ly G tiếp tục chưa dùng tới (đã ghi chú ở `SWAP_ROUNDS` và docs/rounds.md). |
| Phím tắt lật chiều | `↑` = đặt chiều ngửa, `↓` = đặt chiều úp (set trực tiếp, không phải toggle). |

## 3. Kiến trúc

### 3.1 Data model (`game.js`)

Thêm hằng số kịch bản thứ ba:

```js
export const MODE_FLIP = 'FLIP';   // round 8: đặt ly đúng cả loại lẫn chiều
```

Theo đúng khuôn mẫu `SWAP_ROUNDS` đã có (round → số ly), thêm:

```js
const FLIP_ROUNDS = { 8: 6 };   // round → số ly, giống hệt shape của SWAP_ROUNDS
```

`roundMode()` và `roundSize()` kiểm tra `FLIP_ROUNDS` trước, rồi mới tới `SWAP_ROUNDS`, cuối cùng rơi về công thức PLACE mặc định — cùng cấu trúc `??`-chain đang dùng, chỉ thêm một tầng.

`TOTAL_ROUNDS` tăng 7 → 8.

`createRound(8, rng)` trả về state có thêm trường mới:

```js
{
  round: 8,
  mode: MODE_FLIP,
  size: 6,
  palette: ['A','B','C','D','E','F'],
  solution: [...],          // hoán vị 6 ly — giống hệt cơ chế round đặt ly
  orientation: [...],       // MỚI: mảng 6 phần tử 'UP' | 'DOWN', độc lập ngẫu nhiên mỗi ô
  board: Array(6 ô trống),  // { status: SLOT_EMPTY, cup: null } — giống PLACE
  available: Set(palette),
  attempts: 0,
  canDouble: false,
  cleared: false,
}
```

`orientation` là **độc lập ngẫu nhiên mỗi ô** (mỗi ô tung đồng xu riêng UP/DOWN), KHÔNG phải hoán vị — khác hẳn `solution` (là hoán vị, mỗi màu dùng đúng 1 lần). Đây là điểm cần nhấn mạnh trong code comment vì nó thay đổi hẳn công thức tính độ khó (xem mục 3.3).

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

Công thức hiện tại cho kịch bản đặt ly:

```js
for (i=0; i<n-1; i++) total += (n-i+1)/2;
total += 1;   // ô cuối miễn phí — suy luận loại trừ
```

Với round 8, **ô cuối không còn miễn phí**: dù biết chắc ly nào (loại trừ hết các ly khác), chiều vẫn còn 50/50 vì orientation không phải tài nguyên dùng chung. Công thức mới cần mô phỏng lại từ đầu (như cách `SWAP_OPTIMAL` được đo bằng mô phỏng người chơi tối ưu 300+ ván), KHÔNG suy ra từ công thức PLACE hiện có bằng cách nhân đôi đơn giản — vì cấu trúc loại trừ của ô cuối đã thay đổi về chất.

Việc này cần một hằng số mới `FLIP_OPTIMAL` (tương tự `SWAP_OPTIMAL`), đo bằng script mô phỏng viết riêng cho `MODE_FLIP`, chạy trước khi implement để có con số đúng — **không đoán số**.

### 3.4 UI (`ui.js`)

**Trạng thái mới cần thêm** vào `mountGame()`:
- `selectedOrientation` — chiều đang định đặt cho ly đang chọn (`'UP'` mặc định khi vừa chọn ly, đổi bằng nút lật hoặc phím mũi tên).

**Render ly trong khay**: khi ly đang được chọn (`selectedCup === cupId`), thêm:
- Nút nhỏ (⟲) hiện cạnh ly, bấm để đảo `selectedOrientation`.
- Hình ly trong khay xoay 180° khi `selectedOrientation === 'DOWN'` (feedback tức thì, tái dùng transform đã có trong `renderHiddenCup()`).

**Render ly đã khóa trên bàn**: bọc `renderCup()` trong transform `rotate(180 ...)` nếu `slot.orientation === 'DOWN'`. Cân nhắc tách một hàm `renderCup(cupId, seed, { orientation })` thay vì viết hàm riêng, để tái dùng toàn bộ logic vẽ + fill offset hiện có.

**Ô trống**: giữ nguyên `renderHiddenCup()` như đã xây (từ yêu cầu trước) — luôn vẽ ly úp trang trí, không đổi theo `mode`. Cần thêm một dòng trong màn giới thiệu luật round 8 nói rõ: *"Ly úp ở ô trống chỉ là hình trang trí — không phải gợi ý chiều thật."* để tránh hiểu lầm.

**Bàn phím**: thêm xử lý `ArrowUp`/`ArrowDown` khi `game.active.mode === MODE_FLIP` và có ly đang chọn — set `selectedOrientation` trực tiếp (không toggle).

**Màn giới thiệu round 8**: tự kích hoạt trong `showRoundCleared()` giống cách round 5 (hoán đổi) và round 3 (Đặt đôi) đã làm — cần đoạn text mới giải thích luật lật ly, ví dụ tương tự các đoạn `entersSwap`/`unlocksDouble` hiện có.

### 3.5 Accessibility

`aria-label` của ly trong khay và ly đã khóa cần nêu rõ chiều: `"Ly A màu Đỏ, chiều ngửa"` / `"Ly A màu Đỏ, chiều úp, đã chốt"`. Không dựa riêng vào hình xoay — người dùng screen reader phải biết chiều qua text.

## 4. Testing

Theo đúng pattern test hiện có (`src/game.test.js`, chạy bằng `node`, không framework ngoài):

- `createRound(8)` sinh `orientation` độc lập ngẫu nhiên (không phải hoán vị) — test phân phối UP/DOWN qua nhiều seed, không test "mỗi giá trị đúng 1 lần" như với `solution`.
- `judge()` với `MODE_FLIP`: đúng ly + đúng ô + sai chiều → `NO`; đúng cả ba → `ONE` và board lưu đúng `orientation`.
- Round 8 không có Đặt đôi: `canDouble(8) === false`.
- Chuỗi 8 round chạy hết, `TOTAL_ROUNDS = 8`, `roundMode(8) === MODE_FLIP`.
- Mô phỏng độ khó: viết script đo `FLIP_OPTIMAL` tương tự cách `SWAP_OPTIMAL` được đo (xem comment tại `SWAP_OPTIMAL` trong `game.js`), rồi test `optimalAverage(8)` khớp con số đo được.

Smoke test UI (`test/smoke.mjs`, Playwright) cần thêm:
- Chọn ly, bấm nút lật, kiểm tra hình ly trong khay xoay.
- Đặt đúng ly sai chiều → nhận SAI, ô không khóa.
- Đặt đúng cả hai → ô khóa, ly hiển thị đúng chiều.
- Phím `↑`/`↓` đổi chiều đang chọn.
- Cập nhật số nút cheat nhảy round (7 → 8) và chuỗi giải-round-tự-động tới cuối game.

## 5. Cập nhật tài liệu

- `docs/rounds.md` — thêm round 8 vào mọi bảng (tổng quan, chi tiết kịch bản, thang sao).
- `docs/game-design.md` — mục 3 (cấu trúc round), mục về kịch bản mới (giống mục 6b đã viết cho hoán đổi).
- `README.md` — bảng round, số lượng test, phím tắt (`↑`/`↓` mới).

## 6. Rủi ro / điểm cần cẩn thận khi triển khai

- **Không đoán `FLIP_OPTIMAL`** — phải đo bằng mô phỏng trước, đúng tinh thần dự án (xem cách `SWAP_OPTIMAL` và giá trị 2.9 của round 5 được quyết định ở phiên trước).
- **Không phá vỡ shape dữ liệu của `MODE_PLACE`/`MODE_SWAP`** — `orientation` chỉ xuất hiện trong state của `MODE_FLIP`, các round khác giữ nguyên contract cũ để không phải sửa lại toàn bộ test đã có.
- **Ô trống dùng chung `renderHiddenCup()`** — cần đảm bảo message hướng dẫn nói rõ đó không phải gợi ý, tránh người chơi hiểu lầm và khiếu nại "game lừa dối".
- **Phím `↑`/`↓` không được xung đột** với hành vi cuộn trang mặc định của trình duyệt khi đang focus vào nút — cần `e.preventDefault()` giống cách `Enter`/`Space` đã xử lý trong overlay hiện tại.
