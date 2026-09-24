# Trợ lý AI trong ML Practice

Trợ lý dùng SDK JavaScript chính thức `openai` và Responses API. Endpoint `/api/chat` chạy trên server.
API key không nằm trong mã JavaScript của trình duyệt.

## Chạy trên máy

1. Mở `web/.env.local`.
2. Điền key vào `OPENAI_API_KEY=`.
3. Giữ `OPENAI_MODEL=gpt-5-mini`, hoặc chọn model Responses hỗ trợ reasoning và web search.
4. Giữ mã ngẫu nhiên đã tạo trong `AI_CHAT_ACCESS_CODE`.
5. Khởi động lại ứng dụng từ thư mục `web`:

```bash
npm run dev
```

`npm run study` cũng hỗ trợ trợ lý qua endpoint trên máy.
`npm run preview` chỉ phục vụ bản frontend đã build. Lệnh này không chạy API bot.

File `.env.local` đã có đủ ba biến. Cấu hình Supabase hiện có vẫn giữ nguyên.

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
AI_CHAT_ACCESS_CODE=REPLACE_WITH_A_LONG_RANDOM_CODE
```

Ví dụ trên không chứa mã thật. Mã thật được tạo riêng trong `.env.local` trên máy của bạn.
Nếu tạo lại file, dùng một mã ngẫu nhiên dài ít nhất 16 ký tự.

Không thêm tiền tố `VITE_` vào API key hoặc mã truy cập bot.
Build sẽ từ chối các biến công khai chứa OpenAI key hoặc mã truy cập bot.
Git bỏ qua `.env.local`.

Lưu file trước khi chạy kiểm thử. `.env.local` được ưu tiên hơn `.env`, kể cả khi giá trị đang để trống.
Đặt cấu hình OpenAI trong `web/.env.local` để tránh ghi đè ngoài ý muốn.
`OPENAI_MODEL` cần đúng model ID mà API và project của bạn hỗ trợ.

## Dùng trên Vercel

File `.env.local` trên máy không tự cập nhật biến môi trường của Vercel.

1. Mở project `mla-practice-studio` trên Vercel.
2. Vào **Settings → Environment Variables**.
3. Thêm `OPENAI_API_KEY`, `OPENAI_MODEL` và `AI_CHAT_ACCESS_CODE`.
4. Sao chép giá trị tương ứng từ `.env.local` của bạn.
5. Chọn môi trường **Production**.
6. Redeploy bản mới nhất.

Giữ Root Directory là `web`. Vercel chạy `api/chat.ts` thành một Function.
Ứng dụng dùng URL dạng `/#/...`, nên không cần rewrite mọi đường dẫn về `index.html`.
Nhờ đó, `/api/chat` đi đến API thay vì nhận trang HTML.

## Cách dùng

1. Chọn hồ sơ người học.
2. Bấm **Trợ lý AI**, hoặc **Hỏi AI về câu này** ngay trên câu hỏi.
3. Nhập giá trị `AI_CHAT_ACCESS_CODE` vào **Mã truy cập bot**.
4. Bấm **Dùng mã này**.
5. Nhập câu hỏi và bấm Enter.

Mã truy cập bot khác API key. Không nhập API key vào ô chat.
Mã truy cập chỉ được nhớ trong tab hiện tại. Nút **Khóa bot** xóa mã khỏi tab.
API kiểm tra mã ở mỗi lượt hỏi.

Nút **Hỏi AI về nội dung này** gửi đúng ID mục Keywork.
Server lấy nội dung tương ứng từ bộ tài liệu, gồm Domain, Part và nguồn tham khảo.
Người học không cần sao chép đề hoặc phần giải thích.

Bot trả lời bằng tiếng Việt và giữ tên dịch vụ, keyword tiếng Anh.
Bật **Tra tài liệu AWS** để tra cứu các trang thuộc `docs.aws.amazon.com` và `aws.amazon.com`.
Khi không bật tra cứu, câu trả lời dựa trên tài liệu đang học và kiến thức của model.
Bot không tự đổi khóa đáp án hoặc ghi điểm.

Shift + Enter xuống dòng. **Dừng trả lời** hủy yêu cầu đang chạy.
Trợ lý tạm khóa trong màn hình thi thử và tự kiểm tra có ẩn đáp án.

Hội thoại lưu trên trình duyệt, riêng theo người học và câu hỏi hoặc mục Keywork.
Hội thoại AI chưa đồng bộ qua Supabase. Tiến trình học vẫn đồng bộ theo cơ chế hiện có.
Mỗi hội thoại giữ tối đa 40 tin nhắn. Nút dấu cộng xóa hội thoại đang mở để bắt đầu lại.
Khi gửi, tin nhắn và ngữ cảnh câu hỏi được chuyển tới OpenAI. Tên và mã hồ sơ không tự gửi kèm.

## Giới hạn và lỗi

Mỗi lượt hỏi nhận tối đa 3.000 output token, gồm reasoning token.
Server chỉ gửi tối đa năm cặp hỏi đáp hoàn chỉnh gần nhất, kèm câu hỏi mới.
Nội dung đầu vào có giới hạn độ dài. SDK không tự thử lại yêu cầu lỗi.
Khi bật tra cứu, mỗi lượt có tối đa hai lần gọi công cụ.

Server chặn yêu cầu đồng thời từ cùng địa chỉ và giới hạn tám yêu cầu mỗi phút trên mỗi instance.
Bộ giới hạn trong bộ nhớ chỉ giảm gửi liên tục. Nó không phải hạn mức chi phí dùng chung giữa các instance Vercel.
API và web search dùng hạn mức thanh toán của project OpenAI chứa key.

| Thông báo | Cách xử lý |
| --- | --- |
| Trợ lý chưa được kích hoạt | Điền key và mã truy cập, rồi khởi động lại hoặc redeploy. |
| Mã truy cập bot chưa đúng | Nhập lại giá trị `AI_CHAT_ACCESS_CODE` của môi trường đang dùng. |
| Kết nối OpenAI chưa được cấp quyền | Kiểm tra API key và quyền truy cập model trong project OpenAI. |
| OpenAI đang giới hạn yêu cầu | Kiểm tra hạn mức API và thanh toán của project. |
| Câu trả lời chưa hoàn tất | Hỏi một ý ngắn hơn hoặc bấm thử lại. |

## Kiểm tra mã nguồn

```bash
npm test
npm run test:e2e -- tests/assistant.spec.ts
npm run build
```

Kiểm tra server dùng SDK thật với HTTP giả lập. Kiểm tra giao diện dùng phản hồi giả lập.
Các kiểm tra không gửi yêu cầu có phí tới OpenAI.
Chưa kiểm tra câu trả lời từ API thật: `OPENAI_API_KEY` trong file đã lưu hiện còn trống.

Tài liệu: [Responses streaming](https://developers.openai.com/api/docs/guides/streaming-responses),
[GPT-5 Mini](https://developers.openai.com/api/docs/models/gpt-5-mini),
[Web search](https://developers.openai.com/api/docs/guides/tools-web-search),
[Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js).
