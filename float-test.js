/* jshint node: true, browser: false, esversion: 6*/
'use strict';

process.on('SIGTERM', ()=>process.exit());

// CREATE HTTP SERVER AND PROXY

var baseUrl = process.argv[2] || 'xyz';
var baseUrlRe = new RegExp('^\\/'+baseUrl+'(\\/|$)');

var app   = require('express')();
var proxy = require('http-proxy').createProxyServer({
    target: 'http://localhost:2020',
    secure: false,
    headers : {
        base_url : '/'+baseUrl+'/'
    },
});

app.use(require('morgan')('dev'));
app.all('/'+baseUrl,      reRoot, function(req, res) {  proxy.web(req, res); } );
app.all('/'+baseUrl+'/*', reRoot, function(req, res) {  proxy.web(req, res); } );

function reRoot(req, res, next) {
    req.url = '/'+req.url.replace(baseUrlRe, '');
    next();
}

// START SERVER

app.listen(process.env.PORT || 2050, function () {
	console.log('Server listening on %j', this.address());
	console.log('Path: /%s/* => /*', baseUrl);
});