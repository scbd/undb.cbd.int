const path      = require('path');
var express     = require('express');
var httpProxy   = require('http-proxy');

// Create server & proxy
var app    = express();
var proxy  = httpProxy.createProxyServer({});
const basePath = path.join('/', process.env.BASE_PATH||'/', '/');

if(!process.env.API_URL)   console.error(`WARNING: environment API_URL not set. USING default`);
if(!process.env.BASE_PATH) console.error(`WARNING: environment BASE_PATH not set. USING default`);

var apiUrl = process.env.API_URL || 'https://api.cbddev.xyz:443';
var gitVersion = (process.env.COMMIT || 'UNKNOWN').substr(0, 7);

console.info(`info: www.cbd.int/2011-2020`);
console.info(`info: Git version: ${gitVersion}`);
console.info(`info: API address: ${apiUrl}`);
console.info(`info: Base Path:   ${basePath}`);

app.set('views', __dirname + '/app');
app.set('view engine', 'ejs');

app.all('/api/*', function(req, res) { proxy.web(req, res, { target: apiUrl, secure: false, changeOrigin:true } ); } );

// CONFIGURE /APP/* ROUTES

const appRoutes = new express.Router();

appRoutes.use('/favicon.png',   express.static(__dirname + '/app/images/favicon.png', { maxAge: 24*60*60*1000 }));
appRoutes.use('/app',           express.static(__dirname + '/app',                    { setHeaders: setCustomCacheControl }));
appRoutes.use('/app/libs',      express.static(__dirname + '/node_modules/@bower_components', { setHeaders: setCustomCacheControl }));
appRoutes.get('/*',            function(req, res) { res.render('template', { baseUrl: basePath, gitVersion: gitVersion }); });
appRoutes.all('/*',            function(req, res) { res.status(404).send(); } );

// START SERVER

app.use(basePath, appRoutes);

if(basePath!='/') app.use('/', appRoutes); // temps support for transition to Traefik 2 / AWS ALB

app.listen(process.env.PORT || 2020, function () {
	console.log('Server listening: %j', this.address());
  console.log(`http://localhost:${process.env.PORT || 2020}`);
});
// Handle proxy errors ignore

proxy.on('error', function (e,req, res) {
    console.error('proxy error:', e);
    res.status(502).send();
});
process.on('SIGTERM', ()=>process.exit());

//============================================================
//
//
//============================================================
function setCustomCacheControl(res, path) {

	if(res.req.query && res.req.query.v && res.req.query.v==gitVersion && gitVersion!='UNKNOWN')
        return res.setHeader('Cache-Control', 'public, max-age=86400000'); // one day

    res.setHeader('Cache-Control', 'public, max-age=0');
}
