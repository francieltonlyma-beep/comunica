import { teamCoverageSummary, teamDaySummary } from './scheduleTeamMonth.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const shortDate = date => date.split('-').reverse().join('/');
const coverageLabel = (day, departments) => {
  const summary = teamCoverageSummary(day.coverage, departments);
  return `${summary.code}${summary.unknown ? ' ?' : summary.excess ? ' ↑' : ''}`;
};

export function schedulePrintHtml({ rows, days, departments = [], companyName = 'Comunica', filterLabels = [], showHours = false, showCoverage = true, showEvents = false, printedAt = Date.now() }) {
  if (!rows.length || !days.length) throw new Error('Não há colaboradores ou dias para imprimir com estes filtros.');
  const month = days[0].date.slice(0, 7);
  const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const blocks = showHours && days.length > 16 ? [days.slice(0, 16), days.slice(16)] : [days];
  const legends = ['P = Presencial', 'HO = Home office', 'F = Folga', 'FE = Feriado', 'V = Férias', 'A = Ausência', '- = Sem registro', '* = Dia fixado', 'A sobrescrito = Ausência parcial', '2 reg. = Mais de uma marcação'];
  const tables = blocks.map((block, blockIndex) => {
    const headers = block.map(day => `<th scope="col"><b>${Number(day.date.slice(-2))}</b><small>${weekdays[new Date(day.date + 'T12:00:00').getDay()]}</small>${showEvents && day.events?.length ? '<small>+</small>' : ''}</th>`).join('');
    const coverage = !showCoverage ? '' : `<tr class="coverage"><th scope="row">Disponíveis / mínimo<small>Pior faixa · toda a equipe</small></th>${block.map(day => `<td>${escape(coverageLabel(day, departments))}</td>`).join('')}</tr>`;
    const body = rows.map(row => `<tr><th scope="row"><strong>${escape(row.name)}</strong><small>${escape(row.departments.map(id => departments.find(department => department.id === id)?.name || id).join(' / ') || 'Sem setor')}</small></th>${block.map(day => {
      const cell = row.cells.find(item => item.date === day.date) || { date: day.date, schedules: [], absences: [] };
      const summary = teamDaySummary(cell);
      return `<td class="tone-${summary.tone}"><b>${escape(summary.code === '—' ? '-' : summary.code)}${summary.partial ? '<sup>A</sup>' : ''}${summary.fixed ? '<sup>*</sup>' : ''}</b>${showHours && summary.hours ? `<small>${escape(summary.hours.replace('–', '-'))}</small>` : ''}</td>`;
    }).join('')}</tr>`).join('');
    return `<section class="month-block${blockIndex ? ' next-block' : ''}"><h2>${escape(monthLabel)}${blocks.length > 1 ? ` - ${shortDate(block[0].date)} a ${shortDate(block.at(-1).date)}` : ''}</h2><div class="table-scroll"><table><colgroup><col class="person">${block.map(() => '<col>').join('')}</colgroup><thead><tr><th scope="col">Colaborador / setor<small>${escape(companyName)} - ${escape(monthLabel)}</small></th>${headers}</tr></thead><tbody>${coverage}${body}</tbody></table></div><p class="legend">${legends.join(' | ')}</p></section>`;
  }).join('');
  const events = showEvents ? days.flatMap(day => (day.events || []).map(event => `<li>${shortDate(day.date)} - ${escape(event.title)}</li>`)).join('') : '';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Escala-equipe-${escape(month)}</title><style>
@page{size:A4 landscape;margin:10mm}
*{box-sizing:border-box}body{margin:0;background:#edf3f6;color:#203b45;font:12px Arial,sans-serif}.actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px;position:sticky;top:0;background:#163d50;color:#fff;z-index:2}.actions button{font:700 12px Arial,sans-serif;padding:10px 14px;border:1px solid #c5dce5;background:#fff;color:#155e75;border-radius:8px;cursor:pointer}.actions p{margin:0;flex:1;min-width:240px;line-height:1.5}.actions button:focus-visible{outline:3px solid #42d6ee;outline-offset:2px}main{max-width:1240px;margin:20px auto;background:white;padding:24px}header{border-bottom:2px solid #155e75;padding-bottom:12px;margin-bottom:16px}h1{font-size:22px;margin:4px 0}header p{margin:6px 0;font-size:11px;line-height:1.5}.brand{font-size:10px;letter-spacing:1px;font-weight:700;color:#155e75}h2{font-size:14px;text-transform:capitalize;margin:14px 0 10px}.table-scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;table-layout:fixed;min-width:1000px;font-size:9px}col.person{width:160px}th,td{border:1px solid #bcced5;text-align:center;padding:5px 2px;overflow-wrap:anywhere}thead{display:table-header-group}thead th{background:#eaf2f5;font-weight:700}th:first-child{text-align:left;padding:6px}tbody th{font-weight:400}th strong{display:block;font-size:10px}th small,td small{display:block;font-size:8px;line-height:1.4;margin-top:3px;font-weight:400}th>b{display:block}thead small{font-size:7px}td b{font-weight:600}sup{font-size:6px}tr{break-inside:avoid;page-break-inside:avoid}.coverage{background:#f6f8f9;color:#576c75}.tone-work{background:#e8f4ef;color:#216e52}.tone-remote{background:#e9f2fc;color:#2b6093}.tone-off{background:#fff3d9;color:#946414}.tone-holiday{background:#f1ebfa;color:#70458f}.tone-vacation{background:#f4eaf9;color:#815093}.tone-absence{background:#fff0f1;color:#a33b56}.tone-empty{color:#87949b}.legend,.notes{font-size:9px;line-height:1.6;color:#526b76}.events{font-size:10px;line-height:1.5}.next-block{margin-top:25px}footer{border-top:1px solid #ccdce2;margin-top:16px;padding-top:10px;font-size:9px;color:#61757c}
@media print{body{background:white;font-size:9px}.actions{display:none!important}main{max-width:none;margin:0;padding:0}header{margin-bottom:12px;padding-bottom:8px}h1{font-size:18px}.table-scroll{overflow:visible}table{min-width:0;font-size:9px}col.person{width:42mm}th,td{padding:4px 1px}th:first-child{padding:4px}th strong{font-size:9px}th small,td small{font-size:6.5px}thead small{font-size:6px}.next-block{break-before:page;page-break-before:always;margin-top:0}.legend{font-size:8px;break-inside:avoid}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><nav class="actions" aria-label="Ações de impressão"><p>Confira a escala. Para gerar um PDF, clique em Imprimir e escolha Salvar como PDF na janela do navegador.${showHours ? ' Com horários, o mês é dividido em duas partes.' : ''}</p><button id="schedule-print-now" type="button">Imprimir / Salvar em PDF</button><button id="schedule-print-close" type="button">Fechar</button></nav><main><header><span class="brand">COMUNICA - ESCALA PUBLICADA</span><h1>${escape(companyName)}</h1><p><strong>${escape(monthLabel)}</strong> - ${rows.length} colaborador(es) - ${showHours ? 'Com horários' : 'Visão compacta'}</p><p>${escape(filterLabels.length ? `Filtros aplicados: ${filterLabels.join(' | ')}` : 'Toda a equipe disponível no calendário. Sem filtros por pessoa, setor ou situação.')}</p></header>${tables}<p class="notes">Ausências de dia inteiro aparecem sobre a marcação de trabalho. Nenhum registro é indicado por "-"; isso não significa folga.${showCoverage ? ' Cobertura: disponíveis / mínimo na pior faixa do dia, sem somar horários ou setores diferentes; ↑ = excesso em alguma faixa; ? = dados a revisar; — = sem necessidade cadastrada. Considera toda a equipe do setor, mesmo com filtros por pessoa ou situação.' : ''}</p>${events ? `<section class="events"><h2>Eventos e feriados (+)</h2><ul>${events}</ul></section>` : ''}<footer>Gerado em ${escape(new Date(printedAt).toLocaleString('pt-BR'))}. Retrato da escala publicada neste momento; alterações posteriores não atualizam esta impressão.</footer></main></body></html>`;
}

export function openSchedulePrintView(options) {
  const html = schedulePrintHtml(options);
  const preview = window.open('', '_blank');
  if (!preview) throw new Error('O navegador bloqueou a versão de impressão. Permita abrir novas janelas para o Comunica e tente novamente.');
  try {
    preview.opener = null;
    preview.document.open(); preview.document.write(html); preview.document.close();
    preview.document.getElementById('schedule-print-now').addEventListener('click', () => preview.print());
    preview.document.getElementById('schedule-print-close').addEventListener('click', () => preview.close());
    preview.focus();
    return preview;
  } catch (error) { preview.close(); throw error; }
}
