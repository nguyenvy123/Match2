# MATCH 2 — Art Style Guide

> Tham chiếu gốc: `D:\Dowload\sketches-video-game-elements\69801-ODJKRV-653.jpg`
> Cập nhật: 2026-09-14 — thêm kéo thả, nhãn Đặt đôi bắt buộc

---

## 1. Định hướng thị giác

**Hand-drawn doodle / sketch** — mọi thứ trông như được vẽ tay bằng bút lông đen trên giấy trắng, rồi tô màu bằng bút dạ.

Đặc điểm nhận dạng từ ảnh tham chiếu:

| Đặc điểm | Mô tả |
|---|---|
| **Nét viền** | Đen tuyền `#000000`, dày, **độ dày không đều** — chỗ đậm chỗ nhạt như bút thật |
| **Đường nét** | Không thẳng hoàn hảo, hơi run tay, góc bo tròn mềm |
| **Màu fill** | Phẳng tuyệt đối, **không gradient**, không bóng đổ |
| **Fill tràn viền** | Màu tô hơi **lệch khỏi nét viền** 1–3px — như tô màu vội, chưa khớp mép |
| **Nền** | Trắng giấy `#FFFFFF`, sạch, không texture nặng |
| **Bóng đổ** | Không có. Độ sâu tạo bằng nét viền dày mỏng, không bằng shadow |
| **Chữ** | Viết tay in hoa, font Amatic SC |

> Nguyên tắc vàng: **không có gì hoàn hảo**. Hình tròn không tròn đều, hình vuông không vuông đều, đường thẳng hơi cong. Đó chính là linh hồn của style này.

---

## 2. Bảng màu

Trích trực tiếp từ ảnh tham chiếu bằng phân tích pixel.

### 2.1 Màu nền tảng

| Vai trò | Hex | Ghi chú |
|---|---|---|
| Nét viền | `#000000` | Đen tuyền, dùng cho mọi outline |
| Nền giấy | `#FFFFFF` | Trắng sạch |
| Nền phụ / panel | `#FAFAFA` | Trắng ngà, tách nhẹ khỏi nền chính |
| Xám nhạt | `#C5C5C5` | Phím WASD, bề mặt trung tính |
| Xám trung | `#ADADAD` | Viền trong, chi tiết phụ |
| Xám đậm | `#6C6C6C` | Joystick, chữ GAME OVER |
| Xám xanh | `#6C7385` | Khối tetris đã khóa |

### 2.2 Bảng màu ly (7 loại)

5 màu đầu lấy **nguyên xi** từ ảnh tham chiếu. 2 màu cuối (round 4–5) tôi chọn bổ sung theo đúng tông độ bão hòa và độ sáng của bộ gốc.

| Mã | Tên | Hex | Nguồn | Round |
|---|---|---|---|---|
| A | Đỏ | `#EE5742` | ✅ Tetris đỏ | 1 |
| B | Xanh dương | `#3C53A1` | ✅ Tetris xanh đậm | 1 |
| C | Vàng | `#F8D867` | ✅ Cúp, khung PAUSE | 1 |
| D | Xanh ngọc | `#6ACADA` | ✅ Màn Game Boy, tetris | 2 |
| E | Hồng | `#DB5CA1` | ✅ Tamagotchi | 3 |
| F | Cam | `#F2934A` | ➕ Bổ sung | 4 |
| G | Xanh lá | `#7FBF6A` | ➕ Bổ sung | 5 |

**Lý do đổi so với bản thiết kế trước:** tài liệu game-design ban đầu dùng emoji màu chuẩn (🟣 tím, 🟢 lá…). Bảng trên bám sát ảnh tham chiếu hơn — hồng Tamagotchi và xanh ngọc Game Boy là hai màu đặc trưng nhất của bộ art này, bỏ đi thì mất chất.

### 2.3 Màu phản hồi

| Trạng thái | Hex | Dùng cho |
|---|---|---|
| ĐÚNG | `#7FBF6A` | Chữ "ĐÚNG", khung ô đã chốt |
| SAI | `#EE5742` | Chữ "SAI", hiệu ứng rung |

### 2.4 Kiểm tra tương phản

Chữ trên thân ly dùng **mực đen là mặc định**; chỉ ly B (xanh dương đậm) dùng chữ trắng. Số liệu tính bằng công thức WCAG:

| Ly | Nền | Màu chữ | Tỉ lệ | Chuẩn |
|---|---|---|---|---|
| A Đỏ | `#EE5742` | đen | 6.08 : 1 | ✅ AA |
| B Xanh dương | `#3C53A1` | **trắng** | 7.13 : 1 | ✅ AAA |
| C Vàng | `#F8D867` | đen | 15.01 : 1 | ✅ AAA |
| D Xanh ngọc | `#6ACADA` | đen | 11.07 : 1 | ✅ AAA |
| E Hồng | `#DB5CA1` | đen | 6.06 : 1 | ✅ AA |
| F Cam | `#F2934A` | đen | 9.05 : 1 | ✅ AAA |
| G Xanh lá | `#7FBF6A` | đen | 9.56 : 1 | ✅ AAA |

> Chữ **trắng** trên ly A đỏ chỉ đạt **3.46 : 1** — dưới chuẩn AA. Đây là lỗi trong bản thảo đầu, đã sửa: đỏ và hồng đều phải dùng chữ đen. Có test tự động chặn tái phát trong `src/game.test.js`.

---

## 3. Typography

### 3.1 Font chính — Amatic SC

Ảnh gốc dùng **Amatic** (Vernon Adams). Bản hiện hành trên Google Fonts là **Amatic SC**, miễn phí, license SIL OFL.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&display=swap" rel="stylesheet">
```

```css
--font-display: 'Amatic SC', 'Comic Sans MS', cursive;
```

**Đặc tính:** hẹp ngang, cao, viết tay, **chỉ đẹp khi IN HOA**. Chữ thường trông yếu.

### 3.2 Quy tắc dùng

| Dùng cho | Kiểu |
|---|---|
| Tiêu đề game, khẩu lệnh ĐÚNG/SAI, nhãn ô, chữ trên ly | Amatic SC, `text-transform: uppercase`, `letter-spacing: 0.05em` |
| Số đếm lượt, số liệu | Amatic SC Bold |
| Đoạn văn dài (luật chơi, hướng dẫn) | **Không dùng Amatic** — dễ mỏi mắt. Dùng font hệ thống sans-serif |

```css
--font-body: system-ui, -apple-system, 'Segoe UI', sans-serif;
```

Amatic hẹp ngang nên cần **cỡ chữ lớn hơn bình thường ~1.4×** để đọc thoải mái.

### 3.3 Thang cỡ chữ

```css
--text-title:  clamp(2.5rem, 1.5rem + 5vw, 5rem);     /* MATCH 2 */
--text-verdict: clamp(2rem, 1.2rem + 4vw, 4rem);      /* "ĐÚNG" / "SAI" */
--text-round:  clamp(1.5rem, 1rem + 2.5vw, 2.5rem);   /* ROUND 3 / 5 */
--text-label:  clamp(1.1rem, 0.9rem + 1vw, 1.5rem);   /* Nhãn ô, chữ trên ly */
--text-body:   1rem;                                   /* Văn bản thường */
```

---

## 4. Ngôn ngữ nét vẽ

Đây là phần quyết định game trông "vẽ tay thật" hay "vẽ tay giả".

### 4.1 Độ dày viền

```css
--stroke-heavy:  4px;   /* Viền ngoài ly, ô trên bàn */
--stroke-normal: 3px;   /* Viền panel, khung */
--stroke-light:  2px;   /* Chi tiết trong, đường gạch */
```

Ở SVG, dùng `stroke-linecap: round` và `stroke-linejoin: round` — bút thật không cho góc nhọn sắc.

### 4.2 Ba kỹ thuật tạo cảm giác vẽ tay

**① Viền không đều — dùng SVG path thay vì `border`**

`border: 4px solid black` trông như máy vẽ. Thay bằng path có toạ độ lệch nhẹ:

```html
<!-- Hình chữ nhật "vẽ tay" -->
<svg viewBox="0 0 100 120">
  <path d="M 4,6 L 96,3 L 97,115 L 3,117 Z"
        fill="#EE5742" stroke="#000" stroke-width="4"
        stroke-linejoin="round"/>
</svg>
```

Mỗi góc lệch 1–4 đơn vị khỏi vị trí "đúng". Đó là toàn bộ bí quyết.

**② Fill tràn lệch khỏi viền**

Trong ảnh gốc, mảng màu không nằm khít trong nét viền mà lệch ra 1–3px. Tái tạo bằng 2 lớp:

```html
<svg viewBox="0 0 100 120">
  <!-- Lớp màu, dịch lệch -->
  <path d="M 6,4 L 98,5 L 95,113 L 5,115 Z" fill="#EE5742" transform="translate(2,-1)"/>
  <!-- Lớp viền, vẽ đè lên -->
  <path d="M 4,6 L 96,3 L 97,115 L 3,117 Z" fill="none" stroke="#000" stroke-width="4"/>
</svg>
```

**③ Biến thể nét cho mỗi instance**

7 chiếc ly không được giống hệt nhau về hình dáng viền. Sinh 3–4 biến thể path, gán xoay vòng:

```js
const CUP_PATHS = [
  "M 12,8 L 88,6 L 82,110 L 18,112 Z",   // biến thể 1
  "M 10,7 L 90,9 L 84,111 L 16,109 Z",   // biến thể 2
  "M 13,6 L 87,8 L 81,113 L 19,110 Z",   // biến thể 3
];
const cupPath = CUP_PATHS[cupIndex % CUP_PATHS.length];
```

Thêm xoay rất nhẹ để phá đều đặn:

```css
.cup:nth-child(3n)   { transform: rotate(-1.2deg); }
.cup:nth-child(3n+1) { transform: rotate(0.8deg); }
.cup:nth-child(3n+2) { transform: rotate(-0.4deg); }
```

### 4.3 Texture giấy (tuỳ chọn, rất nhẹ)

Nếu nền trắng trơn thấy trống, thêm hạt giấy cực nhẹ bằng SVG filter — **không dùng ảnh texture** (nặng, không co giãn):

```css
.paper-grain::before {
  content: '';
  position: absolute; inset: 0;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

Opacity tối đa `0.04`. Cao hơn là bẩn màn hình.

---

## 5. Thiết kế các thành phần

### 5.1 Chiếc ly

Hình dáng: **cốc hình thang** — miệng rộng ngửa lên trên, thành thu dần xuống, đáy hẹp đặt trên bàn. Nhìn từ ngang, không phối cảnh 3D. Không có cuống, không có chân đế.

```
 ╭───────────╮        <- vành miệng, cong nhẹ xuống
 ├───────────┤        <- nét vành trong
 │           │
  ╲         ╱         <- chỉ màu, không chữ
   ╲       ╱
    ╰─────╯           <- đáy hẹp, hơi vồng xuống
```

**Ly thật và chỗ trống dùng chung hình này** — xem mục 5.1b. Đó cũng là lý do bỏ cuống và chân đế: hình càng đơn giản thì càng dễ nhận ra hai thứ là cùng một loại cốc.

**Vẽ thành MỘT path liền.** Nét vành miệng là path phụ, vẽ mảnh hơn (`2.4px` so với `4px` của viền ngoài).

**Yêu cầu:**
- **Không in chữ cái lên ly** — người chơi phân biệt hoàn toàn bằng màu. Tên màu nằm trong `aria-label` cho trình đọc màn hình.

> **Đánh đổi đã biết:** bỏ chữ cái làm mất cơ chế hỗ trợ người mù màu. Cặp Đỏ `#EE5742` và Xanh lá `#7FBF6A` gần như trùng nhau với người mù màu đỏ-lục (khoảng 8% nam giới). Có test tự động (`game.test.js`) đảm bảo mọi cặp màu cách nhau ≥100 đơn vị trong không gian màu có trọng số, nhưng đó chỉ là ngưỡng cho mắt bình thường. Nếu sau này muốn khôi phục khả năng tiếp cận: thêm hoa văn (chấm/sọc/lưới) lên thân ly thay vì chữ cái.
- Màu chữ: đen `#000000` cho mọi ly, **trừ** ly B xanh dương đậm dùng trắng `#FFFFFF` (xem mục 2.4)
- Kích thước: `88 × 110` đơn vị SVG, hiển thị `clamp(64px, 9vw, 96px)`

### 5.1b Chỗ trống chờ đặt ly (ô chưa có ly)

Ô chưa có ly hiển thị **cùng hình cốc, cùng chiều ngửa** với ly thật — chỉ khác: nét đứt xám nhạt, không tô màu, không chữ cái.

```
 ╭ ─ ─ ─ ─ ─ ╮        <- vành miệng, nét đứt
 ├ ─ ─ ─ ─ ─ ┤
 │           │
  ╲         ╱          <- không màu, không chữ
   ╰ ─ ─ ─ ╯
```

**Phải cùng chiều với ly trong khay.** Vẽ ngược chiều (úp xuống) tuy đúng nghĩa "quản trò đã úp ly kín", nhưng người chơi nhìn vào thấy hai hình ngược nhau và không nhận ra chúng là cùng một loại cốc. Chỗ trống ngửa đọc ra ngay là "chỗ để đặt một chiếc ly vào".

Dùng chính `handCup()` trong `doodle.js`, chỉ đổi cách tô ở CSS (`.cup--hidden`).

### 5.2 Ô trên bàn

Ba trạng thái, phân biệt rõ bằng **nét vẽ**, không chỉ bằng màu:

**EMPTY** — khung nét đứt vẽ tay, nền trắng, số thứ tự mờ ở giữa
```css
stroke-dasharray: 9 6;   /* nét đứt không đều */
stroke: #ADADAD;
```

**TESTING** — khung nét liền đậm, ly đang nằm trong, chờ phán xử (< 200ms)

**LOCKED** — khung nét liền mảnh màu `#7FBF6A` (mờ `0.45`), ly nằm khít bên trong, kèm 2 nét gạch chéo nhỏ ở góc dưới trái như dấu đánh dấu tay.

**HELD** — đang giữ ly chờ ghép cặp (round 3–5): khung nét liền đậm `4px` màu mực, ly bên trong mờ `0.82` và nghiêng `-2.5°`. Cố ý **không** dùng màu xanh "đã chốt" để không lẫn với LOCKED. Kéo được sang ô khác.

Ô đã chốt nên có cảm giác "đóng dấu xong" — 2 nét gạch chéo mảnh ở góc như ký hiệu đánh dấu tay. **Không dùng icon ổ khóa** — chiếc ly nằm trong ô cùng khung xanh đã đủ nói lên trạng thái, thêm icon chỉ làm rối.

**Cố ý không hiển thị dấu vết đoán sai.** Ô trống trở lại hoàn toàn trắng sau khi nhận "SAI", không lưu lại chữ cái nào. Trí nhớ là kỹ năng cốt lõi của game — xem game-design.md mục 9.3.

### 5.3 Bảng phản hồi ĐÚNG / SAI

Đây là khoảnh khắc cảm xúc nhất của game. Làm theo mẫu biển **PAUSE** trong ảnh gốc: khung chữ nhật vẽ tay 2 lớp (viền vàng dày bao ngoài, viền đen bên trong), chữ in hoa lớn ở giữa.

```
╔═══════════════════════╗
║  ┌─────────────────┐  ║
║  │     Đ Ú N G     │  ║    <- Amatic SC, cỡ --text-verdict
║  └─────────────────┘  ║
╚═══════════════════════╝
```

Khẩu lệnh hiển thị bằng **tiếng Việt** — "ĐÚNG" / "SAI". Mã trạng thái trong code vẫn là `VERDICT_ONE` / `VERDICT_NO`, đây chỉ là nhãn ở lớp giao diện.

| Kết quả | Viền ngoài | Màu chữ |
|---|---|---|
| ĐÚNG | `#7FBF6A` | `#7FBF6A` |
| SAI | `#EE5742` | `#EE5742` |

Khi **Đặt đôi**, hiện hai bảng cạnh nhau, xuất hiện **đồng thời** — không lệch nhau, để giữ đúng cảm giác "một lượt".

### 5.4 Bộ ly dự phòng

Hàng ngang dưới bàn, các ly hơi nghiêng khác nhau như đang dựng trên kệ.

- **Khả dụng:** màu đầy, viền đen dày, hover thì nhấc lên `translateY(-6px)` + nghiêng thêm
- **Đã khóa:** `opacity: 0.3` + `filter: grayscale(0.7)`, thêm **nét gạch chéo vẽ tay** đè lên — giống gạch bỏ trong sổ tay. Vẫn nhìn thấy được để người chơi ghi nhớ bố cục.
- **Đang chọn:** nhấc cao hơn + viền đen dày `5px` + rung nhẹ liên tục

### 5.5 Nút bấm

Theo mẫu khung PAUSE: chữ nhật vẽ tay, fill vàng `#F8D867`, viền đen dày, chữ Amatic in hoa.

```
Hover  : dịch lên 2px, viền dày thêm 1px
Active : dịch xuống 1px, fill đậm hơn 8%
Disabled: opacity 0.4, con trỏ not-allowed
```

Không dùng `border-radius` đều — mỗi nút có góc bo hơi khác nhau qua SVG path.

**Biến thể `btn--small`** cho nút "Chơi lại ván" trên thanh trạng thái: cỡ chữ `0.82em`, màu `--grey-dark`, đậm lên `--ink` khi hover. Nút phụ trợ không được cạnh tranh thị giác với bàn chơi.

### 5.9 Kịch bản hoán đổi (round 5–7)

**Ô đã có ly, chưa chốt** (`data-status="FILLED"`) — khung nét **liền mảnh** màu xám thay vì nét đứt, vì ô không bao giờ trống ở kịch bản này. Hover thì viền chuyển đen dày.

**Ô đang chọn để đổi chỗ** (`data-picked`) — nhấc lên `translateY(-10px)`, ly nghiêng `-3.5°` và lắc rất nhẹ theo chu kỳ 1.4s, như đang cầm trên tay chờ đặt xuống.

**Bảng phán xử dạng số** — cùng khung biển PAUSE nhưng chữ lớn hơn `1.1×` vì con số là **toàn bộ** thông tin người chơi nhận được. Màu chữ: xanh khi đúng hết, đỏ khi 0, mực đen khi đúng một phần (đừng dùng đỏ cho kết quả một phần — nó không phải thất bại).

```
╔═══════════════════════╗
║  ┌─────────────────┐  ║
║  │      2 / 5      │  ║
║  │ LY ĐÚNG VỊ TRÍ  │  ║
║  └─────────────────┘  ║
╚═══════════════════════╝
```

**Bảng "Đã thử"** — danh sách các lượt đã kiểm tra, mỗi dòng gồm số lượt, dãy ly cỡ nhỏ (`.cup-chip` — ô màu viền mực, cao hơn rộng cho giống hình ly, không chữ), và kết quả `n/N`. Cuộn dọc trong khung cao tối đa `8.5rem`. Đây là thành phần **bắt buộc** của kịch bản này, không phải tiện ích thêm — xem game-design.md mục 6b.4.

### 5.9b Kịch bản lật ly (round 8)

**Ly úp** — vẽ bằng cách xoay `renderCup()` 180° quanh tâm (`rotate(180 w/2 h/2)`), thêm class `.cup--flipped`. Dùng chính hình ly thường chứ không vẽ hình riêng: đây là *cùng một chiếc ly*, chỉ khác chiều đặt.

**Ly đang chọn trong khay** xoay theo chiều sắp đặt — phản hồi tức thì để người chơi thấy mình sắp đặt úp hay ngửa trước khi thả.

**Thanh điều khiển** (`.flip-bar`) nằm dưới khay ly, gồm hai phần:

```
🙃 CÒN 1 LY ÚP        [ ⟲ ĐANG NGỬA ]
```

- **Bộ đếm** — số ly úp còn lại. Đây không phải tiện ích thêm mà là thứ khiến luật loại trừ dùng được; không có nó người chơi phải tự nhớ đã đặt mấy ly úp.
- **Nút lật** — nền vàng khi đang úp, nền giấy (`btn--ghost`) khi đang ngửa. Vô hiệu khi chưa chọn ly.

**Khi hết ly úp**, bộ đếm đổi thành "Hết ly úp — các ô còn lại đều ngửa".

`aria-label` của ly nêu rõ chiều: `"Ly màu Đỏ, sắp đặt chiều úp"` / `"Ly màu Vàng, chiều ngửa"`. Không dựa riêng vào hình xoay.

### 5.10 Panel

Khung vẽ tay nằm ở lớp riêng phía sau, nội dung ở lớp trên chia hai phần: vùng cuộn được và **hàng nút cố định ở đáy**. Để nút bên trong vùng cuộn thì với nội dung dài (bảng điểm cuối game) nút bị cuộn ra ngoài mép và trông như tràn khỏi viền.

Khung đo theo kích thước thật của panel, **đo lại liên tục qua vài frame đầu** cho tới khi số đo ổn định — chiều cao còn đổi sau lần đo đầu vì font Amatic SC tải qua mạng và animation vào vẫn đang chạy.

Khi focus nút hành động phải dùng `focus({ preventScroll: true })`, nếu không trình duyệt cuộn vùng nội dung xuống để nút vào tầm nhìn và đẩy tiêu đề lên trên khỏi khung.

Panel nội dung ngắn (hộp xác nhận) dùng `.panel--compact` với `max-width: 440px` để không trông rỗng.

### 5.6 Nhãn chế độ Đặt đôi

Từ round 3, Đặt đôi là **bắt buộc** nên đây chỉ là nhãn báo trạng thái, không phải công tắc bấm được. Tia chớp ⚡ vẽ doodle kèm chữ Amatic in hoa.

```
⚡ ĐẶT ĐÔI — BẮT BUỘC 2 LY MỖI LƯỢT     <- khi còn ≥2 ô trống
⚡ Ô CUỐI — ĐẶT 1 LY                    <- khi chỉ còn 1 ô
```

Round 1–2 ẩn hoàn toàn, không hiện dạng disabled (tránh gây tò mò vô ích).

### 5.7 Kéo thả

Lối tương tác chính. Dùng Pointer Events để chạy cả chuột lẫn cảm ứng.

**Ly đang kéo** — bản sao bám theo con trỏ, nghiêng `-4°`, có bóng đổ cứng (`drop-shadow` offset, không blur mềm) để tách khỏi nền. Ly gốc trong khay mờ còn `opacity: 0.25`.

**Ô đích khi rê tới** — viền chuyển nét liền đậm `4px` màu mực, ô nhấc lên `translateY(-5px) scale(1.04)`, dấu `?` bên trong đậm màu và phóng to `1.15`.

**Thả ra ngoài bàn** — ly biến mất, không đặt gì, không tính lần đặt.

**Kéo ly đang giữ giữa các ô** — ở round 3–5, ly đã đặt cho cặp thứ nhất nhấc lên kéo sang ô khác được. Thả ra ngoài bàn (hoặc về chính ô cũ) thì huỷ chờ cặp, ly về khay.

Ngưỡng phân biệt kéo với bấm là `6px` — di chuyển ít hơn thì coi như một cú bấm, nên lối bấm-chọn cũ vẫn dùng được song song.

Trong lúc kéo, `body` nhận `touch-action: none` và `user-select: none` để cử chỉ cảm ứng không cuộn trang.

### 5.8 Vùng chờ ghép cặp

Khi đã đặt ly đầu và đang chờ ly thứ hai, hiện chip dưới bàn:

Ly đã hiện ngay trên ô nên vùng này chỉ cần nhắc việc còn phải làm:

```
        CHỌN LY THỨ HAI CHO MỘT Ô KHÁC     [ HUỶ ]
```

Nút Huỷ dùng biến thể `btn--ghost` (nền giấy thay vì vàng).

**Ly đang giữ cũng bị vô hiệu trong khay** — mờ `0.34` nhưng **giữ nguyên màu** (không `grayscale` như ly đã chốt), vì nó chưa chốt, chỉ đang ở trên bàn. Không có phần này thì người chơi chọn lại chính ly đó làm ly thứ hai và lách được luật "hai ly phải khác loại".

---

## 6. Chuyển động

Motion phải khớp với style vẽ tay: **nảy, hơi quá đà, không mượt kiểu máy**.

### 6.1 Đường cong easing

```css
--ease-bounce: cubic-bezier(0.68, -0.55, 0.27, 1.55);  /* nảy, dùng cho đặt ly */
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);          /* dừng mềm, dùng cho UI */

--dur-instant: 120ms;   /* phản hồi phán xử */
--dur-fast:    200ms;
--dur-normal:  320ms;
```

### 6.2 Danh mục animation

| Sự kiện | Hiệu ứng | Thời lượng |
|---|---|---|
| Nhấc ly lên | Dịch lên 8px + nghiêng 3° + phóng to 1.05 | 200ms |
| Thả ly xuống ô | Rơi + **nảy 2 lần** nhỏ dần | 320ms `--ease-bounce` |
| Phán xử "ĐÚNG" | Ly **rơi vào ô** nảy 2 nhịp nhỏ dần, khung ô chuyển xanh, nét gạch chéo hiện ở góc | 400ms |
| Phán xử "SAI" | Ly **rung ngang** 4 lần biên độ giảm dần, rồi bay về bộ dự phòng | 450ms |
| Bảng phán xử | Bật vào từ scale 0.8 → 1.06 → 1.0, kèm xoay nhẹ ±2° | 300ms |
| Qua round | Các ly nhảy lên lần lượt như sóng, giãn cách 80ms | 800ms |

### 6.3 Rung "SAI" — chi tiết

```css
@keyframes shake-no {
  0%   { transform: translateX(0) rotate(0deg); }
  20%  { transform: translateX(-8px) rotate(-3deg); }
  40%  { transform: translateX(7px) rotate(2.5deg); }
  60%  { transform: translateX(-5px) rotate(-1.8deg); }
  80%  { transform: translateX(3px) rotate(1deg); }
  100% { transform: translateX(0) rotate(0deg); }
}
```

Kèm xoay, không chỉ dịch ngang — mới ra cảm giác "lắc đầu từ chối".

### 6.4 Tôn trọng reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Khi tắt motion, phản hồi ĐÚNG/SAI vẫn phải **rõ ràng bằng màu + chữ + nét gạch chéo** — không phụ thuộc vào animation để truyền đạt kết quả.

---

## 7. Bố cục & nhịp điệu

### 7.1 Thang khoảng cách

```css
--space-xs: 0.5rem;
--space-sm: 0.75rem;
--space-md: 1.25rem;
--space-lg: 2rem;
--space-xl: 3.5rem;
```

**Không dùng padding đều nhau ở mọi chỗ.** Bàn chơi cần khoảng thở rộng (`--space-xl`), bộ ly dự phòng chặt hơn (`--space-md`), tạo phân cấp thị giác.

### 7.2 Cấu trúc trang

Kịch bản **đặt ly** (round 1–4) dùng bố cục **hai hàng**: ly người chơi đặt nằm trên mặt bàn, ly quản trò giấu nằm dưới. Mỗi vị trí là một cặp dọc để đối chiếu trực tiếp.

```
┌────────────────────────────────────────────────┐
│  MATCH 2   Lần đặt: 7   [CHƠI LẠI VÁN]  [⚡]   │
├────────────────────────────────────────────────┤
│   ┌────┐   ┌────┐   ┌────┐   ┌────┐            │
│   │ 🟡 │   │ +  │   │ 🔴 │   │ +  │  <- bạn đặt│
│   └────┘   └────┘   └────┘   └────┘            │
│ ══════════════════════════════════════  <- BÀN │
│   ┌────┐   ┌────┐   ┌────┐   ┌────┐            │
│   │ ╌╌ │   │ ╌╌ │   │ ╌╌ │   │ ╌╌ │  <- ly ẩn │
│   └────┘   └────┘   └────┘   └────┘            │
│   Vị trí 1  Vị trí 2  Vị trí 3  Vị trí 4       │
│                                                │
│        ╔═════════════╗                         │
│        ║   "ĐÚNG"    ║                         │
│        ╚═════════════╝                         │
├────────────────────────────────────────────────┤
│  BỘ LY DỰ PHÒNG    ⚡ ĐẶT ĐÔI — BẮT BUỘC 2 LY  │
│    🔴   🔵   🟡   🟢                            │
└────────────────────────────────────────────────┘
```

Kịch bản **hoán đổi** (round 5–7) dùng **cùng bố cục hai hàng**: ly đang xếp nằm trên mặt bàn, ô ly ẩn của quản trò nằm dưới.

Khác biệt so với kịch bản đặt ly: phản hồi ở đây chỉ là con số `n/N`, **không nói ô nào đúng** — nên hàng dưới không lật từng ly được. Chỉ lật hết một lượt khi round hoàn thành, lúc đó mọi ô đều đúng nên không lộ thông tin gì thêm.

#### Mặt bàn

Dải ngang có độ dày thật (`handTableTop()` trong `doodle.js`): mép trên hơi vồng, mép dưới cong ngược lại một chút, để trông như tấm ván nhìn hơi chếch chứ không phải thanh chữ nhật phẳng. Nền `--paper-alt`, viền mực `4.5px`.

Chiều rộng bám theo `.table` chứ không phải khung cuộn — khi bàn rộng hơn màn hình (round 4 trên mobile), mặt bàn kéo dài hết bàn thay vì bị cắt ngang ở mép khung nhìn.

#### Ô trống ở hàng đặt ly

Hiện dấu `+` mờ làm gợi ý "đặt ly vào đây", đậm lên và phóng to khi hover. Ẩn đi khi ô đang có ly — kể cả ly tạm lúc báo Sai.

#### Ly ẩn ở hàng dưới

Không tương tác được (`pointer-events: none`).

**Khi đặt đúng, ly ẩn lật lên thành ly thật cùng màu** — hai hàng khớp nhau, xác nhận trực quan rằng đó đúng là chiếc ly quản trò giấu ở vị trí này. Khung ô cũng sáng dần sang xanh cùng nhịp.

**Đặt sai thì ly hàng dưới giữ nguyên nét đứt** — không có gì để lật, vì đó không phải ly đúng.

**Có độ trễ trước khi lật**, không lật ngay khi phán xử hiện ra:

```
0ms     Đặt ly → phán xử "ĐÚNG" hiện ra
620ms   Bắt đầu lật ly ở hàng dưới (REVEAL_DELAY_MS)
1320ms  Animation lật hoàn tất (REVEAL_ANIM_MS = 700ms)
```

Độ trễ này bắt buộc: lật ngay lập tức làm mất hẳn cảm giác "chờ quản trò xác nhận rồi mới lật ra". Khi đặt đôi cùng đúng cả hai, hai ly lật **so le nhau** (`REVEAL_STAGGER_MS = 260ms`) chứ không bật lên đồng thời.

**Không khoá tương tác trong lúc chờ lật** — người chơi đặt ly tiếp được ngay sau khi đọc phán xử (~380ms), animation lật chạy nền song song. Chỉ khi round vừa hoàn thành mới đợi lật xong hết rồi mới mở màn chuyển round, để không cắt animation giữa chừng.

**Lưu ý khi viết test tự động.** Độ trễ lật ly làm thời điểm mở màn chuyển round lùi lại: overlay chỉ hiện sau `max(wait, REVEAL_DELAY_MS + REVEAL_ANIM_MS)` = **1320ms** tính từ lượt cuối, không phải ngay khi phán xử vừa hiện. Test chờ overlay phải để timeout rộng (≥12s cho round nhiều lượt), nếu không sẽ gặp lỗi timeout ngắt quãng — pass hầu hết lần chạy nhưng thỉnh thoảng fail khi round cần nhiều lượt hơn bình thường.

**Không vẽ lại bảng phán xử khi không có gì đổi.** Trước đây, hàm mở khoá tương tác sau mỗi lượt gọi `renderAll()` — hàm này vẽ lại toàn bộ giao diện kể cả bảng "ĐÚNG"/"SAI" đang hiện, dù nội dung không đổi. `replaceChildren()` huỷ DOM cũ và tạo DOM mới, nên animation `verdict-pop` chạy lại từ đầu — bảng chữ trông như bị "reload" giữa lúc người chơi đang đọc. Sửa bằng cách chỉ vẽ lại phần cần cập nhật (bàn, khay dự phòng) sau mỗi lượt, không đụng tới bảng phán xử.

Hiệu ứng lật: `rotateX(-90deg) → 0` với `transform-origin: center bottom`, như đang nhấc ly lên cho xem. Hiện dần từ mờ, nảy nhẹ quá đà ở giữa chừng cho khớp tinh thần vẽ tay. Thời lượng animation (`700ms` trong CSS) phải khớp `REVEAL_ANIM_MS` trong `ui.js` — đổi một bên thì phải đổi bên kia.

### 7.3 Responsive

| Breakpoint | Xử lý |
|---|---|
| ≥ 1024px | Bàn ngang đầy đủ, ly cỡ 96px |
| 768–1023px | Ly co còn 80px, giảm khoảng cách |
| 480–767px | Ly 64px. Round 5 (7 ô) bàn **cuộn ngang** trong khung riêng |
| < 480px | Bộ ly dự phòng xuống 2 hàng, ly 56px |

Round 5 có 7 ô — trên màn hẹp bắt buộc cuộn ngang. Bàn chơi cuộn trong container riêng, **body không bao giờ cuộn ngang**.

---

## 8. Checklist triển khai

Trước khi coi phần art là xong:

- [ ] Không có `border` CSS nào cho hình dạng chính — tất cả dùng SVG path lệch tay
- [ ] Mỗi ly có ít nhất 3 biến thể path khác nhau
- [ ] Chỗ trống ở ô chưa có ly cùng hình và cùng chiều với ly trong khay
- [ ] Bố cục hai hàng đúng thứ tự: đặt ly → mặt bàn → ly ẩn
- [ ] Mặt bàn không bị cắt ngang khi bàn cuộn trên mobile
- [ ] Fill lệch khỏi viền 1–3px ở mọi thành phần chính
- [ ] Không có gradient, không có `box-shadow` mềm
- [ ] Amatic SC chỉ dùng cho chữ IN HOA ngắn; văn bản dài dùng font hệ thống
- [ ] Mọi cặp màu ly phân biệt được bằng mắt (test tự động kiểm khoảng cách màu)
- [ ] Round 8: ly úp xoay đúng 180°, bộ đếm ly úp cập nhật đúng
- [ ] Phản hồi ĐÚNG/SAI đọc được cả khi tắt animation
- [ ] Bàn chơi round 5 không làm body cuộn ngang trên mobile
- [ ] Kéo thả hoạt động trên cảm ứng, không cuộn trang khi đang kéo
- [ ] Ô trống không lưu lại dấu vết ly đã trượt
- [ ] Ly đang chờ ghép cặp hiện trên ô và kéo được sang ô khác
- [ ] Ly đang giữ bị vô hiệu trong khay
- [ ] Round 5–7: khay dự phòng ẩn hoàn toàn, bàn luôn đầy ly
- [ ] Bảng "Đã thử" hiện đủ lịch sử và cuộn được khi nhiều lượt
- [ ] Texture giấy (nếu dùng) opacity ≤ 0.04
- [ ] Kiểm tra ở 320 / 375 / 768 / 1024 / 1440 px

---

## 9. Những điều KHÔNG làm

Style này dễ hỏng. Tránh tuyệt đối:

| ❌ Không | Vì sao |
|---|---|
| Gradient trên ly | Phá cảm giác tô bút dạ phẳng |
| `box-shadow` mềm, blur | Style này tạo độ sâu bằng nét, không bằng bóng |
| Viền bo tròn đều hoàn hảo | Trông như máy vẽ, mất chất tay |
| Emoji thật làm icon | Lệch style hoàn toàn — phải vẽ doodle riêng |
| Font Amatic cho đoạn văn dài | Hẹp ngang, mỏi mắt |
| Nền tối / dark mode | Ảnh gốc là mực đen trên giấy trắng. Dark mode làm mất hẳn bản sắc |
| Nhiều hơn 7 màu ly | Bảng màu gốc chỉ có ngần ấy tông hài hoà |
| Animation mượt kiểu material | Cần nảy và hơi quá đà mới khớp nét vẽ tay |

---

## 10. Cập nhật cho `game-design.md`

Bảng màu ly ở mục 3 của tài liệu thiết kế cần đồng bộ theo mục 2.2 ở đây:

| Round | Bảng cũ | Bảng mới (theo art) |
|---|---|---|
| 1 | 🔴 🔵 🟡 | Đỏ `#EE5742`, Xanh dương `#3C53A1`, Vàng `#F8D867` |
| 2 | + 🟢 lá | + Xanh ngọc `#6ACADA` |
| 3 | + 🟣 tím | + Hồng `#DB5CA1` |
| 4 | + 🟠 cam | + Cam `#F2934A` |
| 5 | + 🟤 nâu | + Xanh lá `#7FBF6A` |

Mã `A`–`G` vẫn dùng nội bộ trong code làm định danh ly, nhưng **không hiển thị** lên giao diện.
