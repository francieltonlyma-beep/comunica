import React from 'react';
import { formattedMessageParts, MESSAGE_STYLES } from './messageFormatting.js';

export function InboxFormattingToolbar({ onFormat }) {
  return (
    <div className="mb-1 flex flex-wrap items-center gap-1" role="group" aria-label="Formatação da mensagem">
      {MESSAGE_STYLES.map(({ bit, label, symbol, className }) => (
        <button key={bit} type="button" aria-label={label} title={label}
          onMouseDown={event => event.preventDefault()}
          onClick={() => onFormat(bit)}
          className={`h-8 w-8 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:border-blue-300 hover:text-blue-700 ${className}`}>
          {symbol}
        </button>
      ))}
      <span className="ml-1 text-[10px] text-slate-500">Selecione o trecho para formatar</span>
    </div>
  );
}

export function InboxFormattedText({ text, ranges }) {
  return formattedMessageParts(text, ranges).map(part => (
    <span key={part.start} className={MESSAGE_STYLES.filter(({ bit }) => part.style & bit).map(({ className }) => className).join(' ')}>
      {part.text}
    </span>
  ));
}

export function InboxFormattingPreview({ text, ranges }) {
  if (!ranges.length) return null;
  return (
    <div className="mx-auto mt-2 w-full max-w-4xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
      <span className="block font-semibold text-slate-500">Prévia da formatação</span>
      <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap [overflow-wrap:anywhere]">
        <InboxFormattedText text={text} ranges={ranges} />
      </p>
    </div>
  );
}
