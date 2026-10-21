import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
for(const [name,next,operation] of [['updateDocField','removeDoc','updateDoc'],['removeDoc','handleCompanyRegistration','deleteDoc']]) {
  const start=source.indexOf(`  const ${name} =`);
  const end=source.indexOf(`  const ${next} =`,start);
  const declaration=source.slice(start,end);
  const body=declaration.slice(declaration.indexOf('{')+1,declaration.lastIndexOf('};'));
  test(`${name} confirms only completed cloud operations`,async()=>{
    for(const outcome of ['success','denied','no-session','no-company']) {
      const notifications=[];let calls=0;
      const run=new AsyncFunction('colName','docId','data','isFirebaseAvailable','dbUser','getTenantCollection','doc',operation,'triggerNotification','console',body);
      const result=await run('fixture','fixture',{},true,outcome==='no-session'?null:{uid:'fixture'},()=>outcome==='no-company'?null:{},()=>({}),async()=>{calls++;if(outcome==='denied')throw Error('permission-denied');},(...args)=>notifications.push(args),{error(){}});
      assert.equal(result,outcome==='success');
      assert.equal(calls,['success','denied'].includes(outcome)?1:0);
      assert.equal(notifications.length,outcome==='success'?0:1);
    }
  });
}
test('reviewed handlers stop on failed mutations',()=>{
  assert.match(source,/if \(!await removeDoc\('productivity', prodId\)\) return;/);
  assert.match(source,/if \(!await updateDocField\('announcements', announcement.id, \{ readBy: arrayUnion\(currentUser.id\) \}\)\) return;/);
  assert.match(source,/if \(!await updateDocField\('posts', id, \{ comments: commentsList \}\)\) return;/);
});
