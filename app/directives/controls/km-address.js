define(['app', 'text!./km-address.html','lodash', 'directives/controls/km-inputtext-ml','directives/controls/km-select'], function(app, template, _) { 'use strict';

	app.directive('kmAddress', ['$timeout','locale','$http','$filter',function ($timeout,locale,$http,$filter)
	{
		return {
			restrict: 'E',
			template : template,
			replace: true,
			transclude: true,
			scope: {
				placeholder: '@',
		        ngDisabledFn: '&ngDisabled',
		        binding: '=ngModel',
		        locales: '=',
		        required: "@",
		        ngChange: "&",
			    validate: "&",
				validationReport:"=",
				form:"="
			},
			link: function ($scope, $element,$attr)//, $element, $attr
			{

						initGoogleAutoComplete();

						if($attr.embed) $scope.embed=$attr.embed;

						$scope.options={
								countries	: function() { return $http.get("/api/v2013/thesaurus/domains/countries/terms",            { cache: true }).then(function(o){ return $filter('orderBy')(o.data, 'name'); }); },
						};
						$scope.useGoogle=false;
						var killWatch = $scope.$watch("binding", function() {

								if(!$scope.binding) return;

								if($scope.binding && $scope.binding.websites && _.find($scope.binding.websites,{name:'Google Maps'}) && $attr.embed ==='organization')
									$scope.mapsUrl=_.find($scope.binding.websites,{name:'Google Maps'}).url;
								killWatch();

								if($scope.binding.websites && $scope.embed!=='organization') delete($scope.binding.websites);
								if(!isEmpty())$scope.useGoogle=false;
								 else clearSlacesSearch ();
						});
						//
						$scope.$watch("binding.websites", function() {
									if($scope.binding && $scope.binding.websites && _.find($scope.binding.websites,{name:'Google Maps'} && $attr.embed ==='organization'))
											$scope.mapsUrl=_.find($scope.binding.websites,{name:'Google Maps'}).url
						});

						//============================================================
						//
						//============================================================
						 function initGoogleAutoComplete() {
							$timeout(function(){
				         var input = document.getElementById('google-ac-input');
								 if(!input)return;

				         var searchBox = new google.maps.places.Autocomplete(input);  // jshint ignore:line

								 searchBox.setTypes([]);
								 searchBox.addListener('place_changed', function() {
									 $timeout(function(){
										  var selectedPlace = searchBox.getPlace();
											loadGoogleData (selectedPlace );
											$timeout(function(){
												$scope.validate();
											});
									 });
				         		});


							},100);
						}  //initMap
//ng-change="placesSearch()"
function placesSearch() {
	if(!$scope.placeSearch || $scope.placeSearch===' '){
		  $scope.clearSlacesSearch();
		   return;
		 }
	  var service = new google.maps.places.AutocompleteService();
		service.getQueryPredictions({input:$scope.placeSearch},function(predictions, status) {
			if (status != google.maps.places.PlacesServiceStatus.OK)
			   $timeout(function(){$scope.noPredictions = true})
			 else
						   $timeout(function(){$scope.noPredictions = false;});
				   }
		);
}
$scope.placesSearch = placesSearch;

						//==================================
						//
						//==================================
						function loadGoogleData (selectedPlace ){

							if(!$scope.binding)$scope.binding={};
							$scope.binding.address				=	formatGoogleAddress(selectedPlace.address_components);
							$scope.binding.city						={};
							$scope.binding.city[locale]		=	getAddressCompnent(selectedPlace.address_components,'locality'); // city
							$scope.binding.state					={};
							$scope.binding.state[locale]	=	getAddressCompnent(selectedPlace.address_components,'administrative_area_level_1'); //state

							var country = getAddressCompnent(selectedPlace.address_components,'country','short_name').toLowerCase();

							$scope.binding.country 			=	{identifier:country};
							$scope.binding.postalCode		= {};
							$scope.binding.postalCode[locale] =	getAddressCompnent(selectedPlace.address_components,'postal_code');

							if($attr.embed ==='event'){
									$scope.binding.googleMapsUrl = selectedPlace.url;
									$scope.binding.googlePlaceId = selectedPlace.place_id;
									$scope.binding.geoLocation={};
									$scope.binding.geoLocation.lat=selectedPlace.geometry.location.lat();
									$scope.binding.geoLocation.lng=selectedPlace.geometry.location.lng();
						  }

							if($attr.embed ==='organization'){
								  $scope.binding.establishmentGooglePlaceId= selectedPlace.place_id;
									//$scope.binding.phones				=[];
									//$scope.binding.phones.push(selectedPlace.international_phone_number);

									$scope.mapsUrl=selectedPlace.url;
									if(selectedPlace.url)
									updateWebsites('Google Maps',selectedPlace.url);

									if(selectedPlace.website)
									updateWebsites('website',selectedPlace.website);

									$scope.binding.coordinates={};
									$scope.binding.coordinates.lat=selectedPlace.geometry.location.lat();
									$scope.binding.coordinates.lng=selectedPlace.geometry.location.lng();
							}
						}

						//==================================
						//
						//==================================
						function formatGoogleAddress(addressComponents){

							var formatedAddress = {};
							formatedAddress[locale]='';

							if(getAddressCompnent(addressComponents,'street_number'))
									formatedAddress[locale]+=	getAddressCompnent(addressComponents,'street_number')+', ';

							if(getAddressCompnent(addressComponents,'route'))
									formatedAddress[locale]+=	getAddressCompnent(addressComponents,'route')+', ';

							if(getAddressCompnent(addressComponents,'neighborhood'))
									formatedAddress[locale]+=	getAddressCompnent(addressComponents,'neighborhood')+', ';

							if(getAddressCompnent(addressComponents,'administrative_area_level_2'))
									formatedAddress[locale]+=	getAddressCompnent(addressComponents,'administrative_area_level_2')+', ';

							if(getAddressCompnent(addressComponents,'subpremise'))
									formatedAddress[locale]+=	getAddressCompnent(addressComponents,'subpremise')+', ';

							formatedAddress[locale]=formatedAddress[locale].slice(0,formatedAddress[locale].length-2);

							return formatedAddress;

						}

						//==================================
						//
						//==================================
						function isEmpty(){

							if($scope.binding && (($scope.embed==='event' && $scope.binding.googlePlaceId) || ($scope.embed==='organization' && $scope.binding.establishmentGooglePlaceId))){

								return false;
							}else {

								return true;
							}
						}
						$scope.isEmpty = isEmpty;

						//==================================
						//
						//==================================
						function getAddressCompnent(addressComponents,type,length){

							var returnVal = '';
							if(!length) length='long_name';
							else length='short_name';
							_.each(addressComponents,function(comp){
										if(comp.types.indexOf(type)>-1)
											returnVal = comp[length];
							});
							return returnVal;
						}
						//
						//============================================================
						//
						//============================================================
						function updateWebsites (name,value) {
								if(!$scope.binding.websites) $scope.binding.websites =[];
								var site = _.find($scope.binding.websites,{'name':name});

								if(site)
										if(value)
											site.url=value;
										else
											delete($scope.binding.websites[_.findIndex($scope.binding.websites,{'name':name})]);

								else
									 $scope.binding.websites.push({name:name,url:value,type:'link'});

								if(name==='website'){
									$scope.website=value;
									if(!$scope.binding.profileLink || !Array.isArray($scope.binding.profileLink ))
									$scope.binding.profileLink =[];
									$scope.binding.profileLink.push({name:name,url:value,type:'link'});
								}
								$scope.binding.websites=_.compact($scope.binding.websites);
						}
						$scope.updateWebsites=updateWebsites;

						//==============================
						//
						//
						//==============================
						function clearSlacesSearch (){
								 $scope.selectedPlace='';
								 $scope.placeSearch='';
								 $scope.noPredictions=false;
								 if(!$scope.binding)$scope.binding={};
								 delete($scope.binding.address);
								 delete($scope.binding.city);
								 delete($scope.binding.state);
								 delete($scope.binding.country);
								 delete($scope.binding.phones);
								 delete($scope.binding.websites);
								 delete($scope.binding.phones);
								 delete($scope.binding.postalCode);
								 delete($scope.binding.coordinates);
								 delete($scope.binding.coordinates);
								 delete($scope.binding.googlePlaceId);
								 delete($scope.mapsUrl);
								//  if($scope.binding && $scope.binding.websites && _.find($scope.binding.websites,{name:'Google Maps'}))
								// 	 $scope.binding.websites.slice(_.find($scope.binding.websites,{name:'Google Maps'}));
						}
						$scope.clearSlacesSearch=clearSlacesSearch;
			},
			// controller: function ($scope)
			// {
			//
			// }
		};
	}]);
});

