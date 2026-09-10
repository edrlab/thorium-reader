const http = require('node:http');
const origin = 'http://127.0.0.1:9123';
const auth = 'Basic ' + Buffer.from('test:test').toString('base64');
const pub = {
 metadata: {'@type':'http://schema.org/Book',identifier:'urn:cover-refresh-test',title:'Authenticated Cover Refresh Test',author:[{name:'Lipu Test'}],description:'Detail refresh arrives after the authenticated cover fallback.'},
 links: [{rel:'self',href:origin+'/publication',type:'application/opds-publication+json'}, {rel:'http://opds-spec.org/acquisition',href:origin+'/book.epub',type:'application/epub+zip'}],
 images:[{href:origin+'/cover.svg',type:'image/svg+xml',width:300,height:450}]
};
http.createServer((req,res)=>{
 const authorized=req.headers.authorization===auth;
 console.log(new Date().toISOString(),req.method,req.url,authorized?'authenticated':'unauthenticated');
 res.setHeader('Cache-Control','no-store');
 if(!authorized){res.writeHead(401,{'WWW-Authenticate':'Basic realm="Cover test"'});res.end();return;}
 if(req.url==='/cover.svg'){res.writeHead(200,{'Content-Type':'image/svg+xml'});res.end('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#234d40"/><text x="30" y="160" fill="white" font-size="28">AUTHENTICATED</text><text x="30" y="200" fill="white" font-size="28">COVER TEST</text></svg>');return;}
 if(req.url==='/publication'){setTimeout(()=>{res.writeHead(200,{'Content-Type':'application/opds-publication+json'});res.end(JSON.stringify(pub));},1800);return;}
 res.writeHead(200,{'Content-Type':'application/opds+json'});
 res.end(JSON.stringify({metadata:{title:'Cover Refresh Fixture'},links:[{rel:'self',href:origin+'/opds',type:'application/opds+json'}],publications:[pub]}));
}).listen(9123,'127.0.0.1');
