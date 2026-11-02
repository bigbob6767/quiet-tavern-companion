export const BODY_ZONES={head:'Голова',chest:'Грудь',belly:'Живот',hips:'Бёдра',hands:'Руки'};
export function presetZones(type='portrait'){
 const ranges=type==='full'?[[.02,.24],[.26,.40],[.41,.53],[.54,.69]]:[[.02,.38],[.40,.62],[.63,.81],[.82,.99]];
 return ['head','chest','belly','hips'].map((id,i)=>({id,x:.22,y:ranges[i][0],w:.56,h:ranges[i][1]-ranges[i][0]}));
}
// Coordinates refer to the original PNG, not the potentially letterboxed button.
export function imagePoint(clientX,clientY,box,naturalWidth,naturalHeight){
 if(!box.width||!box.height||!naturalWidth||!naturalHeight)return null;
 const scale=Math.min(box.width/naturalWidth,box.height/naturalHeight),w=naturalWidth*scale,h=naturalHeight*scale;
 const x=(clientX-box.left-(box.width-w)/2)/w,y=(clientY-box.top-(box.height-h))/h;
 return x>=0&&x<=1&&y>=0&&y<=1?{x,y}:null;
}
export function hitZone(point,zones){if(!point)return null;return zones.filter(z=>Object.hasOwn(BODY_ZONES,z.id)&&point.x>=z.x&&point.x<=z.x+z.w&&point.y>=z.y&&point.y<=z.y+z.h).sort((a,b)=>a.w*a.h-b.w*b.h)[0]?.id||null;}
export function rectangle(a,b){return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)};}
export function touchEvent(zones){const counts={};for(const id of zones)if(Object.hasOwn(BODY_ZONES,id))counts[id]=(counts[id]||0)+1;return {kind:'touch',text:'Пользователь касается персонажа. Зоны: '+Object.entries(counts).map(([id,n])=>BODY_ZONES[id]+' ('+n+')').join(', ')+'.',touches:Object.entries(counts).map(([zone,count])=>({zone,label:BODY_ZONES[zone],count})),repeated:zones.length};}
