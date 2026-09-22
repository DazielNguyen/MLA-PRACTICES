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

Web chỉ phục vụ MLA-C01. Bộ lọc hỗ trợ câu sai gần nhất, câu đã lưu, câu chưa luyện và khoảng số câu.

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

## Nguồn câu hỏi trên web

Ngân hàng web có **594 câu MLA-C01**: 242 câu được gộp từ 286 mục trong ZIP và 352 câu **Tự biên soạn**. Có 16 ảnh khác nhau.

Chọn bộ **MLA-C01 · 352 câu tự biên soạn** khi luyện tập hoặc thi thử. Flashcard và Ngân hàng câu hỏi có bộ lọc **Nguồn câu hỏi**.

Bộ tự biên soạn gồm các tình huống luyện tập thuộc 44 chủ đề, không phải câu hỏi thi chính thức. Xem [nguồn dữ liệu và xuất Quizlet](PERSONAL_STUDY.md).

| Trạng thái | Số câu | Cách sử dụng |
| --- | ---: | --- |
| Đã đối chiếu | 562 | Có đáp án và chấm điểm. Dùng trong học nhanh, luyện tập, flashcard và thi thử. |
| Cần xác minh | 32 | Có phân tích theo điều kiện. Không chấm điểm và không xuất hiện trong thi thử. |

Mỗi câu có giải thích tiếng Anh cho từng lựa chọn và nguồn đối chiếu AWS.

Phần đáp án gồm **Correct answer**, **Key Concept**, **Why this is correct** và **Why other options are incorrect**.

Câu cần xác minh dùng **Answer not finalized**. Bật bộ lọc tương ứng để đọc thêm trong luyện tập hoặc flashcard.

Mã câu được giữ nguyên để tiến trình MLA-C01 tiếp tục hoạt động. Với bộ ZIP, mã ngân hàng bằng 332 cộng số câu nguồn được giữ. Bộ tự biên soạn dùng mã 1001–1352.

Ví dụ, MLA-C01 Q001 có mã #333. Các khoảng trống là câu đã gộp, không phải câu bị mất.

File `src/data/questions.json` chỉ chứa 594 câu MLA-C01. Thư mục `public/images/` chỉ chứa ảnh MLA-C01.

Bản web không đóng gói nội dung, đáp án, giải thích hoặc hình của bộ MLS.

Tỷ lệ đúng trong ứng dụng không quy đổi thành điểm thi AWS. Hint chỉ hiện trong các chế độ cho phép xem đáp án.

## Tiến trình và tài liệu từ bộ cũ

Trang học, thống kê và lịch sử chỉ hiển thị các phiên gồm toàn bộ câu MLA-C01.

Phiên MLS và phiên trộn cũ vẫn được giữ trong bộ nhớ trình duyệt, Supabase và bản sao JSON. Ứng dụng không xóa hoặc chấm lại chúng.

Những lượt trả lời MLA-C01 trong phiên trộn vẫn đóng góp vào thống kê câu MLA-C01.

Một phiên trộn đang làm không thể tiếp tục trên bản web mới. Hãy bắt đầu phiên MLA-C01 mới từ Tổng quan hoặc Luyện tập.

Flashcard cũ giữ các thẻ MLA-C01 và vị trí gần nhất. Nếu không còn thẻ phù hợp, ứng dụng tạo bộ MLA-C01 theo bộ lọc.

File `src/data/retired-question-shapes.ts` chỉ giữ mã câu, ký tự lựa chọn, số đáp án cần chọn và cờ không chấm điểm.

Thông tin này dùng để kiểm tra bản sao cũ. File không chứa đề bài, nội dung lựa chọn hoặc khóa đáp án MLS.

Bộ MLS gốc được lưu tại `../output/merged/MLS_ARCHIVE.json`. Hình MLS nằm trong `../output/merged/images/`.

Các bản [Markdown tổng hợp](../output/merged/ML_COMBINED.md) và [Quizlet tổng hợp](../output/merged/QUIZLET_COMBINED.md) vẫn giữ 567 câu để lưu trữ ngoài web.

## Cập nhật dữ liệu

Ứng dụng không cần PDF hoặc thư mục `tmp` khi chạy hay build. Sau khi thay đổi dữ liệu đã rà soát, chạy:

```bash
python3 scripts/import-questions.py
npm test
npm run build
```

Lệnh nhập cần `../tmp/pdfs/reviewed_questions.json`, các hình gốc và `../MLA-C01_Web_Study_Bundle.zip`.

Lệnh giữ toàn bộ tài liệu gốc trong `../output/merged/`, nhưng chỉ ghi câu MLA-C01 vào dữ liệu web.

Giải thích nằm trong `scripts/explanations/`. Khóa, trạng thái và nguồn đối chiếu bổ sung nằm trong `scripts/answer-review.json`.

Quyết định gộp câu MLA nằm trong `scripts/bank-review.json`. Nhật ký gộp MLS được giữ để kiểm tra tài liệu lưu trữ.

Các báo cáo cũ phản ánh ngân hàng kết hợp tại thời điểm lập báo cáo. `src/data/catalog.json` thể hiện ngân hàng web hiện tại.

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
