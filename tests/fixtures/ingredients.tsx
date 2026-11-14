import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CartaComprasScreen} from '../../src/components/CartaComprasScreen';
import {INITIAL_COCKTAILS,INITIAL_INGREDIENTS,DEFAULT_BUSINESS_PROFILE} from '../../src/data/initialData';
import '../../src/index.css';
function Fixture(){const [cocktails,setCocktails]=useState(INITIAL_COCKTAILS);const [ingredients,setIngredients]=useState<typeof INITIAL_INGREDIENTS>([]);return <div className="h-dvh flex flex-col"><CartaComprasScreen inventoryScope="evento" contextName="Evento de prueba" ingredientCatalog={INITIAL_INGREDIENTS} cocktails={cocktails} setCocktails={setCocktails} ingredients={ingredients} setIngredients={setIngredients} businessProfile={DEFAULT_BUSINESS_PROFILE}/></div>}
createRoot(document.getElementById('root')!).render(<Fixture/>);
