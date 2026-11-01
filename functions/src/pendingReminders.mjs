const DAY = 24 * 60 * 60 * 1000;
const civilDate = value => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(value));
const timestamp = value => {
  const number = typeof value?.toMillis === 'function' ? value.toMillis() : Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};
const ids = value => Array.isArray(value)
  ? [...new Set(value.filter(id => typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id)))] : [];

/** Build reminders from current company records; never infer that a missing date is old. */
export function buildPendingReminders(messages, activities, now = Date.now()) {
  const today = civilDate(now);
  const unread = new Map();
  const pending = [];
  const addActivity = (id, record, activity, threadId, mutedBy = []) => {
    if (!activity || typeof activity !== 'object' || ['resolved', 'completed', 'cancelled', 'canceled'].includes(activity.status)) return;
    const lastUpdate = Math.max(timestamp(activity.updatedAt), timestamp(activity.createdAt)) || timestamp(record.timestamp);
    if (!lastUpdate || now - lastUpdate < DAY) return;
    const assignees = ids(activity.assigneeIds);
    const recipientIds = (assignees.length ? assignees : ids([activity.createdBy])).filter(userId => !mutedBy.includes(userId));
    if (!recipientIds.length) return;
    pending.push({
      kind: 'stalled', key: `stalled-${threadId ? 'message' : 'standalone'}-${id}`,
      type: 'activity_update', threadId, messageId: id, recipientIds,
      title: 'Atividade sem atualização há 24 horas',
      body: String(record.subject || record.title || 'Atividade pendente').slice(0, 180),
    });
  };
  for (const record of messages) {
    const threadId = String(record.threadId || '');
    if (!/^[a-zA-Z0-9_-]+$/.test(threadId)) continue;
    const mutedBy = ids(record.mutedBy);
    const sentAt = timestamp(record.timestamp);
    if (sentAt && civilDate(sentAt) < today) {
      const readBy = ids(record.readBy);
      const recipients = ids(record.participants).filter(userId => userId !== record.senderId && !readBy.includes(userId) && !mutedBy.includes(userId));
      for (const userId of recipients) {
        const key = `unread-${threadId}-${userId}`;
        const previous = unread.get(key);
        if (!previous || sentAt > previous.sentAt) unread.set(key, {
          kind: 'unread', key, type: 'message', threadId, messageId: record.id,
          recipientIds: [userId], sentAt,
          title: 'Você tem mensagens não lidas',
          body: String(record.subject || 'Conversa no Comunica').slice(0, 180),
        });
      }
    }
    // A completed conversation no longer requires work on its embedded activity.
    if (!record.completedAt) addActivity(record.id, record, record.activity, threadId, mutedBy);
  }
  for (const record of activities) addActivity(record.id, record, record, '');
  return [...unread.values(), ...pending];
}
