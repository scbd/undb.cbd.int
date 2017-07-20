define(['text!./filter-actions.html', 'app', 'lodash', 'moment'], function(template, app, _, moment) {
    'use strict';

    app.directive('filterActions', [function() {
        return {
            restrict: 'E',
            template: template,
            replace: true,
            require: '^undbMap',
            scope: {
                title: '@title',
                active: '=active',
                message: '=message',
                        link: '=link',
            },
            link: function($scope, $element, $attr, undbMap) {
                    $scope.queries = {
                        'actions': {
                            'schema_s': ['event'],
                            '_state_s': ['public']
                        }
                    };
                    $scope.searchYear= new Date().getFullYear().toString();

                    //=======================================================================
                    //
                    //=======================================================================
                    $scope.loadRecords = function() {
                      var startD, endDate;
                      var q ;
                      delete($scope.queries.actions.endDate_dt);
                      delete($scope.queries.actions.startDate_dt);
                      if ($scope.searchYear && $scope.searchYear!=='past') {
                          startD = moment('01-01-' + $scope.searchYear, "DD-MM-YYYY").toISOString();
                          q = ['[' + startD + ' TO * ]'];
                          $scope.queries.actions.endDate_dt = q;
                      } else if($scope.searchYear==='past'){
                        startD = moment('01-01-2010', "DD-MM-YYYY").toISOString();

                        var y = new Date().getFullYear()-1;
                          console.log('30-12-'+y);
                        endDate = moment('30-12-'+y, "DD-MM-YYYY").toISOString();
                          q = ['[' + startD + ' TO ' +  endDate + ']'];
                        $scope.queries.actions.endDate_dt = q;

                      } else {
                          undbMap.deleteSubQuery('actions');
                          if ($scope.queries.actions.endDate_dt)
                              delete($scope.queries.actions.endDate_dt);
                      }
                        $scope.link="/actions/participate";
                        $scope.message = "actions";
                        undbMap.filterActive('actions');
                        undbMap.addSubQuery(_.cloneDeep($scope.queries), 'actions');
                        undbMap.search();
                    }; // loadRecords

                } //link
        }; // return
    }]); //app.directive('sfilterNbsap
}); // define