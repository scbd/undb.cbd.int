define(['text!./ammap3.html',
    'app',
    'lodash',
    'moment-timezone',
    'text!./pin-popup-actions.html',
    'text!./pin-popup-title-actions.html',
    'text!./pin-popup-title-actors.html',
    'data/ccc',
    'ammap',
    'shim!./worldEUHigh[ammap]',
    'shim!ammap/themes/light[ammap]',
    'css!./mappin.css',
    'filters/hack',
    'filters/trunc',
    'filters/moment',
    'utilities/km-utilities'
], function(template, app, _,moment, popoverTemplateActions, popoverTitleActions, popoverTitleActors) {
    'use strict';
var images=[];
    app.directive('ammap3', ['$timeout', 'locale', '$http','$document','$filter','$compile',function($timeout, locale, $http,$document,$filter,$compile) {
        return {
            restrict: 'E',
            template: template,
            replace: true,
            require: ['^ammap3'],
            scope: {
                items: '=ngModel',
                schema: '=schema',
                debug: '=debug',
                loading:'=loading'
            },
            link: function($scope, $element, $attr, requiredDirectives) {

                var ammap3 = requiredDirectives[0];

                $scope.leggends = {
                    parties: [{
                        id: 5,
                        title: 'CBD Party',
                        visible: true,
                        color: '#009B48'
                    }, {
                        id: 0,
                        title: 'Not a Party',
                        visible: true,
                        color: '#8cc65d'
                    }, ],
                    aichi: [ {
                      id: 5,
                      title: 'Exceeded Target',
                      visible: true,
                      color: '#1074bc'
                    }, {
                      id: 4,
                      title: 'Met Target',
                      visible: true,
                      color: '#109e49'
                    }, {
                      id: 3,
                      title: 'Insufficient Rate',
                      visible: true,
                      color: '#fec210'
                    }, {
                      id: 2,
                      title: 'No Progress',
                      visible: true,
                      color: '#ee1d23'
                    } , {
                      id: 1,
                      title: 'Moving Away',
                      visible: true,
                      color: '#6c1c67'
                    },{
                      id: 0,
                      title: 'No Data',
                      visible: true,
                      color: '#dddddd'
                    }]
                };

                //=======================================================================
                //
                //=======================================================================
                $scope.$watch('items', function(newV,old) {
                    if ($scope.map && (!_.isEmpty($scope.items) || (_.isEmpty(newV) && !_.isEmpty(old))) ) {
                        $scope.map.dataProvider.images = _.clone($scope.images);
                        ammap3.generateMap($scope.schema);
                    }
                });

                //=======================================================================
                //
                //=======================================================================
                $http.get('/api/v2015/countries', {
                    cache: true,
                }).then(function(res) {
                    res.data.forEach(function(c) {
                        c.name = c.name[locale];
                    });
                    $scope.countries = res.data;
                    initMap();
                });
                //=======================================================================
                //
                //=======================================================================
                function onMapClick(event) {
                  var info = event.chart.getDevInfo();
                  if(ammap3.isPopoverOpen())
                      ammap3.closePopovers();
                  else{
                    info = event.chart.getDevInfo();
                    var zoomLevel;
                    if($scope.map.zoomLevel()<4097)
                      zoomLevel = $scope.map.zoomLevel()*8;
                    else
                      zoomLevel = $scope.map.zoomLevel();

                    var longitude= info.longitude;
                    var latitude= info.latitude;

                    $timeout(function(){

                        $scope.map.zoomToLongLat(zoomLevel, longitude, latitude);
                    },400);
                  }
                }

                //=======================================================================
                //
                //=======================================================================
                function initMap() {

                    $scope.images = [{
                        "label": "EU",
                        "latitude": -5.02,
                        "longitude": -167.66
                    }];
                    $scope.mapData = {
                        "type": "map",
                        "developerMode":true,
                        "theme": "light",
                        "zoomDuration":.3,//jshint ignore:line
                        "responsive": {
                            "enabled": true
                        },
                        "dataProvider": {
                            "map": "worldEUHigh",
                            "getAreasFromMap": true,
                        },

                        "areasSettings": {
                            "autoZoom": false,
                            "selectedColor": "#004844",
                            "rollOverColor": "#004844",
                            "selectable": true,
                            "color": "#069554"
                        },

                        "zoomControl": {
                            "right": 20,
                            "top": 150,
                            "maxZoomLevel": 262144,
                            "zoomFactor":8,
                            "panStepSize":.2//jshint ignore:line
                        }
                    }; //

                    $scope.mapData.images = _.clone($scope.images);
                    ammap3.writeMap();
                    $document.keyup(function(v){
                      if(v.keyCode == 27)
                        ammap3.closePopovers();
                    });
                    $scope.map.addListener("homeButtonClicked", ammap3.closePopovers);
                    $scope.map.addListener("homeButtonClicked", ammap3.updateCustomMarkers);
                    $scope.map.addListener("positionChanged", ammap3.updateCustomMarkers);
                    $scope.map.addListener('zoomCompleted',function(){
                      $timeout(function(){ammap3.updateCustomMarkers();},50);
                    });
                    $scope.map.addListener("click",onMapClick );
                } //$scope.initMap
            }, //link


            //=======================================================================
            // controller
            //=======================================================================
            controller: ["$scope", function($scope) {

                //=======================================================================
                //
                //=======================================================================
                function closePopovers(pin) {
                    // get map object
                    var map = $scope.map;

                    // go through all of the images
                    for (var x in map.dataProvider.images) {
                        if (x !== $(pin).data('i')) //exlude passed pin
                            $($scope.map.dataProvider.images[x].externalElement).children('#pin').popover('hide');
                    }
                } //close popover

                //=======================================================================
                //
                //=======================================================================
                function isPopoverOpen() {
                    // get map object
                    var map = $scope.map;
                    var pin = null;
                    // go through all of the images
                    for (var x in map.dataProvider.images) {
                        pin = $($scope.map.dataProvider.images[x].externalElement).children('#pin');
                        if($(pin).next('div.popover:visible').length) return true;
                    }
                    return false;
                } //close popover


                //=======================================================================
                //
                //=======================================================================
                function updateCustomMarkers() {

                    if ($scope.schema == 'parties') return;
                    var map = $scope.map;


                    for (var x in map.dataProvider.images) {
                        var image = map.dataProvider.images[x];

                        if (map.dataProvider.images[x].label && map.dataProvider.images[x].label === 'EU' || map.dataProvider.images[x].label && map.dataProvider.images[x].label === ' ') continue;

                        if ('undefined' == typeof image.externalElement) {// create pin is it does not exist
                            image.externalElement = generateMarker(x);
                          }

                        if ('undefined' !== typeof image.externalElement) { //update xy based on movement of map



                            image.externalElement.style.top = map.latitudeToY(image.latitude) + 'px';
                            image.externalElement.style.left = map.longitudeToX(image.longitude) + 'px';
                        }
                    } //for


                } //updateCustomMarkers


                //=======================================================================
                //
                //=======================================================================
                function generateMarker(imageIndex) {

                    if ($scope.schema === 'actions')
                        if($scope.map.dataProvider.images[imageIndex].isCCC)
                          return makeMarker(imageIndex, 'pin-ccc', 'pulse-', 'app/img/pointer-undb-orange.png');
                        else if(is25th($scope.map.dataProvider.images[imageIndex]))
                          return makeMarker(imageIndex, 'pin-action pin-action-25', 'pulse-', 'app/img/pointer-yellow-pin.png');
                        else
                          return makeMarker(imageIndex, 'pin-action', 'pulse-', 'app/img/pointer-undb-green.png');

                    if ($scope.schema === 'undbActor')
                        return makeMarker(imageIndex, 'pin-actor', 'pulse-', 'app/img/pointer-undb-blue.png');

                } //generateMarker

                //=======================================================================
                //
                //=======================================================================
                function is25th(thematicArea) {
                    if(thematicArea && thematicArea.thematicArea_ss)
                      for (var theme of thematicArea.thematicArea_ss) {
                        if(theme==='CBD-SUBJECT-25TH-ANN'){
                          return true;
                        }
                      }
                    return false
                } //generateMarker
                //=======================================================================
                // this function creates and returns a new marker element
                //=======================================================================
                function makeMarker(imageIndex, pinClass, pulseClass, imagePath) {

                     var holder = document.createElement('div');
                    holder.className = 'map-marker';
                    holder.style.position = 'absolute';

                    //create pin
                    var pin = document.createElement('div');

                    pin.id = 'pin';
                    pin.className = 'pin ' + pinClass;
                    $(pin).data('i', imageIndex);
                    $(pin).data('toggle', 'popover');

                    $(pin).hover(function(){
                      closePopovers(pin);
                      $(pin).popover(generatePopover(imageIndex));
                    });

                    $(pin).on('shown.bs.popover',function(){
                      if ($(pin).data('bs.popover').tip().hasClass('in')){
                        $timeout(function(){
                          $scope.map.zoomToLongLat($scope.map.zoomLevel(), $scope.map.dataProvider.images[imageIndex].longitude, $scope.map.dataProvider.images[imageIndex].latitude);
                          $scope.map.moveUp();
                        },100);
                      }
                    });
                    holder.appendChild(pin);

                    var img = document.createElement('img');
                    img.setAttribute('src', imagePath);

                    img.className = 'leaf-image';
                    pin.appendChild(img);


                    //append the marker to the map container
                    $scope.map.dataProvider.images[imageIndex].chart.chartDiv.appendChild(holder);

                    return holder;
                } //makeMarker

                //=======================================================================
                //
                //=======================================================================
                function extractId (id){
                    if(!id)return;
                    return parseInt(id.replace('52000000cbd08', ''), 16);
                }

                //=======================================================================
                //
                //=======================================================================
                function generatePopover(imageIndex) {

                    $scope.currImage = $scope.map.dataProvider.images[imageIndex];
                    var popoverTitleParsed = '';
                    var popoverTemplateParsed = '';
                    var img='';
                    switch ($scope.schema) {

                        case 'actions':
                            // cache image
                            if($scope.currImage.logo_s){
                              img = new Image();
                              img.src=$scope.currImage.logo_s;
                              images.push(img);
                            }
                            if($scope.currImage.id)
                              $scope.currImage.links_s='actions/'+extractId($scope.currImage.id);
                              if ($scope.currImage.countryCode) $scope.currImage.countryName = _.findWhere($scope.countries, {
                                  code: $scope.currImage.countryCode.toUpperCase()
                              }).name;
                            $scope.$apply(function(){
                                popoverTitleParsed = $compile(popoverTitleActions)($scope);
                                  popoverTemplateParsed = $compile(popoverTemplateActions)($scope);
                            });
                            return {
                                html: true,
                                trigger: 'click',
                                placement: 'top',
                                title: popoverTitleParsed,
                                template: popoverTemplateParsed
                            };

                        case 'undbActor':

                            // cache image
                            if($scope.currImage.logo_s){
                              img = new Image();
                              img.src=$scope.currImage.logo_s;
                              images.push(img);
                            }
                            if ($scope.currImage.countryCode) $scope.currImage.countryName = _.findWhere($scope.countries, {
                                code: $scope.currImage.countryCode.toUpperCase()
                            }).name;

                            if($scope.currImage.id)
                              $scope.currImage.links_s='actors/partners/'+extractId($scope.currImage.id);
                              if ($scope.currImage.countryCode) $scope.currImage.countryName = _.findWhere($scope.countries, {
                                  code: $scope.currImage.countryCode.toUpperCase()
                              }).name;
                            $scope.$apply(function(){
                                popoverTitleParsed = $compile(popoverTitleActors)($scope);
                                popoverTemplateParsed = $compile(popoverTemplateActions)($scope);
                            });
                            return {
                                html: true,
                                trigger: 'click',
                                placement: 'top',
                                title: popoverTitleParsed,
                                template: popoverTemplateParsed
                            };
                    } // switch
                } //$scope.legendHide


                //=======================================================================
                //
                //=======================================================================
                function generateMap(schema) {

                    if (!schema) throw "Error schema not passed";
                    if (schema === 'parties'){
                        colorMap(resetMap);
                        partiesMap();
                    }
                    else if (schema === 'aichi'){
                        colorMap(resetMap,true);
                        progressColorMap(aichiMap);

                      }
                    else {
                        hideEu();
                        colorMap(resetMap);
                        pinMap(defaultPinMap);
                    }
                } //generateMap


                //=======================================================================
                //
                //=======================================================================
                function progressToColor(progress) {

                  switch (progress) {
                    case 5:
                      return '#1074bc';
                    case 4:
                      return '#109e49';
                    case 3:
                      return '#fec210';
                    case 2:
                      return '#ee1d23';
                    case 1:
                      return '#6c1c67';
                  }
                } //readQueryString
                //=======================================================================
                //
                //=======================================================================
                function aichiMap(country) {


                  if(!_.isEmpty(country.docs)){
                      changeAreaColor(country.code, progressToColor(country.docs[0].progress));
                      if(country.docs[0].progress && country.docs[0].nationalTarget_EN_t)
                      buildProgressBaloon(country,country.docs[0].progress, country.docs[0].nationalTarget_EN_t);

                  }else
                      changeAreaColor(country.code,'#cccccc');

                } // aichiMap

                //=======================================================================
                //
                //=======================================================================
                $scope.legendHide = function(legendItem) {

                    var area2 = {};

                    _.each($scope.map.dataProvider.areas, function(area) {

                        if (legendItem.color === area.originalColor && area.mouseEnabled === true && 'GL' !== area.id) {
                            area.colorReal = '#FFFFFF';
                            area.mouseEnabled = false;

                        } else if (legendItem.color === area.originalColor && area.mouseEnabled === false && 'GL' !== area.id) {
                            area.colorReal = legendItem.color;
                            area.mouseEnabled = true;

                        }
                        if (area.id.toUpperCase() === 'DK') {
                            area2 = getMapObject('GL');
                            area2.colorReal = area.colorReal;
                            area2.mouseEnabled = area.mouseEnabled;
                        }
                    });

                    if (legendItem.visible)
                        legendItem.visible = false;
                    else
                        legendItem.visible = true;
                    $scope.map.validateData();
                }; //$scope.legendHide

                //=======================================================================
                //
                //=======================================================================
                function toggleLegend(legend, color) { //jshint ignore:line

                    var index = _.findIndex(legend, function(legendItem) {
                        return legendItem.color == 'color';
                    });
                    legend[index].visible = false;
                } //toggleLeggend


                //=======================================================================
                //
                //=======================================================================
                function writeMap(mapData) {

                    if (!mapData) mapData = getMapData();
                    $scope.map = AmCharts.makeChart("mapdiv", mapData); //jshint ignore:line
                    $scope.map.write("mapdiv");
                } // writeMap

                //=======================================================================
                //
                //=======================================================================
                function partiesMap() {
                       changeAreaColor('divider1', "#009B48");
                       changeAreaColor('EU', "#009B48");
                       changeAreaColor('US', "#8cc65d");
                       var area = getMapObject('EU');
                       area.outlineAlpha = '.5';
                       area = getMapObject('divider1');
                       area.outlineAlpha = '.5';
                       $scope.map.dataProvider.images[0].label = 'EU';
                       $scope.map.validateData();
                } //progressColorMap

                //=======================================================================
                //
                //=======================================================================
                function progressColorMap(mapTypeFunction) {

                    //hideAreas();

                    _.each($scope.items, function(country) {

                        if (!_.isEmpty(country.docs))
                            _.each(country.docs, function(schema) {
                                if (mapTypeFunction) mapTypeFunction(country, schema, $scope.schema);
                            });
                        else mapTypeFunction(country);
                    });

                    changeAreaColor('divider1', "#009B48");

                    var area = getMapObject('EU');
                    area.outlineAlpha = '.5';
                    area = getMapObject('divider1');
                    area.outlineAlpha = '.5';

                    $scope.map.dataProvider.images[0].label = 'EU';
                    $scope.map.validateData(); // updates map with color changes
                } //progressColorMap


                //=======================================================================
                //
                //=======================================================================
                function pinMap(mapTypeFunction) {

                    $scope.legendTitle = ""; // reset legend title

                    _.each($scope.items, function(item) {
                        mapTypeFunction(item);
                    });
                    $scope.map.validateData(); // updates map with color changes
                    updateCustomMarkers();
                } //


                //=======================================================================
                //
                //=======================================================================
                function colorMap(mapTypeFunction,grey) {

                    if(mapTypeFunction.name==='resetMap' && $scope.resetAreas && !grey)
                      $scope.map.dataProvider.areas = _.cloneDeep($scope.resetAreas);

                    else
                    _.each($scope.map.dataProvider.areas, function(country) {
                          mapTypeFunction({
                              'code': country.id
                          },grey);
                    });
                    if(mapTypeFunction.name==='resetMap' && !$scope.resetAreas && !grey)
                      $scope.resetAreas = _.cloneDeep($scope.map.dataProvider.areas);
                    $scope.map.validateData(); // updates map with color changes
                    updateCustomMarkers();
                } //colorMap


                //=======================================================================
                //
                //=======================================================================
                function resetMap(country,grey) {
                    var color = "#069554";//24a071 +30 -11 +39
                    if(grey)color = '#c1ccd1';

                    if (country.code !== 'EU' && country.code !== 'divider1')
                        changeAreaColor(country.code, color);

                } //resetMap
                //=======================================================================
                //
                //=======================================================================
                function hideEu() {
                        var color= '#99CDE8'
                        changeAreaColor('EU', color );
                        changeAreaColor('divider1', color );

                        var area = getMapObject('EU');
                        area.outlineAlpha = 0;
                        area = getMapObject('divider1');
                        area.outlineAlpha = 0;
                        $scope.map.dataProvider.images[0].label = ' ';
                        $scope.map.validateData();

                } //resetMap

                //=======================================================================
                //
                //=======================================================================
                function defaultPinMap(item) {
                    var imgPin = itemToImagePin(item);
                    if (imgPin)
                        $scope.map.dataProvider.images.push(imgPin);

                } // defaultPinMap


                //=======================================================================
                //
                //=======================================================================
                function itemToImagePin(item) {

                    if (item.coordinates_s && !_.isObject(item.coordinates_s))
                        item.coordinates_s = JSON.parse(item.coordinates_s);
                    if (($scope.schema == 'undbActor' || $scope.schema == 'actions') && (!item.lat_d || !item.lng_d)) return 0;

                        switch ($scope.schema) {
                            case 'actions':
                                if(moment(item.startDate_dt).isSame(moment(item.endDate_dt),'day'))
                                    item.endDate_dt=null;
                                return {
                                    // zoomLevel: 5,
                                    scale: 0.5,
                                    id:item.id,
                                    isCCC:item.isCCC,
                                    startDate_dt: item.startDate_dt,
                                    endDate_dt: item.endDate_dt,
                                    logo_s: item.logo_s,
                                    facebook_s: item.facebook_s,
                                    twitter_s: item.twitter_s,
                                    youtube_s: item.youtube_s,
                                    website_s: item.website_s,
                                    email_s: item.email_s,
                                    address_s: item.address_s,
                                    phone_s: item.phone_s,
                                    countryCode: item.country_s,
                                    description_s: item.description_s,
                                    descriptionNative_s: item.descriptionNative_s,
                                    title: item.title_s,
                                    directions: item.googleMaps_s,
                                    links_s:item.link_s,
                                    draft:item.draft,
                                    latitude: _.clone(item.lat_d),
                                    longitude: _.clone(item.lng_d),
                                    thematicArea_ss:item.thematicArea_ss,
                                    aichiTarget_ss:item.aichiTarget_ss,
                                    coordinates_s: {
                                        lat: _.clone(item.lat_d),
                                        lng: _.clone(item.lat_d)
                                    },
                                    schema: _.clone($scope.schema),
                                };
                            case 'undbActor':
                                return {
                                    // zoomLevel: 5,
                                    id:item.id,
                                    scale: 0.5,
                                    logo_s: item.logo_s,
                                    facebook_s: item.facebook_s,
                                    twitter_s: item.twitter_s,
                                    youtube_s: item.youtube_s,
                                    website_s: item.website_s,
                                    email_s: item.email_s,
                                    address_s: item.address_s,
                                    phone_s: item.phone_s,
                                    countryCode: item.country_s,//
                                    description_s: item.description_s,
                                    descriptionNative_s: item.descriptionNative_s,
                                    title: item.title_s,//
                                    directions: item.googleMaps_s,
                                    latitude: _.clone(item.lat_d),//
                                    longitude: _.clone(item.lng_d),//
                                    links_s:item.link_s,
                                    coordinates_s: {
                                        lat: _.clone(item.lat_d),
                                        lng: _.clone(item.lat_d)
                                    },
                                    schema: _.clone($scope.schema),
                                };
                            }//switch
                } // aichiMap
$scope.isEs = function(arr){
    if(!arr)return false;
    return !!(~arr.indexOf('BD8F75CA-32D4-427B-A9CE-55079989A0CC'));
};
$scope.isIbd = function(arr){
    if(!arr)return false;
    return !!(~arr.indexOf('CBD-SUBJECT-IBD'));
};

                // =======================================================================
                //
                // =======================================================================
                function changeAreaColor(id, color, area) {

                    if (!area)
                        area = getMapObject(id);

                    area.colorReal = area.originalColor = color;
                    if (id === 'DK') {
                        var area2 = getMapObject('GL');
                        area2.colorReal = area.colorReal;
                        area2.originalColor = area.originalColor;
                    }
                } //changeAreaColor

                // //=======================================================================
                // // c
                // //=======================================================================
                function getProgressIcon(progress) {

                  switch (progress) {
                    case 1:
                      return '/app/images/ratings/36A174B8-085A-4363-AE11-E34163A9209C.png';
                    case 2:
                      return '/app/images/ratings/2D241E0A-1D17-4A0A-9D52-B570D34B23BF.png';
                    case 3:
                      return '/app/images/ratings/486C27A7-6BDF-460D-92F8-312D337EC6E2.png';
                    case 4:
                      return '/app/images/ratings/E49EF94E-0590-486C-903B-68C5E54EC089.png';
                    case 5:
                      return '/app/images/ratings/884D8D8C-F2AE-4AAC-82E3-5B73CE627D45.png';
                  }
                } //getProgressIcon(progress)

                // // =======================================================================
                // //
                // // =======================================================================
                function buildProgressBaloon(country, progress, target) {

                  var area = getMapObject(country.code);
                  if(country.code==='EU')country.code='eur';
                  area.balloonText = "<div class='panel panel-default' ><div class='panel-heading' style='font-weight:bold; font-size:medium; white-space: nowrap;'><img style=\"max-height:20px;\" src=\"https://www.cbd.int/images/flags/96/flag-"+country.code+"-96.png\">&nbsp;";
                  var balloonText2 = area.title + "</div> <div class='panel-body' style='text-align:left;'><img style='float:right;width:60px;hight:60px;' src='" + getProgressIcon(progress) + "' >" + getProgressText(progress, target) + "</div> </div>";

                  area.balloonText += balloonText2;
                } //buildProgressBaloon

                // //=======================================================================
                // //
                // //=======================================================================
                function getProgressText(progress, target) {
                  if(Array.isArray(target))target= target[0];
                  switch (progress) {
                    case 1:
                      return 'Moving away from ' + aichiTargetReadable(target) + ' (things are getting worse rather than better).';
                    case 2:
                      return 'No significant overall progress towards ' + aichiTargetReadable(target) + ' (overall, we are neither moving towards the ' + aichiTargetReadable(target) + ' nor moving away from it).';
                    case 3:
                      return 'Progress towards ' + aichiTargetReadable(target) + ' but at an insufficient rate (unless we increase our efforts the ' + aichiTargetReadable(target) + ' will not be met by its deadline).';
                    case 4:
                      return 'On track to achieve ' + aichiTargetReadable(target) + ' (if we continue on our current trajectory we expect to achieve the ' + aichiTargetReadable(target) + ' by 2020).';
                    case 5:
                      return 'On track to exceed ' + aichiTargetReadable(target) + ' (we expect to achieve the ' + aichiTargetReadable(target) + ' before its deadline).';
                  }
                } //getProgressText(progress, target)
                // //=======================================================================
                // //
                // //=======================================================================
                function aichiTargetReadable(target) {

                  if(typeof target === 'string')
                  return target.replace("-", " ").replace("-", " ").toLowerCase().replace(/\b./g, function(m) {
                    return m.toUpperCase();
                  });
                } //aichiTargetReadable
                //=======================================================================
                //
                //=======================================================================
                function getMapData() {
                    return $scope.mapData;
                }


                // //=======================================================================
                // //
                // //=======================================================================
                function getMapObject(id) {

                    var index = _.findIndex($scope.map.dataProvider.areas, function(area) {
                        if(id==='eur') return area.id === 'EU';

                        return area.id === id;
                    });
                    return $scope.map.dataProvider.areas[index];
                } //getMapObject

                this.closePopovers = closePopovers;
                this.getMapObject = getMapObject;
                this.getMapObject = getMapObject;
                this.writeMap = writeMap;
                this.getMapData = getMapData;
                this.generatePopover = generatePopover;
                this.generateMap = generateMap;
                this.progressColorMap = progressColorMap;
                this.updateCustomMarkers=updateCustomMarkers;
                this.isPopoverOpen=isPopoverOpen;
            }],
        }; // return
    }]); //app.directive('searchFilterCountries
}); // define