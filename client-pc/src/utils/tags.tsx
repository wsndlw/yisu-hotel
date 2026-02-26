import { Tag } from "antd";

export function statusTag(status: string, hasEverPublished?: boolean) {
  const map: Record<string, { color: string; text: string }> = {
    DRAFT: { color: 'default', text: hasEverPublished ? '更改待提交' : '草稿' },
    REVIEWING: { color: 'processing', text: '审核中' },
    REJECTED: { color: 'error', text: '未通过' },
    PUBLISHED: { color: 'success', text: '已发布' },
    OFFLINE: { color: 'warning', text: '已下线' },
  };
  const s = map[status] || { color: 'default', text: status };
  return <Tag color={s.color}>{s.text}</Tag>;
}