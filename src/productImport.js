const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function csvRows(source) {
  const delimiter = source.includes(';') ? ';' : source.includes('\t') ? '\t' : ',';
  const rows=[];let row=[],value='',quoted=false;
  for(let i=0;i<source.length;i++) {
    const c=source[i];
    if(c==='"') {if(quoted && source[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
    else if(c===delimiter && !quoted){row.push(value);value='';}
    else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&source[i+1]==='\n')i++;row.push(value);rows.push(row);row=[];value='';}
    else value+=c;
  }
  if(quoted)throw new Error('O CSV contém aspas sem fechamento.');
  row.push(value);rows.push(row);return rows;
}
export function decodeProductCsv(bytes) {
  try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch { /* Legacy ERP exports use Macintosh or Windows. */ }
  const candidates=['macintosh','windows-1252'].map(encoding=>new TextDecoder(encoding).decode(bytes));
  return candidates.sort((a,b)=>score(b)-score(a))[0];
}
function score(text) {return (text.match(/Código|Descrição|Marca|Fornecedor/gi)||[]).length;}
export function parseProductCsv(source) {
  const rows=csvRows(source.replace(/^\uFEFF/,''));
  const aliases={code:['codigo','cod','code'],name:['produto','descricao','nome','name'],brand:['marca','brand']};
  const header=rows.findIndex(row=>Object.values(aliases).slice(0,2).every(names=>row.some(value=>names.includes(normalize(value)))));
  if(header<0)throw new Error('Não encontrei as colunas Código e Produto/Descrição.');
  const columns=Object.fromEntries(Object.entries(aliases).map(([key,names])=>[key,rows[header].findIndex(v=>names.includes(normalize(v)))]));
  const products=[],seen=new Set();let duplicates=0;
  for(const row of rows.slice(header+1)) {
    const code=String(row[columns.code] || '').trim(),name=String(row[columns.name] || '').trim();
    if(!code&&!name || /^filtros:|^total/i.test(code) || aliases.code.includes(normalize(code)) && aliases.name.includes(normalize(name)))continue;
    if(!code||!name)throw new Error('Há um produto sem código ou descrição. Confira o arquivo.');
    if(code.length>80 || name.length>160)throw new Error(`Código ou nome excede o limite: ${code}.`);
    const key=normalize(code);if(seen.has(key)){duplicates++;continue;}seen.add(key);
    products.push({code,name,...(columns.brand>=0 ? {brand:String(row[columns.brand] || '').trim().slice(0,160)} : {})});
  }
  if(!products.length)throw new Error('Nenhum produto encontrado no arquivo.');
  return {products,duplicates,hasBrand:columns.brand>=0};
}
