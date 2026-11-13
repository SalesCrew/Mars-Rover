export function parseOrderVe(value: unknown): number | null {
 const text=String(value??'').trim().replace(/^VE\s*:\s*/i,'');
 if(!/^\d+(?:[.,]0+)?(?:\s*(?:stk|stück|stueck|einheit|einheiten))?$/i.test(text))return null;
 const units=Number.parseInt(text,10);
 return Number.isInteger(units)&&units>0&&units<=100000?units:null;
}
export const waveOrderVe=(item:{catalogVeSize?:unknown;ve?:unknown})=>parseOrderVe(item.catalogVeSize)??parseOrderVe(item.ve);
export function orderPieces(quantity:number,ve:unknown):number{
 if(quantity===0)return 0;
 const units=parseOrderVe(ve);
 if(!Number.isInteger(quantity)||quantity<0||units===null||quantity*units>2147483647)throw new Error('Bitte ganze VEs eingeben; die VE muss beim Artikel hinterlegt sein.');
 return quantity*units;
}

