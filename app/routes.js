define(['app', 'lodash', 'text!views/index.html','text!./redirect-dialog.html', 'views/index', 'providers/extended-route', 'authentication','ngDialog','ngCookies'], function(app, _, rootTemplate, redirectDialog) { 'use strict';
    var locationPath = window.location.pathname.toLowerCase().split('?')[0];
    app.config(['extendedRouteProvider', '$locationProvider',function($routeProvider, $locationProvider) {

        $locationProvider.html5Mode(true);
        $locationProvider.hashPrefix('!');

        $routeProvider.
            when('/',                             { template:    rootTemplate,  label:'Home',  resolveController: 'views/index', reloadOnSearch : false }).
            when('/home', { redirectTo: '/' }).
            //////////////////depreciated
when('/default.shtml', { redirectTo: '/' }).
when('/events', { redirectTo: '/actions' }).
when('/country/partner.shtml?country=us&partner=2296', { redirectTo: '/actors/partners' }).
                        when('/actions/submit',               { templateUrl: 'views/actions/submit.html',           label:'Participate',          resolveController: true, resolve : { user : securize(['User']) }, reloadOnSearch : false }).
                        when('/actions/register/:uid?',       { templateUrl: 'views/actions/submit-form.html',      label:'Form',                 resolveController: true, resolve : { user : securize(['User']) } }).
                        when('/actions/submit-form/:uid?',    { templateUrl: 'views/actions/submit-form.html',      label:'Form',                 resolveController: true, resolve : { user : securize(['User']) } }).
                        when('/actions/submit-form-done',     { templateUrl: 'views/actions/submit-form-done.html', label:'Thanks',               resolve : { user : securize(['User']) } }).

                        // when('/actors/partners/register', { redirectTo: '/dashboard/submit/undb-actor/new' }).
                        // when('/actors/register?', { redirectTo: '/dashboard/submit/undb-actor/:id' }).
                        // when('/actors/register/:uid', { redirectTo: '/dashboard/submit/undb-actor/:id' }).
                        // when('/actors/partners/edit/:uid', { redirectTo: '/dashboard/submit/undb-actor/:id'}).
                        when('/actors/partners/register',    { templateUrl: 'views/actors/submit-form.html',      label:'Become a UNDB Partner',   resolveController: true, resolve : { user : securize(['User']) } }).
                        when('/actors/register',             { templateUrl: 'views/actors/submit-form.html',      label:'Become a UNDB Partner',   resolveController: true, resolve : { user : securize(['User']) } }).
                        when('/actors/register/:uid',        { templateUrl: 'views/actors/submit-form.html',      label:'Become a UNDB Partner',   resolveController: true, resolve : { user : securize(['User']) } }).
                        when('/actors/partners/edit/:uid',   { templateUrl: 'views/actors/submit-form.html',      label:'Become a UNDB Partner',   resolveController: true, resolve : { user : securize(['User']) } }).
                        when('/actors/submit-form-done',     { templateUrl: 'views/actors/submit-form-done.html', label:'Thanks',                  resolve : { user : securize(['User']) } }).
            //////////////////depreciated

            when('/about',                       { templateUrl: 'views/about/index.html',         label:'Biodiversity',  resolveController: true }).
            when('/about/undb',                   { templateUrl: 'views/about/index.html',         label:'UNDB',          }).
            when('/about/goals',                  { templateUrl: 'views/about/goals.html',         label:'Goals',         }).
            when('/about/biodiversity',           { templateUrl: 'views/about/biodiversity.html',  label:'Biodiversity',  resolveController: true }).
            when('/about/iyb2010',                { templateUrl: 'views/about/iyb2010.html',       label:'IYB2010',       }).
            when('/about/sdgs',                   { templateUrl: 'views/about/sdgs.html',          label:'SDGs',          }).

            when('/actions',                      { redirectTo:  '/actions/worldwide' }).
            when('/actions/ccc',                  { templateUrl: 'views/actions/ccc.html',       label:'Commitments',              resolveController: true}).
            when('/actions/calendar',             { templateUrl: 'views/actions/calendar.html',         label:'Calendar',             resolveController: true }).
            when('/actions/participate',          { templateUrl: 'views/actions/participate.html',      label:'Participate'           }).
            when('/actions/worldwide',            { templateUrl: 'views/actions/worldwide.html',        label:'Worldwide',            resolveController: true , reloadOnSearch : false}).
            when('/actions/country',              { templateUrl: 'views/actions/country.html',          label:'By Country',           resolveController: true }).
            when('/actions/countries/:code',      { templateUrl: 'views/actions/country-profile.html',  label :'Profile',             resolveController: true }).
            // when('/actions/countries/edit/:code', { templateUrl: 'views/actions/country-profile-form.html', label:'Edit Country Profile',   resolveController: true, resolve : { user : securize(["UNDBPublishingAuthority", "undb-administrator"]) } }).

           // when('/actions/un',                 { templateUrl: 'views/actions/un.html',               label:'By UN Organization',   resolveController: true }).


            when('/actions/:uid',                 { templateUrl: 'views/actions/action.html',           label:'Action',               resolveController: true }).

            when('/actors',                      { templateUrl: 'views/actors/index.html',            label:'Actors',                  resolveController: true}).
            when('/actors/abttf',                { templateUrl: 'views/actors/abttf.html',            label:'ABTTF',                   resolveController: true}).
            when('/actors/champions',            { templateUrl: 'views/actors/champions.html',        label:'Biodiversity Champions',  resolveController: true}).
            when('/actors/blg',                  { templateUrl: 'views/actors/blg.html',              label:'BLG',                     resolveController: true}).
            when('/actors/country',              { templateUrl: 'views/actors/country.html',          label:'By Country',           resolveController: true }).

            when('/actors/jlg',                  { templateUrl: 'views/actors/jlg.html',              label:'JLG' ,                    resolveController: true}).
            when('/actors/submit',               { templateUrl: 'views/actors/submit.html',           label:'Participate',             resolveController: true, resolve : { user : securize(['User']) }, reloadOnSearch : false }).
            when('/actors/partners',             { templateUrl: 'views/actors/partners.html',         label:'UNDB Partners',           resolveController: true, resolve : { user : currentUser() } }).
            when('/actors/partners/:uid',        { templateUrl: 'views/actors/actor.html',            label:'Actor',                   resolveController: true }).

            when('/resources',                   { templateUrl: 'views/resources/index.html',           label:'Resources'         }).
            when('/resources/logo',              { templateUrl: 'views/resources/logo.html',            label:'Logo',                  resolveController: true}).
            when('/resources/materials',         { templateUrl: 'views/resources/materials.html',       label:'Printed Materials' }).
            when('/resources/waiver',            { templateUrl: 'views/resources/waiver.html',          label:'Waiver',                resolveController: true}).
            when('/resources/waiver/submit',     { templateUrl: 'views/resources/submit-waiver.html',   label:'Submit Waiver',         resolveController: true, resolve : { user : securize(['User']) } }).
            when('/resources/waiver/submit-done',{ templateUrl: 'views/resources/submit-form-done.html',label:'Submit Waiver done' }).
            when('/resources/un-logo',           { templateUrl: 'views/resources/un-logo.html',         label:'UN Logo Use' }).
            when('/resources/contact',           { templateUrl: 'views/resources/contact.html',         label:'Contact Us' }).

            when('/dashboard',                   { templateUrl: 'views/dashboard/index-dash.html',    controllerAs: 'dashCtrl',    resolveController: true ,resolve : { user : securize(['User']) }}).
            when('/dashboard/submit/', { redirectTo: '/dashboard' }).

            when('/dashboard/submit/:schema/:id/view',{ templateUrl: 'views/dashboard/view.html',    controllerAs: 'viewCtrl',    resolveController: true,resolve : { user : securize(['Everyone']) } }).
            when('/dashboard/submit/:schema/:id',     { templateUrl: 'views/dashboard/edit.html',         controllerAs: 'editCtrl',    resolveController: true ,resolve : { user : securize(['User']) }}).
            when('/dashboard/submit/:schema',         { templateUrl: 'views/dashboard/record-list.html',  controllerAs: 'submitCtrl',  resolveController: true,resolve : { user : securize(['User']) } }).





            when('/help/404',                    { templateUrl: 'views/404.html',  controllerAs: 'notFoundCtrl',resolveController: true ,label : 'Not found',resolve : {path:currentPath}  }).
            when('/help/403',                    { templateUrl: 'views/403.html',   label : 'Forbidden' }).
            otherwise({ redirectTo: '/help/404' });
    }]);

    //============================================================
    //
    //
    //============================================================
    function currentUser() {

        return ['authentication', function (authentication) {

            return authentication.getUser();
        }];
    }
    //============================================================
    //
    //
    //============================================================
    function currentPath() {

        return locationPath;
    }
    //============================================================
    //
    //
    //============================================================
    function securize(requiredRoles) {

        return ['$q', '$rootScope', 'authentication', '$location', '$window','ngDialog','$cookies', function($q, $rootScope, authentication, $location, $window,ngDialog,$cookies) {

            return $q.when(authentication.getUser()).then(function (user) {

                var hasRole = !!_.intersection(user.roles, requiredRoles).length;

                if (!user.isAuthenticated) {
                    $rootScope.authRediectChange=authRediectChange;
                    if(!!_.intersection(requiredRoles, ['Everyone']).length)
                      return user;

                    if(!$cookies.get('redirectOnAuthMsg') || $cookies.get('redirectOnAuthMsg')==='false')
                        openDialog();
                    else
                        $window.location.href = authentication.accountsBaseUrl()+'/signin?returnurl='+encodeURIComponent($location.absUrl());

                    throw user; // stop route change!
                }
                else if (!hasRole)
                    $location.url('/403?returnurl='+encodeURIComponent($location.url()));

                return user;
            });

            //============================================================
            //
            //
            //============================================================
            function openDialog() {
                $rootScope.redirectOnAuthMsg=true;
                $cookies.put('redirectOnAuthMsg',true);
                ngDialog.open({
                      template: redirectDialog,
                      className: 'ngdialog-theme-default',
                      closeByDocument: false,
                      plain: true,
                      scope:$rootScope
                  }).closePromise.then(function(retVal){
                        if(retVal.value)
                          $window.location.href = authentication.accountsBaseUrl()+'/signin?returnurl='+encodeURIComponent($location.absUrl());
                        else
                          $window.history.back();
                  });
            }
            //============================================================
            //
            //
            //============================================================
            function authRediectChange(value) {
                $cookies.put('redirectOnAuthMsg',value);
            }//authRediectChange

        }];//return array
    }//securize

});
