export function formatCredits(credits: number | null | undefined): string {
  if (credits == null) return '0';
  return credits.toFixed(0);
}

export function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return '¥0';
  return `¥${(cents / 100).toFixed(0)}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;

  return formatDate(dateStr);
}

export function formatOrderNo(orderNo: string): string {
  return orderNo.slice(0, 16) + '...';
}

export const transactionTypeLabels: Record<string, string> = {
  initial: '注册赠送',
  purchase: '充值',
  consumption: '消耗',
  refund: '退款',
  manual: '手动调整',
};

export const taskStatusLabels: Record<string, string> = {
  pending: '等待中',
  processing: '生成中',
  completed: '已完成',
  failed: '失败',
};