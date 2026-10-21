import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Section = ({ title, children }) => <section><h2 className="text-base font-extrabold text-slate-900">{title}</h2><p className="mt-2">{children}</p></section>;

export default function Privacy() {
  return <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900"><main className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-sm"><header className="bg-slate-900 p-6 text-white"><span className="text-xs font-bold uppercase tracking-wide text-blue-200">Comunica</span><h1 className="mt-2 flex items-center gap-2 text-2xl font-extrabold"><ShieldCheck className="h-6 w-6" /> Política de Privacidade</h1><p className="mt-2 text-sm text-slate-300">Banco de Talentos e candidaturas · versão de 12/10/2026</p></header><article className="space-y-6 p-6 text-sm leading-relaxed text-slate-700 sm:p-8">
    <Section title="Quem é responsável pelos dados">A empresa que publicou a vaga é responsável pelo processo seletivo e pelas decisões sobre a candidatura. O Comunica fornece a plataforma tecnológica usada para receber e organizar essas informações.</Section>
    <Section title="Dados utilizados">Podemos tratar nome, e-mail, telefone, cidade, competências, resumo profissional, currículo anexado, respostas do questionário, vaga escolhida e datas relacionadas ao processo.</Section>
    <Section title="Finalidade e compartilhamento">Os dados são usados para cadastrar o candidato, receber a candidatura e permitir que a empresa responsável pela vaga avalie o perfil. Não vendemos currículos. As informações da candidatura ficam disponíveis aos administradores autorizados da empresa que publicou a vaga.</Section>
    <Section title="Análise automática">A plataforma pode comparar competências informadas na vaga com o cadastro e o texto legível do currículo. O resultado é apenas indicativo, pode conter imprecisões e não decide contratação, reprovação ou classificação. A avaliação deve ser humana.</Section>
    <Section title="Controle do candidato">No portal de carreiras, o candidato pode consultar a situação, retirar uma candidatura e remover o currículo daquela vaga. Também pode excluir o cadastro completo, eliminando dados básicos, candidaturas e currículos vinculados à conta.</Section>
    <Section title="Conservação e segurança">Cada candidatura e currículo permanece disponível por 90 dias. Nos 15 dias anteriores ao vencimento, a empresa recebe um aviso e pode prorrogar o prazo uma única vez por mais 90 dias para continuidade do processo seletivo. Registros vencidos devem ser removidos pelo controle de limpeza da empresa. O candidato pode retirar a candidatura antes desse prazo. São aplicadas autenticação, confirmação de e-mail e restrições de acesso, mas nenhum sistema elimina totalmente os riscos de segurança.</Section>
    <Section title="Dúvidas e solicitações">Para informações específicas sobre seleção, critérios ou uso do currículo, procure a empresa responsável pela vaga. Solicitações sobre o funcionamento da plataforma podem ser encaminhadas pelo canal de suporte do Comunica disponibilizado à empresa.</Section>
    <div className="border-t border-slate-200 pt-5"><a href="/carreiras" className="font-bold text-blue-700 underline">Voltar ao Banco de Talentos</a></div>
  </article></main></div>;
}
