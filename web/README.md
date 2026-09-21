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
| Học nhanh | Làm 10 câu ngẫu nhiên, xem giải thích sau khi kiểm tra từng câu. |
| Flashcard | Lật thẻ, đánh dấu đã thuộc, lọc thẻ chưa thuộc hoặc đã lưu. |
| Luyện cùng đáp án | Chọn đủ phương án rồi bấm **Kiểm tra đáp án**. Câu đã kiểm tra sẽ khóa lựa chọn. |
| Tự kiểm tra | Trả lời trước, xem toàn bộ đáp án sau khi nộp bài. Không giới hạn thời gian. |
| Thi thử | Chọn số câu và thời gian. Đáp án ẩn cho đến khi nộp bài. |
| Ngân hàng câu hỏi | Tìm theo từ khóa hoặc số câu. Xem hình gốc, giải thích và tài liệu đối chiếu. |
| Tiến trình | Xem lịch sử, kết quả và xuất hoặc nhập bản sao JSON. |

Bộ lọc hỗ trợ câu sai gần nhất, câu đã lưu, câu chưa luyện, khoảng số câu và bộ MLS/MLA-C01.

Trong Ngân hàng câu hỏi, tìm `mla-c01 q228` để mở câu nguồn Q228, kể cả khi đã gộp với bản lặp.

Câu chọn nhiều chỉ đúng khi chọn đủ và chính xác toàn bộ phương án. Câu bỏ trống không được điểm.

Trong phiên làm bài, dùng phím **← / →** để chuyển câu. Dùng **1–6** để chọn phương án.

Trong flashcard, dùng **Space** để lật thẻ khi con trỏ không nằm trên nút hoặc ô nhập.

## Người học, tiến trình và đồng hồ

Nhập tên tại màn hình đầu để tạo hồ sơ. Tên người đang học luôn xuất hiện ở góc trên.

Mỗi tab giữ người học và bài đang mở riêng. Trang **Tiến trình** gộp lịch sử theo hồ sơ đang chọn.

Để đổi người học, mở **Người học → Đổi người học**. Bài chưa hoàn thành vẫn được giữ lại.

Mở **Tiến trình → Bài chưa hoàn thành** để tiếp tục một phiên đã lưu. Quyền làm phiên đó chuyển sang tab này.

Khi đã cấu hình Supabase, trang **Người học** có mã tiếp tục riêng. Mã này mở lại cùng hồ sơ trên thiết bị khác.

Bật **Chia sẻ lịch sử học tập** để hồ sơ xuất hiện trong **Học chung**. Người khác chỉ xem các bài đã hoàn thành.

Nếu chưa cấu hình Supabase, các tính năng hồ sơ vẫn hoạt động trên trình duyệt hiện tại.

Đồng hồ thi dùng thời hạn cố định. Đổi tab hoặc tải lại trang không dừng đồng hồ.

Khi hết giờ, bài được tự nộp. Nếu trình duyệt đã đóng, bài được chấm khi bạn tiếp tục phiên đó.

Ứng dụng giữ dữ liệu v1 gốc sau khi chuyển sang hồ sơ đầu tiên. Các bản ghi v2 lưu theo hồ sơ và mã phiên.

Để sao lưu, chọn **Xuất bản sao JSON**. Để gộp dữ liệu, chọn **Nhập bản sao** và chọn file đã xuất.

Ứng dụng kiểm tra file và tải bản sao hiện tại xuống trước khi gộp. Bản sao JSON không chứa mã tiếp tục riêng.

Dữ liệu trình duyệt thuộc từng địa chỉ web. `localhost`, `127.0.0.1` và tên miền Vercel có vùng lưu riêng.

Nếu xóa dữ liệu trình duyệt, dùng mã Supabase hoặc bản sao JSON để khôi phục.

## Nguồn câu hỏi

Ngân hàng chứa **574 câu**: 332 câu từ PDF Machine Learning – Specialty và 242 câu từ ZIP MLA-C01 bổ sung.

ZIP có 286 mục. Sau khi gộp 44 bản lặp, còn 242 câu. Giữ 22 hình MLS và 16 ảnh MLA khác nhau.

MLS và MLA-C01 là hai bộ nguồn riêng. Chọn bộ trong Luyện tập, Thi thử, Flashcard hoặc Ngân hàng câu hỏi.

| Trạng thái | Số câu | Cách sử dụng |
| --- | ---: | --- |
| Đã đối chiếu | 280 | Có chấm điểm; gồm 278 câu MLS và 2 câu MLA vừa xử lý mâu thuẫn. |
| Dịch vụ cũ | 26 | Có chấm điểm theo bối cảnh cũ. Có thể loại bằng bộ lọc. |
| Theo nguồn | 239 | Chấm theo khóa trong ZIP, chưa kiểm chứng toàn bộ với AWS. Có thể loại khỏi bài bằng bộ lọc. |
| Cần xác minh | 29 | Không chấm điểm. Luôn loại khỏi thi thử. Có thể đọc trong luyện tập và flashcard. |

Các câu đã đối chiếu có liên kết tài liệu hỗ trợ. Câu **Theo nguồn** giữ lời giải trong ZIP và ghi rõ trạng thái này.

Tỷ lệ đúng của bài luyện không quy đổi thành điểm AWS. Hint chỉ hiện trong luyện cùng đáp án, flashcard và thư viện.

Mã 1–332 không đổi. Mã câu MLA bằng 332 cộng số câu nguồn được giữ; khoảng trống là các bản lặp đã gộp.

Xem [báo cáo đối chiếu đầy đủ](../BAO_CAO_GOP_BO_DE.md), [Markdown tổng hợp](../output/merged/ML_COMBINED.md) và [file Quizlet](../output/merged/QUIZLET_COMBINED.md).

File dùng trong ứng dụng là `src/data/questions.json`. Các hình nằm trong `public/images/`.

Ứng dụng không cần PDF hoặc thư mục `tmp` khi chạy hay build. Khi thay đổi bộ dữ liệu đã rà soát, cập nhật bằng:

```bash
python3 scripts/import-questions.py
npm test
npm run build
```

Lệnh nhập cần `../tmp/pdfs/reviewed_questions.json`, các hình gốc và `../MLA-C01_Web_Study_Bundle.zip`.

Quyết định gộp thủ công và sửa đáp án nằm trong `scripts/bank-review.json`. Dữ liệu nguồn và nhật ký gộp được xuất vào `../output/merged/`.

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
