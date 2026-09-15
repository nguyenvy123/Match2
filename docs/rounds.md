# Kịch bản các round

Mô tả đầy đủ 8 round của Match 2. Mọi con số ở đây lấy từ `src/game.js` — nếu sửa `SWAP_ROUNDS`, `TOTAL_ROUNDS` hay `SWAP_OPTIMAL` thì phải cập nhật file này theo.

---

## 1. Tổng quan

| Round | Kịch bản | Số ô | Bộ ly | Số hoán vị | Luật mới |
|---|---|---|---|---|---|
| 1 | Đặt ly | 3 | A B C | 6 | Làm quen |
| 2 | Đặt ly | 4 | A B C D | 24 | — |
| 3 | Đặt ly | 5 | A B C D E | 120 | ⚡ **Đặt đôi bắt buộc** |
| 4 | Đặt ly | 6 | A B C D E F | 720 | Bàn đặt ly rộng nhất |
| 5 | 🔄 Hoán đổi | 3 | A B C | 6 | 🔄 **Đổi kịch bản** — bàn tập |
| 6 | 🔄 Hoán đổi | 5 | A B C D E | 120 | Bàn thật |
| 7 | 🔄 Hoán đổi | 6 | A B C D E F | 720 | Bàn hoán đổi lớn nhất |
| 8 | 🙃 Lật ly | 3 | A B C | 18 | 🙃 **Đổi kịch bản** — thử thách cuối |

Bộ ly **cộng dồn**: round sau giữ nguyên các màu cũ và thêm màu mới, nên người chơi quen mặt dần thay vì phải học lại bảng màu.

> **Ly G (Xanh lá)** hiện chưa round nào dùng tới — bàn rộng nhất chỉ còn 6 ô. Vẫn giữ trong `CUPS` để sẵn sàng nếu thêm bàn rộng hơn về sau.

**Không có thua.** Không giới hạn số lần thử — người chơi luôn giải được mọi round. Thử thách nằm ở chỗ **giải với ít lượt nhất**.

---

## 1b. Kịch bản lật ly (round 8)

Bàn trống như round 1–4, người chơi kéo ly từ khay vào ô. Khác biệt: mỗi ô cần đúng **cả loại ly lẫn chiều** — úp hay ngửa.

- Trong 3 ly có **đúng 1 ly úp**, hai ly còn lại ngửa. Không phải mỗi ô tung đồng xu riêng.
- Chọn ly rồi bấm **⟲** (hoặc phím `↑` ngửa / `↓` úp) để đổi chiều trước khi đặt.
- Sai chiều cũng chỉ nhận **SAI** — quản trò không nói bạn sai vì ly hay vì chiều.
- Bộ đếm dưới khay theo dõi số ly úp còn lại.

Không gian lời giải: `3! × C(3,1) = 18` tổ hợp.

### Vì sao ràng buộc "đúng 1 ly úp"

Nếu chiều tung đồng xu độc lập từng ô thì nó **không phải tài nguyên dùng chung**, và luật loại trừ mất tác dụng hoàn toàn — biết ô 1 úp không nói gì về ô 2. Mô phỏng bản thiết kế đầu (6 ly, đồng xu độc lập) cho thấy người chơi dò cạn và người chơi biết suy luận tốn **y hệt nhau: 24.0 lần đặt**.

Với "đúng 1 úp": đặt được ly úp rồi thì các ô còn lại chắc chắn ngửa, và **ô cuối lại miễn phí** như các round đặt ly khác.

### Độ khó

Đo bằng mô phỏng 200 000 ván:

| Lối chơi | TB lần đặt | Xấu nhất |
|---|---|---|
| Tối ưu (lọc dần 18 tổ hợp) | 6.8 | 11 |
| **Thực tế** (nhớ ly đã khóa + đếm ly úp) | **6.5** | 10 |
| Không biết luật "đúng 1 úp" | 7.0 | 10 |

Nặng hơn round 1 (cùng 3 ly, 4.5) đúng 1.4×, không vượt round 4 (13.5) nên chuỗi độ khó không gãy.

---

## 2. Ba kịch bản

|  | Round 1–4 · Đặt ly | Round 5–7 · Hoán đổi | Round 8 · Lật ly |
|---|---|---|---|
| Bàn khởi đầu | Trống | Đã đầy ly, thứ tự bị xáo | Trống |
| Khay dự phòng | Có | **Không** | Có |
| Thao tác | Lấy ly từ khay đặt vào ô | Đổi chỗ hai ly trên bàn | Đặt ly **kèm chọn chiều** |
| Khi nào quản trò trả lời | Ngay khi ly chạm bàn | Khi bấm **Kiểm tra** | Ngay khi ly chạm bàn |
| Nội dung phản hồi | "ĐÚNG" / "SAI" cho **từng ô** | **Số ly** đúng vị trí, không nói ly nào | "ĐÚNG" / "SAI" — sai ly hay sai chiều đều như nhau |
| Số ẩn số mỗi ô | 1 (loại ly) | 1 (loại ly) | **2** (loại ly + chiều) |
| Đơn vị đo | Số lần đặt ly | Số lượt kiểm tra | Số lần đặt ly |
| Lịch sử | **Không hiển thị** — phải tự nhớ | **Có bảng "Đã thử"** | **Không hiển thị** |

Ở cùng số ly, kịch bản hoán đổi **khó hơn hẳn**: mỗi lượt chỉ thu được một con số thay vì biết chính xác ô nào đúng. Đó là lý do số ly lùi lại ở round 5–7, và round 5 chỉ 3 ly để làm bàn tập.

---

## 3. Kịch bản đặt ly (round 1–4)

### Luật

```
1. Kéo một ly từ khay lên ô muốn đặt (hoặc bấm ly rồi bấm ô)
2. Quản trò trả lời NGAY cho đúng ô vừa đặt:
     ĐÚNG -> ly khóa cố định tại ô đó, bị gạch khỏi khay
     SAI  -> ly bay về khay, ô trở lại trống
3. Lặp lại cho tới khi khóa hết ô
```

Phản hồi **chỉ áp dụng cho ô vừa đặt**, không tiết lộ gì về các ô còn lại.

Vì số loại ly luôn bằng số ô, luật loại trừ là tuyệt đối: ly đã khóa ở ô này thì chắc chắn không ở ô khác. Khóa được n−1 ô thì ô cuối suy ra được, không cần đoán.

### Trí nhớ là kỹ năng cốt lõi

**Game không ghi lại những lần đoán sai.** Đặt ly A vào ô 1 và nhận "SAI" — thông tin đó biến mất khỏi màn hình ngay. Muốn dùng lại thì phải tự nhớ. Giao diện hiển thị **trạng thái hiện tại** (ô nào đã khóa, ly nào đã dùng) nhưng không hiển thị **lịch sử**.

### ⚡ Đặt đôi — từ round 3

Mở khi bàn có **từ 5 ô trở lên**, tức round 3 và 4. Đây là **luật bắt buộc của round**, không phải quyền chọn.

- Mỗi lượt phải đặt **2 ly vào 2 ô khác nhau**, hai ly phải **khác loại**.
- Phải chọn cả hai **trước khi biết bất kỳ kết quả nào** — không dò tuần tự được nữa.
- Nhận về 2 mẩu thông tin cùng lúc, đều phải ghi nhớ.
- Khi chỉ còn 1 ô chưa khóa thì lượt đó đặt 1 ly.

Ly đầu của cặp hiện ngay trên ô (mờ, nghiêng nhẹ = chưa chốt) và **kéo được sang ô khác** nếu đổi ý. Kéo ra ngoài bàn thì huỷ cả lượt.

### Chi tiết từng round

| Round | Ô | Đặt đôi | Ít nhất | Trung bình tối ưu | Xấu nhất |
|---|---|---|---|---|---|
| 1 | 3 | — | 3 | 4.5 | 6 |
| 2 | 4 | — | 4 | 7 | 10 |
| 3 | 5 | ⚡ bắt buộc | 5 | 10 | 15 |
| 4 | 6 | ⚡ bắt buộc | 6 | 13.5 | 21 |

- **Ít nhất** = đoán đúng ngay từ lần đầu ở mọi ô (n lần đặt).
- **Trung bình tối ưu** = người nhớ hoàn hảo: ô còn k ứng viên tốn trung bình (k+1)/2 lần, ô cuối chỉ tốn 1 lần để khóa.
- **Xấu nhất** = dò cạn từng ô, n(n+1)/2 lần.

---

## 4. Kịch bản hoán đổi (round 5–7)

### Luật

```
1. Bấm hai ô (hoặc kéo ly từ ô này sang ô khác) để đổi chỗ hai ly
2. Đổi bao nhiêu lần cũng được — KHÔNG tốn lượt
3. Khi thấy ưng ý, bấm KIỂM TRA
4. Quản trò đếm và nói SỐ LY đúng vị trí, ví dụ "2/5"
5. Lặp lại cho đến khi đạt n/n
```

Quản trò **không** chỉ ra ly nào đúng, chỉ nói có bao nhiêu ly đúng chỗ.

Thông tin nằm ở **mức thay đổi của con số** giữa các lượt, không phải bản thân con số:

```
Lượt 1:  C B E A D  ->  1/5     có 1 ly đúng chỗ, nhưng ly nào?
Lượt 2:  B C E A D  ->  1/5     đổi C↔B, vẫn 1 → cả hai đều sai chỗ
Lượt 3:  B C E D A  ->  3/5     đổi A↔D, tăng 2 → cả hai vừa về đúng chỗ
```

Vì vậy bảng **"Đã thử"** là bắt buộc ở kịch bản này — không thấy lại các lượt trước thì không suy luận được gì, chỉ còn dò mò thuần. Đây là điểm khác hẳn round 1–4, nơi việc không ghi lại lịch sử chính là thử thách.

**Lặp lại một cách xếp đã thử sẽ bị từ chối** và không tốn lượt — nước đi đó không mang lại thông tin mới.

### Cách xếp ban đầu

Bàn không bao giờ khởi đầu ở trạng thái đã giải sẵn hoặc gần giải. `startingArrangement()` loại bỏ hai trường hợp hỏng ván:

- **Trùng y hệt lời giải** → thắng ngay khi chưa chơi.
- **Đúng quá nửa số ly** (> ⌊n/2⌋) → gần như xong từ đầu.

Trong vùng còn lại, số ly đúng sẵn phân bố như sau (tính chính xác bằng tổ hợp, không phải ước lượng):

| Round | Ly | 0 đúng | 1 đúng | 2 đúng | 3 đúng |
|---|---|---|---|---|---|
| 5 | 3 | 40.0% | 60.0% | — | — |
| 6 | 5 | 40.4% | 41.3% | 18.3% | — |
| 7 | 6 | 37.6% | 37.5% | 19.2% | 5.7% |

Nói cách khác: bấm Kiểm tra ngay khi vừa vào round thì khoảng **6 trong 10 lần sẽ có ít nhất 1 ly đúng sẵn** — không phải luôn luôn bằng 0.

### Round 5 là bàn tập

Round 5 chỉ 3 ly, và màn chuyển round trước đó giải thích toàn bộ luật mới. Lý do: phản hồi ở kịch bản này chỉ là một con số, khó hơn hẳn kịch bản đặt ly — ném thẳng người chơi vào bàn 5 ly là quá dốc.

Với 3 ly chỉ có 6 hoán vị, người chơi nắm được cơ chế "đổi chỗ rồi đọc chênh lệch con số" trong vài lượt.

### Chi tiết từng round

| Round | Ly | Hoán vị | Trung bình tối ưu |
|---|---|---|---|
| 5 | 3 | 6 | 2.9 |
| 6 | 5 | 120 | 4.7 |
| 7 | 6 | 720 | 5.7 |

Trung bình tối ưu đo bằng mô phỏng người chơi lọc dần tập hoán vị còn khả dĩ sau mỗi phản hồi (chiến thuật kiểu Knuth).

**Bàn tập 3 ly là ngoại lệ có chủ đích:** mô phỏng cho 2.8, nhưng con số đó khiến ván 2 lượt chỉ được 4 sao và ván 4 lượt rơi thẳng từ 3 sao xuống 1 sao. Nới lên 2.9 để thang sao mượt — xem chú thích tại `SWAP_OPTIMAL` trong `src/game.js`.

Ở hai bàn thật, người chơi thật cần khoảng 20 / 31 lượt, tức 4–5× mức tối ưu. Khoảng cách đó chính là biên độ kỹ năng.

---

## 5. Chấm điểm và xếp sao

**Điểm** = số lần đặt ly (round 1–4) + số lượt kiểm tra (round 5–7). Thấp hơn là tốt hơn.

**Sao** chấm theo tỉ lệ so với trung bình tối ưu của chính round đó, không phải con số cố định:

| Tỉ lệ (điểm ÷ tối ưu) | Sao | Nhãn |
|---|---|---|
| ≤ 0.70 | ⭐⭐⭐⭐⭐ | Hoàn hảo |
| ≤ 0.88 | ⭐⭐⭐⭐ | Xuất sắc |
| ≤ 1.12 | ⭐⭐⭐ | Giỏi |
| ≤ 1.40 | ⭐⭐ | Khá |
| > 1.40 | ⭐ | Cần luyện thêm |

Ngưỡng 5 sao đặt ở 0.70 chứ không chặt hơn: ván hoàn hảo của round 1 tốn 3 lần đặt trên trung bình 4.5, tức tỉ lệ 0.667 — ngưỡng chặt hơn sẽ khiến ván hoàn hảo tuyệt đối không bao giờ đạt 5 sao.

### Số lượt cần để đạt từng mức sao

| Round | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
|---|---|---|---|---|---|
| 1 (3 ô) | ≤ 3 | — | 4–5 | 6 | ≥ 7 |
| 2 (4 ô) | ≤ 4 | 5–6 | 7 | 8–9 | ≥ 10 |
| 3 (5 ô) | ≤ 7 | 8 | 9–11 | 12–14 | ≥ 15 |
| 4 (6 ô) | ≤ 9 | 10–11 | 12–15 | 16–18 | ≥ 19 |
| 5 (3 ly) | ≤ 2 | — | 3 | 4 | ≥ 5 |
| 6 (5 ly) | ≤ 3 | 4 | 5 | 6 | ≥ 7 |
| 7 (6 ly) | ≤ 3 | 4–5 | 6 | 7 | ≥ 8 |

Ở bàn nhỏ, số lượt là số nguyên mà các mức sao lại chia theo tỉ lệ, nên một vài mức sao không có lượt nào rơi vào (ô "—"). Đây là hệ quả tất yếu của n nhỏ, không phải lỗi.

**Xếp hạng chung cuộc** so tổng điểm cả ván với tổng trung bình tối ưu của 7 round, dùng cùng thang tỉ lệ trên.

---

## 6. Điều khiển

- **Kéo thả** — kéo ly từ khay lên ô, hoặc kéo ly giữa hai ô ở kịch bản hoán đổi. Chạy được cả chuột lẫn cảm ứng.
- **Bấm chọn** — bấm ly → bấm ô. Dùng song song được.
- **Bàn phím** — `A`–`F` chọn ly · `1`–`6` chọn ô · `Enter` kiểm tra (kịch bản hoán đổi) · `Esc` huỷ · `R` chơi lại ván · `Shift`+`C` mở bảng cheat.
- **Chơi lại ván** — dựng lại round đang chơi với **lời giải mới**, bộ đếm về 0; các round đã xong giữ nguyên điểm. Lời giải phải xáo mới, vì giữ nguyên thì người chơi nhớ hết các ly đã trượt rồi reset để xoá bộ đếm, lách được toàn bộ thử thách trí nhớ.

---

## Xem thêm

- [game-design.md](game-design.md) — luật chi tiết, máy trạng thái, cân bằng
- [art-style.md](art-style.md) — bảng màu, ngôn ngữ nét vẽ, chuyển động
