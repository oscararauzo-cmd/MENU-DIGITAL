import type {Cocktail} from '../types/bar';
export function mergeMenuImport(existing:Cocktail[],incoming:Cocktail[]):Cocktail[]{
 const map=new Map(existing.map(product=>[product.name.trim().toLocaleLowerCase(),product]));
 for(const product of incoming){
  if(!Number.isFinite(product.price)||product.price<0)throw new Error(`Precio inválido para ${product.name}. No se importó el archivo.`);
  const key=product.name.trim().toLocaleLowerCase();const previous=map.get(key);
  map.set(key,previous?{...previous,name:product.name,description:product.description,price:product.price,category:product.category}:product);
 }
 return [...map.values()];
}
