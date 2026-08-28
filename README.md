# Nền tảng luyện thi Tiếng Anh THPT 2026

Web app luyện thi Tiếng Anh tốt nghiệp THPT, bám cấu trúc đề áp dụng từ 2025
(Quyết định 4068/QĐ-BGDĐT): **40 câu — 50 phút — 0,25 điểm/câu — thang 10**.

Dựng theo spec trong [`prompt-nen-tang-luyen-thi-tieng-anh-thpt-2026.md`](./prompt-nen-tang-luyen-thi-tieng-anh-thpt-2026.md).

---

## Công nghệ

| Lớp | Lựa chọn |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript |
| Giao diện | Tailwind CSS v4, design token trong `src/app/globals.css` |
| Biểu đồ | Recharts (đường tiến bộ) + HTML thuần (cột tỉ lệ đúng) |
| Backend | Next.js Server Actions + hàm Postgres |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Chữ | Be Vietnam Pro (giao diện) · Source Serif 4 (đoạn văn tiếng Anh) |
| Đọc file | ExcelJS (.xlsx) · PapaParse (.csv) · Mammoth (.docx) |
| Trích xuất AI | Claude (`claude-opus-5`) qua `@anthropic-ai/sdk` — tuỳ chọn |

---

## Chạy lần đầu

### 1. Cài phụ thuộc

```bash
npm install
```

### 2. Dựng database

**Cách A — chạy local (cần Docker Desktop đang bật):**

```bash
npx supabase start
```

Lệnh này tự chạy migration trong `supabase/migrations/` và nạp dữ liệu mẫu
trong `supabase/seed/`. Kết thúc, nó in ra `API URL` và `anon key`.

**Cách B — dùng Supabase Cloud:**

Tạo project tại [supabase.com](https://supabase.com), rồi:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Sau đó chạy lần lượt 5 file trong `supabase/seed/` bằng SQL Editor trên
dashboard (đúng thứ tự 01 → 05).

### 3. Khai báo biến môi trường

```bash
cp .env.example .env.local
```

Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` lấy ở bước 2.

### 4. Chạy app

```bash
npm run dev
```

Mở http://localhost:3000, đăng ký một tài khoản và bắt đầu.

### 5. Tự cấp quyền quản trị

Tài khoản mới mặc định là `student`. Để mở khu Quản trị, chạy trong SQL Editor:

```sql
update profiles set role = 'admin' where id = (
  select id from auth.users where email = 'email-cua-ban@example.com'
);
```

### 6. Bật đăng nhập Google (tuỳ chọn)

Học sinh vẫn đăng nhập bằng email/mật khẩu nếu bỏ qua bước này.

1. Vào [Google Cloud Console](https://console.cloud.google.com) → tạo project.
2. **APIs & Services → OAuth consent screen**: chọn External, điền tên ứng dụng.
3. **Credentials → Create credentials → OAuth client ID**, loại *Web application*:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs:
     - local: `http://127.0.0.1:54321/auth/v1/callback`
     - cloud: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Điền `SUPABASE_AUTH_GOOGLE_CLIENT_ID` và `SUPABASE_AUTH_GOOGLE_SECRET` vào
   `.env.local`, rồi đổi `enabled = false` thành `true` ở mục
   `[auth.external.google]` trong `supabase/config.toml`.
5. `npx supabase stop && npx supabase start` để nạp lại cấu hình.

Trên Supabase Cloud thì khai hai giá trị đó ở **Authentication → Providers →
Google** thay vì sửa `config.toml`.

### 7. Bật lấy đề từ Google Drive (tuỳ chọn)

1. Cùng project ở bước 6, vào **Library** bật **Google Drive API** và
   **Google Picker API**.
2. **Credentials → Create credentials → API key**. Nên giới hạn key theo HTTP
   referrer (`http://localhost:3000/*`).
3. Điền vào `.env.local`:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — dùng lại OAuth client ID ở bước 6
   - `NEXT_PUBLIC_GOOGLE_API_KEY` — API key vừa tạo

Hệ thống chỉ xin scope `drive.file`, nghĩa là Google **chỉ cấp quyền đọc đúng
file bạn chọn** trong hộp thoại, không phải toàn bộ Drive. Access token sống
trong bộ nhớ trang, gửi kèm đúng một lần rồi bỏ — không lưu database, không lưu
localStorage. Vì vậy không cần refresh token và không có gì để rò rỉ.

### 8. Bật đọc file Word bằng AI (tuỳ chọn)

Điền `ANTHROPIC_API_KEY` (lấy ở [console.anthropic.com](https://console.anthropic.com))
vào `.env.local`. Không có khoá thì đường Excel/CSV vẫn chạy bình thường, giao
diện nói rõ trạng thái này.

---

## Kiểm thử

```bash
npm run db:verify   # 72 kiểm tra schema/seed/luồng thi/lịch/nhập liệu, không cần Docker
npm run typecheck   # kiểm tra kiểu TypeScript
npm run build       # build production
```

`db:verify` chạy toàn bộ SQL trên [PGlite](https://pglite.dev) (Postgres biên
dịch sang WebAssembly) nên **không cần Docker hay Supabase**. 72 kiểm tra, gồm:

- dựng schema và nạp dữ liệu mẫu
- mô phỏng trọn một lượt thi 40 câu: điểm số, điểm thưởng, streak, huy hiệu
- luyện tự do chỉ lộ đáp án ở câu ĐÃ trả lời, không lộ trước
- thống kê chỉ tính bài đã nộp của chính mình
- sửa ma trận đề là all-or-nothing
- bảng xếp hạng, tuỳ chọn ẩn danh, và các ràng buộc bảo mật
- khung giờ mở–đóng chặn ở máy chủ, hạn nộp cắt theo giờ đóng
- giới hạn số lượt, đề riêng của lớp ẩn với học sinh ngoài lớp
- nhập câu hỏi: bắt lỗi từng dòng, gộp ngữ liệu, chặn commit trùng

Mọi thay đổi SQL nên chạy lệnh này trước khi commit.

---

## Cấu trúc thư mục

```
src/
├── app/
│   ├── (app)/                  # Khu vực cần đăng nhập, có thanh điều hướng
│   │   ├── bang-dieu-khien/    # Tổng quan năng lực
│   │   ├── luyen-tap/          # Luyện theo danh mục (6 danh mục)
│   │   ├── lam-bai/            # Màn làm bài của phiên luyện tập
│   │   ├── thi-thu/            # Danh sách đề + lịch sử
│   │   ├── ket-qua/            # Kết quả kèm giải thích từng câu
│   │   ├── bao-cao/            # Biểu đồ năng lực + lộ trình
│   │   ├── thanh-tich/         # Huy hiệu, streak, cấp độ
│   │   ├── vinh-danh/          # Bảng xếp hạng
│   │   ├── diem-thuong/        # Ví điểm
│   │   ├── ho-so/              # Hồ sơ cá nhân
│   │   └── quan-tri/           # Ngân hàng câu hỏi, học sinh, ma trận đề,
│   │                           #   nhập câu hỏi, lịch thi & giao bài
│   ├── phong-thi/              # Phòng thi ảo (KHÔNG có thanh điều hướng)
│   ├── dang-nhap/ dang-ky/     # Xác thực
│   └── globals.css             # Design token
├── components/                 # UI dùng chung
├── lib/
│   ├── import/                 # Đọc Excel/CSV, trích xuất bằng AI, file mẫu
│   └── actions/                # Server action
└── middleware.ts               # Bảo vệ route + làm mới session

supabase/
├── migrations/                 # Schema, RLS, hàm Postgres
└── seed/                       # Dữ liệu mẫu (74 câu hỏi + 1 đề thi thử)

scripts/verify-sql.mjs          # Bộ kiểm thử SQL chạy bằng PGlite
design-system/                  # Design system sinh từ ui-ux-pro-max
```

---

## Nguyên tắc thiết kế đã áp dụng

**Điểm số do server quyết định.** Client chỉ gửi lựa chọn A/B/C/D. Hạn nộp bài
(`deadline_at`) do Postgres đặt khi bắt đầu lượt thi, và `save_answer` /
`submit_attempt` đều đối chiếu với `now()` của database. Học sinh sửa giờ máy
hay can thiệp JavaScript đều không kéo dài được thời gian làm bài.

**Đáp án không rời khỏi server khi đang thi.** RLS chặn học sinh `select` trực
tiếp bảng `questions`. Câu hỏi tới tay học sinh qua hàm `get_attempt_questions`,
hàm này chỉ trả `correct_key` và `explanation` khi ở chế độ luyện tự do hoặc sau
khi đã nộp bài.

**Ma trận đề là dữ liệu, không phải mã nguồn.** Số câu mỗi dạng, thời gian làm
bài và thang điểm nằm trong bảng `exam_matrices` / `exam_matrix_items`, sửa được
tại `/quan-tri/ma-tran-de`. Khi Bộ GD&ĐT điều chỉnh cấu trúc đề, admin tự cập
nhật mà không cần lập trình viên.

**Màu không bao giờ là kênh thông tin duy nhất.** Trạng thái đúng/sai luôn kèm
chữ và biểu tượng. Biểu đồ cột dùng một sắc màu duy nhất vì độ dài cột đã mã hoá
độ lớn — bộ ba xanh/cam/đỏ ban đầu chỉ cách nhau ΔE 2.8 với người mù màu deutan,
tức học sinh mù màu đỏ-lục không phân biệt được.

---

## Vài chỗ dễ vấp (đã gặp và đã sửa)

Ghi lại vì đây là những lỗi chỉ lộ ra khi chạy thật, không lỗi nào bị `tsc` hay
`next build` bắt được:

- **RLS chặn học sinh đọc bảng `questions`** (cố ý, để không lộ đáp án). Mọi
  nhu cầu đọc dữ liệu câu hỏi từ phía học sinh phải đi qua hàm security definer
  — xem `question_bank_counts()` và `get_attempt_questions()`.
- **Cờ lộ đáp án phải xét theo từng câu**, không theo cả lượt làm bài, nếu
  không phiên luyện tự do sẽ hiện sẵn đáp án ngay khi mở.
- **`OptionList` dùng chung cho server và client.** Khi không truyền `onSelect`
  thì tuyệt đối không được gắn `onChange` — hàm không truyền qua được ranh giới
  server/client và trang kết quả sẽ đổ lỗi 500 lúc render.
- **supabase-js gửi mỗi lệnh ghi thành một transaction riêng.** Thao tác cần
  nguyên tử (sửa ma trận đề) phải gói vào một hàm Postgres, xem
  `update_exam_matrix()`.
- **`z.string().uuid()` của Zod 4 kiểm tra cả bit version/variant RFC 4122**,
  loại oan những UUID mà Postgres chấp nhận. Dùng `z.guid()` cho id lấy từ DB.
- **Đừng viết `where ... or true`** trong hàm thống kê: nó vô hiệu hoá bộ lọc và
  LEFT JOIN sẽ kéo theo cả dữ liệu lẽ ra bị loại.

## Điều cần biết trước khi dùng thật

**Ngân hàng câu hỏi mẫu chưa được thẩm định.** 74 câu trong `supabase/seed/` do
AI biên soạn để chạy thử toàn bộ luồng và làm khuôn mẫu định dạng. Trước khi cho
học sinh dùng, giáo viên chuyên môn cần rà soát lại từng câu và đối chiếu với đề
minh hoạ Bộ GD&ĐT công bố.

**Số câu mỗi dạng trong ma trận là ước lượng.** Spec không nêu con số chính
thức, nên ma trận mặc định dùng phân bổ 4 / 5 / 10 / 21 cho bốn dạng bài. Cần
đối chiếu với đề minh hoạ mới nhất và sửa lại tại `/quan-tri/ma-tran-de`.

**Ngày thi đếm ngược ở trang chủ là ngày dự kiến.** Sửa `EXAM_DATE_ESTIMATE`
trong `src/lib/exam-config.ts` khi có lịch chính thức.

---

## Chưa làm (giai đoạn 2 theo spec)

- Cửa hàng đổi thưởng (màn hình đã có, nêu rõ trạng thái chưa mở)
- Quản lý lớp học chi tiết (đã có: tạo lớp, giao đề, khung giờ, giới hạn lượt)
- Xuất báo cáo PDF
- Tài khoản phụ huynh
- Sinh đề tự động theo ma trận (bảng `exam_matrices` đã sẵn sàng cho việc này)
- Thêm học sinh vào lớp bằng mã mời (cột `classes.join_code` đã có, chưa dùng)
- Theo dõi thư mục Drive để tự nhập (hiện phải chọn file thủ công)
