# Quy ước của dự án

Tệp này do người viết (và chỉnh khi cần); agent đọc nhưng không sửa.

## Stack và lệnh
- Ngôn ngữ/stack: (điền)
- Cài: (điền)
- Test: (điền)

## Cách làm việc
- Tài liệu của yêu cầu nằm ở `specs/REQ-xxx/` (xem `requirement.md`, `spec.md`, `plan.md`, `progress.md`).
- Tài liệu cho người đọc viết tiếng Việt; code, tên định danh và tên test viết tiếng Anh.
- Commit nhỏ, thông điệp tiếng Anh, sau mỗi bước của `plan.md`.
- Không ghi bí mật, token hay nội dung `.env` vào repo.
- Không sửa `requirement.md`, `notes.md`, `.claude/`, `.codex/`, `.git*`, `AGENTS.md`, `CLAUDE.md`.
- Kết thúc mỗi lần chạy bằng `.agent/result.json` đúng hợp đồng trong prompt.
