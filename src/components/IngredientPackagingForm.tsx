import React, { useState } from 'react';
import type { Ingredient } from '../types/bar';
import { packageUnits, packagingDescription, stockDescription, presentationLabel, unitsInPackage, containerVolume } from '../utils/packaging';

export function IngredientPackagingForm({ingredient,onSave,onCancel}: {ingredient?:Ingredient;onSave:(ingredient:Ingredient)=>void;onCancel:()=>void}) {
  const [name,setName]=useState(ingredient?.name || '');
  const [category,setCategory]=useState<Ingredient['category']>(ingredient?.category || 'licor');
  const [unit,setUnit]=useState<Ingredient['unit']>(ingredient?.unit || 'botella');
  const [containerType,setContainerType]=useState<'botella'|'lata'>(ingredient?.containerType || (ingredient?.unit.startsWith('lata')?'lata':'botella'));
  const [count,setCount]=useState(String(ingredient?unitsInPackage(ingredient):1));
  const [volume,setVolume]=useState(String(ingredient?containerVolume(ingredient):750));
  const [cost,setCost]=useState(String(ingredient?.packageCost || ''));
  const [quantity,setQuantity]=useState(String(ingredient?.currentStockUnits ?? 0));
  const grouped=packageUnits.has(unit);
  const singleCount=grouped?Number(count):1;
  const preview:Ingredient={id:ingredient?.id || '',name,category,unit,unitsPerPackage:singleCount,containerType,volumePerContainerMl:Number(volume),volumePerUnitMl:singleCount*Number(volume),packageCost:Number(cost),initialStockUnits:ingredient?.initialStockUnits || Number(quantity),currentStockUnits:Number(quantity),minAlertUnits:ingredient?.minAlertUnits ?? 2};
  const input='w-full min-h-12 rounded-xl border border-stone-300 bg-white px-3 mt-1 text-sm font-semibold text-stone-900';
  return <form onSubmit={e=>{e.preventDefault();if(!name.trim()||singleCount<1||!Number.isInteger(singleCount)||Number(volume)<=0||Number(quantity)<0||Number(cost)<0)return;onSave({...preview,id:ingredient?.id || `ing-${crypto.randomUUID()}`,name:name.trim()});}} className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4 space-y-3">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-stone-600">
      <label>Nombre del insumo<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Pilsen 330 ml" className={input}/></label>
      <label>Categoría<select value={category} onChange={e=>setCategory(e.target.value as Ingredient['category'])} className={input}><option value="licor">Licor / cerveza</option><option value="mezclador">Agua / mezclador</option><option value="fruta_jarabe">Fruta / jarabe</option><option value="comida_insumo">Comida</option><option value="guarnicion">Guarnición</option><option value="otro">Otro</option></select></label>
      <label>Presentación<select value={unit} onChange={e=>{const next=e.target.value as Ingredient['unit'];setUnit(next);if(next==='sixpack'){setCount('6');setVolume('330');}else if(next==='paquete'||next==='caja'){setCount('6');setVolume('500');}else if(next==='unidad'){setCount('1');setVolume('1');}else if(next==='kg'||next==='litro'){setCount('1');setVolume('1000');}else{setCount('1');setVolume(next==='lata'?'355':'750');}}} className={input}>
        <option value="botella">Botella individual</option><option value="lata">Lata individual</option><option value="sixpack">Six-pack</option><option value="paquete">Paquete</option><option value="caja">Caja</option><option value="litro">Litro</option><option value="kg">Kg</option><option value="unidad">Unidad</option>
        {ingredient&&!['botella','lata','sixpack','paquete','caja','litro','kg','unidad'].includes(ingredient.unit)&&<option value={ingredient.unit}>{presentationLabel(ingredient)} ({containerVolume(ingredient)} ml)</option>}
      </select></label>
      {grouped&&<label>Envase dentro del paquete<select value={containerType} onChange={e=>setContainerType(e.target.value as 'botella'|'lata')} className={input}><option value="botella">Botella</option><option value="lata">Lata</option></select></label>}
      {grouped&&<label>Botellas / latas por {presentationLabel(preview)}<input required type="number" min="1" step="1" value={count} onChange={e=>setCount(e.target.value)} className={input}/></label>}
      <label>{unit==='kg'?'Rendimiento por kg (g)':unit==='unidad'?'Rendimiento por unidad (un)':'Contenido de cada botella / lata (ml)'}<input required type="number" min="0.01" step="any" value={volume} onChange={e=>setVolume(e.target.value)} className={input}/></label>
      <label>Cantidad de {presentationLabel(preview)}(s)<input required type="number" min="0" step="any" value={quantity} onChange={e=>setQuantity(e.target.value)} className={input}/></label>
      <label>Costo por {presentationLabel(preview)} (S/)<input required type="number" min="0" step="0.01" value={cost} onChange={e=>setCost(e.target.value)} className={input}/></label>
    </div>
    {Number(volume)>0&&singleCount>0&&<div role="status" className="rounded-xl border border-orange-100 bg-white p-3 text-xs text-orange-950 space-y-1"><p className="font-bold">{packagingDescription(preview)}</p><p>{stockDescription(preview)}</p>{grouped&&<p>Consignación: un {presentationLabel(preview)} abierto ya no se devuelve, aunque queden botellas cerradas dentro.</p>}</div>}
    <div className="flex flex-wrap gap-2"><button type="submit" className="min-h-12 px-4 rounded-xl bg-orange-600 text-white font-bold text-sm">{ingredient?'Guardar presentación':'Guardar insumo'}</button><button type="button" onClick={onCancel} className="min-h-12 px-4 rounded-xl border border-stone-200 bg-white font-bold text-sm">Cancelar</button></div>
  </form>;
}
