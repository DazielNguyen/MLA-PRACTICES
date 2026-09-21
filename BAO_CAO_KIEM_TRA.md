**Kết quả kiểm tra 5 bộ quiz — 21/09/2026**

Đã giải nén cả 5 file `.quiz` vào [extracted](extracted/). Các file gốc được giữ nguyên. Mỗi thư mục con chứa `document.json`, `metainfo.json`, `workspace.json` và `images/`.

| File gốc | Số mục câu hỏi | Chọn một | Chọn nhiều | File ảnh |
|---|---:|---:|---:|---:|
| MLS-1_66-NgocHan.quiz | 1 | 1 | 0 | 1 |
| MLS-Part1-BaoAn.quiz | 69 | 62 | 7 | 6 |
| MLS-Part1-VietPhap(134-200) .quiz | 66 | 51 | 15 | 6 |
| ML-Specialist 201-266.quiz | 65 | 53 | 12 | 2 |
| MLS-Part1-MinhTien(266-332).quiz | 67 | 52 | 15 | 1 |
| **Tổng** | **268** | **219** | **49** | **16** |

268 là số mục trong file, bao gồm câu mẫu và câu trùng. Số ảnh tính cả ảnh dùng chung giữa các bộ.

**Tính toàn vẹn của file**

Cả 5 file đều qua kiểm tra CRC của ZIP. Nội dung đã giải nén khớp từng byte với file nén. Cả 15 file JSON đọc được. Các file ảnh khớp SHA-1 trong metadata và qua kiểm tra CRC của PNG. Không thiếu file được tham chiếu bằng `storage://`.

**Các vấn đề đã xác định**

Số câu dưới đây là thứ tự trong từng file, bắt đầu từ 1; không phải số câu suy ra từ tên file.

| Bộ / vị trí | Phát hiện |
|---|---|
| Ngọc Hân | Chỉ có 1 câu, dù tên file ghi 1–66. Câu hỏi nói về EC2, placement group và thiết kế mạng cho cơ sở dữ liệu; có dấu hiệu là câu SAA còn lại từ mẫu. |
| Bảo An, câu 7 | Chưa có đề bài thực: chỉ ghi “Select the correct answer option:” và “Option 1/2/3”; không có ảnh đề bài. |
| Bảo An, câu 20 và 21 | Trùng đề về transfer learning, nhưng câu 20 đánh dấu phương án thứ hai, câu 21 đánh dấu phương án thứ nhất. |
| Bảo An, câu 25 và 26 | Trùng đề yêu cầu chọn 3. Câu 25 được cấu hình chọn một và chỉ đánh dấu 1 đáp án; câu 26 được cấu hình chọn nhiều và đánh dấu 3 đáp án. |
| Bảo An, câu 31 và 32 | Trùng đề, lựa chọn và đáp án sau khi chuẩn hóa khoảng trắng. |
| Việt Pháp, câu 47 | Đề yêu cầu chọn 2 nhưng chỉ đánh dấu 1 đáp án đúng. |
| Việt Pháp, toàn bộ file | Có 66 mục; khoảng 134–200 trong tên file tương ứng 67 số nếu tính cả hai đầu. |
| ML-Specialist, toàn bộ file | Có 65 mục; khoảng 201–266 trong tên file tương ứng 66 số nếu tính cả hai đầu. |

Chưa xác định được số câu gốc nào bị thiếu chỉ từ tên file. Bộ Minh Tiến có 67 mục, khớp số lượng của khoảng 266–332, nhưng điều đó chưa chứng minh đủ và đúng từng câu.

Các câu 39, 46, 57, 58 và 69 của Bảo An dùng ảnh làm đề bài. Ảnh đính kèm tồn tại; không tính các câu này là câu trống hoặc trùng chỉ vì phần văn bản giống nhau.

**Mức phù hợp với MLA-C01**

Chưa đủ căn cứ xác nhận đây là bộ ôn MLA-C01 đầy đủ. Tên file dùng MLS/ML-Specialist, còn trường tiêu đề `T` trong cả 5 `document.json` đều ghi “AWS Certified Solutions Architect Associate (SAA-C02)”. Bốn bộ lớn có nội dung machine learning; tiêu đề có thể còn từ mẫu cũ.

Theo [hướng dẫn kỳ thi AWS](https://docs.aws.amazon.com/aws-certification/latest/machine-learning-engineer-associate-01/machine-learning-engineer-associate-01.html), MLA-C01 là Machine Learning Engineer – Associate, gồm chuẩn bị dữ liệu, phát triển mô hình, triển khai/quy trình ML, và giám sát/bảo trì/bảo mật.

Có nội dung cần rà soát tính cập nhật: câu 1 của Việt Pháp chọn Amazon Elastic Inference. [Tài liệu AWS](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ElasticInference.html) ghi dịch vụ này ngừng nhận khách hàng mới từ 15/04/2023.

Phạm vi kiểm tra: tính toàn vẹn, cấu trúc, số lượng, câu trùng theo văn bản, cấu hình chọn đáp án và một số dấu hiệu về nội dung. Chưa thẩm định toàn bộ đáp án với tài liệu AWS hoặc chạy thử giao diện quiz trong ứng dụng gốc. Báo cáo không sửa đề hay đáp án.
