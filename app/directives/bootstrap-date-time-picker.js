define(['app', 'moment', 'eonasdan-bootstrap-datetimepicker'], function(app, moment) {
    'use strict';

    app.directive('dateTimePicker', ['$timeout', function($timeout) {
        return {
            require: '?ngModel',
            restrict: 'AE',
            scope: {
                minDate: '=?',
                maxDate: '=?',
                binding: '=ngModel'
            },
            link: function($scope, $element, $attrs, ngModelCtrl) {

                var options = $scope.optionsObj;
                $scope.$watch('binding', function() {
                    if (!$scope.binding) {
                        $element.data('DateTimePicker').date(null);
                        ngModelCtrl.$viewValue = '';

                        return;
                    } else {
                        $element.data('DateTimePicker').date(ngModelCtrl.$viewValue);
                        setPickerValue();
                    }

                });
                $scope.$watch('minDate', function() {

                    if (!$scope.minDate) return;

                    $element.data('DateTimePicker').minDate($scope.minDate);

                    if(ngModelCtrl.$viewValue)
                      setPickerValue();
                    // $element.data('DateTimePicker').date(null);
                    // ngModelCtrl.$viewValue = '';

                });
                $scope.$watch('maxDate', function() {
                    if (!$scope.maxDate) return;
                    $element.data('DateTimePicker').maxDate($scope.maxDate);
                    $element.data('DateTimePicker').date(null);
                    ngModelCtrl.$viewValue = '';
                });
                if (typeof options === 'undefined') options = {
                    format: 'YYYY-MM-DD HH:mm',
                    defaultDate: false,
                    showClose: true
                };

                $element
                    .on('dp.change', function(e) {
                        if (ngModelCtrl) {
                            $timeout(function() {
                                moment.tz.setDefault('UTC');
                                if (e.target.value)
                                    ngModelCtrl.$setViewValue(moment(e.target.value, 'YYYY-MM-DD HH:mm').utc());
                                else
                                   $element.data('DateTimePicker').date(null);
                            });
                        }
                    })
                    .datetimepicker(options);

                function setPickerValue() {
                    var date = null;


                    if (ngModelCtrl && ngModelCtrl.$viewValue) {
                        if (ngModelCtrl.$viewValue instanceof moment) ngModelCtrl.$viewValue = ngModelCtrl.$viewValue.format('YYYY-MM-DD HH:mm');
                        moment.tz.setDefault('UTC');
                        if (ngModelCtrl.$viewValue)
                            date = moment(ngModelCtrl.$viewValue, 'YYYY-MM-DD HH:mm').utc();
                        else
                            date = '';
                    }
                    moment.tz.setDefault('UTC');
                    $element.data('DateTimePicker').date( moment(date, 'YYYY-MM-DD HH:mm').utc());
                }

                if (ngModelCtrl) {
                    ngModelCtrl.$render = function() {
                        setPickerValue();
                    };
                }

                setPickerValue();
            }


        };
    }]);
}); // define