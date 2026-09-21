# ML Practice

Ứng dụng ôn tập bằng React, TypeScript và Vite. Tiến trình lưu trên trình duyệt, không cần đăng nhập.

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

Bộ lọc hỗ trợ câu sai gần nhất, câu đã lưu, câu chưa luyện và khoảng số câu.

Câu chọn nhiều chỉ đúng khi chọn đủ và chính xác toàn bộ phương án. Câu bỏ trống không được điểm.

Trong phiên làm bài, dùng phím **← / →** để chuyển câu. Dùng **1–6** để chọn phương án.

Trong flashcard, dùng **Space** để lật thẻ khi con trỏ không nằm trên nút hoặc ô nhập.

## Tiến trình và đồng hồ

Dữ liệu lưu trong `localStorage`, tại khóa `ml-practice:v1`. Ứng dụng giữ một phiên đang làm và tối đa 100 phiên hoàn thành.

Đáp án, câu đánh dấu, thẻ đã thuộc và vị trí thẻ đều được lưu. Phiên mới cần xác nhận trước khi nộp phiên cũ.

Đồng hồ thi dùng thời hạn cố định. Đổi tab, tải lại trang hoặc đóng trình duyệt không dừng đồng hồ.

Khi hết giờ, ứng dụng tự nộp bài. Nếu trình duyệt đang đóng, ứng dụng nộp bài khi bạn mở lại.

Tiến trình thuộc từng trình duyệt và từng địa chỉ web. `localhost`, `127.0.0.1` và tên miền Vercel có vùng lưu riêng.

Để chuyển tiến trình sang địa chỉ khác:

1. Tại trang **Tiến trình của tôi**, chọn **Xuất bản sao JSON**.
2. Mở ứng dụng tại địa chỉ mới.
3. Chọn **Nhập bản sao**.
4. Chọn file JSON đã xuất.
5. Xác nhận khôi phục.

Ứng dụng kiểm tra file trước khi thay dữ liệu. Khi xác nhận, ứng dụng tải bản sao tiến trình hiện tại xuống máy.

Nếu xóa dữ liệu trình duyệt, tiến trình cũng bị xóa. Bản sao JSON có thể khôi phục tiến trình đó.

## Nguồn câu hỏi

Ngân hàng chứa **332 câu từ PDF Machine Learning – Specialty**, kèm 22 hình ở 19 câu.

Đây là tài liệu **MLS**, không phải bộ đề MLA-C01 đã được phân loại theo mục tiêu thi hiện tại.

| Trạng thái | Số câu | Cách sử dụng |
| --- | ---: | --- |
| Đã đối chiếu | 278 | Có chấm điểm. |
| Dịch vụ cũ | 26 | Có chấm điểm theo bối cảnh cũ. Có thể loại bằng bộ lọc. |
| Cần xác minh | 28 | Không chấm điểm. Luôn loại khỏi thi thử. Có thể đọc trong luyện tập và flashcard. |

Mỗi lời giải có liên kết tài liệu nguồn. Tỷ lệ đúng của bài luyện không quy đổi thành điểm AWS.

File dùng trong ứng dụng là `src/data/questions.json`. Các hình nằm trong `public/images/`.

Ứng dụng không cần PDF hoặc thư mục `tmp` khi chạy hay build. Khi thay đổi bộ dữ liệu đã rà soát, cập nhật bằng:

```bash
python3 scripts/import-questions.py
npm test
npm run build
```

Lệnh nhập cần file nguồn `../tmp/pdfs/reviewed_questions.json` và các hình gốc trong repository.

## Đưa lên Vercel

Ứng dụng đã có `vercel.json`. Không cần cơ sở dữ liệu, API key hoặc biến môi trường.

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

Tại thư mục `web`, chạy:

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
```

Kiểm tra trình duyệt dùng Google Chrome qua Playwright. Máy chạy cần cài Google Chrome.

Các kiểm tra gồm chấm câu chọn nhiều, ẩn đáp án, tải lại trang, tự nộp khi hết giờ và khôi phục bản sao.

Ảnh kiểm tra giao diện nằm trong `test-results/`. Bộ kiểm tra dùng dữ liệu trình duyệt riêng.

Để xem bản build:

```bash
npm run preview
```

Mở địa chỉ Terminal hiển thị, mặc định là `http://127.0.0.1:4173/`.
