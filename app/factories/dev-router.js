/* jshint sub:true */

define(['app'], function(app) {
    'use strict';
    /***************************************************************************************
     * dev env variables
     ***************************************************************************************/
    app.factory('devRouter', [function() {

        var domain = document.location.hostname.replace(/[^\.]+\./, '');
        var production = true; // change to true to work on production accounts
        // if ((domain == 'localhost'  || (domain.indexOf('cbddev.xyz') >= 0)) && !production)
        //     domain = 'cbddev.xyz';
        // else
            domain = 'cbd.int';

        var ACCOUNTS_URI = 'https://accounts.' + domain;

        /***************************************************************************************
         *

         ***************************************************************************************/
        function isDev() {
          if((domain == 'localhost'  ||(domain.indexOf('cbddev.xyz') >= 0)) && !production)
            return true;
            else {
              return '';
            }
        }

        return {
            ACCOUNTS_URI: ACCOUNTS_URI,
            DOMAIN: domain,
            isDev: isDev
        };
    }]);
});
