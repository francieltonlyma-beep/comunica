import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PLATFORM_SUPPORT,withPlatformSupport} from '../src/platformSupportContact.js';
import {isCompanyEmployee} from '../src/teamMembership.js';
const source=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
test('support is a unique contact, never an employee, with or without legacy profile',()=>{
  for(const users of [[{id:'employee'}],[{id:'employee'},{id:PLATFORM_SUPPORT.id,isEmployee:true}]]){
    const contacts=withPlatformSupport(users);
    assert.equal(contacts.filter(u=>u.id===PLATFORM_SUPPORT.id).length,1);
    assert.equal(contacts.filter(isCompanyEmployee).length,1);
  }
});
test('regular employees and administrators can select support without a company profile',()=>{
  const start=source.indexOf('  const getAllowedMessageRecipients =');
  const end=source.indexOf('  const openPlatformSupport =',start);
  const declaration=source.slice(start,end);
  const evaluate=new Function('currentUser','usersList','messageContacts','normMessages','getUserDepts',declaration+'; return getAllowedMessageRecipients();');
  for(const isAdmin of [false,true]){
    const user={id:'employee',isAdmin,depts:['production']};
    const recipients=evaluate(user,[user],withPlatformSupport([user]),[],u=>u.depts||[]);
    assert.deepEqual(recipients.map(u=>u.id),[PLATFORM_SUPPORT.id]);
  }
});
