define(['app', 'text!./toast.html', 'lodash','angular', 'authentication','providers/locale', 'toastr','utilities/realm'], function(app, toastTemplate,_,ng) {
    'use strict';

    app.controller('TemplateController', ['$scope', '$rootScope', '$window', '$location', '$route', 'authentication', 'toastr', '$templateCache', function($scope, $rootScope, $window, $location, $route, authentication, toastr, $templateCache) {

        $scope.path = $location.path();
        var basePath = (ng.element('base').attr('href')||'').replace(/\/+$/g, '');
        $scope.$on("$routeChangeSuccess", function() {
            $scope.routeLoaded = true;
            $window.ga('set',  'page', basePath+$location.path());
            $window.ga('send', 'pageview');
            if($route.current.$$route)
            $scope.$root.breadcrumb = getPage($route.current.$$route.originalPath);
            $scope.path = $location.path();
        });
        $rootScope.$on('event:auth-emailVerification', function(evt, data) {
            $scope.showEmailVerificationMessage = data.message;
        });
        authentication.getUser().then(function(user) {
            $scope.user = user;
        });
        var killWatch = $scope.$watch('user', _.debounce(function(user) {

            if (!user)
                return;

            require(["_slaask"], function(_slaask) {

                if (user.isAuthenticated) {
                    _slaask.identify(user.name, {
                        'user-id' : user.userID,
                        'name' : user.name,
                        'email' : user.email,
                    });

                    if(_slaask.initialized) {
                        _slaask.slaaskSendUserInfos();
                    }
                }

                if(!_slaask.initialized) {
                    _slaask.init('45333ce83b22e400b1528f2bf51993df');
                    killWatch();
                }
            });
        }, 1000));


        // handling sub menus
        $("#siteMenu .dropdown-menu>li>a").click(function(e) {
            e.stopPropagation();

            if ($(this).siblings('ul').length > 0) {
                if ($(this).parent('li').hasClass('open')) {
                    // $(this).parent('li').removeClass('open');
                } else {
                    e.preventDefault();
                    $('#siteMenu li.open').removeClass('open');
                    $(this).parent('li').addClass('open');
                }
            }
        });

        // close open sub menus when the dropdown is closed
        $('.darkbox').click(function() {
            $('.dropdown-menu li.open').removeClass('open');
        });
        $('#siteMenu').click(function() {
            $('.dropdown-menu li.open').removeClass('open');
        });
        // close dropdown & open sub menus on window resize
        $(window).resize(function() {
            $('.dropdown').removeClass('open');
            $('.dropdown-menu li.open').removeClass('open');
            $('.darkbox').removeClass('open');
        });



        // activate darkbox
        // $('.dropdown').on('show.bs.dropdown', function () {
        //   $('.darkbox').addClass('open');
        // });
        // // deactivate darkbox
        // $('.dropdown').on('hide.bs.dropdown', function () {
        //   $('.darkbox').removeClass('open');
        // });



        //============================================================
        //
        //
        //============================================================
        $scope.actionSignUp = function() {
            var redirect_uri = $window.encodeURIComponent($location.protocol() + '://' + $location.host() + ':' + $location.port() + '/');
            $window.location.href = 'https://accounts.cbd.int/signup?returnUrl=' + redirect_uri;
        };

        //============================================================
        //
        //
        //============================================================
        $scope.actionSignIn = function() {
            var returnUrl   = $window.encodeURIComponent($window.location.href);
            $window.location.href = 'https://accounts.cbd.int/signin?returnUrl=' + returnUrl;
            //            $location.url('/signin');
        };

        //============================================================
        //
        //
        //============================================================
        $scope.actionSignOut = function() {
            authentication.signOut();
            $window.location.href = $window.location.href;
        };

        //============================================================
        //
        //
        //============================================================
        $scope.actionPassword = function() {
            var redirect_uri = $window.encodeURIComponent($location.protocol() + '://' + $location.host() + ':' + $location.port() + '/');
            $window.location.href = 'https://accounts.cbd.int/password?redirect_uri=' + redirect_uri;
        };

        //============================================================
        //
        //
        //============================================================
        $scope.actionProfile = function() {
            var redirect_uri = $window.encodeURIComponent($location.protocol() + '://' + $location.host() + ':' + $location.port() + '/');
            $window.location.href = 'https://accounts.cbd.int/profile?redirect_uri=' + redirect_uri;
        };

        //============================================================
        //============================================================

        var siteMap = {
            '/': {
                name: 'Home',
                pages: {
                    '/about': {
                        name: 'About',
                        pages: {
                            '/about/approach': {
                                name: 'Approach'
                            },
                            '/about/history': {
                                name: 'History'
                            },
                            '/about/strategic-plan': {
                                name: 'Strategic Plan'
                            }
                        }
                    },
                    '/events': {
                        name: 'Events'
                    },
                    '/training': {
                        name: 'Training'
                    },
                    '/resources': {
                        name: 'Resources',
                        pages: {
                            '/resources/brochures': {
                                name: 'Brochures'
                            },
                            '/resources/cbd-materials': {
                                name: 'SOI/CBD Materials'
                            },
                            '/resources/relevant-resources': {
                                name: 'Other Relevant Resources'
                            },
                            '/resources/background-materials': {
                                name: 'Background Materials'
                            }
                        }
                    },
                    '/experiences': {
                        name: 'Experiences'
                    },
                    '/partners': {
                        name: 'Partners'
                    },
                    '/aligned-initiatives': {
                        name: 'Aligned Initiatives'
                    },
                    '/help': {
                        name: 'Help',
                        pages: {
                            '/help/403': {
                                name: '403'
                            },
                            '/help/404': {
                                name: '404'
                            }
                        }
                    }
                }
            }
        };

        //============================================================
        //
        //
        //============================================================
        function getPage(url) {
            return getPageInternal(siteMap, url);
        }

        //============================================================
        //
        //
        //============================================================
        function getPageInternal(current, url) {

            var keys = Object.keys(current);

            for (var i = 0; i < keys.length; ++i) {

                if (keys[i] == url)
                    return [{
                        url: keys[i],
                        name: current[keys[i]].name
                    }];

                if (!current[keys[i]].pages)
                    continue;

                var res = getPageInternal(current[keys[i]].pages, url);

                if (res) {
                    res.unshift({
                        url: keys[i],
                        name: current[keys[i]].name
                    });
                    return res;
                }
            }
        }

        $templateCache.put("directives/toast/toast.html", toastTemplate);


        //==============================
        //
        //==============================
        $rootScope.$on("showInfo", function(evt, msg) {
            toastr.info(msg);
        });

        //==============================
        //
        //==============================
        $rootScope.$on("showWarning", function(evt, msg) {
            toastr.warning(msg);
        });

        //==============================
        //
        //==============================
        $rootScope.$on("showSuccess", function(evt, msg) {
            toastr.success(msg);
        });

        //==============================
        //
        //==============================
        $rootScope.$on("showError", function(evt, msg) {
            toastr.error(msg);
        });


    }]);
});