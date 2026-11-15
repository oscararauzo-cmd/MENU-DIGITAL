import test from 'node:test';
import assert from 'node:assert/strict';
import {readBarSession,resolveBarEvent,clearBarSession} from '../src/utils/barSession.ts';
const store=new Map();const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
test('bar access persists on reload and administrative exit clears it',()=>{
 const session=readBarSession('?acceso=barra',storage);assert.deepEqual(session,{name:'ALTURA LIVE',date:'2026-11-14'});assert.deepEqual(readBarSession('',storage),session);clearBarSession(storage);assert.equal(readBarSession('',storage),null);
});
test('bar session never falls back to another event or ambiguous name',()=>{
 const session={name:'ALTURA LIVE',date:'2026-11-14'},event={id:'today',name:'altura live',date:'2026-11-14',status:'active'};
 assert.equal(resolveBarEvent([event,{...event,id:'other',date:'2026-11-15'}],session).id,'today');
 assert.equal(resolveBarEvent([{...event,status:'trashed'}],session),undefined);
 assert.equal(resolveBarEvent([event,{...event,id:'duplicate'}],session),undefined);
 assert.equal(resolveBarEvent([event],{eventId:'missing'}),undefined);
});
