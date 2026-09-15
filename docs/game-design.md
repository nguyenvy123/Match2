# MATCH 2 — Tài liệu thiết kế game

> Trạng thái: Đã triển khai
> Cập nhật: 2026-09-14 — Đặt đôi bắt buộc, bỏ dấu vết đoán sai, thêm kéo-thả

---

## 1. Tổng quan

| Hạng mục | Giá trị |
|---|---|
| Tên | Match 2 |
| Thể loại | Suy luận logic (deduction), lượt chơi |
| Số người chơi | 1 (máy làm Quản trò) |
| Cấu trúc | 7 round, hai kịch bản nối tiếp |
| Thời lượng trọn game | 12–25 phút |
| Chỉ số đo | Số lần đặt ly (round 1–4) / số lượt kiểm tra (round 5–7) |

**Mục tiêu:** Người chơi phải tìm ra chính xác **loại ly** và **vị trí** của các chiếc ly bí mật mà Quản trò đã giấu úp kín trên bàn. Hoàn thành cả 7 round là thắng game.

---

## 2. Nguyên lý cốt lõi: bài toán hoán vị

Đây là điểm quan trọng nhất của thiết kế.

**Số loại ly trong bộ dự phòng luôn bằng đúng số ô trên bàn.**

Ví dụ round 1 có 3 ô, thì bộ dự phòng có đúng 3 loại: **A Đỏ**, **B Xanh dương**, **C Vàng**. Và lời giải bí mật cũng dùng đúng 3 ly đó, mỗi ly đúng một lần.

### Hệ quả

1. Người chơi **biết trước** những ly nào có mặt trong lời giải. Câu hỏi không còn là *"ly nào?"* mà là **"ly nào nằm ở ô nào?"**
2. Bài toán trở thành **tìm hoán vị đúng** — mỗi ly xuất hiện đúng 1 lần, mỗi ô chứa đúng 1 ly.
3. **Luật loại trừ trở nên tuyệt đối:** ly đã khóa ở ô này thì chắc chắn không nằm ở ô khác.
4. **Ô cuối cùng là quà tặng:** khi đã khóa được n−1 ô, ly còn lại chắc chắn thuộc ô cuối. Người chơi không cần đoán, chỉ cần đặt xuống.

> Điều này biến game từ "dò mò may rủi" thành **puzzle suy luận thực thụ** — người chơi giỏi sẽ dùng thông tin từ những lần "SAI" trước để thu hẹp dần các hoán vị còn khả dĩ.

---

## 3. Cấu trúc 7 round

Game có **hai kịch bản** nối tiếp nhau.

| | Round 1–4 · Đặt ly | Round 5–7 · Hoán đổi |
|---|---|---|
| Bàn khởi đầu | Trống | Đã đầy ly, thứ tự bị xáo |
| Thao tác | Lấy ly từ khay đặt vào ô | Đổi chỗ hai ly trên bàn |
| Khi nào quản trò trả lời | Ngay khi ly chạm bàn | Khi người chơi bấm **Kiểm tra** |
| Nội dung phản hồi | "ĐÚNG" / "SAI" cho **từng ô** | **Số ly** đúng vị trí, không nói ly nào |
| Đơn vị đo | Số lần đặt ly | Số lượt kiểm tra |

Kịch bản hoán đổi **khó hơn hẳn** ở cùng số ly, vì mỗi lượt chỉ thu được một con số thay vì biết chính xác ô nào đúng. Đó là lý do số ly lùi lại ở round 5–7, và round 5 chỉ 3 ly — bàn tập để làm quen luật mới trước khi vào bàn thật.

### 3.1 Bảng round

| Round | Kịch bản | Số ô | Bộ ly | Số hoán vị | Ghi chú |
|---|---|---|---|---|---|
| 1 | Đặt ly | 3 | A B C | 6 | Làm quen |
| 2 | Đặt ly | 4 | A B C D | 24 | |
| 3 | Đặt ly | 5 | A B C D E | 120 | Đặt đôi bắt buộc |
| 4 | Đặt ly | 6 | A B C D E F | 720 | Bàn đặt ly rộng nhất |
| 5 | 🔄 Hoán đổi | 3 | A B C | 6 | **Đổi kịch bản** — bàn tập |
| 6 | 🔄 Hoán đổi | 5 | A B C D E | 120 | Bàn thật |
| 7 | 🔄 Hoán đổi | 6 | A B C D E F | 720 | Thử thách cuối |

Bộ ly **cộng dồn**: round sau giữ nguyên các màu cũ và thêm 1 màu mới. Người chơi quen mặt dần, không phải học lại bảng màu mỗi round.

| Mã | Tên | Hex | Xuất hiện từ |
|---|---|---|---|
| A | Đỏ | `#EE5742` | Round 1 |
| B | Xanh dương | `#3C53A1` | Round 1 |
| C | Vàng | `#F8D867` | Round 1 |
| D | Xanh ngọc | `#6ACADA` | Round 2 |
| E | Hồng | `#DB5CA1` | Round 3 |
| F | Cam | `#F2934A` | Round 4 |
| G | Xanh lá | `#7FBF6A` | *(chưa round nào dùng)* |

Bảng màu trích trực tiếp từ ảnh tham chiếu art style — xem [art-style.md](art-style.md) mục 2.2.

### Thua thì sao?

**Không có thua.** Không giới hạn số lần đặt — người chơi luôn giải được mọi round. Thử thách nằm ở việc **giải với ít lần đặt nhất**. Hoàn thành round 7 là hoàn thành game.

---

## 4. Tiến trình chơi

### 4.1 Vòng lặp cơ bản

```
1. Người chơi chọn 1 loại ly từ bộ dự phòng (kéo lên, hoặc bấm chọn)
2. Người chơi đặt ly đó vào 1 ô TRỐNG trên bàn
3. Quản trò lập tức kiểm tra ô vừa đặt và hô: "ĐÚNG" hoặc "SAI"
4. Nếu "ĐÚNG"  -> ly bị KHÓA cố định tại ô đó
   Nếu "SAI"   -> người chơi được sửa sai ngay lập tức (mục 5)
5. Lặp lại cho đến khi tất cả các ô đều KHÓA -> qua round
```

### 4.2 Quy tắc phản hồi của Quản trò

Quản trò **chỉ kiểm tra đúng/sai tại đúng ô vừa được đặt ly**, không tiết lộ bất cứ thông tin nào về các ô còn lại.

| Khẩu lệnh | Điều kiện | Hệ quả |
|---|---|---|
| 🟢 **"ĐÚNG"** | Ly đặt đúng loại **VÀ** đúng ô của ly ẩn | Ly được **giữ nguyên cố định**, không thể nhấc ra nữa |
| 🔴 **"SAI"** | Ly đặt sai loại so với ly ẩn tại ô đó | Ly **không được khóa**, người chơi sửa sai ngay tại chỗ |

> Phản hồi là **nhị phân**. Quản trò không bao giờ nói "đúng loại nhưng sai vị trí".

---

## 5. Luật sửa sai lập tức (khi nghe "SAI")

Người chơi có **2 lựa chọn**, thực hiện ngay lập tức:

### 5.1 Đổi ly khác — giữ nguyên ô

```
Ô 2: đặt A -> "SAI"
Ô 2: đặt B -> "SAI"       <- đổi ly, vẫn ở ô 2
Ô 2: đặt C -> "ĐÚNG" ✅    <- khóa ô 2
```

### 5.2 Đổi ô — giữ nguyên ly

```
Ô 1: đặt D -> "SAI"
Ô 3: đặt D -> "ĐÚNG" ✅    <- cùng ly D, đổi sang ô 3
```

### 5.3 Ràng buộc

- Chỉ được đặt vào ô **chưa bị khóa**. Ô đã "ĐÚNG" là bất khả xâm phạm.
- Mỗi lần đặt ly xuống bàn tính là **1 lần đặt**, kể cả khi kết quả là "SAI".
- Ly đã khóa ở một ô thì **không còn trong bộ dự phòng** — không thể đặt lại ở ô khác (vì mỗi loại chỉ xuất hiện đúng 1 lần).

---

## 6. Đặt đôi — bắt buộc từ round 3

Từ round 3 (5 ô) trở đi, **mỗi lượt bắt buộc đặt 2 ly vào 2 ô khác nhau**. Đây không phải quyền chọn mà là luật của round.

### 6.1 Cách hoạt động

Người chơi đặt ly thứ nhất vào một ô — **ly hiện ngay trên ô đó**, hơi mờ và nghiêng để báo "chưa chốt". Rồi đặt ly thứ hai vào ô khác. Cả hai chỉ được gửi đi khi đã đủ cặp, và quản trò trả lời cho **cả hai ô cùng lúc**.

Trong lúc chờ ly thứ hai, ly đầu **kéo được sang ô khác** nếu đổi ý. Kéo nó ra ngoài bàn thì huỷ cả lượt, ly về khay.

```
Lượt 5 — Đặt đôi:
   Ô 2: E    Ô 4: F
   Quản trò: Ô 2 -> "SAI"   |   Ô 4 -> "ĐÚNG" ✅
```

### 6.2 Quy tắc

- Hai ly phải **khác loại**, hai ô phải **khác nhau** và đều **chưa khóa**.
- Phản hồi độc lập theo từng ô: có thể `ĐÚNG + ĐÚNG`, `ĐÚNG + SAI`, hoặc `SAI + SAI`.
- Ô nào "ĐÚNG" thì khóa ngay, ô nào "SAI" thì trả ly về khay.
- **Tính là 2 lần đặt**, nhưng chỉ tốn **1 lượt**.
- **Ngoại lệ ô lẻ:** khi chỉ còn 1 ô chưa khóa thì không ghép đôi được nữa — lượt đó đặt 1 ly. Giao diện báo rõ "Ô cuối — đặt 1 ly".
- **Ly đang giữ bị vô hiệu trong khay**, để người chơi không chọn lại chính nó làm ly thứ hai — nếu cho phép thì lách được luật "hai ly phải khác loại" và gửi đi 1 ly trong khi round đang bắt buộc 2.
- Trước khi gửi cặp đi: bấm lại chính ô đang giữ, kéo ly ra ngoài bàn, hoặc bấm Huỷ — cả ba đều rút lại lựa chọn.

### 6.3 Vì sao bắt buộc thay vì tuỳ chọn

Nếu để tuỳ chọn, đặt đôi là **lợi ích thuần** — giảm số lượt mà không mất gì rõ ràng, nên người chơi tối ưu sẽ luôn bật, và cái "công tắc" chỉ là thao tác thừa.

Khi bắt buộc, nó trở thành **ràng buộc định hình lối chơi**: người chơi không thể dò từng ô một cách tuần tự nữa. Mỗi lượt phải cam kết hai phán đoán độc lập **trước khi** biết bất kỳ kết quả nào.

| | Nếu được đặt đơn | Đặt đôi bắt buộc |
|---|---|---|
| Thông tin khi chọn ly thứ 2 | Đã biết kết quả ly 1 | Chưa biết gì |
| Chiến thuật | Dò cạn tuần tự từng ô | Phải phân bổ phán đoán ra 2 ô |
| Gánh nặng trí nhớ | 1 ô mỗi lần | 2 ô song song |

Đây cũng là lý do độ khó nhảy bậc ở round 3 — xem mục 9.

---

## 6b. Kịch bản hoán đổi (round 5–7)

### 6b.1 Luật

Bàn **đã đầy ly** ngay từ đầu, nhưng thứ tự bị xáo trộn. Người chơi không có khay dự phòng — chỉ đổi chỗ các ly đang có.

```
1. Bấm hai ô (hoặc kéo ly từ ô này sang ô khác) để đổi chỗ hai ly
2. Đổi bao nhiêu lần cũng được — KHÔNG tốn lượt
3. Khi thấy ưng ý, bấm KIỂM TRA
4. Quản trò đếm và nói SỐ LY đúng vị trí, ví dụ "2/5"
5. Lặp lại cho đến khi đạt n/n
```

### 6b.2 Phản hồi chỉ là một con số

Đây là điểm cốt lõi. Quản trò **không** chỉ ra ly nào đúng, chỉ nói có bao nhiêu ly đúng chỗ. Người chơi phải tự suy ra.

Ví dụ ở round 6 (5 ly):

```
Lượt 1:  C B E A D  ->  1/5     (có đúng 1 ly đúng chỗ, nhưng ly nào?)
Lượt 2:  B C E A D  ->  1/5     (đổi C↔B, vẫn 1 → cả hai đều sai chỗ)
Lượt 3:  B C E D A  ->  3/5     (đổi A↔D, tăng 2 → cả hai vừa về đúng chỗ)
```

Thông tin thu được mỗi lượt là **mức thay đổi của con số**, không phải bản thân con số. Đổi một cặp rồi thấy tăng 2 nghĩa là cả hai ly vừa về đúng chỗ; tăng 1 là một đúng một sai; giảm 2 là vừa phá hỏng hai ly đang đúng.

### 6b.3 Ràng buộc

- Hai ô phải khác nhau; ô đã chốt (sau khi thắng) không đổi được nữa.
- Hoán đổi **không tính lượt**. Chỉ mỗi lần bấm Kiểm tra tính 1 lượt.
- **Lặp lại một cách xếp đã thử bị từ chối** và không tốn lượt — nó không cho thêm thông tin gì, để người chơi tiêu lượt vào đó là bẫy vô nghĩa.
- Xếp ban đầu **không bao giờ trùng lời giải**, và không có sẵn quá nửa số ly đúng chỗ (tránh ván gần như xong từ đầu).

### 6b.4 Bảng "Đã thử" là bắt buộc

Khác với round 1–4 (cố ý không ghi lại lịch sử để buộc người chơi nhớ), kịch bản này **phải hiển thị lại các lượt đã thử** kèm kết quả.

Lý do: phản hồi chỉ là một con số, và thông tin nằm ở **so sánh giữa các lượt**. Không thấy lại lượt trước thì không có gì để so, và lối chơi tụt xuống dò mò thuần túy — mất hẳn phần suy luận.

### 6b.5 Cân bằng

Mô phỏng 300 ván mỗi cỡ, người chơi lọc dần tập hoán vị còn khả dĩ sau mỗi phản hồi (chiến thuật kiểu Knuth):

| Số ly | Hoán vị | TB lượt (tối ưu) | Xấu nhất |
|---|---|---|---|
| 5 | 120 | 4.7 | 8 |
| 6 | 720 | 5.7 | 9 |
| 7 | 5 040 | 6.9 | 10 |
| 8 | 40 320 | 8.2 | 11 |

Nhưng người chơi thật không lọc được 720 hoán vị trong đầu. Mô phỏng lối chơi thực tế (đổi 1–2 cặp mỗi lượt, giữ lại nếu số đúng tăng):

| Số ly | TB lượt (người thật) | So với tối ưu |
|---|---|---|
| 5 | ~19.7 | 4.2× |
| 6 | ~30.8 | 5.4× |
| 7 | ~41.7 | 6.0× |

Khoảng cách này là **biên độ kỹ năng** — càng suy luận tốt càng gần mức tối ưu. Đó cũng là lý do chọn 5–6 ly thay vì 7–8: ở 7 ly, người chơi trung bình cần hơn 40 lượt, quá dài cho một round.

---

## 7. Điều kiện kết thúc

### 7.1 Chơi lại ván

Người chơi có thể dựng lại round đang chơi bất cứ lúc nào. Bàn trở về trống, bộ đếm của round về 0, **các round đã hoàn thành giữ nguyên điểm**.

**Lời giải được xáo mới, không giữ lời giải cũ.** Nếu giữ nguyên thì người chơi ghi nhớ hết các ly đã trượt rồi bấm chơi lại để xoá bộ đếm — lách được toàn bộ thử thách trí nhớ ở mục 9.3.

### 7.2 Kết thúc

- **Qua round** khi tất cả các ô đều KHÓA.
- Màn chuyển round hiển thị: lời giải vừa rồi, số lần đặt của round, xếp hạng round.
- **Thắng game** sau khi hoàn thành round 7. Màn tổng kết hiển thị số lần đặt từng round + tổng cộng + xếp hạng chung cuộc.

---

## 8. Máy trạng thái

### 8.1 Trạng thái mỗi ô

```
EMPTY      <- chưa có ly, hoặc ly vừa bị nhấc ra
TESTING    <- có ly đang chờ Quản trò phản hồi (tồn tại rất ngắn)
LOCKED     <- đã nhận "ĐÚNG", cố định vĩnh viễn trong round này
```

### 8.2 Trạng thái game

```
ROUND_SETUP   -> sinh lời giải ngẫu nhiên cho round hiện tại
PLAYING       -> vòng lặp đặt ly / phản hồi
ROUND_CLEARED -> tất cả ô LOCKED, hiện kết quả round
GAME_WON      -> đã qua round 7
```

### 8.3 Mô hình dữ liệu

```
Game:
    currentRound   : 1..7
    roundResults   : [ { round, attempts, rank } ]
    totalAttempts  : số nguyên

Round:
    size       : 3..7                       // số ô = số loại ly
    palette    : [CupType]                  // đúng `size` loại
    solution   : [CupType]                  // hoán vị của palette
    board      : [Slot]
    available  : Set<CupType>               // các ly chưa bị khóa
    attempts   : số nguyên
    turns      : số nguyên
    canDouble  : size >= 5

Slot:
    status : EMPTY | LOCKED
    cup    : CupType | null
```

### 8.4 Hàm phán xử

```
function judge(round, placements):
    // placements: [ {slot, cup} ]  — 1 phần tử khi đặt đơn, 2 khi đặt đôi

    // --- Kiểm tra hợp lệ ---
    if placements.length == 2:
        if not round.canDouble:                    return REJECT("Round này chưa mở Đặt đôi")
        if placements[0].slot == placements[1].slot: return REJECT("Hai ô phải khác nhau")
        if placements[0].cup  == placements[1].cup:  return REJECT("Hai ly phải khác loại")

    for p in placements:
        if round.board[p.slot].status == LOCKED:   return REJECT("Ô đã khóa")
        if p.cup not in round.available:           return REJECT("Ly này đã bị khóa ở ô khác")

    // --- Phán xử ---
    round.turns += 1
    results = []

    for p in placements:
        round.attempts += 1
        if round.solution[p.slot] == p.cup:
            round.board[p.slot] = { status: LOCKED, cup: p.cup }
            round.available.remove(p.cup)
            results.push({ slot: p.slot, verdict: "ĐÚNG" })
        else:
            round.board[p.slot] = { status: EMPTY, cup: null }
            results.push({ slot: p.slot, verdict: "SAI" })

    if all slots LOCKED:
        return { results, roundCleared: true }

    return { results, roundCleared: false }
```

---

## 9. Cân bằng & độ khó

### 9.1 Số liệu mô phỏng

Mô phỏng 50 000 ván mỗi round với người chơi dùng **chiến thuật tối ưu cơ bản** (dò cạn từng ô từ trái sang phải, loại trừ các ly đã khóa):

| Round | Số ô | Hoán vị | TB số lần đặt | Tốt nhất | Xấu nhất |
|---|---|---|---|---|---|
| 1 | 3 | 6 | 4.5 | 3 | 6 |
| 2 | 4 | 24 | 7.0 | 4 | 10 |
| 3 | 5 | 120 | 10.0 | 5 | 15 |
| 4 | 6 | 720 | 13.5 | 6 | 21 |
| 5 | 7 | 5 040 | 17.5 | 7 | 28 |
| **Tổng** | | | **52.5** | **25** | **80** |

Công thức: ô có k ứng viên tốn trung bình `(k+1)/2` lần đặt; ô cuối miễn phí suy luận nhưng vẫn tốn 1 lần đặt để khóa.

Độ khó tăng **tuyến tính êm** (4.5 → 7 → 10 → 13.5 → 17.5), mỗi round nặng hơn round trước khoảng 3–4 lần đặt. Không có bậc thang gây hẫng.

### 9.2 Thang xếp hạng theo round

Tính theo tỉ lệ so với trung bình tối ưu của round đó:

| Số lần đặt so với TB | Hạng | Ý nghĩa |
|---|---|---|
| ≤ 65 % | ⭐⭐⭐⭐⭐ Hoàn hảo | May mắn lớn + suy luận sắc |
| 66–85 % | ⭐⭐⭐⭐ Xuất sắc | Trên mức tối ưu lý thuyết |
| 86–110 % | ⭐⭐⭐ Giỏi | Đúng chuẩn tối ưu |
| 111–140 % | ⭐⭐ Khá | Có lãng phí vài lượt |
| > 140 % | ⭐ Cần luyện thêm | Chưa tận dụng luật loại trừ |

Ví dụ round 3 (TB = 10): giải trong 6 lần → ⭐⭐⭐⭐⭐; giải trong 10 lần → ⭐⭐⭐; giải trong 15 lần → ⭐.

### 9.3 Kỹ năng cốt lõi: TRÍ NHỚ

**Game không ghi lại những lần đoán sai.** Người chơi đặt ly A vào ô 1 và nhận "SAI" — thông tin đó biến mất khỏi màn hình ngay khi ly bay về khay. Muốn dùng lại thì phải tự nhớ.

Đây là quyết định thiết kế trung tâm, và nó định nghĩa game.

#### Tải trọng trí nhớ theo round

Số cặp ly–ô mà người chơi phải theo dõi trong đầu ở trường hợp xấu nhất:

| Round | Số ô | Số cặp tối đa cần nhớ | Ghi chú |
|---|---|---|---|
| 1 | 3 | 6 | Nhớ được thoải mái |
| 2 | 4 | 12 | Bắt đầu phải tập trung |
| 3 | 5 | 20 | Vượt ngưỡng trí nhớ làm việc (~7 mục) |
| 4 | 6 | 30 | Cần chiến lược ghi nhớ có hệ thống |
| 5 | 7 | 42 | Rất nặng — đây là thử thách cuối |

Ngưỡng trí nhớ làm việc của người bình thường là khoảng 7 mục. Từ round 3 trở đi, người chơi **buộc phải** chuyển từ ghi nhớ thô sang một chiến lược nào đó: nhóm theo ô, nhóm theo ly, hoặc ghi ra giấy.

#### Ba nguồn thông tin người chơi phải tự quản

**① Loại trừ ngang — từ "SAI":** Đặt A vào ô 1 nhận "SAI" → A không ở ô 1. Đây là thứ *không được hiển thị*, phải nhớ.

**② Loại trừ dọc — từ "ĐÚNG":** Khóa C ở ô 2 → C bị loại khỏi mọi ô khác. Cái này **có** hiển thị (ly bị gạch khỏi khay), vì nó là trạng thái hiện tại của bàn chứ không phải lịch sử.

**③ Suy luận bắc cầu:** Kết hợp ① và ② để suy ra vị trí một ly mà chưa từng thử ly đó ở ô đó.

> Ranh giới: giao diện hiển thị **trạng thái hiện tại** (ô nào đã khóa, ly nào đã dùng), nhưng không hiển thị **lịch sử** (đã thử gì ở đâu). Người chơi nhìn thấy bàn cờ, không nhìn thấy sổ tay.

#### Tương tác với Đặt đôi bắt buộc

Từ round 3, hai luật này cộng hưởng làm độ khó nhảy bậc:

- Mỗi lượt sinh ra **2 mẩu thông tin cùng lúc** thay vì 1 → tốc độ nạp vào trí nhớ tăng gấp đôi.
- Người chơi phải **phân bổ phán đoán ra 2 ô song song**, không thể tập trung dò cạn từng ô rồi quên ô đó đi.

Đây là lý do round 3 là bước ngoặt thật sự của game, không chỉ là "thêm một ô".

#### Hệ quả với cân bằng

Con số ở mục 9.1 (trung bình 4.5 / 7 / 10 / 13.5 / 17.5) là của **người chơi nhớ hoàn hảo**. Người chơi thật sẽ quên và thử lại những ly đã trượt, nên số thật cao hơn — đặc biệt ở round 4–5.

Điều này **cố ý**. Thang xếp hạng ở mục 9.2 đo theo chuẩn trí nhớ hoàn hảo, nên đạt 4–5 sao ở round 5 là thành tích đáng kể chứ không phải mặc định.

#### Đánh đổi đã cân nhắc

| Mặt được | Mặt mất |
|---|---|
| Trí nhớ trở thành kỹ năng thật, có thể luyện | Người chơi có thể tự ghi ra giấy, vượt qua thiết kế |
| Thất bại có cảm giác "tại mình", tạo động lực chơi lại | Gánh nặng nhận thức cao, không hợp chơi giải trí nhẹ |
| Mỗi ván khác nhau rõ rệt tuỳ trạng thái tập trung | Người có khó khăn về trí nhớ bị thiệt rõ |

Hướng mở nếu sau này muốn hạ ngưỡng (chưa đưa vào v1): chế độ "có sổ tay" bật/tắt được, giữ nguyên luật nhưng hiển thị lại dấu vết.

---

## 10. Giao diện & trải nghiệm

### 10.1 Bố cục màn hình

Kịch bản **đặt ly** dùng bố cục **hai hàng**, ngăn bởi một mặt bàn:

- **Hàng trên** — ly người chơi đặt, nằm *trên* mặt bàn. Ô trống hiện dấu `+`.
- **Hàng dưới** — ly quản trò đang giấu, luôn hiển thị dạng nét đứt không màu.

Mỗi vị trí là một **cặp dọc**, người chơi đối chiếu trực tiếp "mình đoán gì" với "chỗ cần đoán".

```
   ┌────┐   ┌────┐   ┌────┐
   │ 🟡 │   │ +  │   │ 🔴 │      <- ly bạn đặt
   └────┘   └────┘   └────┘
 ═════════════════════════════   <- MẶT BÀN
   ┌────┐   ┌────┐   ┌────┐
   │ ╌╌ │   │ ╌╌ │   │ ╌╌ │      <- ly quản trò giấu
   └────┘   └────┘   └────┘
   Vị trí 1 Vị trí 2 Vị trí 3
```

**Đặt đúng thì ly ẩn ở hàng dưới lật lên thành ly thật cùng màu**, sau một nhịp chờ (không lật ngay lập tức). Khung cả hai ô sáng dần sang xanh. Người chơi thấy ngay hai hàng khớp nhau:

```
   ┌────┐   ┌────┐
   │ 🟡 │   │ +  │      <- ly bạn đặt
   └────┘   └────┘
 ═══════════════════    <- MẶT BÀN
   ┌────┐   ┌────┐
   │ 🟡 │   │ ╌╌ │      <- vị trí 1 đã lật, khớp màu
   └────┘   └────┘
```

Kịch bản **hoán đổi** dùng **cùng bố cục hai hàng**, nhưng hàng dưới **không lật từng ly** — phản hồi chỉ là con số `n/N` chứ không nói ô nào đúng. Hàng dưới chỉ lật hết một lượt khi giải xong cả round.

### 10.2 Thao tác

**Kéo-thả là lối chính.** Kéo ly từ khay lên ô muốn đặt — một bản sao chiếc ly bám theo con trỏ, ô đích sáng viền đậm khi rê tới. Dùng Pointer Events nên chạy được cả chuột lẫn cảm ứng.

**Bấm-chọn vẫn dùng được** song song: bấm ly → bấm ô. Thao tác kéo dưới 6px được coi là một cú bấm, nên hai lối không xung đột.

- **Round 1–2:** mỗi lượt đặt 1 ly.
- **Round 3–5:** mỗi lượt đặt 2 ly. Đặt ly đầu → **ly hiện ngay trên ô** (mờ, nghiêng nhẹ) → đặt ly thứ hai vào ô khác → cả hai gửi đi cùng lúc. Trong lúc chờ, ly đầu kéo được sang ô khác; bấm lại ô đó hoặc kéo ra ngoài bàn thì rút lại.
- Ô đã chốt: khung xanh mờ + nét gạch chéo ở góc (không dùng icon ổ khóa), không nhận thao tác.
- Ly đã khóa bị gạch chéo trong khay (vẫn nhìn thấy để ghi nhớ bố cục).
- **Không hiển thị các ly đã thử và trượt** — xem mục 9.3.
- **Chơi lại ván:** nút ở thanh trạng thái (hoặc phím `R`) dựng lại **round đang chơi** với lời giải mới, bộ đếm về 0. Các round đã hoàn thành giữ nguyên. Hỏi xác nhận trước nếu đã đặt ít nhất 1 lần.
- Bàn phím: `A`–`G` chọn ly, `1`–`7` chọn ô, `Esc` huỷ lựa chọn, `R` chơi lại ván.

### 10.3 Phản hồi

| Kết quả | Hiệu ứng |
|---|---|
| "ĐÚNG" | Chữ xanh lá, ly hạ xuống chắc nịch, khung ô chuyển xanh, âm thanh xác nhận |
| "SAI" | Chữ đỏ, ly rung lắc rồi bay trở lại bộ dự phòng, âm thanh từ chối |
| Đặt đôi | Hai ô phản hồi **đồng thời**, không lệch nhau — giữ đúng cảm giác "1 lượt" |

Phản hồi xuất hiện **tức thì** (dưới 200 ms) — đúng tinh thần "ngay khi ly vừa chạm bàn".

### 10.4 Chuyển round

Màn chuyển hiển thị: lời giải vừa giải, số lần đặt, xếp hạng round, và **preview round tiếp theo** (số ô + màu ly mới được thêm). Nếu round tiếp theo mở khóa Đặt đôi thì báo rõ.

### 10.5 Khả năng tiếp cận

- Ly phân biệt **hoàn toàn bằng màu**, không in chữ cái. Tên màu nằm trong `aria-label` cho trình đọc màn hình.
- **Hạn chế đã biết:** người mù màu đỏ-lục khó phân biệt ly Đỏ với ly Xanh lá. Xem art-style.md mục 5.1 cho hướng khắc phục nếu cần.
- Khẩu lệnh hiển thị bằng **chữ**, không chỉ bằng màu sắc.
- Điều khiển đầy đủ bằng bàn phím (mục 10.2).

---

## 11. Phạm vi bản v1

### Có

- 7 round, hai kịch bản: đặt ly (1–4) và hoán đổi (5–7)
- Bộ ly cộng dồn qua các round
- Phản hồi ĐÚNG / SAI tức thì
- Sửa sai lập tức (đổi ly hoặc đổi ô)
- Đặt đôi bắt buộc từ round 3, ngoại lệ ô lẻ đặt 1 ly
- Kéo-thả (chuột + cảm ứng), song song với bấm-chọn
- **Không ghi lại lần đoán sai** — người chơi tự nhớ
- Đếm số lần đặt + xếp hạng từng round + tổng kết cuối game
- Nút "Chơi lại ván" ở thanh trạng thái, có bước xác nhận
- Chơi lại toàn bộ từ round 1 sau khi hoàn thành game

### Chưa có (để dành)

- Chế độ 2 người
- Bảng xếp hạng lưu trữ
- Chế độ endless (round 6, 7, 8… vô hạn)
- Giới hạn lượt / chế độ thử thách
- Chế độ "có sổ tay" — bật/tắt việc hiển thị dấu vết đoán sai
- Âm thanh

---

## 12. Trạng thái triển khai

Đã code xong, chạy được. Web thuần (HTML + ES modules), không cần build.

| Phần | File |
|---|---|
| Logic game | `src/game.js` — không đụng DOM, test riêng được |
| Sinh nét vẽ tay | `src/doodle.js` |
| Giao diện | `src/ui.js`, `src/style.css` |
| Test logic | `src/game.test.js` — 35 test |
| Test giao diện | `test/smoke.mjs` — chạy Chrome thật |

Chạy: `npm start` rồi mở http://localhost:8123

Xem thêm [art-style.md](art-style.md) cho phần thị giác.
