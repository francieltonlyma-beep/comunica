import { ArrowLeftRight, Check, Clock, X } from 'lucide-react';
import { canCancelSwapRequest, canRespondSwapRequest, canReviewSwapRequest, swapRequestStatus } from './scheduleSwapRequests.js';
import './ScheduleSwapRequestsPanel.css';

const date = value => value?.split('-').reverse().join('/') || '—';

export default function ScheduleSwapRequestsPanel({ requests, currentUser, canManage, busy, onClose, onAction, onReview }) {
  const sorted = requests.slice().sort((a, b) => Number(b.updatedAt || b.createdAt) - Number(a.updatedAt || a.createdAt));
  const pending = sorted.filter(item => ['pending_peer', 'pending_manager'].includes(item.status));
  const history = sorted.filter(item => !['pending_peer', 'pending_manager'].includes(item.status)).slice(0, 8);
  const card = item => <article className={`ssr-card ssr-${item.status}`} key={item.id}>
    <div className="ssr-card-head"><div><strong>{item.requesterName} ⇄ {item.targetName}</strong><span>{date(item.sourceDate)} ⇄ {date(item.targetDate)}</span></div><span className="ssr-status">{swapRequestStatus[item.status] || item.status}</span></div>
    {item.reason && <p>{item.reason}</p>}
    {item.decisionNote && <p className="ssr-note">Observação: {item.decisionNote}</p>}
    <div className="ssr-actions">
      {canRespondSwapRequest(item, currentUser) && <><button type="button" disabled={busy} onClick={() => onAction(item, 'reject-peer')}><X size={14}/>Recusar</button><button type="button" disabled={busy} className="ssr-primary" onClick={() => onAction(item, 'accept')}><Check size={14}/>Aceitar e enviar ao gestor</button></>}
      {canCancelSwapRequest(item, currentUser) && <button type="button" disabled={busy} onClick={() => onAction(item, 'cancel')}>Cancelar solicitação</button>}
      {canManage && item.status === 'pending_peer' && <span><Clock size={13}/>Aguardando resposta de {item.targetName}</span>}
      {canReviewSwapRequest(item, canManage) && <><button type="button" disabled={busy} onClick={() => onAction(item, 'reject-manager')}><X size={14}/>Recusar</button><button type="button" disabled={busy} className="ssr-primary" onClick={() => onReview(item)}><ArrowLeftRight size={14}/>Analisar e aprovar</button></>}
    </div>
  </article>;
  return <section className="ssr" aria-label="Solicitações de troca de escala">
    <header><div><span>FLUXO DE APROVAÇÃO</span><h3>Solicitações de troca</h3><p>O colega aceita primeiro; depois o gestor confere a cobertura e decide.</p></div><button type="button" onClick={onClose} aria-label="Fechar solicitações de troca"><X size={18}/></button></header>
    <div className="ssr-body"><section><h4>Pendentes <span>{pending.length}</span></h4>{pending.length ? pending.map(card) : <p className="ssr-empty">Nenhuma troca aguardando resposta.</p>}</section>
      {history.length > 0 && <details><summary>Histórico recente ({history.length})</summary><div className="ssr-history">{history.map(card)}</div></details>}
    </div>
  </section>;
}
