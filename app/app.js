define(['angular'], function(angular) { 'use strict';

    var deps = ['ngRoute','smoothScroll','toastr','ngCkeditor','ngSanitize','ngDialog','ngCookies'];

    angular.defineModules(deps);

    var app = angular.module('app', deps);

    // app.value('realm', 'CHM');

    app.config(['$httpProvider', function($httpProvider){

        $httpProvider.useApplyAsync(true);
        $httpProvider.interceptors.push('authenticationHttpIntercepter');
        $httpProvider.interceptors.push('realmHttpIntercepter');
        $httpProvider.interceptors.push('apiRebase');
    }]);

  app.config(['toastrConfig',function(toastrConfig) {
    angular.extend(toastrConfig, {
      autoDismiss: true,
      containerId: 'toast-container',
      newestOnTop: true,
      closeButton: true,
      positionClass: 'toast-top-right',
      iconClasses: {
        error: 'toast-error',
        info: 'toast-info',
        success: 'toast-success',
        warning: 'toast-warning'
      },
      target: 'body',
      timeOut: 5000,
      progressBar: true,
    });
  }]);


    return app;
});
