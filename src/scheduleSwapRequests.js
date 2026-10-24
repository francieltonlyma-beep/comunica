import { scheduleSignature } from './scheduleOptimizer.js';
import { publishedScheduleOnDay, publishedSwapIssues } from './publishedScheduleSwap.js';

export const swapRequestStatus = {
  pending_peer: 'Aguardando o colega', pending_manager: 'Aguardando o gestor', approved: 'Aprovada', rejected: 'Recusada', cancelled: 'Cancelada',
};

export function buildScheduleSwapRequest({ id, source, sourceDate, target, targetDate, requester, reason = '', history = [], absences = [], rules = {}, existing = [], now }) {
  if (!id || !requester?.id || !Number.isFinite(now)) throw new Error('Não foi possível identificar esta solicitação.');
  if (String(source?.userId) !== String(requester.id)) throw new Error('Você só pode solicitar troca de um dia da sua própria escala.');
  const issues = publishedSwapIssues(source, sourceDate, target, targetDate, { history, absences, rules });
  if (issues.length) throw new Error(issues[0]);
  if (existing.some(item => ['pending_peer', 'pending_manager'].includes(item.status) && String(item.requesterId) === String(requester.id) && item.sourceDate === sourceDate)) throw new Error('Já existe uma solicitação aberta para este dia.');
  return {
    id, requesterId: String(requester.id), requesterName: requester.name || source.userName || 'Colaborador',
    sourceScheduleId: source.id, sourceDate, targetUserId: String(target.userId), targetName: target.userName || 'Colaborador',
    targetScheduleId: target.id, targetDate, reason: String(reason || '').trim().slice(0, 240), status: 'pending_peer',
    scheduleSignature: scheduleSignature([source, target]), createdAt: now, updatedAt: now,
  };
}

export function resolveScheduleSwapRequest(request, history) {
  const source = publishedScheduleOnDay(history, request?.requesterId, request?.sourceDate);
  const target = publishedScheduleOnDay(history, request?.targetUserId, request?.targetDate);
  const valid = Boolean(source && target && source.id === request.sourceScheduleId && target.id === request.targetScheduleId
    && scheduleSignature([source, target]) === request.scheduleSignature);
  return { source, target, valid, message: valid ? '' : 'A escala mudou depois da solicitação. Recuse este pedido e peça uma nova troca.' };
}

export function canRespondSwapRequest(request, user) {
  return request?.status === 'pending_peer' && String(request.targetUserId) === String(user?.id);
}

export function canCancelSwapRequest(request, user) {
  return ['pending_peer', 'pending_manager'].includes(request?.status) && String(request.requesterId) === String(user?.id);
}

export function canReviewSwapRequest(request, canManage) {
  return Boolean(canManage && request?.status === 'pending_manager');
}

export function swapRequestPatch(request, action, actor, now, note = '') {
  if (!request?.id || !actor?.id || !Number.isFinite(now)) throw new Error('Solicitação indisponível.');
  const base = { updatedAt: now };
  if (action === 'accept' && canRespondSwapRequest(request, actor)) return { ...base, status: 'pending_manager', peerRespondedAt: now, peerRespondedById: String(actor.id), peerRespondedByName: actor.name || request.targetName };
  if (action === 'reject-peer' && canRespondSwapRequest(request, actor)) return { ...base, status: 'rejected', peerRespondedAt: now, peerRespondedById: String(actor.id), peerRespondedByName: actor.name || request.targetName, decisionNote: String(note || '').trim().slice(0, 240) };
  if (action === 'cancel' && canCancelSwapRequest(request, actor)) return { ...base, status: 'cancelled', cancelledAt: now, cancelledById: String(actor.id) };
  if (action === 'reject-manager') return { ...base, status: 'rejected', reviewedAt: now, reviewedById: String(actor.id), reviewedByName: actor.name || 'Gestor', decisionNote: String(note || '').trim().slice(0, 240) };
  throw new Error('Esta solicitação não pode receber essa ação.');
}
