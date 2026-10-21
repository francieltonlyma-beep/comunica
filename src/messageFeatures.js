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

export const createMessageActivity = (actor = {}) => ({
  status: 'pending',
  priority: 'normal',
  assigneeIds: [],
  checklist: [],
  createdAt: Date.now(),
  createdBy: actor.id || '',
  createdByName: actor.name || '',
  resolvedAt: null,
  resolvedBy: '',
});

export const normalizeMessageActivity = activity => activity && typeof activity === 'object' ? ({
  status: ['pending', 'in_progress', 'resolved'].includes(activity.status) ? activity.status : 'pending',
  priority: ['low', 'normal', 'high', 'urgent'].includes(activity.priority) ? activity.priority : 'normal',
  assigneeIds: normalizeMessageFeatureList(activity.assigneeIds),
  checklist: Array.isArray(activity.checklist) ? activity.checklist.map(item => ({
    id: String(item?.id || ''),
    text: String(item?.text || '').slice(0, 180),
    completed: item?.completed === true,
  })).filter(item => item.id && item.text).slice(0, 30) : [],
  createdAt: Number(activity.createdAt || 0),
  createdBy: String(activity.createdBy || ''),
  createdByName: String(activity.createdByName || ''),
  resolvedAt: Number(activity.resolvedAt || 0) || null,
  resolvedBy: String(activity.resolvedBy || ''),
}) : null;
