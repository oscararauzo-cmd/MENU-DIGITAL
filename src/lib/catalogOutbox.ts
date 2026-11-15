import type {Ingredient,Cocktail} from '../types/bar';
export type CatalogRecord=Ingredient|Cocktail;
export type CatalogResource='ingredients'|'cocktails';
export interface CatalogMutation{resource:CatalogResource;id:string;action:'upsert'|'delete';record?:CatalogRecord;}
export type CatalogQueue=Record<string,CatalogMutation>;
export function catalogChanges(resource:CatalogResource,before:CatalogRecord[],after:CatalogRecord[]):CatalogMutation[]{
 const old=new Map(before.map(row=>[row.id,row]));const next=new Map(after.map(row=>[row.id,row]));
 return [...after.filter(row=>JSON.stringify(row)!==JSON.stringify(old.get(row.id))).map(record=>({resource,id:record.id,action:'upsert' as const,record})),...before.filter(row=>!next.has(row.id)).map(row=>({resource,id:row.id,action:'delete' as const}))];
}
export function mergeCatalogQueue<T extends CatalogRecord>(resource:CatalogResource,remote:T[],queue:CatalogQueue):T[]{
 const rows=new Map(remote.map(row=>[row.id,row]));
 for(const mutation of Object.values(queue)){if(mutation.resource!==resource)continue;if(mutation.action==='delete')rows.delete(mutation.id);else if(mutation.record)rows.set(mutation.id,mutation.record as T);}
 return [...rows.values()];
}
export function restoreCatalogQueue(raw:string|null):CatalogQueue{
 try{return Object.fromEntries(Object.entries(JSON.parse(raw||'{}')).filter(([,value]:[string,any])=>['ingredients','cocktails'].includes(value?.resource)&&typeof value.id==='string'&&['upsert','delete'].includes(value.action)&&(value.action==='delete'||value.record?.id===value.id))) as CatalogQueue;}catch{return {};}
}
