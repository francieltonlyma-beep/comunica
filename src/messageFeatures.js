export const normalizeMessageFeatureList = value => Array.isArray(value) ? [...new Set(value.filter(Boolean))] : [];

export const toggleMessageUser = (value, userId) => {
  const current = normalizeMessageFeatureList(value);
  return current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId];
};

export const messageReplySnapshot = message => message ? ({
  id: message.id,
  senderId: message.senderId,
  senderName: message.senderName || 'Participante',
  content: String(message.content || '').slice(0, 240),
  attachmentName: message.attachment?.name || '',
}) : null;

export const findMentionedParticipantIds = (text, participants = []) => {
  const source = String(text || '').toLocaleLowerCase('pt-BR');
  return participants.filter(person => {
    const fullName = String(person?.name || '').trim().toLocaleLowerCase('pt-BR');
    const firstName = fullName.split(/\s+/)[0];
    return Boolean(fullName && (source.includes(`@${fullName}`) || (firstName.length >= 2 && source.includes(`@${firstName}`))));
  }).map(person => person.id);
};

export const createActivityHistoryEntry = (actor = {}, text = 'Atividade criada', type = 'created', timestamp = Date.now()) => ({
  id: `history-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
  type: String(type || 'update').slice(0, 40),
  text: String(text || 'Atividade atualizada').trim().slice(0, 240),
  actorId: String(actor.id || ''),
  actorName: String(actor.name || 'Participante').slice(0, 120),
  timestamp: Number(timestamp || Date.now()),
});

export const createMessageActivity = (actor = {}) => {
  const now = Date.now();
  return {
    status: 'pending',
    priority: 'normal',
    assigneeIds: [],
    dueDate: '',
    checklist: [],
    comments: [],
    attachments: [],
    history: [createActivityHistoryEntry(actor, 'Atividade criada', 'created', now)],
    createdAt: now,
    createdBy: actor.id || '',
    createdByName: actor.name || '',
    updatedAt: now,
    updatedBy: actor.id || '',
    updatedByName: actor.name || '',
    resolvedAt: null,
    resolvedBy: '',
    recurrence: { frequency: 'none', interval: 1 },
  };
};

export const normalizeActivityRecurrence = value => ({
  frequency: ['none', 'daily', 'weekly', 'monthly'].includes(value?.frequency) ? value.frequency : 'none',
  interval: Math.max(1, Math.min(12, Number(value?.interval) || 1)),
});

export const normalizeMessageActivity = activity => activity && typeof activity === 'object' ? ({
  status: ['pending', 'in_progress', 'resolved'].includes(activity.status) ? activity.status : 'pending',
  priority: ['low', 'normal', 'high', 'urgent'].includes(activity.priority) ? activity.priority : 'normal',
  assigneeIds: normalizeMessageFeatureList(activity.assigneeIds),
  dueDate: /^\d{4}-\d{2}-\d{2}$/.test(String(activity.dueDate || '')) ? String(activity.dueDate) : '',
  checklist: Array.isArray(activity.checklist) ? activity.checklist.map(item => ({
    id: String(item?.id || ''),
    text: String(item?.text || '').slice(0, 180),
    completed: item?.completed === true,
  })).filter(item => item.id && item.text).slice(0, 30) : [],
  comments: Array.isArray(activity.comments) ? activity.comments.map(comment => ({
    id: String(comment?.id || ''),
    text: String(comment?.text || '').trim().slice(0, 1000),
    authorId: String(comment?.authorId || ''),
    authorName: String(comment?.authorName || 'Participante').slice(0, 120),
    createdAt: Number(comment?.createdAt || 0),
  })).filter(comment => comment.id && comment.text && comment.createdAt).slice(-100) : [],
  attachments: Array.isArray(activity.attachments) ? activity.attachments.map(file => ({
    id: String(file?.id || ''),
    name: String(file?.name || 'arquivo').slice(0, 180),
    type: String(file?.type || 'application/octet-stream').slice(0, 120),
    size: Math.max(0, Number(file?.size || 0)),
    url: String(file?.url || ''),
    storagePath: String(file?.storagePath || ''),
    uploadedAt: Number(file?.uploadedAt || 0),
    uploadedBy: String(file?.uploadedBy || ''),
    uploadedByName: String(file?.uploadedByName || 'Participante').slice(0, 120),
  })).filter(file => file.id && file.name && (file.url || file.storagePath)).slice(-30) : [],
  history: Array.isArray(activity.history) ? activity.history.map(entry => ({
    id: String(entry?.id || ''),
    type: String(entry?.type || 'update').slice(0, 40),
    text: String(entry?.text || '').trim().slice(0, 240),
    actorId: String(entry?.actorId || ''),
    actorName: String(entry?.actorName || 'Participante').slice(0, 120),
    timestamp: Number(entry?.timestamp || 0),
  })).filter(entry => entry.id && entry.text && entry.timestamp).slice(-100) : [],
  createdAt: Number(activity.createdAt || 0),
  createdBy: String(activity.createdBy || ''),
  createdByName: String(activity.createdByName || ''),
  updatedAt: Number(activity.updatedAt || activity.createdAt || 0),
  updatedBy: String(activity.updatedBy || ''),
  updatedByName: String(activity.updatedByName || ''),
  resolvedAt: Number(activity.resolvedAt || 0) || null,
  resolvedBy: String(activity.resolvedBy || ''),
  recurrence: normalizeActivityRecurrence(activity.recurrence),
}) : null;

export const activityUpdateDescription = (currentValue, changes = {}, people = []) => {
  const current = normalizeMessageActivity(currentValue);
  if (!current) return 'Atividade atualizada';
  if (changes.status && changes.status !== current.status) {
    return `Situação alterada para ${{ pending: 'pendente', in_progress: 'em andamento', resolved: 'resolvida' }[changes.status] || changes.status}`;
  }
  if (Object.hasOwn(changes, 'dueDate') && changes.dueDate !== current.dueDate) {
    return changes.dueDate ? `Prazo alterado para ${String(changes.dueDate).split('-').reverse().join('/')}` : 'Prazo removido';
  }
  if (changes.priority && changes.priority !== current.priority) {
    return `Prioridade alterada para ${{ low: 'baixa', normal: 'normal', high: 'alta', urgent: 'urgente' }[changes.priority] || changes.priority}`;
  }
  if (changes.assigneeIds && JSON.stringify(changes.assigneeIds) !== JSON.stringify(current.assigneeIds)) {
    const names = changes.assigneeIds.map(id => people.find(person => person.id === id)?.name).filter(Boolean);
    return names.length ? `Responsável definido: ${names.join(', ')}` : 'Responsável removido';
  }
  if (changes.recurrence && changes.recurrence.frequency !== current.recurrence.frequency) {
    return `Recorrência alterada para ${activityRecurrenceLabel(changes.recurrence).toLocaleLowerCase('pt-BR')}`;
  }
  if (changes.checklist) return 'Checklist atualizado';
  return 'Atividade atualizada';
};

export const activityRecurrenceLabel = recurrence => {
  const normalized = normalizeActivityRecurrence(recurrence);
  if (normalized.frequency === 'daily') return normalized.interval === 1 ? 'Diariamente' : `A cada ${normalized.interval} dias`;
  if (normalized.frequency === 'weekly') return normalized.interval === 1 ? 'Semanalmente' : `A cada ${normalized.interval} semanas`;
  if (normalized.frequency === 'monthly') return normalized.interval === 1 ? 'Mensalmente' : `A cada ${normalized.interval} meses`;
  return 'Não se repete';
};

export const nextActivityDueDate = (dueDate, recurrence) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dueDate || ''))) return '';
  const normalized = normalizeActivityRecurrence(recurrence);
  if (normalized.frequency === 'none') return '';
  const [year, month, day] = dueDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (normalized.frequency === 'daily') date.setUTCDate(date.getUTCDate() + normalized.interval);
  if (normalized.frequency === 'weekly') date.setUTCDate(date.getUTCDate() + (7 * normalized.interval));
  if (normalized.frequency === 'monthly') {
    const targetMonth = date.getUTCMonth() + normalized.interval;
    const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;
    const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
    date.setUTCFullYear(targetYear, normalizedMonth, Math.min(day, lastDay));
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

export const normalizeActivityTemplate = template => ({
  id: String(template?.id || ''),
  name: String(template?.name || '').trim().slice(0, 80),
  description: String(template?.description || '').trim().slice(0, 240),
  priority: ['low', 'normal', 'high', 'urgent'].includes(template?.priority) ? template.priority : 'normal',
  checklist: Array.isArray(template?.checklist) ? template.checklist.map((item, index) => ({
    id: String(item?.id || `template-item-${index}`),
    text: String(item?.text || '').trim().slice(0, 180),
    completed: false,
  })).filter(item => item.text).slice(0, 30) : [],
  createdAt: Number(template?.createdAt || 0),
  createdBy: String(template?.createdBy || ''),
  createdByName: String(template?.createdByName || ''),
});

export const activityProductivityMetrics = (activities = [], today = '', now = Date.now()) => {
  const normalized = activities.map(normalizeMessageActivity).filter(Boolean);
  const resolved = normalized.filter(activity => activity.status === 'resolved');
  const resolvedWithDueDate = resolved.filter(activity => activity.dueDate && activity.resolvedAt);
  const onTime = resolvedWithDueDate.filter(activity => {
    const completed = new Date(activity.resolvedAt);
    const completedDate = `${completed.getFullYear()}-${String(completed.getMonth() + 1).padStart(2, '0')}-${String(completed.getDate()).padStart(2, '0')}`;
    return completedDate <= activity.dueDate;
  }).length;
  const completionDurations = resolved
    .filter(activity => activity.createdAt && activity.resolvedAt && activity.resolvedAt >= activity.createdAt)
    .map(activity => activity.resolvedAt - activity.createdAt);
  const last30Days = now - (30 * 24 * 60 * 60 * 1000);
  return {
    total: normalized.length,
    resolved: resolved.length,
    resolvedLast30Days: resolved.filter(activity => Number(activity.resolvedAt || 0) >= last30Days).length,
    completionRate: normalized.length ? Math.round((resolved.length / normalized.length) * 100) : 0,
    onTimeRate: resolvedWithDueDate.length ? Math.round((onTime / resolvedWithDueDate.length) * 100) : 0,
    averageCompletionHours: completionDurations.length ? Math.round(completionDurations.reduce((sum, value) => sum + value, 0) / completionDurations.length / 3600000) : 0,
    overdue: normalized.filter(activity => activity.status !== 'resolved' && activity.dueDate && today && activity.dueDate < today).length,
    recurring: normalized.filter(activity => activity.recurrence.frequency !== 'none').length,
  };
};

export const messageActivityProgress = activity => {
  const normalized = normalizeMessageActivity(activity);
  if (!normalized) return 0;
  if (normalized.status === 'resolved') return 100;
  if (!normalized.checklist.length) return normalized.status === 'in_progress' ? 25 : 0;
  return Math.round((normalized.checklist.filter(item => item.completed).length / normalized.checklist.length) * 100);
};

export const isMessageActivityOverdue = (activity, today) => {
  const normalized = normalizeMessageActivity(activity);
  return Boolean(normalized && normalized.status !== 'resolved' && normalized.dueDate && normalized.dueDate < today);
};

export const messageActivitySchedule = (activity, today) => {
  const normalized = normalizeMessageActivity(activity);
  if (!normalized || normalized.status === 'resolved') return 'resolved';
  if (!normalized.dueDate) return 'no_due';
  if (normalized.dueDate < today) return 'overdue';
  if (normalized.dueDate === today) return 'today';
  return 'upcoming';
};
