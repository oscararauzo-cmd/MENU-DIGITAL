import {useCallback,useEffect,useRef,useState} from 'react';
import type {Ingredient,Cocktail} from '../types/bar';
import {catalogChanges,mergeCatalogQueue,restoreCatalogQueue,type CatalogQueue} from '../lib/catalogOutbox';
import {applyCatalogMutation,isSupabaseConfigured} from '../lib/supabase';
const key='altura_catalog_outbox_v1';
function readSaved(){try{return restoreCatalogQueue(localStorage.getItem(key));}catch{return {};}}

export function useCatalogSync(ingredients:Ingredient[],cocktails:Cocktail[],ready:boolean){
 const pending=useRef<CatalogQueue>(readSaved());
 const observed=useRef({ingredients,cocktails});
 const busy=useRef(new Set<string>());
 const version=useRef(0);
 const [error,setError]=useState('');
 const persist=()=>localStorage.setItem(key,JSON.stringify(pending.current));
 const flush=useCallback(async()=>{
  if(!isSupabaseConfigured()||!navigator.onLine)return;
  for(const [id,mutation] of Object.entries(pending.current)){
   if(busy.current.has(id))continue;busy.current.add(id);
   try{const result=await applyCatalogMutation(mutation);if(!result.success)throw new Error();if(pending.current[id]===mutation){delete pending.current[id];persist();}}
   catch{setError('Hay cambios de carta o insumos guardados aquí pendientes de conexión. Se reintentarán automáticamente.');}
   finally{busy.current.delete(id);}
  }
  if(!Object.keys(pending.current).length)setError('');
 },[]);
 useEffect(()=>{
  if(!ready||!isSupabaseConfigured())return;
  const changes=[...catalogChanges('ingredients',observed.current.ingredients,ingredients),...catalogChanges('cocktails',observed.current.cocktails,cocktails)];
  observed.current={ingredients,cocktails};
  if(changes.length){for(const mutation of changes)pending.current[`${mutation.resource}:${mutation.id}`]=mutation;version.current++;try{persist();}catch{setError('No hay espacio para guardar los cambios pendientes. Libera espacio antes de continuar.');}void flush();}
 },[ingredients,cocktails,ready,flush]);
 useEffect(()=>{if(!ready)return;void flush();const timer=setInterval(()=>void flush(),10000);window.addEventListener('online',flush);return()=>{clearInterval(timer);window.removeEventListener('online',flush);};},[ready,flush]);
 const adoptRemote=(remoteIngredients:Ingredient[],remoteCocktails:Cocktail[])=>{
  const merged={ingredients:mergeCatalogQueue('ingredients',remoteIngredients,pending.current),cocktails:mergeCatalogQueue('cocktails',remoteCocktails,pending.current)};
  observed.current=merged;return merged;
 };
 const seed=()=>{observed.current={ingredients:[],cocktails:[]};};
 return {adoptRemote,seed,pending,version,error,flush,dismissError:()=>setError('')};
}
