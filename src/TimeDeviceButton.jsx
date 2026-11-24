import { useEffect, useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { httpsCallable } from 'firebase/functions';

export default function TimeDeviceButton({ functionsClient, company, punchType, busy, save, onMonth }) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable?.()
      .then(result => { if (active) setAvailable(result); }).catch(() => {});
    return () => { active = false; };
  }, []);
  async function verify() {
    if (!window.confirm('Continuar com a verificação do aparelho? No primeiro uso, você cadastra a chave. Nos próximos, confirma a batida selecionada.')) return;
    const call = httpsCallable(functionsClient, 'timeDeviceVerification');
    await save(async () => {
      const {data} = await call({company, action: 'begin', punchType});
      const registration = data.mode === 'register';
      const response = registration ? await startRegistration({optionsJSON: data.options}) : await startAuthentication({optionsJSON: data.options});
      await call({company, action: 'finish', response});
      if (registration) return 'Chave cadastrada. Toque novamente para registrar sua primeira batida verificada.';
      onMonth();
      return 'Batida verificada pelo aparelho e registrada.';
    }, '');
  }
  return <div className="mt-3 space-y-1">
    <button className="min-h-11 rounded-xl border border-blue-700 px-4 py-2 font-semibold text-blue-800 disabled:opacity-50" disabled={busy || !available} onClick={verify}>
      Usar biometria do aparelho
    </button>
    <button type="button" className="ml-2 text-sm underline" disabled={busy} onClick={() => {
      if (!window.confirm('Desvincular sua chave do ponto neste endereço? Você precisará cadastrar outra para verificar novas batidas.')) return;
      void save(() => httpsCallable(functionsClient, 'timeDeviceVerification')({company, action: 'revoke'}), 'Chave desvinculada do ponto.');
    }}>Desvincular minha chave</button>
    <p className="text-xs text-slate-600">{available ? 'O aparelho pode oferecer digital, rosto ou PIN. Use sua conta pessoal.' : 'Para usar esta opção, abra o site em um navegador com desbloqueio do aparelho configurado.'}</p>
  </div>;
}
