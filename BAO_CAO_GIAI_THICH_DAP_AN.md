# Giải thích và rà soát đáp án

Cập nhật ngày 21/09/2026. Ngân hàng giữ **574 bản ghi**. Dữ liệu có **2.396 phần phân tích lựa chọn** bằng tiếng Anh. Sau khi gộp 7 biến thể, còn **567 câu học**.

Website: [ML Practice](https://mla-practice-studio.vercel.app).

Mỗi câu có kiến thức chính và lý do cho từng phương án. Các lời giải mẫu chung trong ZIP được thay bằng phân tích theo nội dung câu.

## Nội dung hiển thị

- **Correct answer**: ký tự và nội dung đầy đủ của đáp án.
- **Key Concept**: kiến thức cần nhớ.
- **Why this is correct**: lý do cho từng đáp án đúng.
- **Why other options are incorrect**: lý do loại từng phương án còn lại trong bối cảnh đề.
- **Nguồn và ghi chú**: tài liệu đối chiếu, giả định và thay đổi dịch vụ.

Câu nhiều đáp án có phần giải thích riêng cho từng lựa chọn. Câu chưa chốt khóa dùng **Answer not finalized** và **Option-by-option analysis**.

Giải thích xuất hiện sau khi kiểm tra trong Học nhanh và Luyện cùng đáp án. Flashcard chỉ hiện giải thích sau khi lật thẻ.

Thi thử và Tự kiểm tra giữ đáp án ẩn đến khi nộp bài. Thư viện và kết quả dùng cùng phần giải thích.

## Trạng thái hiện tại

| Trạng thái | MLS | MLA-C01 | Tổng |
| --- | ---: | ---: | ---: |
| Đã đối chiếu | 270 | 210 | 480 |
| Dịch vụ cũ | 27 | 0 | 27 |
| Cần xác minh | 28 | 32 | 60 |
| Theo nguồn | 0 | 0 | 0 |
| Tổng câu học | 325 | 242 | 567 |

Có 507 câu chấm được. Khi loại dịch vụ cũ, còn 480 câu. Các câu Cần xác minh không tham gia điểm hoặc thi thử.

Tài liệu AWS hỗ trợ tính năng và giới hạn dịch vụ. Kết luận đáp án là phân tích theo đề, không phải khóa thi chính thức của AWS.

Một số câu phụ thuộc giả định hoặc bối cảnh dịch vụ cũ. Những giới hạn này có trong phần phân tích và ghi chú.

## Thay đổi khóa và câu cần xác minh

| Mã web | Câu nguồn | Khóa trước | Khóa hiện tại | Lý do |
| --- | --- | --- | --- | --- |
| #359 | MLA Q027 | A | B | Flink không có hàm SQL RANDOM_CUT_FOREST như Kinesis Data Analytics SQL cũ. Phương án B dùng mô hình qua Lambda. |
| #544 | MLA Q212 | A | D | Tăng lambda của XGBoost là thay đổi ít công sức để xử lý dấu hiệu overfitting. Cần đánh giá trên tập validation. |

Nguồn cho #359: [chuyển từ Kinesis SQL sang Flink](https://docs.aws.amazon.com/kinesisanalytics/latest/dev/migrating-to-kda-studio-overview.html).

Nguồn cho #544: [siêu tham số XGBoost](https://docs.aws.amazon.com/sagemaker/latest/dg/xgboost_hyperparameters.html).

Có thêm 31 câu MLA chuyển sang Cần xác minh. Các nguyên nhân gồm thiếu giả định, sai tên API, thiếu bước xử lý hoặc nhiều lựa chọn hợp lệ.

Các mã: #337, #346, #347, #357, #358, #362, #363, #393, #420, #421, #432, #437, #439, #440, #450, #461, #466, #474, #477, #494, #498, #506, #519, #520, #525, #536, #537, #543, #568, #611, #613.

Câu MLS #161 chuyển sang Dịch vụ cũ do giới hạn hiện tại của các trường phát âm trong từ vựng Amazon Transcribe.

[Nhật ký máy đọc được](output/merged/ANSWER_ANALYSIS_AUDIT.json) chứa khóa trước/sau, trạng thái, lý do và nguồn của từng thay đổi.

## Dữ liệu học và file xuất

Mã câu, thứ tự lựa chọn, ảnh và ánh xạ câu nguồn giữ nguyên. Cả 286 số câu nguồn MLA vẫn ánh xạ vào 242 câu đã gộp.

Không có thay đổi schema Supabase hoặc xóa tiến trình. Các lựa chọn, dấu lưu và phiên học cũ vẫn dùng cùng mã câu.

Trang kết quả tính điểm theo khóa hiện tại. Điểm bài cũ có thể đổi khi khóa hoặc trạng thái câu thay đổi.

Thống kê lượt luyện đã ghi vẫn giữ nguyên. Vì vậy, thống kê cũ có thể khác điểm bài tính lại.

- [Markdown tổng hợp](output/merged/ML_COMBINED.md): câu hỏi, đáp án, phân tích, ghi chú và tài liệu đối chiếu.
- [File Quizlet](output/merged/QUIZLET_COMBINED.md): 567 dòng, mỗi dòng là một thẻ.
- [Dữ liệu web](web/src/data/questions.json): dữ liệu có cấu trúc cho giao diện.

Trong Quizlet, chọn TAB làm ký tự tách hai mặt thẻ. Chọn dòng mới làm ký tự tách thẻ.

Các câu có hình dẫn về bản Markdown. Bản nhập văn bản Quizlet không nhúng ảnh.

## Gộp 7 cặp biến thể MLS

Các cặp này cùng bài toán và hướng trả lời. Cách diễn đạt hoặc một số phương án khác nhau.

| Mã bản cũ | Mã dùng cho phiên học mới | Nội dung |
| --- | --- | --- |
| #269 | #70 | Notebook đọc dữ liệu S3 mã hóa KMS |
| #271 | #81 | Tăng recall của MLP bằng class weights |
| #188 | #86 | Khởi chạy training container bằng ENTRYPOINT |
| #295 | #109 | Dự báo số hồ sơ bảo hiểm theo tháng |
| #202 | #113 | Cung cấp dữ liệu TFRecord cho SageMaker |
| #193 | #143 | Mã hóa dữ liệu và ghi nhận việc dùng khóa KMS |
| #270 | #197 | Xử lý sự kiện podcast trong cửa sổ 10 phút |

[Nhật ký gộp biến thể](output/merged/STUDY_DUPLICATE_AUDIT.json) ghi lý do và khóa của từng phiên bản.

Phiên học mới, thư viện và file xuất dùng 567 câu. Các bản cũ vẫn phục vụ lịch sử và bài chưa hoàn thành.

Việc gộp không đổi ký tự đã chọn hoặc khóa đáp án trong lịch sử. Ví dụ, #271 vẫn chấm A dù bản đại diện #81 chấm D.

Dấu lưu, thẻ đã thuộc và bộ lọc câu sai nhận biết cả nhóm. Thẻ đã lưu được gộp khi mở lại.

Các cặp khác mục tiêu như #14/#25 và #173/#204 vẫn được giữ riêng.

## Cập nhật dữ liệu

Giải thích nằm trong `web/scripts/explanations/`. Mỗi mục gồm kiến thức chính và lý do theo thứ tự lựa chọn của câu.

Khóa và ghi chú rà soát nằm trong `web/scripts/answer-review.json`. Các file này dùng mã ngân hàng web.

Chạy từ thư mục gốc:

```bash
python3 web/scripts/import-questions.py
```

Lệnh nhập kiểm tra độ phủ, số lựa chọn, khóa và nguồn. Lệnh dừng nếu thiếu phân tích hoặc còn lời giải mẫu chung.

Lệnh nhập tạo lại ngân hàng web, Markdown, Quizlet và nhật ký. Dữ liệu nguồn PDF/ZIP vẫn giữ nội dung ban đầu.

## Kiểm tra hoàn tất

- 38 kiểm thử dữ liệu, chấm điểm, tiến trình và đồng bộ đạt.
- 22 kiểm thử trình duyệt đạt, gồm màn hình nhỏ, câu nhiều đáp án và lịch sử dùng mã đã gộp.
- Build TypeScript/Vite thành công.
- Kiểm tra đủ 567 thẻ Quizlet, mỗi thẻ có đúng một TAB.
- Kiểm tra trực quan phần giải thích trên máy tính và điện thoại.

Bản build có cảnh báo kích thước JavaScript vì chứa toàn bộ ngân hàng câu hỏi. Kích thước nén gzip khoảng 537 KB.
