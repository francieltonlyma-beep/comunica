// Limita toda a restauração, inclusive quando o observador de autenticação não responde.
// Resultados de uma sessão anterior nunca podem substituir a sessão mais recente.
export function observeSessionStartup({ subscribe, validate, onReady, onError, timeoutMs = 15000 }) {
  let disposed = false;
  let generation = 0;
  let timer;
  const begin = () => {
    clearTimeout(timer);
    const attempt = ++generation;
    timer = setTimeout(() => {
      if (disposed || attempt !== generation) return;
      generation += 1;
      onError(new Error('Tempo limite ao recuperar a sessão.'));
    }, timeoutMs);
    return attempt;
  };
  const fail = (error, attempt) => {
    if (disposed || attempt !== generation) return;
    clearTimeout(timer);
    generation += 1;
    onError(error);
  };
  begin();
  const unsubscribe = subscribe(user => {
    if (disposed) return;
    const attempt = begin();
    Promise.resolve().then(() => validate(user)).then(result => {
      if (disposed || attempt !== generation) return;
      clearTimeout(timer);
      onReady(result);
    }, error => fail(error, attempt));
  }, error => fail(error, generation));
  return () => {
    disposed = true;
    generation += 1;
    clearTimeout(timer);
    unsubscribe();
  };
}
