# MLA Practices

Ứng dụng ôn tập nằm trong [web](web/README.md).

Chạy từ thư mục này:

```bash
cd web
npm ci
npm run dev
```

Mở **http://127.0.0.1:5173/**.

- Flashcard, luyện có đáp án, luyện ẩn đáp án và thi có đồng hồ.
- 594 câu MLA-C01: 242 câu từ ZIP và 352 câu **Tự biên soạn**. MLS chỉ giữ trong kho lưu trữ.
- Lọc riêng bộ tự biên soạn khi luyện tập, thi thử, học flashcard hoặc xem ngân hàng câu hỏi.
- Hồ sơ theo tên, bài riêng cho từng tab, lịch sử chia sẻ chỉ đọc.
- Lưu trên trình duyệt hoặc đồng bộ Supabase, không cần email/mật khẩu.
- [Thông tin bộ tự biên soạn và xuất Quizlet](web/PERSONAL_STUDY.md).
- [Hướng dẫn tạo và kết nối Supabase](web/SUPABASE_SETUP.md).
- Có cấu hình Vercel. Khi import repository, chọn Root Directory là `web`.

Xem [hướng dẫn sử dụng và triển khai](web/README.md), [báo cáo kiểm tra dữ liệu](BAO_CAO_KIEM_TRA.md) và [tài liệu Quizlet](output/quizlet/HUONG_DAN_QUIZLET.md).

Bản tổng hợp mới: [báo cáo trùng câu và đáp án](BAO_CAO_GOP_BO_DE.md), [Markdown đầy đủ](output/merged/ML_COMBINED.md), [file nhập Quizlet](output/merged/QUIZLET_COMBINED.md).

Website: [mla-practice-studio.vercel.app](https://mla-practice-studio.vercel.app).
