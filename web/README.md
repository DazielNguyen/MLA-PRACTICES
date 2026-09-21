# ML Practice

Ứng dụng ôn tập bằng React, TypeScript và Vite. Mỗi người có hồ sơ riêng, không cần nhập email hoặc mật khẩu. Hỗ trợ lưu trên trình duyệt và đồng bộ Supabase.

Để bật Supabase, làm theo [hướng dẫn kết nối](SUPABASE_SETUP.md).

## Chạy trên máy

Mở Terminal tại thư mục `MLA-PRACTICES`:

```bash
cd web
npm ci
npm run dev
```

Mở địa chỉ được Terminal hiển thị, mặc định là **http://127.0.0.1:5173/**.

Dùng Node.js 24 LTS. Mã nguồn yêu cầu Node.js từ 22.12 trở lên.

## Các chế độ học

| Chế độ | Cách dùng |
| --- | --- |
| Học nhanh | Chọn là chấm, xem đáp án và giải thích ngay. Trang chủ mở 10 câu ngẫu nhiên. |
| Flashcard | Lật thẻ, đánh dấu đã thuộc, lọc thẻ chưa thuộc hoặc đã lưu. |
| Luyện cùng đáp án | Chọn đủ phương án rồi bấm **Kiểm tra đáp án**. Câu đã kiểm tra sẽ khóa lựa chọn. |
| Tự kiểm tra | Trả lời trước, xem toàn bộ đáp án sau khi nộp bài. Không giới hạn thời gian. |
| Thi thử | Chọn số câu và thời gian. Đáp án ẩn cho đến khi nộp bài. |
| Ngân hàng câu hỏi | Tìm theo từ khóa hoặc số câu. Xem hình gốc, giải thích và tài liệu đối chiếu. |
| Tiến trình | Xem lịch sử, kết quả và xuất hoặc nhập bản sao JSON. |

Bộ lọc hỗ trợ câu sai gần nhất, câu đã lưu, câu chưa luyện, khoảng số câu và bộ MLS/MLA-C01.

Trong Ngân hàng câu hỏi, tìm `mla-c01 q228` để mở câu nguồn Q228, kể cả khi đã gộp với bản lặp.

Câu chọn nhiều chỉ đúng khi chọn đủ và chính xác toàn bộ phương án. Câu bỏ trống không được điểm.

Trong phiên làm bài, dùng phím **1–6** để chọn phương án A–F. Dùng **← / →** để chuyển câu.

Trong **Học nhanh**, chọn đáp án để xem kết quả ngay. Câu chọn nhiều chờ đủ số phương án rồi chấm.

Sau khi xem kết quả, bấm lại trên một đáp án, hoặc nhấn **Enter / Space** để sang câu tiếp.

Phím **→** cũng sang câu tiếp sau khi chấm. Giữ phím không tự trả lời hoặc bỏ qua nhiều câu.

Câu cuối mở kết quả bằng cùng thao tác. Dùng **Kết thúc** để lưu và kết thúc phiên sớm.

Phần giải thích hiện đáp án đúng, ý chính và lý do lựa chọn của bạn sai. Mở **Why other options are incorrect** để đọc thêm.

Để chọn số câu và bộ lọc, vào **Luyện tập → Học nhanh** trước khi bắt đầu.

Chuyển câu có hiệu ứng ngắn. Ứng dụng tắt hiệu ứng khi thiết bị bật chế độ giảm chuyển động.

Trong flashcard, dùng **Space** để lật thẻ khi con trỏ không nằm trên nút hoặc ô nhập.

## Người học, tiến trình và đồng hồ

Nhập tên tại màn hình đầu để tạo hồ sơ. Tên người đang học luôn xuất hiện ở góc trên.

Mỗi tab giữ người học và bài đang mở riêng. Trang **Tiến trình** gộp lịch sử theo hồ sơ đang chọn.

Để đổi người học, mở **Người học → Đổi người học**. Bài chưa hoàn thành vẫn được giữ lại.

Mở **Tiến trình → Bài chưa hoàn thành** để tiếp tục một phiên đã lưu. Quyền làm phiên đó chuyển sang tab này.

Khi đã cấu hình Supabase, trang **Người học** có mã tiếp tục riêng. Mã này mở lại cùng hồ sơ trên thiết bị khác.

Bật **Chia sẻ lịch sử học tập** để hồ sơ xuất hiện trong **Học chung**. Người khác chỉ xem các bài đã hoàn thành.

Nếu chưa cấu hình Supabase, các tính năng hồ sơ vẫn hoạt động trên trình duyệt hiện tại.

Lựa chọn được lưu trên máy ngay. Đồng bộ Supabase chạy nền, gom thay đổi và gửi từng lượt nối tiếp.

Bạn có thể tiếp tục học khi mạng chậm. Thay đổi trong lúc gửi được giữ lại cho lượt đồng bộ tiếp theo.

Đồng hồ thi dùng thời hạn cố định. Đổi tab hoặc tải lại trang không dừng đồng hồ.

Khi hết giờ, bài được tự nộp. Nếu trình duyệt đã đóng, bài được chấm khi bạn tiếp tục phiên đó.

Ứng dụng giữ dữ liệu v1 gốc sau khi chuyển sang hồ sơ đầu tiên. Các bản ghi v2 lưu theo hồ sơ và mã phiên.

Để sao lưu, chọn **Xuất bản sao JSON**. Để gộp dữ liệu, chọn **Nhập bản sao** và chọn file đã xuất.

Ứng dụng kiểm tra file và tải bản sao hiện tại xuống trước khi gộp. Bản sao JSON không chứa mã tiếp tục riêng.

Dữ liệu trình duyệt thuộc từng địa chỉ web. `localhost`, `127.0.0.1` và tên miền Vercel có vùng lưu riêng.

Nếu xóa dữ liệu trình duyệt, dùng mã Supabase hoặc bản sao JSON để khôi phục.

## Nguồn câu hỏi

Ngân hàng học có **567 câu**: 325 câu MLS và 242 câu MLA-C01. Có thêm 7 bản MLS cũ phục vụ lịch sử.

ZIP có 286 mục. Sau khi gộp 44 bản lặp, còn 242 câu. Giữ 22 hình MLS và 16 ảnh MLA khác nhau.

MLS và MLA-C01 là hai bộ nguồn riêng. Chọn bộ trong Luyện tập, Thi thử, Flashcard hoặc Ngân hàng câu hỏi.

| Trạng thái | Số câu | Cách sử dụng |
| --- | ---: | --- |
| Đã đối chiếu | 480 | Có chấm điểm; gồm 270 câu MLS và 210 câu MLA. |
| Dịch vụ cũ | 27 | Có chấm điểm theo bối cảnh cũ. Có thể loại bằng bộ lọc. |
| Theo nguồn | 0 | Trạng thái dự phòng cho các lần nhập tiếp theo. |
| Cần xác minh | 60 | Không chấm điểm. Luôn loại khỏi thi thử. Có thể đọc trong luyện tập và flashcard. |

Toàn bộ 567 câu học và 7 bản lưu cho lịch sử có giải thích tiếng Anh cho từng lựa chọn.

Phần đáp án gồm **Correct answer**, **Key Concept**, **Why this is correct** và **Why other options are incorrect**.

Câu **Cần xác minh** dùng **Answer not finalized** và phân tích từng lựa chọn theo điều kiện của đề.

Thi thử có 507 câu chấm được, hoặc 480 câu khi loại dịch vụ cũ. Riêng MLA có 210 câu chấm được.

Tỷ lệ đúng của bài luyện không quy đổi thành điểm AWS. Hint chỉ hiện trong luyện cùng đáp án, flashcard và thư viện.

Mã câu cũ vẫn đọc được trong lịch sử. Mã MLA bằng 332 cộng số câu nguồn được giữ. Khoảng trống là các bản đã gộp.

Xem [báo cáo giải thích và sửa đáp án](../BAO_CAO_GIAI_THICH_DAP_AN.md), [báo cáo gộp ban đầu](../BAO_CAO_GOP_BO_DE.md), [Markdown tổng hợp](../output/merged/ML_COMBINED.md) và [file Quizlet](../output/merged/QUIZLET_COMBINED.md).

Trong Quizlet, dùng TAB để tách hai mặt thẻ và dòng mới để tách thẻ. File có 567 thẻ.

Lịch sử giữ các lựa chọn đã lưu. Điểm bài cũ được tính lại theo khóa và trạng thái hiện tại khi mở kết quả.

Thống kê lượt luyện đã ghi không được viết lại. Vì vậy, thống kê cũ có thể khác điểm bài sau khi sửa khóa.

File `src/data/questions.json` giữ 574 bản ghi, gồm 567 câu học và 7 biến thể cho lịch sử. Các hình nằm trong `public/images/`.

Ứng dụng không cần PDF hoặc thư mục `tmp` khi chạy hay build. Khi thay đổi bộ dữ liệu đã rà soát, cập nhật bằng:

```bash
python3 scripts/import-questions.py
npm test
npm run build
```

Lệnh nhập cần `../tmp/pdfs/reviewed_questions.json`, các hình gốc và `../MLA-C01_Web_Study_Bundle.zip`.

Quyết định gộp thủ công nằm trong `scripts/bank-review.json` và dùng số câu nguồn MLA.

Giải thích nằm trong `scripts/explanations/`. Khóa, trạng thái, ghi chú và nguồn đối chiếu bổ sung nằm trong `scripts/answer-review.json`.

Hai phần bổ sung dùng mã câu của ngân hàng web. Lệnh nhập dừng nếu thiếu giải thích hoặc sai số lựa chọn.

Dữ liệu nguồn và các nhật ký được xuất vào `../output/merged/`. `STUDY_DUPLICATE_AUDIT.json` ghi 7 cặp biến thể MLS đã gộp.

## Câu đã gộp và tiến trình cũ

Các cặp dùng chung một câu cho phiên học mới: 269→70, 271→81, 188→86, 295→109, 202→113, 193→143 và 270→197.

Quyết định nằm trong `scripts/study-duplicates.json`. Chỉ các cặp đã đọc và đối chiếu thủ công được gộp.

Câu có `duplicateOf` không xuất hiện trong phiên học mới hoặc file Quizlet. Bản gốc vẫn phục vụ bài đã lưu và bản sao tiến trình.

Lịch sử giữ mã câu, lựa chọn và khóa gốc của từng phiên bản. Ký tự đáp án không được chuyển giữa các bản đã đảo lựa chọn.

Dấu lưu và thẻ đã thuộc của bản cũ áp dụng cho cả nhóm. Bộ lọc câu sai dùng lần trả lời gần nhất trong nhóm.

Flashcard đã lưu được gộp khi mở, giữ vị trí của nhóm đang học. Tìm `#269` hoặc `mls q269` trong thư viện sẽ mở #70.

Tổng số câu đã luyện tính theo nhóm. Tổng lượt trả lời vẫn bao gồm các lần làm bản cũ.

Các câu cùng tình huống nhưng hỏi khác mục tiêu vẫn riêng biệt, như #14 về accuracy và #25 về recall.

## Đưa lên Vercel

Ứng dụng đã có `vercel.json`. Có thể chạy chỉ với bộ nhớ trình duyệt. Để đồng bộ nhiều thiết bị, thêm hai biến public của Supabase theo [hướng dẫn](SUPABASE_SETUP.md).

### Qua GitHub

1. Đưa mã nguồn lên repository GitHub của bạn.
2. Tại Vercel, tạo project từ repository đó.
3. Đặt **Root Directory** thành `web`.
4. Kiểm tra các giá trị sau.

| Mục | Giá trị |
| --- | --- |
| Framework Preset | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | 24.x |

5. Chọn **Deploy**.
6. Mở URL Vercel trả về.

Nếu repository chỉ chứa nội dung của `web`, giữ Root Directory mặc định.

### Qua Terminal

Với project hiện tại đã đặt Root Directory là `web`, chạy tại thư mục gốc repository:

```bash
npx vercel login
npx vercel
```

Sau khi kiểm tra bản preview, đưa bản production lên bằng:

```bash
npx vercel --prod
```

Chỉ thư mục `web` cần dùng cho ứng dụng. PDF và các bản giải nén không cần đưa vào project Vercel.

Cấu hình theo [tài liệu Vite của Vercel](https://vercel.com/docs/frameworks/frontend/vite).
Phiên bản Node.js theo [danh sách Vercel hỗ trợ](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Kiểm tra mã nguồn

Chạy trong thư mục `web`:

```bash
npm test
npm run build
npm run test:e2e
# Nếu máy có PostgreSQL:
npm run test:sql
```

Kiểm tra trình duyệt dùng Google Chrome qua Playwright. Máy chạy cần cài Google Chrome.

Các kiểm tra gồm chấm câu chọn nhiều, ẩn đáp án, tải lại trang, tự nộp khi hết giờ và khôi phục bản sao.

Ảnh kiểm tra giao diện nằm trong `test-results/`. Bộ kiểm tra dùng dữ liệu trình duyệt riêng.

Cổng 5175 chạy không kết nối Supabase; cổng 5174 dùng API giả lập. Kiểm tra không ghi vào project Supabase thật.

Để xem bản build:

```bash
npm run preview
```

Mở địa chỉ Terminal hiển thị, mặc định là `http://127.0.0.1:4173/`.
