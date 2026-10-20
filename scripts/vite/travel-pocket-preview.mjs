// Dev-only bridge: credentials remain in the server process, never browser code.
import {readTravelPost} from '../../lib/travel-pocket.mjs';
export function travelPocketPreview(){return {
  name:'travel-pocket-local-api',
  configureServer(server){
    server.middlewares.use('/api/pocket',async(req,res,next)=>{
      if(req.method!=='POST')return next();
      res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
      const reply=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body))};
      try{
        if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return reply(403,{error:'Open this form in Travel Time.'});
        let body='';for await(const part of req){body+=part;if(body.length>40000)return reply(413,{error:'Use a shorter caption.'})}
        reply(200,await readTravelPost(JSON.parse(body)));
      }catch{return reply(400,{error:'Paste a supported public post link.'})}
    });
  }
}}
