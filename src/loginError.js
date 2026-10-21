export function loginErrorMessage(error, support = false) {
  if (error?.code === 'functions/resource-exhausted') {
    return 'Acesso temporariamente bloqueado após várias tentativas. Aguarde 30 segundos e tente novamente.';
  }
  if (error?.code === 'functions/permission-denied') {
    return support ? 'PIN de suporte inválido ou acesso não autorizado.' : 'PIN inválido. Confira os números e tente novamente.';
  }
  if (error?.code === 'functions/not-found') {
    return 'Colaborador não encontrado. Atualize a lista e tente novamente.';
  }
  if (error?.code === 'functions/unavailable' || error?.code === 'functions/deadline-exceeded') {
    return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';
  }
  return support ? 'Não foi possível iniciar o acesso de suporte. Tente novamente.' : 'Não foi possível entrar. Tente novamente.';
}
