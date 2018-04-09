'use strict'; // jshint node: true, browser: false, esnext: true
var express     = require('express');
var httpProxy   = require('http-proxy');

// Create server & proxy
var app    = express();
var proxy  = httpProxy.createProxyServer({});

if(!process.env.API_URL) {
    console.warn('warning: evironment API_URL not set. USING default (https://api.cbddev.xyz:443)');
}

var apiUrl = process.env.API_URL || 'https://api.cbddev.xyz:443';
var gitVersion = (process.env.COMMIT || 'UNKNOWN').substr(0, 7);

console.info(`info: www.cbd.int/2011-2020`);
console.info(`info: Git version: ${gitVersion}`);
console.info(`info: API address: ${apiUrl}`);


app.set('views', __dirname + '/app');
app.set('view engine', 'ejs');
app.use(require('morgan')('dev'));

// CONFIGURE /APP/* ROUTES

app.use('/favicon.png',   express.static(__dirname + '/app/images/favicon.png', { maxAge: 24*60*60*1000 }));
app.use('/app',           express.static(__dirname + '/app',                    { setHeaders: setCustomCacheControl }));


// CONFIGURE TEMPLATE
app.all('/api/*', function(req, res) { proxy.web(req, res, { target: apiUrl, secure: false, changeOrigin:true } ); } );

app.get('/*',            function(req, res) { res.render('template', { baseUrl: req.headers.base_url || '/', gitVersion: gitVersion }); });

app.all('/*',            function(req, res) { res.status(404).send(); } );
// START SERVER

app.listen(process.env.PORT || 2020, function () {
	console.log('Server listening on %j', this.address());
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
