# BÁO CÁO NGHIỆP VỤ — ỨNG DỤNG ĐỒNG HỒ GIẢI ĐẤU POKER (POKER CLOCK)

**Mục đích tài liệu:** Tài liệu này mô tả toàn bộ nghiệp vụ hiện có của ứng dụng, không đề cập đến giao diện/thiết kế. Mục tiêu là để đội ngũ phát triển và khách hàng cùng xác nhận: (1) hệ thống đã hiểu đúng và đủ nhu cầu vận hành một giải đấu poker, và (2) làm rõ những điểm còn mơ hồ hoặc chưa được xử lý, tránh hiểu nhầm trước khi triển khai tiếp.

---

## 1. Tổng quan

Ứng dụng phục vụ việc **tổ chức và điều hành một giải đấu poker theo hình thức tournament (đấu loại theo vòng, tăng dần mức cược — blind)**. Có 3 vai trò/màn hình sử dụng:

1. **Người điều hành giải đấu (Director/Dealer trưởng):** thiết lập giải đấu, vận hành đồng hồ đếm giờ, quản lý người chơi.
2. **Người xem tại bàn/khán phòng:** theo dõi qua **màn hình máy chiếu (Projector)** — chỉ xem, không thao tác.
3. **Người chơi:** không thao tác trực tiếp trên hệ thống, chỉ được ghi nhận thông tin bởi người điều hành.

Toàn bộ dữ liệu (giải đấu, cấu trúc blind, cấu trúc trả thưởng, danh sách người chơi, lịch sử mua lại...) được **lưu trực tiếp trên trình duyệt của máy đang chạy ứng dụng**, không có máy chủ trung tâm (xem mục 7 — Giới hạn hệ thống).

---

## 2. Quy trình nghiệp vụ tổng thể

```
Tạo giải đấu mới
      │
      ▼
Thiết lập thông tin giải đấu (6 bước, xem mục 3)
      │
      ▼
Đăng ký người chơi tham gia (trước hoặc trong lúc giải đấu diễn ra)
      │
      ▼
Vận hành đồng hồ đếm giờ (bắt đầu, tạm dừng, chuyển mức cược...)
      │  ◄──── song song: ghi nhận mua lại / mua thêm / loại người chơi
      ▼
Máy chiếu hiển thị trực tiếp cho người xem (đồng bộ theo thời gian thực)
      │
      ▼
Kết thúc giải đấu khi chỉ còn 1 người chơi
```

---

## 3. Thiết lập giải đấu (quy trình 6 bước)

Khi tạo mới hoặc chỉnh sửa một giải đấu, người điều hành đi qua 6 bước sau. **Mỗi giải đấu có đúng một cấu hình blind và đúng một cấu hình trả thưởng riêng** (không dùng chung, không chọn từ danh sách mẫu dựng sẵn) — mỗi giải đấu mới sẽ được gợi ý một mẫu mặc định để chỉnh sửa lại cho phù hợp.

### 3.1. Thông tin cơ bản
- Tên giải đấu.

### 3.2. Tiền tệ & tài chính
- **Đơn vị tiền tệ**: chọn 1 trong 3 loại — **USD, VND, KEYS** (KEYS là đơn vị điểm/token tùy biến, không phải tiền thật). Đơn vị này áp dụng cho toàn bộ số tiền hiển thị trong giải đấu đó (phí tham gia, tiền thưởng...).
- **Phí tham gia (buy-in)**: số tiền mỗi người chơi đóng để tham gia.
- **Phí dịch vụ / phí bàn (fee, rake)**: một khoản phí được khai báo riêng, tách biệt với buy-in.
- **Stack khởi điểm**: số chip mỗi người chơi nhận khi vào giải.
- **Số người tối đa mỗi bàn**.
- **Số lượng người chơi dự kiến (entrant count)**: dùng để ước tính giải thưởng/thống kê trước khi có danh sách đăng ký thực tế.
- **Mức (level) đóng đăng ký muộn**: đăng ký muộn sẽ tự động **đóng lại khi giải đấu bước sang mức cược lớn hơn mức được khai báo** ở đây.
- **Giải thưởng đảm bảo (guaranteed prize pool)** — tùy chọn, chỉ để nhập thông tin tham khảo.
- **Cho phép mua lại (rebuy)**: bật/tắt.
- **Cho phép mua thêm (add-on)**: bật/tắt.
- **Giải đấu có tiền thưởng cho mỗi lần loại đối thủ (bounty)**: bật/tắt, kèm số tiền thưởng mỗi lần hạ một đối thủ.

### 3.3. Cấu trúc mức cược (Blind Structure)
- Nếu giải đấu **đã có** cấu trúc mức cược từ trước (khi chỉnh sửa lại) → hệ thống hiển thị đúng cấu trúc đó để chỉnh tiếp.
- Nếu là giải đấu **mới**, hệ thống hiển thị **một mẫu mặc định** (dãy mức cược tăng dần theo thời gian) để người dùng chỉnh sửa tự do.
- Với mỗi mức, có thể chỉnh: mức cược nhỏ (small blind), mức cược lớn (big blind), tiền cược bắt buộc thêm (ante), thời lượng của mức (phút).
- Có thể **thêm một mức cược mới** ngay sau bất kỳ mức nào (mức mới sẽ tự lấy giá trị mức cược/thời lượng của mức liền trước làm gợi ý ban đầu).
- Có thể **thêm một lượt nghỉ giải lao (break)** ngay sau bất kỳ mức nào.
- Có thể **xóa** một mức bất kỳ (không cho xóa nếu chỉ còn đúng 1 mức).
- Số thứ tự các mức được **tự động đánh lại** mỗi khi thêm/xóa, đảm bảo luôn liên tục.

### 3.4. Cấu trúc trả thưởng (Payout Structure)
- Tương tự cấu trúc blind: nếu giải đấu đã có cấu trúc trả thưởng thì hiển thị lại để chỉnh; nếu là giải mới thì hiển thị **một mẫu mặc định** (hạng 1: 50%, hạng 2: 30%, hạng 3: 20%) để chỉnh sửa.
- Có thể thêm/xóa hạng thưởng, chỉnh tỷ lệ % của từng hạng.
- **Bắt buộc**: tổng tỷ lệ % của tất cả các hạng phải đúng bằng **100%** thì mới được tiếp tục sang bước kế tiếp.

### 3.5. Âm thanh thông báo
Người điều hành chọn âm thanh riêng cho **7 sự kiện** sau đây (mỗi sự kiện là một danh sách chọn, **mặc định là "Không có âm thanh" (None)**):
1. Chuyển sang mức cược tiếp theo (Next level)
2. Bắt đầu giờ nghỉ giải lao (Break start)
3. Kết thúc giờ nghỉ giải lao (Break end)
4. Còn 5 giây nữa sang mức tiếp theo
5. Còn 10 giây nữa sang mức tiếp theo
6. Còn 30 giây nữa sang mức tiếp theo
7. Còn 60 giây nữa sang mức tiếp theo

Có nút nghe thử ngay trong lúc thiết lập để chọn âm thanh phù hợp trước khi lưu.

### 3.6. Xem lại & xác nhận
Tổng hợp lại toàn bộ thông tin đã nhập ở các bước trên để kiểm tra trước khi tạo/lưu giải đấu. Sau khi xác nhận, hệ thống chuyển ngay sang màn hình vận hành (Control).

---

## 4. Vận hành giải đấu (màn hình điều khiển)

Đây là màn hình chính mà người điều hành sử dụng trong suốt giải đấu.

### 4.1. Điều khiển đồng hồ
- **Bắt đầu giải đấu**: kích hoạt đồng hồ đếm giờ từ mức cược đầu tiên; giải đấu chuyển sang trạng thái "đang diễn ra".
- **Tạm dừng / Tiếp tục**: một nút duy nhất chuyển đổi qua lại; khi tạm dừng, đồng hồ đứng yên hoàn toàn (không đếm ngược ngầm).
- **Chuyển tới mức tiếp theo / quay lại mức trước đó**: cho phép nhảy thủ công, không cần chờ hết giờ.
- **Điều chỉnh thời gian**: cộng thêm hoặc bớt đi thời gian của mức hiện tại theo các mốc **-1 phút, +1 phút, +5 phút**.
- **Hoàn tác (Undo)**: quay lại thao tác gần nhất trên đồng hồ (lưu tối đa 20 bước gần nhất).
- **Tắt/Bật toàn bộ âm thanh** bằng một nút duy nhất.
- **Tự động chuyển mức**: khi thời gian của một mức về 0 (và đồng hồ không bị tạm dừng), hệ thống **tự động chuyển sang mức kế tiếp** mà không cần thao tác thủ công.
- Âm thanh của 7 sự kiện đã cấu hình (mục 3.5) được **phát tự động đúng thời điểm** trong lúc đồng hồ chạy (trừ khi đang tắt âm thanh).

### 4.2. Thông tin hiển thị trực tiếp
- Mức cược hiện tại (số thứ tự / tổng số mức), hoặc nhãn "đang nghỉ giải lao", hoặc "mức cuối cùng".
- Mức cược nhỏ / lớn / tiền cược bắt buộc (ante) của mức hiện tại và mức kế tiếp.
- Trạng thái **đăng ký muộn: Đang mở / Đã đóng** (tự động xác định dựa trên mức đóng đăng ký muộn đã cấu hình).
- Số người chơi còn lại / tổng số đã đăng ký.
- Tổng giải thưởng hiện tại, kèm bảng chi tiết chia thưởng theo từng hạng (xem theo yêu cầu).
- Chip trung bình mỗi người chơi còn lại.
- Tổng số lượt vào giải (tổng số lượt buy-in + rebuy), số lượt mua lại (rebuy), số lượt buy-in.
- Tổng số chip đang lưu hành trong giải đấu.
- Tỷ lệ chip trung bình so với mức cược lớn hiện tại (đơn vị: số lần Big Blind).
- Thời gian còn lại cho đến giờ nghỉ giải lao tiếp theo.

---

## 5. Quản lý người chơi

Một màn hình riêng để quản lý danh sách người chơi tham gia một giải đấu cụ thể:

- **Đăng ký người chơi mới**: nhập tên (hệ thống gợi ý tên đã có sẵn trong hệ thống, không phân biệt hoa/thường, để tránh tạo trùng người chơi).
- **Đánh dấu đã check-in** cho từng người chơi (thao tác thủ công, mang tính ghi chú).
- **Nhập/chỉnh số chip hiện tại** của người chơi (thao tác thủ công, mang tính ghi chú tại một thời điểm).
- **Ghi nhận mua lại (rebuy)** — chỉ hiển thị nếu giải đấu cho phép rebuy và người chơi chưa bị loại: người điều hành nhập số tiền và số chip nhận thêm (mặc định gợi ý bằng giá trị buy-in và stack khởi điểm ban đầu, nhưng có thể chỉnh tùy ý cho từng trường hợp); hệ thống tự ghi lại mức cược hiện tại tại thời điểm mua lại.
- **Ghi nhận mua thêm (add-on)** — tương tự mua lại nhưng áp dụng khi giải đấu cho phép add-on, được lưu tách biệt với rebuy.
- **Loại người chơi khỏi giải đấu**: hệ thống tự tính và gán **thứ hạng cuối cùng** dựa trên thứ tự bị loại (người bị loại đầu tiên xếp hạng thấp nhất, người trụ lại sau cùng xếp hạng cao nhất). Khi chỉ còn đúng 1 người chơi, nút này đổi tên thành **"Công bố người thắng cuộc"**.
- **Xóa một lượt đăng ký**: chỉ áp dụng cho người chơi đã có kết quả cuối cùng (đã bị loại), không áp dụng cho người chơi đang thi đấu.
- Thông tin tổng quan: tổng số người đã đăng ký, số người đang thi đấu, tổng giải thưởng tính theo dữ liệu đăng ký thực tế (bao gồm cả các khoản mua lại/mua thêm).

---

## 6. Màn hình máy chiếu (Projector)

Dành để trình chiếu công khai cho người chơi/khán giả theo dõi, **không có bất kỳ thao tác điều khiển nào**, chỉ hiển thị và tự động cập nhật theo thời gian thực từ màn hình điều khiển, bao gồm:

- Tên giải đấu, mức cược hiện tại, đồng hồ đếm ngược, mức cược kế tiếp.
- Số người chơi còn lại/tổng số, tổng số lượt vào giải, số lượt mua lại, số lượt buy-in.
- Tổng số chip trong vòng chơi, chip trung bình, tỷ lệ so với Big Blind.
- Thời gian đến giờ nghỉ giải lao tiếp theo.
- Tổng giải thưởng và bảng chia thưởng chi tiết theo từng hạng.

Nếu người điều hành **chưa bấm "Bắt đầu giải đấu"**, màn hình máy chiếu sẽ hiển thị thông báo đang chờ.

---

## 7. Công thức tính toán nghiệp vụ

Để đảm bảo hai bên thống nhất cách tính, dưới đây là các công thức đang được áp dụng:

- **Tổng giải thưởng (khi đã có người chơi đăng ký thực tế)** = (số lượt buy-in × phí tham gia) + (tổng tiền của tất cả các lượt mua lại) + (tổng tiền của tất cả các lượt mua thêm).
  *Lưu ý: khoản "phí dịch vụ/rake" hiện **không** được trừ ra khỏi tổng giải thưởng — xem thêm mục 8.*
- **Tổng giải thưởng (khi chưa có ai đăng ký thực tế, dùng số liệu ước tính)** = số người chơi dự kiến × phí tham gia.
- **Chia thưởng theo hạng** = tổng giải thưởng × tỷ lệ % của hạng đó, làm tròn xuống đến đơn vị nhỏ nhất; phần dư ra do làm tròn sẽ được **cộng dồn toàn bộ vào giải nhất (hạng 1)**, đảm bảo tổng các hạng luôn khớp chính xác với tổng giải thưởng.
- **Tổng số chip trong vòng chơi** = (stack khởi điểm × số lượt buy-in) + (tổng chip nhận thêm từ các lượt mua lại) + (tổng chip nhận thêm từ các lượt mua thêm).
- **Chip trung bình** = tổng số chip trong vòng chơi ÷ số người chơi còn lại (bằng 0 nếu không còn ai).
- **Tỷ lệ so với Big Blind** = chip trung bình ÷ mức cược lớn hiện tại.
- **Thời gian đến giờ nghỉ tiếp theo** = thời gian còn lại của mức hiện tại + tổng thời lượng của tất cả các mức kế tiếp cho đến mức nghỉ giải lao gần nhất (nếu hiện đang trong giờ nghỉ, tính bằng 0; nếu không còn giờ nghỉ nào phía sau, hiển thị "—").
- **Đăng ký muộn tự động đóng** khi mức cược hiện tại vượt qua mức đã cấu hình ở bước thiết lập (mục 3.2).
- **Thứ hạng cuối cùng** = (tổng số người từng đăng ký) − (thứ tự bị loại) + 1. Người bị loại đầu tiên có thứ tự = 1 (xếp hạng thấp nhất); người trụ lại sau cùng nghiễm nhiên nhận hạng 1.

---

## 8. Các mục đã cho phép nhập liệu nhưng **CHƯA gắn nghiệp vụ xử lý** — cần khách hàng xác nhận

Đây là phần **quan trọng nhất** của báo cáo này. Các trường thông tin dưới đây **đã có trên form nhập liệu và được lưu lại**, nhưng hiện **chưa có bất kỳ tính toán/ràng buộc nào sử dụng đến chúng** ở bất kỳ màn hình nào khác. Đề nghị khách hàng xác nhận rõ: các mục này chỉ mang tính **ghi chú tham khảo**, hay cần được **xây dựng nghiệp vụ đầy đủ** đi kèm?

| # | Trường thông tin | Hiện trạng |
|---|---|---|
| 1 | **Phí dịch vụ / rake** | Được nhập và hiển thị lại khi xem lại thiết lập, nhưng **không được trừ khỏi tổng giải thưởng** khi tính toán. Nếu khách hàng cần "giải thưởng thực nhận" đã trừ phí, cần bổ sung công thức này. |
| 2 | **Giải thưởng đảm bảo (guaranteed prize pool)** | Chỉ được nhập và lưu lại, **không được đối chiếu** với tổng giải thưởng thực tế (không có cảnh báo khi giải thưởng thực tế thấp hơn mức đảm bảo, không có cơ chế "bù thêm" phần thiếu). |
| 3 | **Giải đấu có bounty (thưởng loại đối thủ)** | Có thể bật/tắt và nhập số tiền thưởng mỗi lần loại đối thủ, nhưng **không có bất kỳ tính toán hay ghi nhận nào** khi một người chơi bị loại — không trừ vào giải thưởng chung, không hiển thị số tiền bounty đã tích lũy cho ai. Đây hiện chỉ là một con số được lưu, chưa vận hành thực tế. |
| 4 | **Số người chơi tối thiểu / tối đa mỗi bàn** | Số người tối đa mỗi bàn được nhập nhưng **không có chức năng chia bàn, xếp chỗ ngồi, hay cân bằng bàn chơi** khi số người chơi thay đổi. |
| 5 | **Trạng thái check-in của người chơi** | Có thể đánh dấu đã check-in, nhưng trạng thái này **không ảnh hưởng** đến bất kỳ nghiệp vụ nào khác (không bắt buộc check-in trước khi vào giải, không lọc theo trạng thái này ở đâu). |
| 6 | **Số chip hiện tại nhập tay cho từng người chơi** | Có thể nhập/cập nhật thủ công, nhưng con số này **không được dùng để tính** chip trung bình hay bất kỳ thống kê nào (các thống kê chip đều tính dựa trên stack khởi điểm + mua lại/mua thêm, không dựa trên số liệu nhập tay này). |
| 7 | **Xóa giải đấu / xóa cấu trúc blind / xóa cấu trúc trả thưởng đã lưu** | Hiện **chưa có nút xóa nào** trên giao diện cho các đối tượng này — một khi đã tạo, chỉ có thể chỉnh sửa, chưa có cách gỡ bỏ hoàn toàn. |
| 8 | **Số lượt mua thêm (add-on) trong thống kê "Tổng số lượt vào giải"** | Số liệu "Tổng số lượt vào giải" và "số lượt mua lại" hiện **chỉ tính rebuy, không cộng thêm số lượt add-on** — dù tiền và chip của add-on vẫn được cộng vào tổng giải thưởng/tổng chip. Cần xác nhận đây có phải là cách tính mong muốn hay cần đưa add-on vào luôn. |

---

## 9. Giới hạn hiện tại của hệ thống (lưu ý vận hành quan trọng)

1. **Dữ liệu được lưu cục bộ trên trình duyệt của máy đang sử dụng**, chưa có máy chủ/đám mây dùng chung. Nếu xóa dữ liệu trình duyệt, đổi máy, hoặc dùng trình duyệt khác, dữ liệu giải đấu sẽ **không tự động xuất hiện lại**.
2. **Trạng thái đồng hồ đang chạy không được lưu tự động** — nếu người điều hành lỡ tải lại (refresh) trang màn hình điều khiển trong lúc giải đấu đang diễn ra, đồng hồ sẽ **về trạng thái chưa bắt đầu**, phải bấm "Bắt đầu" lại (các dữ liệu người chơi/rebuy vẫn được giữ nguyên, chỉ đồng hồ bị reset).
3. **Đồng bộ giữa màn hình điều khiển và màn hình máy chiếu chỉ hoạt động khi cả hai được mở trên cùng một trình duyệt, cùng một máy** (ví dụ hai tab hoặc hai cửa sổ trên cùng một máy tính) — chưa hỗ trợ đồng bộ qua mạng giữa hai thiết bị khác nhau (ví dụ máy tính bảng điều khiển + TV chiếu ở phòng khác).
4. Nếu màn hình máy chiếu được **mở sau khi giải đấu đã bắt đầu chạy**, nó sẽ hiển thị "đang chờ" cho đến khi người điều hành thực hiện **thao tác tiếp theo** trên đồng hồ (ví dụ tạm dừng/tiếp tục) — hệ thống hiện chưa tự đồng bộ trạng thái hiện tại ngay khi máy chiếu vừa mở lên.
5. Chưa có cơ chế cảnh báo hoặc chặn khi số người chơi thực tế vượt quá/thấp hơn số lượng dự kiến đã khai báo.

---

## 10. Câu hỏi cần khách hàng xác nhận

1. Phí dịch vụ (rake) có cần được **trừ vào tổng giải thưởng** hay chỉ là con số ghi chú nội bộ?
2. Giải thưởng đảm bảo (guaranteed) có cần **đối chiếu tự động** và cảnh báo khi giải thưởng thực tế không đạt mức đảm bảo không?
3. Giải đấu có bounty (thưởng loại đối thủ) có cần được **tính toán và ghi nhận đầy đủ** theo từng lượt loại người chơi không (ai loại ai, nhận bao nhiêu tiền), hay chỉ cần hiển thị thông tin để trọng tài tự xử lý bên ngoài hệ thống?
4. Có cần chức năng **chia bàn / xếp chỗ ngồi** dựa trên số người tối đa mỗi bàn không?
5. Trạng thái check-in có cần **bắt buộc** trước khi cho phép ghi nhận vào giải, hoặc dùng để lọc danh sách ở đâu đó không?
6. Số chip nhập tay có cần được dùng để **tính lại chip trung bình thực tế** (thay vì chỉ tính theo lý thuyết buy-in/rebuy) không?
7. Có cần bổ sung chức năng **xóa giải đấu** (và xóa cấu trúc blind/trả thưởng đã lưu) không?
8. Số lượt mua thêm (add-on) có cần được **cộng vào "Tổng số lượt vào giải"** cùng với rebuy không?
9. Hệ thống có cần **lưu trữ dữ liệu trên máy chủ/đám mây** để dùng chung nhiều thiết bị, nhiều địa điểm, và không bị mất khi xóa trình duyệt không? Đây là quyết định ảnh hưởng lớn đến kiến trúc hệ thống nên cần xác nhận sớm.
10. Có cần đồng hồ đang chạy **được lưu lại tự động**, để khi tải lại trang không bị mất trạng thái đang chạy không?
11. Có cần màn hình máy chiếu và màn hình điều khiển hoạt động được trên **hai thiết bị khác nhau** (không chỉ hai tab trên cùng một máy) không?
12. Có cần giới hạn/cảnh báo về **số người chơi tối thiểu, tối đa** không?

---

*Tài liệu này phản ánh đúng nghiệp vụ đang được triển khai trong hệ thống tại thời điểm lập báo cáo. Mọi thay đổi về phạm vi (bổ sung nghiệp vụ ở mục 8 và trả lời các câu hỏi ở mục 10) đều nên được xác nhận bằng văn bản trước khi triển khai tiếp, để đảm bảo hai bên thống nhất về phạm vi công việc.*
