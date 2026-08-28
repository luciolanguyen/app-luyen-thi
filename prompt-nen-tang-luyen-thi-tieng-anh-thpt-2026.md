# PROMPT CHI TIẾT: XÂY DỰNG NỀN TẢNG WEB LUYỆN THI TIẾNG ANH THPT 2026

> File này là một bản "prompt kỹ thuật" hoàn chỉnh, có thể dán trực tiếp vào công cụ AI coding (Claude Code, Cursor, v.v.) hoặc đưa cho đội dev để dựng sản phẩm. Viết theo vai trò: chuyên gia luyện thi tiếng Anh THPT + product spec cho nền tảng edtech.

---

## 0. BỐI CẢNH & CĂN CỨ ĐỀ THI

Xây dựng nền tảng web luyện thi **Tiếng Anh – Kỳ thi tốt nghiệp THPT** bám sát cấu trúc đề thi áp dụng từ 2025 (Quyết định 4068/QĐ-BGDĐT), tiếp tục dùng cho năm 2026, cụ thể:

- **Hình thức:** 100% trắc nghiệm, 40 câu hỏi, 4 phương án chọn 1 đáp án đúng.
- **Thời gian làm bài:** 50 phút.
- **Thang điểm:** tối đa 10 điểm, mỗi câu đúng 0,25 điểm.
- **Phổ từ vựng:** trải rộng từ A2 đến C1.
- **Trọng tâm ngữ pháp:** chương trình lớp 12 theo GDPT 2018 (câu điều kiện loại 1, so sánh kép – double comparison, thể bị động nguyên nhân – causative passive, mệnh đề quan hệ, câu tường thuật, liên từ, cụm động từ...).
- **4 dạng bài chính của đề thi** (đây là căn cứ để thiết kế mục "Luyện theo danh mục"):
  1. **Điền từ/câu vào quảng cáo, thông báo, biển hiệu, tờ rơi** (Notice/Advertisement gap-fill)
  2. **Sắp xếp câu/đoạn hội thoại hoặc đoạn văn** (Sentence/Paragraph ordering, đưa câu về đúng vị trí)
  3. **Hoàn thành đoạn văn – Cloze test** (điền từ vào đoạn văn, kiểm tra từ vựng + ngữ pháp trong ngữ cảnh)
  4. **Đọc hiểu** (Reading comprehension: tìm ý chính, suy luận, paraphrase, từ đồng nghĩa/trái nghĩa, tham chiếu đại từ, quan điểm tác giả, điền câu vào đoạn văn)

⚠️ Lưu ý cho đội phát triển nội dung: cấu trúc đề thi có thể được Bộ GD&ĐT điều chỉnh theo từng năm. Cần có cơ chế **admin cập nhật ma trận đề thi** (số câu/dạng bài, trọng số điểm) mà không phải sửa code, để nền tảng luôn bám sát đề thi mới nhất.

---

## 1. MỤC TIÊU SẢN PHẨM

Xây dựng một nền tảng web giúp học sinh THPT:
1. Luyện tập từng kỹ năng/dạng bài riêng lẻ (luyện theo danh mục).
2. Làm đề thi thử mô phỏng sát thực tế (thi thử full đề, tính giờ).
3. Xem báo cáo kết quả chi tiết, biết điểm yếu để cải thiện.
4. Được ghi nhận thành tích, tạo động lực học tập liên tục.
5. Cạnh tranh lành mạnh qua bảng vinh danh (leaderboard).
6. Tích lũy điểm thưởng (gamification) để đổi quà/ưu đãi.
7. Cho phép giáo viên/admin quản lý học sinh, lớp học, nội dung.

---

## 2. ĐỐI TƯỢNG NGƯỜI DÙNG (ROLES)

| Vai trò | Mô tả | Quyền hạn chính |
|---|---|---|
| **Học sinh (Student)** | Người dùng chính | Luyện tập, thi thử, xem báo cáo, tích điểm, xem bảng vinh danh |
| **Giáo viên (Teacher)** | Quản lý lớp/nhóm học sinh | Tạo đề, giao bài tập, xem báo cáo của lớp, nhận xét |
| **Quản trị viên (Admin)** | Vận hành hệ thống | Quản lý toàn bộ người dùng, ngân hàng câu hỏi, cấu hình điểm thưởng, ma trận đề thi |
| **Phụ huynh (Parent) – tuỳ chọn mở rộng** | Theo dõi tiến độ con | Xem báo cáo, không can thiệp bài làm |

---

## 3. KIẾN TRÚC THÔNG TIN TỔNG THỂ (SITEMAP)

```
Trang chủ
├── Đăng nhập / Đăng ký / Quên mật khẩu
├── Luyện thi theo danh mục
│   ├── Điền từ/câu (Notice & Advertisement)
│   ├── Sắp xếp câu/đoạn hội thoại
│   ├── Hoàn thành đoạn văn (Cloze test)
│   ├── Đọc hiểu (Reading comprehension)
│   ├── Ngữ pháp trọng tâm (theo chuyên đề)
│   └── Từ vựng theo chủ đề
├── Bài thi thử mô phỏng
│   ├── Danh sách đề thi thử (theo năm/độ khó/tỉnh)
│   ├── Phòng thi ảo (giao diện giống thi thật, đếm ngược 50 phút)
│   └── Lịch sử các lần thi thử
├── Báo cáo kết quả
│   ├── Tổng quan năng lực (dashboard)
│   ├── Phân tích theo từng dạng bài / chuyên đề
│   ├── Biểu đồ tiến bộ theo thời gian
│   └── Gợi ý lộ trình ôn tập cá nhân hoá
├── Thành tích (Achievements)
│   ├── Huy hiệu (Badges)
│   ├── Chuỗi ngày học liên tục (Streak)
│   └── Cấp độ người học (Level)
├── Vinh danh (Hall of Fame / Leaderboard)
│   ├── Bảng xếp hạng tuần/tháng/toàn thời gian
│   ├── Xếp hạng theo lớp/trường
│   └── Top điểm thi thử cao nhất
├── Tích luỹ điểm (Points & Rewards)
│   ├── Ví điểm thưởng
│   ├── Lịch sử tích/tiêu điểm
│   └── Cửa hàng đổi thưởng (voucher, tài liệu, quyền lợi)
├── Quản lý thành viên (chỉ Admin/Teacher)
│   ├── Danh sách học sinh/lớp
│   ├── Phân quyền
│   ├── Giao bài tập
│   └── Theo dõi hoạt động
└── Hồ sơ cá nhân (Profile)
```

---

## 4. CHI TIẾT TỪNG MODULE

### 4.1. Module "Luyện thi theo danh mục"

**Mục đích:** cho học sinh luyện sâu từng dạng bài xuất hiện trong đề thi thật.

**Yêu cầu chức năng:**
- Danh mục luyện tập map 1-1 với 4 dạng bài trong đề thi thật + 2 danh mục bổ trợ (ngữ pháp, từ vựng):
  1. Điền từ/câu vào quảng cáo, thông báo
  2. Sắp xếp câu/đoạn hội thoại
  3. Hoàn thành đoạn văn (Cloze test)
  4. Đọc hiểu
  5. Ngữ pháp trọng tâm lớp 12 (chia theo chuyên đề nhỏ: câu điều kiện, câu bị động, mệnh đề quan hệ, câu tường thuật, so sánh, liên từ...)
  6. Từ vựng theo chủ đề (chia theo topic: môi trường, công nghệ, giáo dục, sức khoẻ, văn hoá...)
- Mỗi danh mục có:
  - Bộ lọc: độ khó (Nhận biết / Thông hiểu / Vận dụng / Vận dụng cao), chủ đề, số câu mong muốn (10/20/30 câu).
  - Chế độ **luyện tự do** (không giới hạn thời gian, xem đáp án + giải thích ngay sau mỗi câu) và **luyện có tính giờ** (mô phỏng áp lực thời gian thật).
  - Sau mỗi câu: hiển thị đáp án đúng, giải thích chi tiết (ngữ pháp/từ vựng/dịch nghĩa), gợi ý mẹo làm bài.
  - Lưu tiến độ để học sinh có thể làm dở rồi quay lại.
- Kết thúc phiên luyện: hiển thị % đúng, thời gian trung bình/câu, cộng điểm thưởng, gợi ý tiếp tục luyện câu sai.

**Yêu cầu dữ liệu:** ngân hàng câu hỏi cần gắn tag: `dạng_bài`, `chuyên_đề`, `độ_khó`, `mức_năng_lực` (theo thang đánh giá tư duy Bộ GD&ĐT: Nhận biết/Thông hiểu/Vận dụng), `nguồn_đề`.

---

### 4.2. Module "Bài thi thử mô phỏng"

**Mục đích:** trải nghiệm sát nhất với thi thật để rèn tâm lý và quản lý thời gian.

**Yêu cầu chức năng:**
- Danh sách đề thi thử: đề minh hoạ Bộ GD&ĐT, đề của các Sở/trường, đề do giáo viên tự soạn, đề do AI sinh theo đúng ma trận.
- **Phòng thi ảo**: giao diện tối giản giống phòng thi thật:
  - 40 câu, 4 đáp án A/B/C/D, đồng hồ đếm ngược 50:00.
  - Thanh điều hướng câu hỏi (đánh dấu đã làm / chưa làm / đánh dấu để xem lại).
  - Không hiển thị đáp án/giải thích trong lúc làm bài (chỉ hiện sau khi nộp).
  - Cảnh báo khi còn 5 phút, tự động nộp bài khi hết giờ.
  - Chống gian lận cơ bản: không cho copy/paste, cảnh báo chuyển tab (tuỳ chọn bật/tắt).
- Sau khi nộp bài: chấm điểm tự động theo thang 10 (0,25đ/câu), hiển thị đáp án đúng/sai kèm giải thích từng câu, thời gian đã dùng.
- Lưu toàn bộ lịch sử các lần thi thử để so sánh tiến bộ.

---

### 4.3. Module "Báo cáo kết quả"

**Mục đích:** biến dữ liệu làm bài thành thông tin hữu ích cho việc ôn tập.

**Yêu cầu chức năng:**
- **Dashboard tổng quan:** điểm trung bình các lần thi thử, xu hướng tăng/giảm, số giờ đã luyện, tổng số câu đã làm.
- **Phân tích theo dạng bài:** biểu đồ radar/cột thể hiện % đúng ở từng dạng bài (Điền từ, Sắp xếp, Cloze, Đọc hiểu) và từng chuyên đề ngữ pháp — chỉ rõ điểm mạnh/điểm yếu.
- **Biểu đồ tiến bộ theo thời gian** (line chart điểm số các lần thi thử theo ngày/tuần).
- **Gợi ý lộ trình cá nhân hoá:** dựa trên dạng bài/chuyên đề có tỉ lệ sai cao nhất, hệ thống tự đề xuất danh mục luyện tập ưu tiên tuần tới.
- Xuất báo cáo PDF để học sinh/phụ huynh lưu hoặc giáo viên xem nhanh.
- Với Teacher/Admin: báo cáo tổng hợp theo lớp (điểm trung bình lớp, học sinh yếu cần hỗ trợ).

---

### 4.4. Module "Ghi nhận thành tích" (Achievements)

**Mục đích:** tạo động lực học tập bền vững qua gamification.

**Yêu cầu chức năng:**
- **Huy hiệu (Badges):** ví dụ "Hoàn thành 100 câu Đọc hiểu", "10 ngày luyện tập liên tục", "Đạt 9+ điểm thi thử đầu tiên", "Vua Ngữ pháp" (đúng 95% chuyên đề ngữ pháp).
- **Chuỗi ngày học (Streak):** đếm số ngày liên tiếp có hoạt động luyện tập, hiển thị biểu tượng lửa, cảnh báo/nhắc nhở khi sắp mất streak.
- **Hệ thống cấp độ (Level/XP):** mỗi hoạt động (luyện tập, thi thử, đăng nhập hằng ngày) cộng XP, lên cấp mở khoá danh hiệu (VD: "Học sinh mới" → "Chăm chỉ" → "Xuất sắc" → "Thủ khoa tiềm năng").
- Trang cá nhân hiển thị toàn bộ huy hiệu đã đạt/chưa đạt (dạng "bộ sưu tập"), có thể chia sẻ lên mạng xã hội.

---

### 4.5. Module "Vinh danh" (Hall of Fame / Leaderboard)

**Mục đích:** tạo tính cạnh tranh lành mạnh, công nhận công khai.

**Yêu cầu chức năng:**
- Bảng xếp hạng theo nhiều tiêu chí: điểm thi thử cao nhất, tổng điểm tích luỹ, số giờ luyện tập, streak dài nhất.
- Bộ lọc theo: Tuần / Tháng / Toàn thời gian; theo Trường / Lớp / Toàn quốc.
- "Top thủ khoa mô phỏng": vinh danh học sinh đạt điểm cao nhất trong các lần thi thử gần nhất (ví dụ Top 10 điểm 9.5+).
- Tuỳ chọn quyền riêng tư: học sinh có thể chọn ẩn danh/hiện tên trên bảng xếp hạng công khai.
- Thông báo (notification) khi học sinh lọt Top hoặc bị vượt hạng, khuyến khích quay lại luyện tập.

---

### 4.6. Module "Tích luỹ điểm" (Points & Rewards)

**Mục đích:** cơ chế thưởng vật chất/tinh thần khuyến khích duy trì thói quen học.

**Yêu cầu chức năng:**
- **Cách tích điểm:**
  - Hoàn thành 1 phiên luyện tập theo danh mục: +X điểm
  - Hoàn thành 1 bài thi thử: +Y điểm (thưởng thêm nếu điểm số cao)
  - Duy trì streak (mốc 7/30/100 ngày): thưởng điểm bậc thang
  - Đạt huy hiệu mới: thưởng điểm
  - Mời bạn bè tham gia: thưởng điểm (referral)
- **Ví điểm cá nhân:** hiển thị số dư, lịch sử tích/tiêu chi tiết (loại giao dịch, thời gian, số điểm).
- **Cửa hàng đổi thưởng:** đổi điểm lấy voucher khoá học, tài liệu PDF độc quyền, quyền làm thêm đề thi thử cao cấp, huy hiệu đặc biệt, v.v.
- Admin cấu hình được: tỉ lệ quy đổi, danh mục quà, thời hạn điểm (nếu có).

---

### 4.7. Module "Quản lý thành viên" (dành cho Admin/Teacher)

**Mục đích:** vận hành hệ thống, hỗ trợ giáo viên theo sát học sinh.

**Yêu cầu chức năng:**
- Quản lý danh sách học sinh: tìm kiếm, lọc theo lớp/trường, xem hồ sơ chi tiết (lịch sử luyện tập, điểm số, thành tích).
- Quản lý lớp học: tạo lớp, thêm/xoá học sinh, gán giáo viên phụ trách.
- Phân quyền vai trò (Admin/Teacher/Student/Parent).
- Giao bài tập/đề thi thử theo lớp, đặt deadline, theo dõi tỷ lệ hoàn thành.
- Quản lý ngân hàng câu hỏi: thêm/sửa/xoá câu hỏi, gắn tag dạng bài & độ khó, import hàng loạt (Excel/CSV).
- Cấu hình hệ thống điểm thưởng, ma trận đề thi, thông báo đẩy (push notification/email) nhắc học sinh ôn tập.
- Nhật ký hoạt động (audit log) phục vụ giám sát và bảo mật.

---

## 5. YÊU CẦU KỸ THUẬT ĐỀ XUẤT

| Hạng mục | Đề xuất |
|---|---|
| Frontend | React (Next.js), responsive, ưu tiên trải nghiệm mobile vì học sinh thường luyện trên điện thoại |
| Backend | Node.js/NestJS hoặc tương đương, kiến trúc REST/GraphQL API |
| Database | PostgreSQL (dữ liệu quan hệ: người dùng, đề thi, kết quả) + Redis (cache leaderboard, session) |
| Xác thực | JWT + OAuth (đăng nhập Google) |
| Lưu trữ file | S3-compatible storage cho tài liệu PDF, hình ảnh câu hỏi |
| Realtime | WebSocket cho đếm giờ phòng thi ảo, cập nhật leaderboard trực tiếp |
| Phân tích dữ liệu | Job định kỳ tính toán thống kê, gợi ý lộ trình cá nhân hoá (có thể dùng rule-based trước, nâng cấp ML sau) |

---

## 6. GỢI Ý MÀN HÌNH ƯU TIÊN XÂY DỰNG (MVP)

1. Đăng ký/Đăng nhập + Hồ sơ cá nhân cơ bản
2. Luyện tập theo danh mục (4 dạng bài chính) – chế độ tự do có giải thích đáp án
3. Phòng thi thử mô phỏng (tính giờ, chấm điểm tự động)
4. Dashboard báo cáo kết quả cơ bản (điểm số, % đúng theo dạng bài)
5. Hệ thống điểm thưởng + streak đơn giản
6. Bảng xếp hạng tuần
7. Trang quản trị cơ bản cho Admin (ngân hàng câu hỏi, danh sách học sinh)

→ Các module còn lại (huy hiệu nâng cao, cửa hàng đổi thưởng, gợi ý lộ trình AI, quản lý lớp chi tiết) triển khai ở giai đoạn 2.

---

## 7. LƯU Ý QUAN TRỌNG

- Đây là prompt/spec kỹ thuật, **không phải nội dung đề thi chính thức**. Ngân hàng câu hỏi cần được biên soạn bởi giáo viên chuyên môn, đối chiếu đề minh hoạ và đề thi thật do Bộ GD&ĐT công bố hằng năm.
- Cấu trúc đề thi có thể thay đổi theo từng năm — nền tảng nên thiết kế để admin cập nhật ma trận đề mà không cần sửa code.
- Với các con số cụ thể (điểm thưởng, ngưỡng huy hiệu, tỉ lệ quy đổi), đây là gợi ý khởi điểm — có thể điều chỉnh theo dữ liệu hành vi thực tế của người dùng sau khi ra mắt.
