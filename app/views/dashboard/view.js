define(['app', 'lodash',
    'utilities/editFormUtility',
    'directives/views/view-organization',
    'directives/views/view-undb-actor',
    'directives/views/view-event',
    'directives/views/view-undb-party',
    'utilities/km-storage'
], function(app, _) {
    'use strict';


    return ['$scope', '$routeParams',  '$route', 'IStorage','locale','user', function($scope, $routeParams,  $route, storage,locale,user) {


        var _ctrl = this;

        _ctrl.user=user;
        _ctrl.schema = _.camelCase($routeParams.schema);

        $scope.$root.page={};
        $scope.$root.page.title = "Record View: UNDB "+_ctrl.schema;

        //==================================
        //
        //==================================
        function init() {
            $scope.loading = true;
            _ctrl.locale=locale;
            var identifier = $route.current.params.id;
            var promise = null;
            var config ={};



            if (identifier ){
                promise = storage.documents.get(identifier,{ cache : false});
                promise.then(
                    function(doc) {
                        _ctrl.document = doc.data;
                        var header = storage.documents.get(identifier,{ info:'',cache : false});
                        header.then(function(h){
                          _ctrl.header = h.data;
                        });
                        $scope.loading = false;
                    }).then(null,
                    function(err) {
                        $scope.loading = false;
                        onError(err.data, err.status);
                        throw err;
                    });

            }
        }


        //==================================
        //
        //==================================
        function onError(error, status) {
            $scope.status = "error";

            if (status == "notAuthorized") {
                _ctrl.status = "hidden";
                _ctrl.error = "You are not authorized to modify this record";
            } else if (status == 404) {
                _ctrl.status = "hidden";
                _ctrl.error = "Record not found.";
            } else if (status == "badSchema") {
                _ctrl.status = "hidden";
                _ctrl.error = "Record type is invalid.";
            } else if (error.Message)
                _ctrl.error = error.Message;
            else
                _ctrl.error = error;
        }
        init();
    }];
});