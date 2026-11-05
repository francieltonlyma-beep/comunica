export default function InboxParticipantStack({ users = [], max = 3, compact = false, label = 'Participantes da conversa' }) {
  const visible = users.filter(Boolean).slice(0, max);
  const remaining = Math.max(0, users.filter(Boolean).length - visible.length);
  const size = compact ? 'h-7 w-7 text-[8px]' : 'h-8 w-8 text-[9px]';

  return <span className="inline-flex shrink-0 items-center -space-x-2" aria-label={label}>
    {visible.map(user => user.avatar
      ? <img key={user.id} src={user.avatar} alt="" className={`${size} rounded-full border-2 border-white bg-slate-100 object-cover shadow-sm`} />
      : <span key={user.id} aria-hidden="true" className={`${size} grid place-items-center rounded-full border-2 border-white bg-gradient-to-br from-blue-100 to-cyan-100 font-black text-blue-800 shadow-sm`}>{String(user.name || '?').trim().charAt(0).toUpperCase()}</span>)}
    {remaining > 0 && <span aria-hidden="true" className={`${size} grid place-items-center rounded-full border-2 border-white bg-slate-800 font-black text-white shadow-sm`}>+{remaining}</span>}
  </span>;
}
