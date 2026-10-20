import { resolveShare } from '../../../lib/amap-share.mjs';
export async function POST(request: Request) {
  const headers={'Cache-Control':'no-store'};
  if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin) return Response.json({error:'Open this form on Pocket Atlas.'},{status:403,headers});
  try {
    const body=await request.text();
    if(body.length>10000) return Response.json({error:'This share text is too long.'},{status:413,headers});
    let input;
    try { input=JSON.parse(body); } catch {return Response.json({error:'Paste a valid AMap share link.'},{status:400,headers});}
    return Response.json(await resolveShare(input.text),{headers});
  } catch(error) {
    const timeout=error instanceof Error && ['TimeoutError','AbortError','TypeError'].includes(error.name);
    return Response.json({error:timeout?'AMap could not be reached. Please try again, or enter coordinates manually.':error instanceof Error?error.message:'Unable to read this link.'},{status:422,headers});
  }
}
