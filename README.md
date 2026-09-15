# Match 2

Trò chơi suy luận và trí nhớ. Bảy round, hai kịch bản: **đặt ly** rồi **hoán đổi**.

---

## Chạy game

```bash
npm start
```

Mở http://localhost:8123

Không cần build, không cần cài gì để chơi — game là HTML + ES modules thuần. `npm start` chỉ chạy một server tĩnh nhỏ vì ES modules không load được qua `file://`.

## Chạy test

```bash
npm test        # 35 test logic game, không cần trình duyệt
npm run test:ui # test giao diện bằng Chrome thật (cần server đang chạy)
```

`test:ui` cần `npm install` trước (Playwright) và dùng Chrome đã cài sẵn trên máy.

---

## Luật chơi

**Bộ ly dự phòng có đúng những ly mà quản trò đã giấu** — không thừa, không thiếu. Nên bài toán không phải "ly nào?" mà là "thứ tự nào?".

**Kéo** một ly từ khay lên ô muốn đặt (hoặc bấm ly rồi bấm ô). Quản trò trả lời ngay:

| | Nghĩa | Hệ quả |
|---|---|---|
| **ĐÚNG** | Đúng ly, đúng ô | Ly khóa cố định tại đó |
| **SAI** | Sai | Thử ly khác, hoặc mang ly đó sang ô khác |

Phản hồi chỉ áp dụng cho đúng ô vừa đặt, không tiết lộ gì về các ô còn lại.

### Bảy round, hai kịch bản

| Round | Kịch bản | Số ô | Hoán vị |
|---|---|---|---|
| 1–2 | Đặt ly | 3–4 | 6 · 24 |
| 3–4 | Đặt ly + ⚡ Đặt đôi | 5–6 | 120 · 720 |
| 5 | 🔄 Hoán đổi — bàn tập | 3 | 6 |
| 6–7 | 🔄 Hoán đổi | 5–6 | 120 · 720 |

Không có thua. Thử thách là **giải với ít lượt nhất**.

### 🔄 Kịch bản hoán đổi — round 5–7

Round 5 chỉ 3 ly: bàn tập để làm quen luật mới trước khi vào bàn thật. Phản hồi ở kịch bản này chỉ là một con số, khó hơn hẳn kịch bản đặt ly, nên ném thẳng người chơi vào bàn 5 ly là quá dốc.

Bàn đã đầy ly nhưng thứ tự bị xáo. Bạn **đổi chỗ** chúng (bao nhiêu lần cũng được, không tốn lượt) rồi bấm **Kiểm tra**. Quản trò chỉ nói **số ly đúng vị trí** — không nói ly nào.

```
Lượt 1:  C B E A D  ->  1/5     có 1 ly đúng chỗ, nhưng ly nào?
Lượt 2:  B C E A D  ->  1/5     đổi C↔B, vẫn 1 → cả hai đều sai chỗ
Lượt 3:  B C E D A  ->  3/5     đổi A↔D, tăng 2 → cả hai vừa về đúng chỗ
```

Thông tin nằm ở **mức thay đổi của con số** giữa các lượt, không phải bản thân con số. Bảng "Đã thử" ghi lại toàn bộ lịch sử để bạn so sánh — khác với round 1–4 nơi bạn phải tự nhớ.

Kịch bản này khó hơn hẳn ở cùng số ly, nên số ly lùi về 3–6: một bàn tập rồi hai bàn thật.

### Trí nhớ là kỹ năng cốt lõi

**Game không ghi lại những lần đoán sai.** Bạn đặt ly A vào ô 1 và nhận "SAI" — thông tin đó biến mất khỏi màn hình ngay lập tức. Muốn dùng lại thì phải tự nhớ.

Ở round 4 với 6 ô, số cặp ly–ô cần theo dõi lên tới 30. Ngưỡng trí nhớ làm việc của người bình thường là khoảng 7 mục, nên từ round 3 trở đi bạn buộc phải có chiến lược ghi nhớ nào đó.

Giao diện hiển thị **trạng thái hiện tại** (ô nào đã khóa, ly nào đã dùng) nhưng không hiển thị **lịch sử**. Bạn nhìn thấy bàn cờ, không nhìn thấy sổ tay.

### Đặt đôi bắt buộc

Từ round 3, **mỗi lượt phải đặt 2 ly vào 2 ô khác nhau**. Không phải quyền chọn mà là luật của round.

Bạn không thể dò từng ô tuần tự nữa — mỗi lượt phải cam kết hai phán đoán độc lập trước khi biết bất kỳ kết quả nào, và nhận về 2 mẩu thông tin cùng lúc cần ghi nhớ. Khi chỉ còn 1 ô chưa khóa thì lượt đó đặt 1 ly.

Ly đầu của cặp **hiện ngay trên ô** (mờ, nghiêng nhẹ = chưa chốt) và **kéo được sang ô khác** nếu bạn đổi ý. Kéo nó ra ngoài bàn thì huỷ cả lượt.

### Điều khiển

- **Kéo thả:** kéo ly từ khay lên ô. Chạy được cả chuột lẫn cảm ứng.
- **Bấm chọn:** bấm ly → bấm ô. Vẫn dùng được song song.
- **Bàn phím:** `A`–`F` chọn ly · `1`–`6` chọn ô · `Esc` huỷ · `R` chơi lại ván
- **Chơi lại ván:** nút ở góc trên phải dựng lại round đang chơi với lời giải mới, bộ đếm về 0. Các round đã xong giữ nguyên điểm. Lời giải được xáo mới — nếu giữ nguyên thì bạn nhớ hết các ly đã trượt rồi reset để xoá bộ đếm, lách được thử thách trí nhớ.

---

## Cấu trúc

```
index.html          điểm vào
server.js           dev server tĩnh
src/
  game.js           logic game thuần, không đụng DOM
  game.test.js      35 test cho logic
  doodle.js         sinh SVG path kiểu vẽ tay
  ui.js             render + xử lý tương tác
  style.css         stylesheet
test/
  smoke.mjs         test giao diện qua trình duyệt thật
docs/
  rounds.md         kịch bản từng round, thang sao
  game-design.md    luật, cân bằng, máy trạng thái
  art-style.md      bảng màu, ngôn ngữ nét vẽ, motion
```

`game.js` không import gì từ DOM — chơi được, test được, và port sang nền tảng khác được mà không đụng tới logic.

---

## Ghi chú thiết kế

**Bài toán là hoán vị.** Vì số loại ly luôn bằng số ô, luật loại trừ trở nên tuyệt đối: ly đã khóa ở ô này thì chắc chắn không ở ô khác. Khóa được n−1 ô thì ô cuối suy ra được mà không cần đoán.

**Giao diện cố ý không ghi nhớ giúp người chơi.** Ô trống trở lại hoàn toàn trắng sau khi nhận "SAI". Đây là lựa chọn thiết kế trung tâm — nó biến trí nhớ thành kỹ năng thật thay vì để suy luận làm tất cả.

Đánh đổi đã cân nhắc: thất bại có cảm giác "tại mình" nên tạo động lực chơi lại, nhưng gánh nặng nhận thức cao và người có khó khăn về trí nhớ bị thiệt rõ. Hướng mở là chế độ "có sổ tay" bật/tắt được — chưa làm.

**Xếp hạng so với tối ưu lý thuyết**, không phải con số cố định.

Round 1–4 (đặt ly): trung bình tối ưu 4.5 / 7 / 10 / 13.5 lần đặt — kiểm chứng bằng mô phỏng trong `game.test.js`. Đó là số của người nhớ hoàn hảo; người chơi thật sẽ cao hơn, và điều đó cố ý.

Round 5–7 (hoán đổi): tối ưu 2.9 / 4.7 / 5.7 lượt với chiến thuật lọc dần tập hoán vị. Bàn tập 3 ly lấy 2.9 thay vì 2.8 như mô phỏng thuần, để ván hoàn hảo 2 lượt được 5 sao và thang sao không có hố — xem chú thích ở `SWAP_OPTIMAL`. Ở hai bàn thật, người chơi cần ~20 / ~31 lượt, tức 4–5× mức tối ưu — khoảng cách đó chính là biên độ kỹ năng.

**Kéo thả dùng Pointer Events**, không dùng HTML5 drag-and-drop — cái đó không chạy trên cảm ứng. Ngưỡng 6px phân biệt kéo với bấm nên hai lối tương tác không xung đột.

**Art style hand-drawn.** Không dùng `border` CSS cho hình dạng chính — mọi khung, ly, nét đánh dấu đều là SVG path có toạ độ lệch tay, mỗi cái một seed riêng nên không cái nào giống cái nào. Lớp màu tô lệch khỏi viền 1–3px. Chi tiết ở [docs/art-style.md](docs/art-style.md).

Bảng màu trích trực tiếp từ ảnh tham chiếu bằng phân tích pixel. Ly phân biệt hoàn toàn bằng màu — không in chữ cái. Có test tự động đảm bảo mọi cặp màu cách nhau đủ xa để phân biệt bằng mắt.

**Hạn chế:** người mù màu đỏ-lục sẽ khó phân biệt ly Đỏ với ly Xanh lá. Nếu cần khắc phục, hướng đi là thêm hoa văn lên thân ly thay vì chữ cái.
