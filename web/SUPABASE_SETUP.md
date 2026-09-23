# Kết nối Supabase cho ML Practice

Ứng dụng đã kết nối Supabase và chạy trên Vercel. Hướng dẫn dưới đây dùng khi tạo lại môi trường hoặc kết nối project khác.

Nếu chưa cấu hình, ứng dụng vẫn lưu hồ sơ trên trình duyệt. Trang **Người học** hiển thị trạng thái lưu hiện tại.

## 1. Tạo project

1. Mở [Supabase Dashboard](https://supabase.com/dashboard).
2. Tạo một project mới cho ứng dụng.
3. Chờ cơ sở dữ liệu sẵn sàng.

Mật khẩu cơ sở dữ liệu không dùng trong mã frontend.

## 2. Bật phiên ẩn danh

1. Mở **Authentication → Sign In / Providers**.
2. Bật **Allow anonymous sign-ins**.
3. Lưu cấu hình.

Ứng dụng tự tạo phiên Supabase khi kết nối. Người học chỉ nhập tên, không nhập email hay mật khẩu.

Phiên ẩn danh dùng vai trò `authenticated`. Chính sách dữ liệu gắn quyền với mã người dùng trong phiên này. [Tài liệu Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)

Nếu bật CAPTCHA cho anonymous sign-in, cần tích hợp widget và truyền `captchaToken` trong `ensureIdentity()` trước khi dùng.

## 3. Tạo các bảng và chính sách

1. Mở **SQL Editor** trong project.
2. Tạo một truy vấn mới.
3. Dán toàn bộ nội dung [supabase/001_study_profiles.sql](supabase/001_study_profiles.sql).
4. Chạy truy vấn **một lần** trên project mới.
5. Chạy tiếp [supabase/002_expanded_question_bank.sql](supabase/002_expanded_question_bank.sql) để hỗ trợ bộ tổng hợp.
6. Chạy [supabase/003_original_question_bank.sql](supabase/003_original_question_bank.sql) để hỗ trợ 352 câu tự biên soạn.
7. Kiểm tra ba bảng: `ml_profiles`, `ml_memberships` và `ml_records`.

Dùng các migration theo thứ tự `001`, `002`, rồi `003`. Các file `test-bootstrap.sql` và `security-tests.sql` chỉ dành cho kiểm tra cục bộ.

Khi nâng cấp từ bộ 332 câu, chạy `002` rồi `003`. Project đã có `002` chỉ cần chạy `003`; không tạo lại bảng.

Migration `002` mở giới hạn đến 618. Migration `003` mở giới hạn đến 1352 và cho phép mã câu có bốn chữ số. Cả hai giữ nguyên lịch sử, thành viên và chính sách truy cập.

SQL tạo RLS, quyền đọc theo hồ sơ và các hàm ghi có kiểm tra quyền. Không cần tắt RLS hoặc mở quyền ghi công khai. [Tài liệu RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

## 4. Lấy cấu hình public

Mở hộp thoại **Connect** hoặc **Settings → API Keys** của project. Lấy hai giá trị sau:

- **Project URL**, dạng `https://PROJECT_REF.supabase.co`.
- **Publishable key**, bắt đầu bằng `sb_publishable_`.

Project dùng key cũ có thể dùng **anon key** thay thế. Không dùng `sb_secret_...` hoặc `service_role` trong frontend. [Tài liệu API keys](https://supabase.com/docs/guides/api/api-keys)

## 5. Chạy trên máy

Tại thư mục `web`, tạo file cấu hình:

```bash
cp .env.example .env.local
```

Điền hai giá trị của project vào `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Nếu dùng anon key cũ, thay dòng publishable key bằng:

```dotenv
VITE_SUPABASE_ANON_KEY=YOUR_LEGACY_ANON_KEY
```

Khởi động lại Vite sau khi thay cấu hình:

```bash
npm run dev
```

Ứng dụng kiểm tra cấu hình khi khởi động và build. Secret key hoặc service_role key làm build dừng trước khi tạo bundle.

## 6. Cấu hình trên Vercel

1. Mở project Vercel.
2. Giữ **Root Directory** là `web`.
3. Mở **Settings → Environment Variables**.
4. Thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Chọn môi trường cần dùng, ví dụ **Production** và **Preview**.
6. Deploy lại project.

Giá trị `VITE_` được đưa vào ứng dụng khi build. Thay biến môi trường cần một lần deploy mới.

## 7. Kiểm tra với hai thiết bị

1. Trên thiết bị A, tạo hồ sơ “Duy”.
2. Làm một bài hoặc đánh dấu một flashcard đã thuộc.
3. Mở **Người học**.
4. Chờ trạng thái **Các thay đổi đã được gửi lên Supabase**.
5. Chọn **Xem mã tiếp tục → Sao chép link**.
6. Trên thiết bị B, mở link đó.
7. Chọn **Mở hồ sơ bằng mã**.
8. Kiểm tra tên, lịch sử và số thẻ đã thuộc.

Trên cùng trình duyệt, nhập tên đã lưu sẽ mở hồ sơ cũ. Nếu có nhiều hồ sơ trùng tên, chọn đúng thẻ hồ sơ.

Trên thiết bị khác, dùng mã tiếp tục để mở cùng hồ sơ. Chỉ nhập tên không nối được hai thiết bị.

Mã được tạo bằng 32 byte ngẫu nhiên. Database chỉ giữ hash SHA-256 của mã. Mã gốc lưu trên thiết bị có quyền học.

Người có mã tiếp tục có thể học và lưu bài dưới hồ sơ đó. Giữ riêng mã này.

## 8. Chia sẻ lịch sử cho nhóm

1. Mở trang **Người học**.
2. Bật **Chia sẻ lịch sử học tập**.
3. Mở **Học chung**.
4. Chọn tên người học để xem kết quả.

Mặc định, lịch sử không được chia sẻ. Khi bật, người vào cùng website có thể xem tên và tối đa 100 bài hoàn thành gần nhất.

Trang Học chung chỉ cho xem. Nó không cấp quyền tiếp tục hoặc sửa bài. Bài đang làm không xuất hiện trong lịch sử chung.

Các hồ sơ lưu trên cùng trình duyệt có thể được chọn lại tại màn hình đầu. Đây là trình duyệt dùng chung, không có khóa từng hồ sơ.

## Cách lưu tiến trình

| Dữ liệu | Cách lưu |
| --- | --- |
| Người học đang chọn | Riêng từng tab trong `sessionStorage`. |
| Bài đang mở | Riêng từng tab và hồ sơ. |
| Mỗi bài làm | Một bản ghi theo mã phiên, không ghi đè bài ở tab khác. |
| Lượt chấm câu hỏi | Một mã duy nhất gồm mã phiên và số câu. Gửi lại không tính hai lần. |
| Câu đã lưu, thẻ đã thuộc | Một bản ghi cho mỗi câu. Thay đổi mới hơn được giữ. |
| Tiến trình cũ | Chuyển vào hồ sơ được chọn. Bản v1 trên máy vẫn được giữ. |
| Bản sao JSON | Xuất định dạng v2. Nhập v1 hoặc v2 để gộp vào hồ sơ hiện tại. |

Thay đổi lưu ngay trên trình duyệt. Ứng dụng gom thay đổi khoảng 700 ms trước khi gửi lên Supabase.

Ứng dụng kiểm tra đồng bộ mỗi 15 giây. Dữ liệu từ thiết bị khác được tải khoảng 30 giây một lần, hoặc khi quay lại cửa sổ.

Nút **Đồng bộ ngay** gửi thay đổi và tải dữ liệu mới. Khi mất kết nối, dữ liệu chờ trong trình duyệt và được thử gửi lại.

Mở **Tiến trình → Bài chưa hoàn thành → Tiếp tục** để chuyển quyền làm một phiên sang tab này. Các tab khác ngừng chỉnh phiên đó khi nhận cập nhật.

Nếu đang mất mạng, việc chuyển quyền giữa thiết bị chờ đến lần đồng bộ kế tiếp. Tránh tiếp tục cùng một bài ở hai thiết bị đang offline.

Đồng hồ thi giữ thời hạn gốc. Bài hết giờ được chấm khi tab đang làm hoạt động hoặc khi bạn mở lại phiên đó.

Bản v1 chỉ có thống kê tổng. Khi gộp nhiều bản v1 chồng lặp, ứng dụng giữ bộ đếm lớn hơn thay vì cộng trùng.

## Khắc phục lỗi kết nối

| Hiện tượng | Kiểm tra |
| --- | --- |
| “Chưa cấu hình Supabase” | Có đủ hai biến môi trường và đã khởi động hoặc deploy lại chưa? |
| Không tạo được phiên ẩn danh | Đã bật Anonymous Sign-Ins chưa? CAPTCHA có đang yêu cầu token không? |
| Không tìm thấy hàm `ml_...` | Đã chạy file SQL trong đúng project chưa? |
| Không mở được bằng mã | Đã đồng bộ hồ sơ gốc chưa? Hai thiết bị có cùng project URL không? |
| Có tên nhưng không có bài trong Học chung | Chỉ bài đã nộp và hồ sơ bật chia sẻ mới xuất hiện. |
| Đang chờ đồng bộ | Kiểm tra kết nối, rồi bấm Đồng bộ ngay. |

Không dùng cách tắt RLS để xử lý lỗi. Trang Người học hiển thị chi tiết lỗi từ Supabase.

## Kiểm tra dành cho lập trình viên

```bash
npm test
npm run test:e2e
npm run test:sql
npm run build
```

Kiểm tra trình duyệt cần Google Chrome. Cổng `5175` chạy không kết nối Supabase; cổng `5174` dùng API giả lập.

Các bài kiểm tra này không gửi dữ liệu ra project thật.

Kiểm tra SQL cần PostgreSQL và `pg_config` trong PATH. Script tạo database tạm, chạy kiểm tra, rồi dừng và xóa database tạm.

Các kiểm tra SQL bao gồm RLS, chia sẻ chỉ đọc, khôi phục danh tính, chuyển tab, chống chấm trùng và giới hạn bộ câu hỏi mới.

Bản cập nhật được kiểm tra bằng PostgreSQL cục bộ và API giả lập. Migration `002` và `003` đã được xác nhận trên project thật. `003` được áp dụng ngày 22/09/2026.

Khi cấu hình project khác, làm thêm quy trình hai thiết bị ở bước 7.
