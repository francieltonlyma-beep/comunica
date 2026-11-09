import test from 'node:test';
import assert from 'node:assert/strict';
import {clearLegacyCompanyCache,readSessionIdentity,sessionIdentity,legacyCompanyCacheKeys} from '../src/sessionPrivacy.js';
import {publicDirectoryProfile} from '../src/userDirectory.js';
import {collectionRecordTime,sortCollectionRecords} from '../src/companyCollections.js';
import {buildManagementNavigation,integraNavigationSections} from '../src/managementNavigation.js';

test('o diretório inclui dados operacionais, sem contatos, PIN ou token', () => {
  assert.deepEqual(publicDirectoryProfile({id:'u1',name:'Teste',depts:['A'],birthDate:'2000-11-08',
    emergencyPhone:'999999999',pushTokens:['segredo'],pin:'1234'}),
  {id:'u1',name:'Teste',depts:['A'],birthMonthDay:'11-08'});
  assert.equal(publicDirectoryProfile({id:'u1',birthDate:''}).birthMonthDay,'');
});

test('cache legado é eliminado e a sessão guarda somente identificação', () => {
  const records = new Map(legacyCompanyCacheKeys.map(key => [key,'dados de outra conta']));
  records.set('comunica_current_user',JSON.stringify({id:'u1',name:'Teste',isAdmin:false,
    emergencyPhone:'999999999',pushTokens:['segredo']}));
  const storage = {getItem:key=>records.get(key) || null,removeItem:key=>records.delete(key)};
  clearLegacyCompanyCache(storage);
  assert.equal(legacyCompanyCacheKeys.some(key=>records.has(key)),false);
  assert.deepEqual(readSessionIdentity(storage),{id:'u1',name:'Teste',isAdmin:false});
  assert.deepEqual(sessionIdentity({id:'u2',name:'Outro',readNotifications:['n1'],emergencyName:'Pessoa'}),
    {id:'u2',name:'Outro'});
});

test('ordenação preserva datas históricas e não altera a entrada', () => {
  const rows=[{id:'a',createdAt:'08/11/2026 09:00:00'},{id:'b',createdAt:1794135600000}];
  assert.equal(sortCollectionRecords(rows).length,2);
  assert.equal(rows[0].id,'a');
  assert.equal(collectionRecordTime({createdAt:'08/11/2026 09:00:00'}),new Date('2026-11-08T09:00:00').getTime());
});

test('menu de gestão oculta controles administrativos de colaboradores', () => {
  const sections=buildManagementNavigation({unreadCount:2,unreadUpdates:0,pendingPollResponses:0,
    activeServices:1,pendingDocumentReads:0,canAccessProductivity:false,canManageCareers:false,
    canManageWhistleblowing:false,isAdmin:false,isDeveloper:false,openPlatformSupport:()=>{}});
  const entries=sections.flatMap(section=>section.items);
  assert.equal(entries.find(item=>item.id==='inbox').badge,2);
  assert.equal(entries.some(item=>item.id==='management' || item.id==='support'),false);
  assert.equal(entries.some(item=>item.id==='platform-support'),true);
  assert.equal(integraNavigationSections[0].items[0].id,'integra');
});
