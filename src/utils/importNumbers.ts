export function parseLocalNumber(value:unknown,fallback=0):number{
 if(typeof value==='number')return Number.isFinite(value)?value:fallback;
 let text=String(value??'').trim().replace(/[^\d.,+-]/g,'');
 if(!text)return fallback;
 const comma=text.lastIndexOf(',');const dot=text.lastIndexOf('.');
 if(comma>=0&&dot>=0){text=comma>dot?text.replace(/\./g,'').replace(',','.'):text.replace(/,/g,'');}
 else if(comma>=0){text=text.replace(',','.');}
 const parsed=Number(text);return Number.isFinite(parsed)?parsed:fallback;
}
