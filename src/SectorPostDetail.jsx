import { useEffect, useRef, useState } from 'react';

export default function SectorPostDetail({ post, userId, onClose, onRead, onComment, onLike, onPrivate, canSeePeople, personName, renderText }) {
  const dialog = useRef(null);
  const [reply, setReply] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  const comments = post.comments || [];
  const read = post.readBy || [];
  const opened = post.openedBy || [];
  async function send(event) {
    event.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      if (await onComment(post.id, 'post', text.trim(), reply?.id || '')) {
        setText('');
        setReply(null);
      }
    } finally {
      setSending(false);
    }
  }
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="sector-post-title" className="m-auto w-[min(94vw,38rem)] max-h-[85dvh] overflow-auto rounded-2xl p-5 text-sm shadow-xl backdrop:bg-slate-950/60">
    <header className="flex items-start justify-between gap-4">
      <div><h2 id="sector-post-title" className="break-words text-lg font-bold">{post.title}</h2><small>{post.author} · {post.date}</small></div>
      <button type="button" onClick={onClose} className="text-sm font-semibold">Fechar</button>
    </header>
    <p className="my-4 whitespace-pre-wrap break-words">{renderText(post.content)}</p>
    {post.image && <img src={post.image} alt={post.title} className="w-full rounded-xl" />}
    <div className="my-4 flex flex-wrap gap-3 text-xs font-bold text-blue-800">
      <button disabled={read.includes(userId)} onClick={onRead}>{read.includes(userId) ? 'Leitura confirmada' : 'Confirmar leitura'}</button>
      {post.allowLikes !== false && <button aria-pressed={post.likedBy?.includes(userId) || false} onClick={onLike}>{post.likedBy?.includes(userId) ? 'Descurtir' : 'Curtir'} ({post.likes || 0})</button>}
      {onPrivate && <button onClick={onPrivate}>Responder na caixa de entrada</button>}
    </div>
    {canSeePeople && <details className="my-4 rounded-xl bg-slate-50 p-3 text-xs"><summary className="cursor-pointer font-bold">Abriram ({opened.length}) · Confirmaram leitura ({read.length})</summary>
      {[['Abriram', opened], ['Confirmaram leitura', read], ['Curtiram', post.likedBy || []]].map(([label, ids]) => <p key={label} className="mt-2"><strong>{label}</strong> · {ids.map(personName).join(', ') || 'Ninguém ainda'}</p>)}
    </details>}
    {post.allowComments && <section className="border-t pt-4">
      <h3 className="font-bold">Comentários ({comments.length})</h3>
      {comments.map((comment, index) => {
        const parent = comment.parentId && comments.find(item => item.id === comment.parentId);
        return <div key={comment.id || index} className="mt-2 rounded-lg bg-slate-50 p-3 text-xs">
          <strong>{comment.author}</strong>
          {parent && <blockquote className="my-1 truncate border-l-2 pl-2 text-slate-500">Em resposta a {parent.author} · {parent.text}</blockquote>}
          <p className="whitespace-pre-wrap break-words">{comment.text}</p>
          {comment.id && <button disabled={sending} className="mt-1 text-blue-700" onClick={() => setReply(comment)}>Responder ao comentário</button>}
        </div>;
      })}
      <form onSubmit={send} className="mt-3 grid gap-2">
        {reply && <div className="text-xs">Respondendo a {reply.author} · <button type="button" disabled={sending} onClick={() => setReply(null)}>Cancelar resposta</button></div>}
        <textarea aria-label="Comentário público" placeholder="Escreva um comentário para o setor" maxLength={2000} value={text} disabled={sending} onChange={event => setText(event.target.value)} className="rounded-lg border p-2 text-sm" />
        <button disabled={sending || !text.trim()} className="justify-self-start rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Publicar comentário</button>
      </form>
    </section>}
  </dialog>;
}
