import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeProductCsv,parseProductCsv} from '../src/productImport.js';
import {catalogProductFields,findCatalogProduct,catalogProductSelection,catalogProductForRequest} from '../functions/src/purchaseProductCatalog.mjs';
test('relatório ERP Macintosh com cabeçalho e rodapé importa somente código e descrição',()=>{
 const header=new TextDecoder('macintosh').decode(new Uint8Array([67,151,100,105,103,111,59,68,101,115,99,114,105,141,139,111,59,69,115,116,111,113,117,101]));
 const csv=`Relatório;;\r;;\r${header}\r001;"Produto; com ponto";-100,000\r002;Caixa;20\r;;\rFiltros: Estoque # 0,000;;\r`;
 const result=parseProductCsv(csv);assert.deepEqual(result.products,[{code:'001',name:'Produto; com ponto'},{code:'002',name:'Caixa'}]);assert.equal(result.hasBrand,false);
});
test('decodifica acentos Macintosh, aceita marca explícita e não inventa marca nem fornecedor',()=>{
 assert.equal(decodeProductCsv(new Uint8Array([67,151,100,105,103,111,59,68,101,115,99,114,105,141,139,111])),'Código;Descrição');
 const parsed=parseProductCsv('Código;Produto;Marca;Estoque\n001;Suco;Marca X;100\n001;Duplicado;Marca Y;9');
 assert.equal(parsed.duplicates,1);assert.deepEqual(parsed.products,[{code:'001',name:'Suco',brand:'Marca X'}]);
});
test('códigos distintos resolvem produtos de mesmo nome e deixam o código na solicitação',()=>{
 const products=[{id:'a',code:'001',name:'Leite',brand:'A',unit:'un',suggestedSupplierIds:['s1']},{id:'b',code:'002',name:'Leite',brand:'B',unit:'un',suggestedSupplierIds:['s2']}];
 assert.equal(findCatalogProduct(products,'Leite'),undefined);
 assert.equal(findCatalogProduct(products,'b'),products[1]);
 const selection=catalogProductSelection(products[1]);assert.match(selection.specification,/Código: 002/);assert.match(selection.specification,/Marca: B/);
 assert.equal(catalogProductForRequest(products,selection),products[1]);
});
test('valida fornecedores sugeridos e infere kg somente quando explicitamente presente no nome',()=>{
 assert.equal(catalogProductFields({code:'1',name:'Tomate Kg'}).unit,'kg');
 assert.equal(catalogProductFields({code:'2',name:'Suco 1l'}).unit,'un');
 assert.throws(()=>catalogProductFields({name:'X',suggestedSupplierIds:['../company/foreign']}),/fornecedores/);
 assert.throws(()=>catalogProductFields({name:'X',suggestedSupplierIds:Array(31).fill('s')}),/30/);
 assert.deepEqual(catalogProductFields({name:'X',suggestedSupplierIds:['s','s']}).suggestedSupplierIds,['s']);
});
