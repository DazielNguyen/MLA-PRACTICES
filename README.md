# MLA Practices

Ứng dụng ôn tập nằm trong [web](web/README.md).

Dữ liệu đề, bản dịch, ảnh và metadata không được Git theo dõi. Máy mới cần khôi phục các file riêng trước khi chạy.

Chạy từ thư mục này:

```bash
cd web
npm ci
npm run dev
```

Mở **http://127.0.0.1:5173/**.

- Flashcard, luyện có đáp án, luyện ẩn đáp án và thi có đồng hồ.
- Web có 437 câu MLA-C01 từ ZIP và Udemy. MLS và bộ tự biên soạn chỉ giữ trong kho lưu trữ.
- Mục **Ảnh & ghép từ** để ôn riêng câu có ảnh, ghép tình huống và sắp xếp thứ tự.
- Bảng màu tỷ lệ đúng từng câu, danh sách sai nhiều nhất và câu chưa từng trả lời đúng.
- Hồ sơ theo tên, bài riêng cho từng tab, lịch sử chia sẻ chỉ đọc.
- Lưu trên trình duyệt hoặc đồng bộ Supabase, không cần email/mật khẩu.
- [Thông tin bộ tự biên soạn và xuất Quizlet](web/PERSONAL_STUDY.md).
- [Hướng dẫn tạo và kết nối Supabase](web/SUPABASE_SETUP.md).
- Triển khai Vercel từ máy giữ dữ liệu riêng. Project dùng Root Directory là `web`.

Các báo cáo và bản xuất bên dưới chỉ có trên máy giữ dữ liệu riêng.

Xem [hướng dẫn sử dụng và triển khai](web/README.md), [báo cáo kiểm tra dữ liệu](BAO_CAO_KIEM_TRA.md) và [tài liệu Quizlet](output/quizlet/HUONG_DAN_QUIZLET.md).

Bản tổng hợp mới: [báo cáo trùng câu và đáp án](BAO_CAO_GOP_BO_DE.md), [Markdown đầy đủ](output/merged/ML_COMBINED.md), [file nhập Quizlet](output/merged/QUIZLET_COMBINED.md).

Website: [mla-practice-studio.vercel.app](https://mla-practice-studio.vercel.app).
