# Báo cáo gộp bộ đề và kiểm tra đáp án

> Báo cáo này ghi nhận đợt gộp ban đầu. Số liệu và khóa hiện tại nằm trong [báo cáo giải thích đáp án](BAO_CAO_GIAI_THICH_DAP_AN.md).

Đã kiểm tra 5 file quiz cũ, ngân hàng 332 câu đang dùng và ZIP bổ sung `MLA-C01_Web_Study_Bundle.zip`.

Kết quả: **574 câu = 332 câu MLS cũ + 242 câu MLA-C01**. ZIP có 286 mục; đã gộp 44 bản lặp.

## 1. Phạm vi và cách đối chiếu

- Kiểm tra câu trùng, lựa chọn trùng trong cùng câu, số đáp án và mâu thuẫn giữa các bản.
- So sánh nội dung đáp án, không chỉ ký tự A/B/C/D. Nhiều bản đã đảo thứ tự lựa chọn.
- Gộp tự động khi đề, tập lựa chọn và nội dung ảnh trùng sau chuẩn hóa dấu câu/khoảng trắng.
- Kiểm tra thủ công thêm 4 cặp gần giống. Câu cùng tình huống nhưng hỏi mục tiêu khác vẫn giữ riêng.
- Đối chiếu AWS cho 3 mâu thuẫn trong ZIP. Đây không phải đợt kiểm chứng lại toàn bộ kiến thức của 574 câu.

Không phát hiện đề trùng nguyên văn sau chuẩn hóa giữa 332 câu MLS và 286 mục MLA. Việc này không loại trừ các câu diễn đạt khác nhưng kiểm tra cùng kiến thức.

## 2. Ngân hàng sau khi gộp

| Nguồn | Số mục đầu vào | Số câu giữ | Xử lý |
| --- | ---: | ---: | --- |
| PDF MLS đã rà soát | 332 | 332 | Giữ nguyên mã, nội dung, lựa chọn, khóa và trạng thái. |
| ZIP MLA-C01 | 286 | 242 | Gộp 40 nhóm trùng theo nội dung và 4 cặp đã xem thủ công. |
| Tổng dùng trên web | 618 | 574 | 44 bản lặp không tạo câu học riêng. |

| Trạng thái | Số câu | Chấm điểm |
| --- | ---: | --- |
| Đã đối chiếu | 280 | Có; 278 MLS và 2 MLA. |
| Dịch vụ cũ | 26 | Có, theo bối cảnh cũ. Có bộ lọc để loại. |
| Theo nguồn | 239 | Theo khóa ZIP; chưa xác minh toàn bộ với AWS. Có thể loại khỏi bài. |
| Cần xác minh | 29 | Không tính điểm và không đưa vào thi thử. |

Mặc định có 545 câu chấm được. Riêng MLA có 241 câu chấm được, trong đó 239 câu dùng khóa nguồn.

### Bảo toàn tiến trình và hình ảnh

- Mã MLS 1–332 giữ nguyên. Không gộp lại các mã này để tránh làm sai lịch sử học.
- Mã MLA bằng `332 + số câu nguồn được giữ`. Ví dụ Q101/Q247 cùng ánh xạ tới mã #433.
- Lưu đủ ánh xạ của 286 số câu nguồn. Các khoảng trống trong mã mới là bình thường.
- Giữ 22 hình MLS. ZIP có 17 PNG, tương ứng 16 ảnh khác nhau; Q227/Q228 dùng ảnh giống từng byte.
- Hình, lựa chọn, hint và giải thích nguồn được giữ. Hint ẩn trong thi thử và luyện ẩn đáp án.
- Migration Supabase `002` đã áp dụng; truy vấn kiểm tra trả về đủ 3 giới hạn mới. Lịch sử và quyền truy cập giữ nguyên.

## 3. Ba mâu thuẫn đáp án trong ZIP

| Câu nguồn | Mâu thuẫn | Quyết định |
| --- | --- | --- |
| Q101 / Q247 | A / C; C đảo vai trò Comprehend và Textract. | Giữ A theo thứ tự Q101, mã #433; Đã đối chiếu. |
| Q122 / Q286 | A OnStart / B OnCreate. | Giữ A, mã #454; Đã đối chiếu. |
| Q137 / Q223 | D ở Q137; C ở Q223 tương đương B ở Q137. | Mã #469 chuyển Cần xác minh, không chốt khóa và không tính điểm. |

Q101: custom entity recognition của Comprehend hỗ trợ PDF và tự trích xuất văn bản trước khi nhận diện thực thể. [Tài liệu AWS](https://docs.aws.amazon.com/comprehend/latest/dg/idp.html).

Q122: mẫu auto-stop-idle của AWS thiết lập tác vụ trong `on-start.sh`, phù hợp lifecycle OnStart. [Mẫu AWS](https://github.com/aws-samples/amazon-sagemaker-notebook-instance-lifecycle-config-samples/blob/master/scripts/auto-stop-idle/on-start.sh).

Q137: AWS định nghĩa DPL = q_a − q_d. Đề không xác định nhóm 40–45 tuổi là facet a hay d. Nếu là facet a, phương án B của Q137 làm giảm tỷ lệ dương của nhóm đó. Vì thiếu định nghĩa facet, chưa chốt đáp án. [Định nghĩa DPL của AWS](https://docs.aws.amazon.com/sagemaker/latest/dg/clarify-data-bias-metric-true-label-imbalance.html).

Q25/Q161 khác chữ `network Ad` và `network ACL`, đồng thời khác tên SageMaker/SageMaker AI. Đây là khác biệt chữ/OCR, không tính là mâu thuẫn kiến thức thứ tư.

## 4. Danh sách 44 nhóm đã gộp

Các ký tự trong cột khóa nguồn thuộc thứ tự lựa chọn của từng bản. Khóa giữ dùng thứ tự của câu đầu tiên.

| Nguồn MLA | Mã web | Khóa từng bản | Khóa giữ | Đối chiếu |
| --- | ---: | --- | --- | --- |
| Q1 / Q277 | #333 | Q1=C; Q277=C | C | Cùng nội dung đáp án |
| Q2 / Q276 | #334 | Q2=B; Q276=C | B | Cùng nội dung đáp án |
| Q3 / Q275 | #335 | Q3=D; Q275=A | D | Cùng nội dung đáp án |
| Q4 / Q274 | #336 | Q4=A; Q274=C | A | Cùng nội dung đáp án |
| Q5 / Q273 | #337 | Q5=D; Q273=D | D | Cùng nội dung đáp án |
| Q6 / Q272 | #338 | Q6=C; Q272=C | C | Cùng nội dung đáp án |
| Q7 / Q271 | #339 | Q7=C; Q271=D | C | Cùng nội dung đáp án |
| Q8 / Q270 | #340 | Q8=D; Q270=D | D | Cùng nội dung đáp án |
| Q9 / Q269 | #341 | Q9=A; Q269=D | A | Cùng nội dung đáp án |
| Q12 / Q268 | #344 | Q12=D; Q268=D | D | Cùng nội dung đáp án |
| Q15 / Q267 | #347 | Q15=D; Q267=D | D | Cùng nội dung đáp án |
| Q20 / Q266 | #352 | Q20=A; Q266=B | A | Cùng nội dung đáp án |
| Q23 / Q265 | #355 | Q23=B; Q265=C | B | Cùng nội dung đáp án |
| Q25 / Q161 | #357 | Q25=B; Q161=B | B | OCR Ad/ACL, cùng ý; gộp thủ công |
| Q32 / Q261 | #364 | Q32=A; Q261=D | A | Cùng nội dung đáp án |
| Q33 / Q260 | #365 | Q33=D; Q260=D | D | Cùng nội dung đáp án |
| Q34 / Q259 | #366 | Q34=A,D; Q259=D,E | A, D | Cùng nội dung đáp án; gộp thủ công |
| Q36 / Q258 | #368 | Q36=A; Q258=A | A | Cùng nội dung đáp án |
| Q37 / Q257 | #369 | Q37=C; Q257=B | C | Cùng nội dung đáp án; gộp thủ công |
| Q42 / Q256 | #374 | Q42=A; Q256=D | A | Cùng nội dung đáp án |
| Q47 / Q255 | #379 | Q47=D; Q255=D | D | Cùng nội dung đáp án |
| Q59 / Q254 | #391 | Q59=D; Q254=D | D | Cùng nội dung đáp án |
| Q63 / Q253 | #395 | Q63=D; Q253=D | D | Cùng nội dung đáp án |
| Q76 / Q252 | #408 | Q76=A; Q252=D | A | Cùng nội dung đáp án |
| Q81 / Q251 | #413 | Q81=C; Q251=B | C | Cùng nội dung đáp án |
| Q85 / Q250 | #417 | Q85=C,E; Q250=A,C | C, E | Cùng nội dung đáp án |
| Q95 / Q249 | #427 | Q95=D; Q249=B | D | Cùng nội dung đáp án |
| Q98 / Q248 | #430 | Q98=C; Q248=C | C | Cùng nội dung đáp án |
| Q101 / Q247 | #433 | Q101=A; Q247=C | A | Mâu thuẫn — xem mục 3 |
| Q106 / Q246 | #438 | Q106=A; Q246=A | A | Cùng nội dung đáp án |
| Q108 / Q245 | #440 | Q108=C; Q245=C | C | Cùng nội dung đáp án |
| Q122 / Q286 | #454 | Q122=A; Q286=B | A | Mâu thuẫn — xem mục 3 |
| Q131 / Q285 | #463 | Q131=A,B; Q285=A,B | A, B | Cùng nội dung đáp án; gộp thủ công |
| Q137 / Q223 | #469 | Q137=D; Q223=C | Chưa chốt | Mâu thuẫn — xem mục 3 |
| Q138 / Q284 | #470 | Q138=C; Q284=D | C | Cùng nội dung đáp án |
| Q149 / Q232 | #481 | Q149=D; Q232=D | D | Cùng nội dung đáp án |
| Q152 / Q233 | #484 | Q152=D; Q233=B | D | Cùng nội dung đáp án |
| Q164 / Q231 | #496 | Q164=B; Q231=D | B | Cùng nội dung đáp án |
| Q169 / Q264 | #501 | Q169=C; Q264=B | C | Cùng nội dung đáp án |
| Q175 / Q263 | #507 | Q175=D; Q263=A | D | Cùng nội dung đáp án |
| Q178 / Q234 | #510 | Q178=B; Q234=C | B | Cùng nội dung đáp án |
| Q180 / Q262 | #512 | Q180=B; Q262=C | B | Cùng nội dung đáp án |
| Q183 / Q243 | #515 | Q183=C; Q243=A | C | Cùng nội dung đáp án |
| Q227 / Q228 | #559 | Q227=C; Q228=C | C | Cùng nội dung đáp án |

Chi tiết nội dung đáp án trước khi gộp nằm trong [MERGE_AUDIT.json](output/merged/MERGE_AUDIT.json). Cả 286 bản nguồn nằm trong [MLA_SOURCE_RECORDS.json](output/merged/MLA_SOURCE_RECORDS.json).

## 5. Kiểm tra toàn bộ 5 file quiz cũ

Có 268 mục trong 5 file. Đối chiếu được 266 mục với 263 câu MLS riêng biệt; ba mục dư là bản lặp.

| Tên rút gọn | Thư mục | Số mục |
| --- | --- | ---: |
| Specialist | `ML-Specialist 201-266` | 65 |
| Ngọc Hân | `MLS-1_66-NgocHan` | 1 |
| Bảo An | `MLS-Part1-BaoAn` | 69 |
| Minh Tiến | `MLS-Part1-MinhTien(266-332)` | 67 |
| Việt Pháp | `MLS-Part1-VietPhap(134-200)` | 66 |

Hai mục không nhập vào ngân hàng: Ngọc Hân mục 1 là câu SAA không thuộc bộ MLS; Bảo An mục 7 là mẫu trống.

261 mục được ghép bằng nội dung đề, với độ tương đồng từ 0,92 trở lên. Năm mục chỉ có hình được ghép bằng toàn bộ lựa chọn rồi xem ảnh xác nhận:

| Mục Bảo An | Câu MLS | Nội dung ảnh |
| ---: | ---: | --- |
| 39 | 32 | Mã hóa Day_Of_Week. |
| 46 | 25 | Phân lớp gian lận, hỏi recall. |
| 57 | 14 | Phân lớp gian lận, hỏi accuracy. |
| 58 | 13 | Đồ thị actual/forecast. |
| 69 | 1 | Ma trận nhầm lẫn churn. |

### Ba câu có lựa chọn bị sao chép trùng

| File, vị trí trong file | Câu MLS | Lựa chọn trùng | Nội dung |
| --- | ---: | --- | --- |
| Specialist, mục 52 | 252 | B = C | Training Compiler và Spot Instances; C còn mang nhãn chữ B. |
| Bảo An, mục 51 | 20 | C = D | Word embedding kết hợp edit distance. |
| Việt Pháp, mục 55 | 145 | A = B | Train a custom classifier by using Amazon Comprehend. |

Các lỗi này nằm trong file quiz cũ. Ngân hàng từ PDF hiện tại có lựa chọn riêng biệt, nên không nhập đè các lựa chọn lỗi.

### Câu lặp và thiếu đáp án

| File | Vị trí | Câu MLS | Vấn đề |
| --- | --- | ---: | --- |
| Bảo An | 20 / 21 | 48 | Cùng câu nhưng đánh dấu B / A. Ngân hàng đã rà soát dùng B. |
| Bảo An | 25 / 26 | 44 | Bản 25 chỉ đánh dấu B, trong khi đề chọn 3; ngân hàng dùng B,C,F. |
| Bảo An | 31 / 32 | 39 | Cùng câu và cùng khóa. |
| Việt Pháp | 47 | 154 | Đề chọn 2 nhưng chỉ đánh dấu A; ngân hàng dùng C,E theo bối cảnh dịch vụ cũ. |

### 47 mục khác khóa đang dùng trên web

30 mục đối chiếu với câu Đã đối chiếu, 3 mục với Dịch vụ cũ và 14 mục với Cần xác minh. **Không đồng nghĩa cả 47 mục đã được chứng minh sai.**

Bảng dùng nội dung lựa chọn để quy đổi ký tự về thứ tự MLS. Với câu Cần xác minh, ứng dụng không tính điểm dù dữ liệu cũ còn giữ ký tự tham khảo.

| File | Vị trí | MLS | Khóa quiz | Quy đổi về MLS | Khóa đang dùng | Trạng thái |
| --- | ---: | ---: | --- | --- | --- | --- |
| Specialist | 5 | 205 | C | C | D | Đã đối chiếu |
| Specialist | 7 | 207 | A | A | Không chốt / không chấm | Cần xác minh |
| Specialist | 10 | 210 | A | A | C | Đã đối chiếu |
| Specialist | 29 | 229 | A,C,D | A,C,D | A,C,F | Đã đối chiếu |
| Specialist | 42 | 242 | A | A | Không chốt / không chấm | Cần xác minh |
| Specialist | 44 | 244 | A | A | D | Đã đối chiếu |
| Specialist | 54 | 254 | B,C,E | B,C,E | Không chốt / không chấm | Cần xác minh |
| Specialist | 56 | 256 | C,D | C,D | D,E | Đã đối chiếu |
| Specialist | 58 | 258 | C | C | Không chốt / không chấm | Cần xác minh |
| Specialist | 60 | 260 | C | C | D | Đã đối chiếu |
| Bảo An | 3 | 64 | D | D | C | Đã đối chiếu |
| Bảo An | 9 | 59 | A | A | B | Đã đối chiếu |
| Bảo An | 18 | 50 | C | C | B | Đã đối chiếu |
| Bảo An | 19 | 49 | D | D | A | Đã đối chiếu |
| Bảo An | 21 | 48 | A | A | B | Đã đối chiếu |
| Bảo An | 23 | 46 | A | A | C | Đã đối chiếu |
| Bảo An | 25 | 44 | B | B | B,C,F | Đã đối chiếu |
| Bảo An | 28 | 42 | A | A | Không chốt / không chấm | Cần xác minh |
| Bảo An | 40 | 31 | A | A | B | Đã đối chiếu |
| Bảo An | 41 | 30 | A,C,F | A,C,F | Không chốt / không chấm | Cần xác minh |
| Bảo An | 42 | 29 | B,D | B,D | B,E | Đã đối chiếu |
| Bảo An | 43 | 28 | A | A | B | Đã đối chiếu |
| Bảo An | 46 | 25 | C | C | Không chốt / không chấm | Cần xác minh |
| Bảo An | 51 | 20 | D | C | D | Đã đối chiếu |
| Bảo An | 61 | 10 | A | A | B | Dịch vụ cũ |
| Bảo An | 68 | 3 | A | A | B | Đã đối chiếu |
| Bảo An | 69 | 1 | A | A | Không chốt / không chấm | Cần xác minh |
| Minh Tiến | 12 | 321 | A | A | D | Đã đối chiếu |
| Minh Tiến | 13 | 320 | B | B | Không chốt / không chấm | Cần xác minh |
| Minh Tiến | 20 | 313 | B | B | Không chốt / không chấm | Cần xác minh |
| Minh Tiến | 29 | 304 | D | D | B | Đã đối chiếu |
| Minh Tiến | 40 | 293 | B,C,E | B,C,E | A,B,E | Đã đối chiếu |
| Minh Tiến | 47 | 286 | B | B | A | Đã đối chiếu |
| Minh Tiến | 52 | 281 | B | B | C | Đã đối chiếu |
| Minh Tiến | 58 | 275 | A,B | A,B | A,C | Đã đối chiếu |
| Minh Tiến | 65 | 268 | D | D | Không chốt / không chấm | Cần xác minh |
| Việt Pháp | 4 | 197 | B | B | C | Đã đối chiếu |
| Việt Pháp | 13 | 188 | A | A | B | Đã đối chiếu |
| Việt Pháp | 20 | 181 | A | A | D | Đã đối chiếu |
| Việt Pháp | 21 | 180 | C,E | C,E | A,C | Dịch vụ cũ |
| Việt Pháp | 24 | 177 | C | C | D | Đã đối chiếu |
| Việt Pháp | 25 | 176 | A,C | A,C | Không chốt / không chấm | Cần xác minh |
| Việt Pháp | 35 | 166 | A | A | C | Đã đối chiếu |
| Việt Pháp | 38 | 163 | B,D | B,D | Không chốt / không chấm | Cần xác minh |
| Việt Pháp | 45 | 156 | A,C | A,C | Không chốt / không chấm | Cần xác minh |
| Việt Pháp | 47 | 154 | A | A | C,E | Dịch vụ cũ |
| Việt Pháp | 66 | 134 | A | A | B | Đã đối chiếu |

Bảo An mục 51 minh họa vì sao phải so nội dung: quiz đánh dấu D nhưng nội dung D bị sao chép từ C của PDF. Nó không tương đương D trong ngân hàng chuẩn.

Chi tiết của cả 268 mục, mã ghép, nội dung lựa chọn và dấu vết đối chiếu: [LEGACY_QUIZ_AUDIT.json](output/merged/LEGACY_QUIZ_AUDIT.json).

### Các câu MLS gần giống được giữ riêng

Không thấy đề trùng chính xác hoặc lựa chọn bị lặp trong 332 câu đang dùng. Có các cặp gần giống sau:

| Câu MLS | Lý do giữ |
| --- | --- |
| 14 / 25 / 93 | Cùng dạng phân lớp; yêu cầu accuracy/recall hoặc lựa chọn khác nhau. |
| 86 / 188 | Custom container/ENTRYPOINT; lựa chọn khác nhau. |
| 197 / 270 | Cửa sổ 10 phút của podcast; lựa chọn khác nhau. |
| 125 / 325 | Chỉ số gian lận; các lựa chọn PR-AUC/F1 khác nhau. |
| 113 / 202 | TFRecord và script mode; cách hỏi, lựa chọn khác nhau. |
| 143 / 193 | KMS root trust; biến thể cách hỏi. |
| 70 / 269 | KMS và notebook IAM; biến thể lựa chọn. |
| 81 / 271 | MLP và class weights; biến thể lựa chọn. |

Các cặp này có thể cùng kiểm tra một khái niệm. Giữ nguyên mã cũ để không làm sai tiến trình hoặc kết quả đã lưu.

## 6. File bàn giao và cách dùng

- [ML_COMBINED.md](output/merged/ML_COMBINED.md): đủ 574 câu, lựa chọn, ảnh, đáp án và giải thích.
- [QUIZLET_COMBINED.md](output/merged/QUIZLET_COMBINED.md): 574 dòng; mỗi dòng là một thẻ, một ký tự TAB ngăn mặt trước/mặt sau.
- [Ngân hàng web](web/src/data/questions.json) và [ánh xạ mã](web/src/data/catalog.json).
- [Quyết định rà soát](web/scripts/bank-review.json), [script nhập lại](web/scripts/import-questions.py).
- [Migration Supabase](web/supabase/002_expanded_question_bank.sql).

Khi nhập Quizlet, chọn TAB giữa thuật ngữ/định nghĩa và xuống dòng giữa các thẻ. File nhập không tự tải hình; câu có hình ghi chú để mở bản Markdown.

ZIP gốc và 5 file quiz được giữ nguyên. Thư mục giải nén bổ sung nằm tại `extracted/MLA-C01-Web-Study-Bundle/`.

## 7. Kiểm tra hoàn thành

- 31 kiểm tra dữ liệu, chấm điểm, sao lưu và đồng bộ đạt.
- 18 kiểm tra trình duyệt đạt, gồm bộ lọc MLA, flashcard, ảnh, thi ẩn đáp án và tải lại bài.
- Kiểm tra PostgreSQL đạt: RLS, hồ sơ, chia sẻ chỉ đọc, mã câu mới, bài 400 câu và migration chạy lại.
- Build production đạt. Trạng thái Theo nguồn và Cần xác minh được giữ trong bản Markdown, Quizlet và giao diện.
- Kiểm tra 332 câu MLS không đổi nội dung/lựa chọn/khóa/trạng thái; đủ 286 ánh xạ nguồn MLA, mỗi số xuất hiện một lần.
- Đã triển khai lên [website hiện tại](https://mla-practice-studio.vercel.app). Website trả HTTP 200; bundle trùng bản build đã kiểm tra và tải đủ 38 ảnh.

**Phần còn chưa xác minh:** 239 khóa Theo nguồn và 29 câu Cần xác minh không được xem là đáp án AWS đã chốt.
