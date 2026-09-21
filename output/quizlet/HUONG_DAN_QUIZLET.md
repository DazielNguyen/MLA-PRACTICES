# Nhập bộ câu hỏi Machine Learning – Specialty vào Quizlet

Đã chuyển đủ **332 câu** từ PDF, gồm **22 hình trong 19 câu**. Câu hỏi và lựa chọn giữ tiếng Anh; đáp án và giải thích ngắn dùng tiếng Việt.

## Chọn file

| File | Nội dung |
| --- | --- |
| [ML_SPECIALTY_332_QUIZLET_IMPORT.md](ML_SPECIALTY_332_QUIZLET_IMPORT.md) | Đủ 332 thẻ, có nhãn cảnh báo ở các câu chưa chốt |
| [ML_SPECIALTY_QUIZLET_KHONG_CO_CAU_MO_HO.md](ML_SPECIALTY_QUIZLET_KHONG_CO_CAU_MO_HO.md) | 304 thẻ đã có kết luận, gồm cả câu dịch vụ cũ có ghi chú |
| [ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md) | Bản đọc đầy đủ: đề, lựa chọn, hình gốc, giải thích, đáp án PDF và nguồn |

## Cách nhập

1. Mở file `ML_SPECIALTY_332_QUIZLET_IMPORT.md` ở **chế độ văn bản/source trong IDE**, chọn tất cả và sao chép. Không sao chép từ Markdown Preview.
2. Trên website Quizlet, tạo một bộ flashcard và chọn **Import**.
3. Dán nội dung. Chọn **Tab** giữa thuật ngữ và định nghĩa, **New line** giữa các thẻ.
4. Kiểm tra phần xem trước có đúng **332 thẻ** (hoặc **304 thẻ** nếu dùng file không có câu mơ hồ), rồi hoàn tất nhập.

Mỗi dòng là một thẻ: `Câu hỏi + A/B/C/D…` → `Đáp án + giải thích + nguồn`. Dấu `|` chỉ phân cách các lựa chọn trong cùng thẻ. File nhập không có tiêu đề, bảng Markdown hay hàng trống. Nguồn: [hướng dẫn nhập nội dung của Quizlet](https://help.quizlet.com/hc/en-us/articles/360029977151-Creating-sets-by-importing-content).

Quizlet nhập chữ từ file này; hình không được tải lên tự động. Dữ kiện hình đã được chép thành chữ trong thẻ. Có thể xem hình gốc trong bản đọc và thư mục `images/`. Giữ cả thư mục này khi di chuyển bản đọc.

## Kết quả đối chiếu

- 278 câu có đáp án sau đối chiếu.
- 26 câu có đáp án theo bối cảnh dịch vụ cũ.
- 28 câu cần xác minh/sửa đề, chưa dùng làm đáp án chắc chắn.
- 175 câu đã chốt có đáp án khác đáp án in trong PDF.
- Đã bổ sung đúng số lựa chọn ở câu **154, 291, 293, 300**, nơi đáp án PDF thiếu lựa chọn.

Việc đối chiếu dựa trên tài liệu AWS cho tính năng dịch vụ và tài liệu gốc cho kiến thức ML. Kết luận theo tình huống là suy luận của người biên soạn; các nguồn không phải answer key của bộ đề. Ngày rà soát: **21/09/2026**.

PDF mang tên **Machine Learning – Specialty**. Giữ đúng phạm vi nguồn khi sử dụng cùng tài liệu ôn **MLA-C01**; bộ này chưa được biên soạn lại theo cấu trúc MLA-C01.

## Câu cần xác minh hoặc sửa đề

Các câu này được giữ trong bộ 332 thẻ, nhưng mặt đáp án bắt đầu bằng “CẦN XÁC MINH / SỬA ĐỀ”. File 304 thẻ đã loại nhóm này.

| Câu | Lý do |
| --- | --- |
| [001](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-001) | Accuracy = 86%; precision = 50%. C phù hợp nếu nói chi phí mỗi lỗi; tổng chi phí còn phụ thuộc tỷ lệ chi phí churn/incentive. |
| [025](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-025) | Không thể khẳng định mô hình có recall cao nhất chỉ từ hình; còn phụ thuộc phân phối, huấn luyện và ngưỡng. |
| [030](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-030) | Đề yêu cầu chọn 3 nhưng cấu hình built-in training thường cần A, C, E và F; không có bộ ba duy nhất đầy đủ. |
| [042](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-042) | Đề mô tả thời gian chờ có giới hạn 10 phút nhưng yêu cầu Poisson cho số đếm; không đủ giả định xác định prior. |
| [060](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-060) | Ý định là SageMaker Local Mode với container đã tải sẵn; image chính thức lấy từ registry, không trực tiếp từ GitHub. |
| [097](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-097) | Lex đã hỗ trợ cả tiếng nói và văn bản; đề không đủ yêu cầu để chọn duy nhất ba dịch vụ, các phương án có chức năng chồng lấp. |
| [105](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-105) | D là ý định của đề, nhưng tương quan biên không chứng minh phụ thuộc có điều kiện theo nhãn. |
| [106](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-106) | Log giúp giảm skew; hồi quy tuyến tính không bắt buộc các biến đầu vào có phân phối chuẩn. |
| [118](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-118) | AutoML hoặc HPO có thể cải thiện model, nhưng API cấm bật cả hai cùng lúc trong một CreatePredictor call. |
| [156](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-156) | C và D trực tiếp sửa độ phân giải và dữ liệu zero bị bỏ; A cũng có thể hỗ trợ cold-start/seasonality. Đề chưa loại trừ một bộ đôi duy nhất. |
| [159](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-159) | B/D/E là nhóm chọn đặc trưng; E ghi classifier dù giá bán liên tục cần regressor hoặc cách chia nhãn rõ ràng. |
| [163](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-163) | One-hot chắc chắn phù hợp; RGB và frequency encoding đều có thể dùng với giả định khác nhau, nên không có cặp duy nhất từ đề. |
| [176](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-176) | Object2Vec hỗ trợ sentence embeddings. Phương án thứ hai phụ thuộc khả năng lấy encoder state hoặc thiết kế custom RNN; chưa đủ để chốt cặp. |
| [178](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-178) | Ý định là Logarithmic scaling; các hình gốc đảo MinValue=0.1 và MaxValue=0.0001 nên cấu hình phải sửa trước khi chạy. |
| [207](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-207) | B mô tả đúng phân loại BERT bằng token đầu [CLS]. D cũng có thể diễn giải là thay task head; đề cần nói rõ kiến trúc head để loại mơ hồ. |
| [208](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-208) | C phù hợp khi nền tảng cũ hỗ trợ tích hợp SIPREC/Contact Lens. A cũng khả thi nếu Transcribe được hiểu là Call Analytics. Đề chưa chỉ rõ khả năng tích hợp và phiên bản dịch vụ để chốt duy nhất. |
| [242](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-242) | Không phương án nào ghép đúng hai tham số. Cần target_recall=0.9 và binary_classifier_model_selection_criteria=precision_at_target_recall. |
| [252](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-252) | Ý định là Training Compiler kết hợp Spot. Mọi lựa chọn mô tả truyền script vào fit() không đúng SDK: script đặt ở entry_point; Compiler còn phụ thuộc model được hỗ trợ. |
| [254](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-254) | B và E phù hợp underfitting. Thêm training examples không bảo đảm giảm high bias; đề yêu cầu ba lựa chọn nhưng thiếu lựa chọn thứ ba có căn cứ. |
| [258](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-258) | Object detection + ResNet thường ít công sức hơn gán nhãn pixel. Segmentation + ResNet cũng khả thi; đề không cho ràng buộc độ chính xác để chốt duy nhất. |
| [262](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-262) | Rekognition nhận diện celebrity; CloudTrail ghi IP của API caller. Nếu upload qua backend, đó không tự động là IP người dùng cuối; cần bổ sung logging tại ingress. |
| [268](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-268) | B có cơ sở cho metadata author/sensitivity và tra cứu trong Studio. D cần thêm bước đưa metadata sang nguồn dữ liệu QuickSight. Yêu cầu tạo báo cáo chưa đủ chi tiết để kết luận một phương án hoàn chỉnh. |
| [288](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-288) | Firehose có thể ghi S3 nhưng không tự đọc trực tiếp DynamoDB. Cần DynamoDB→Kinesis Data Streams→Firehose (hoặc Lambda); các lựa chọn đều lược thiếu một bước. |
| [294](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-294) | Mode < median < mean gợi ý lệch phải; log có thể hữu ích với giá trị dương. OLS không bắt buộc feature có phân phối chuẩn. |
| [313](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-313) | B có metric bị hỏng ngay trong PDF và ghi csv_weight thay vì csv_weights. C tối đa hóa F1 nhưng tuning mọi tham số không tối ưu ngân sách. Cần sửa đề trước khi chốt; không tự thay metric thành f1 hoặc recall. |
| [319](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-319) | C tạo chuỗi daily đúng tần suất dự báo, nhưng decomposition không đủ chứng minh ARIMA phù hợp; còn cần xử lý giờ thiếu và kiểm tra stationarity/residuals. |
| [320](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-320) | Không lựa chọn nào đầy đủ: phải tắt direct internet, có S3 gateway/API endpoints, và cho phép inbound HTTPS tại endpoint SG. B ghi chỉ outbound nên sai cấu hình. |
| [323](ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md#câu-323) | Ý định là nhiều instances trên ít nhất hai AZ. C viết hai subnet trong AZ thứ hai gây mơ hồ; chỉ hai subnet cùng AZ không tạo khả năng chịu lỗi đa AZ, cũng chưa chứng minh RTO 5 phút. |

## Bối cảnh dịch vụ cũ

Các câu: 010, 022, 037, 061, 062, 073, 077, 108, 119, 120, 128, 136, 137, 154, 160, 180, 186, 196, 200, 216, 228, 230, 239, 240, 273, 296.

- Kinesis Data Analytics for SQL đã ngừng hoạt động; các câu dùng SQL application cũ chỉ giữ để hiểu bối cảnh đề. [AWS](https://docs.aws.amazon.com/kinesisanalytics/latest/dev/what-is.html).
- Forecast, A2I, Comprehend topic modeling và Fraud Detector có hạn chế tiếp nhận khách hàng mới. Xem nguồn ngay tại câu liên quan.
- DeepLens và dòng Snowball Edge GPU được liệt kê trong nhóm dịch vụ đã dừng. [AWS](https://docs.aws.amazon.com/general/latest/gr/elastictranscoder.html).
- Elastic Inference không tiếp nhận khách hàng mới từ 15/04/2023. [AWS](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ElasticInference.html).
- Glue development endpoints thuộc quy trình cũ, chỉ hỗ trợ phiên bản Glue trước 2.0. [AWS](https://docs.aws.amazon.com/glue/latest/dg/dev-endpoint.html).

## Kiểm tra bản chuyển đổi

Đủ số thứ tự 001–332, giữ số lựa chọn từng câu, kiểm tra số đáp án của câu chọn nhiều và giữ đủ 22 hình. Mỗi dòng nhập có đúng một ký tự Tab. Không đưa bình luận cộng đồng, header/footer trang hoặc đáp án vào mặt câu hỏi.

Các lỗi font có thể xác định chắc chắn được chuẩn hóa. Riêng đơn vị dung lượng bị hỏng trong câu 166 và 179 được ghi `[unit unreadable in source]`; không đoán đơn vị. Câu 178 giữ nguyên MinValue/MaxValue bị đảo trong hình và ghi cách sửa ở phần giải thích. Câu 313 giữ tên metric bị lỗi như PDF.

Đã kiểm tra cấu trúc file để nhập; chưa đăng nhập, nhập thử hoặc xuất bản bộ thẻ trên tài khoản Quizlet.
