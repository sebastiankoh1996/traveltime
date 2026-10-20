import {readTravelPost} from '../../../lib/travel-pocket.mjs';
export async function POST(request:Request){
  const headers={'Cache-Control':'no-store'};
  if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Open Travel Time to save a link.'},{status:403,headers});
  try{const body=await request.text();if(body.length>40000)return Response.json({error:'Please use a shorter caption.'},{status:413,headers});const input=JSON.parse(body);return Response.json(await readTravelPost(input),{headers})}
  catch{return Response.json({error:'Paste a valid public link from a supported platform.'},{status:400,headers})}
}
