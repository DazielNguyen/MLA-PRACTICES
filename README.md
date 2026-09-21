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
- 574 câu: 332 câu MLS cũ và 242 câu MLA-C01 sau khi gộp 44 bản lặp trong ZIP bổ sung.
- Lọc riêng MLS, MLA-C01 hoặc học chung. Đáp án chưa kiểm chứng được ghi rõ **Theo nguồn**.
- Hồ sơ theo tên, bài riêng cho từng tab, lịch sử chia sẻ chỉ đọc.
- Lưu trên trình duyệt hoặc đồng bộ Supabase, không cần email/mật khẩu.
- [Hướng dẫn tạo và kết nối Supabase](web/SUPABASE_SETUP.md).
- Có cấu hình Vercel. Khi import repository, chọn Root Directory là `web`.

Xem [hướng dẫn sử dụng và triển khai](web/README.md), [báo cáo kiểm tra dữ liệu](BAO_CAO_KIEM_TRA.md) và [tài liệu Quizlet](output/quizlet/HUONG_DAN_QUIZLET.md).

Bản tổng hợp mới: [báo cáo trùng câu và đáp án](BAO_CAO_GOP_BO_DE.md), [Markdown đầy đủ](output/merged/ML_COMBINED.md), [file nhập Quizlet](output/merged/QUIZLET_COMBINED.md).

Website: [mla-practice-studio.vercel.app](https://mla-practice-studio.vercel.app).
