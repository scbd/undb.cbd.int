define(['text!./edit-organization.html', 'text!./undb-records-dialog.html','app', 'angular', 'lodash', 'authentication',
'utilities/editFormUtility',
'utilities/km-storage',
'utilities/workflows',
'utilities/user-settings',
'directives/file',
'directives/on-focus-helper',
'directives/controls/km-address',
'directives/controls/km-control-group',
'directives/controls/km-document-validation',
'directives/controls/km-form-languages',
'directives/controls/km-form-std-buttons',
'directives/controls/km-select',
'directives/controls/km-link',
'directives/controls/km-inputtext-ml',
'directives/controls/km-inputtext-list',
'directives/controls/scbd-tab',
'directives/controls/km-terms-check',
'providers/locale',
'directives/views/view-organization',
'utilities/guid'
], function(template,bbiRecordsDialog, app, angular, _) { 'use strict';

app.directive('editOrganization', ['$http',"$rootScope", "Enumerable", "$filter", "$q", "guid", "$location", "Thesaurus", 'authentication', 'editFormUtility',  'IStorage', '$route','$timeout','locale','userSettings','ngDialog','realm',  function ($http, $rootScope, Enumerable, $filter, $q, guid, $location, thesaurus, authentication, editFormUtility, storage, $route,$timeout,locale,userSettings,ngDialog,realm) {
	return {
		restrict   : 'E',
		template   : template,
		replace    : true,
		transclude : false,
		scope: {user:'='},
		link : function($scope,$element)
		{
			$scope.schema = 'organization';
			$scope.status   = "";
			$scope.error    = null;
			$scope.document = null;
			$scope.tab      = 'general';
			$scope.review   = { locale: "en" };
			$scope.options  = {
				allLanguages : allLanguages,
				languages     : function() { return $http.get("/api/v2013/thesaurus/domains/52AFC0EE-7A02-4EFA-9277-8B6C327CE21F/terms", { cache: true }).then(function(o){ return $filter('orderBy')(o.data, 'name'); }); },
				countries					: function() { return $http.get("/api/v2013/thesaurus/domains/countries/terms",            { cache: true }).then(function(o){ return $filter('orderBy')(o.data, 'name'); }); },
				organizationTypes			: function() { return $http.get("/api/v2013/thesaurus/domains/Organization%20Types/terms", { cache: true }).then(function(o){ return $filter('orderBy')(o.data, 'name'); }); },
				aichiTargets  : function() { return $http.get("/api/v2013/thesaurus/domains/AICHI-TARGETS/terms",                        { cache: true }).then(function(o){ return o.data; }); },
				absSubjects   : function() { return $http.get("/api/v2013/thesaurus/domains/CA9BBEA9-AAA7-4F2F-B3A3-7ED180DE1924/terms", { cache: true }).then(function(o){ return o.data; }); },
				bchSubjects   : function() { return $http.get("/api/v2013/thesaurus/domains/043C7F0D-2226-4E54-A56F-EE0B74CCC984/terms", { cache: true }).then(function(o){ return o.data; }); },
				bchRaSubjects : function() { return $http.get("/api/v2013/thesaurus/domains/69B43BB5-693B-4ED9-8FE0-95895E144142/terms", { cache: true }).then(function(o){ return o.data; }); },
				libraries			: function() { return $http.get("/api/v2013/thesaurus/domains/cbdLibraries/terms",         { cache: true }).then(function(o){ return o.data;});},

			   cbdSubjects     : function() { return $http.get("/api/v2013/thesaurus/domains/CBD-SUBJECTS/terms",                         { cache: true }).then(function(o){

			   	var subjects = ['CBD-SUBJECT-BIOMES', 'CBD-SUBJECT-CROSS-CUTTING','CBD-SUBJECT-CPB','CBD-SUBJECT-PART-INIT-COOP'];
			   	var items = [];

			   		_.forEach(subjects, function(subject) {
			   			var term = _.findWhere(o.data, {'identifier': subject } );

			   			items.push(term);

			   			_(term.narrowerTerms).forEach(function (term) {
			   				items.push(_.findWhere(o.data, {'identifier':term}));

			   			}).value();

			   		});
			   		return items;
			   	});
			   },
			   absKeyAreas : function () {return $http.get("/api/v2013/thesaurus/domains/2B2A5166-F949-4B1E-888F-A7976E76320B/terms", { cache: true }).then(function(o){return o.data;});}

			};

			$scope.$watch("document.websites", function() {
						if($scope.document && $scope.document.websites && _.find($scope.document.websites,{name:'website'}))
								$scope.website=_.find($scope.document.websites,{name:'website'}).url;

						if($scope.document && $scope.document.websites && _.find($scope.document.websites,{name:'facebook'}))
								$scope.facebook=_.find($scope.document.websites,{name:'facebook'}).url;

						if($scope.document && $scope.document.websites && _.find($scope.document.websites,{name:'youtube'}))
								$scope.youtube=_.find($scope.document.websites,{name:'youtube'}).url;

						if($scope.document && $scope.document.websites && _.find($scope.document.websites,{name:'twitter'}))
								$scope.twitter=_.find($scope.document.websites,{name:'twitter'}).url;
			});

			$scope.patterns = {
					facebook : /^http[s]?:\/\/(www.)?facebook.com\/.+/i,
					twitter  : /^http[s]?:\/\/twitter.com\/.+/i,
					youtube  : /^http[s]?:\/\/(www.)?youtube.com\/\w+\/.+/i,
			};

			// userSettings.ready.then(bbiRecords);
			//============================================================
			//
			//
			//============================================================
			// function bbiRecords() {
			// 		if(typeof userSettings.setting('bbi.recordsNotice') ==='undefined' || !userSettings.setting('bbi.recordsNotice')){
			// 				$scope.bbiRecordsNotice=false;
			// 				ngDialog.open({
			// 							template: bbiRecordsDialog,
			// 							className: 'ngdialog-theme-default',
			// 							closeByDocument: false,
			// 							plain: true,
			// 							scope:$scope
			// 				});
			// 		}
			// }
			//
			// //============================================================
			// //
			// //
			// //============================================================
			// function bbiRecordsNoticeChange(value) {
			// 		userSettings.setting('bbi.recordsNotice',value);
			// }//bbiRecordsNoticeChange
			// $scope.bbiRecordsNoticeChange=bbiRecordsNoticeChange;

			//============================================================
			//
			//
			//============================================================
			function  allLanguages() {
				return $q.all([
				$http.get("/api/v2013/thesaurus/domains/ISO639-2/terms",   { cache: true })
				]).then(function(o) {
				var data = $filter("orderBy")(o[0].data, "name");

				return  data;
				});
			}



			//============================================================
			//
			//============================================================
			$scope.nextTab = function() {
				var next = 'review';


				if($scope.tab=='general') 	{ next = 'detail';}
				if($scope.tab=='detail')	  { next = 'social';   }
				if($scope.tab=='social')    { next = 'chm';   }
				if($scope.tab=='chm' && $scope.isAbs($scope.document)	) { next = 'absch'; }
				if($scope.tab=='chm' && $scope.isBCH($scope.document)	&& !$scope.isAbs($scope.document)) { next = 'bch'; }
				if($scope.tab=='chm' && !$scope.isBCH($scope.document)	&& !$scope.isAbs($scope.document)) { next = 'members'; }
				if($scope.tab=='absch'	) { next = 'members'; }
				if($scope.tab=='absch' && $scope.isBCH($scope.document)	) { next = 'bch'; }
				if($scope.tab=='bch') 			{ next = 'members';   }
				if($scope.tab=='members'	) { next = 'review';$scope.validate();}

				$scope.tab = next;
			};

			//============================================================
			//
			//============================================================
			$scope.prevTab = function() {
				var prev;

				if($scope.tab=='review' ) { prev = 'members';}
				if($scope.tab=='members'&& $scope.isBCH($scope.document)) { prev = 'bch';  }
				if($scope.tab=='members'&& !$scope.isBCH($scope.document) && $scope.isAbs($scope.document)	) { prev = 'absch';  }
				if($scope.tab=='members'&& !$scope.isBCH($scope.document) && !$scope.isAbs($scope.document)	) { prev = 'chm';  }
				if($scope.tab=='bch'	&& $scope.isAbs($scope.document)) { prev = 'absch';  }
				if($scope.tab=='bch'	&& !$scope.isAbs($scope.document)) { prev = 'chm';  }
				if($scope.tab=='absch'	) { prev = 'chm'; 	 }
				if($scope.tab=='chm'	) { prev = 'social';}
				if($scope.tab=='social'	) { prev = 'detail';}
				if($scope.tab=='detail'	) { prev = 'general';}
				 $scope.tab = prev;
			};

			//============================================================
			//
			//============================================================
			$scope.updateWebsites = function(name,value) {
				if(!$scope.document.websites) $scope.document.websites =[];
				var site = _.find($scope.document.websites,{'name':name});
				if(site)
						if(value)
							site.url=value;
						else
							delete($scope.document.websites[_.findIndex($scope.document.websites,{'name':name})]);

				else
					 $scope.document.websites.push({name:name,url:value,type:'link'});
				if(name==='website'){
					$timeout(function(){$scope.updateProfileLink(name,value)});
				}
				$scope.document.websites=_.compact($scope.document.websites);

			};
			//============================================================
			//
			//============================================================
			$scope.updateProfileLink = function(name,value) {
				if(!$scope.document.profileLink) $scope.document.profileLink =[];
				var site = _.find($scope.document.profileLink,{'name':name});

				if(site)
						if(value)
							site.url=value;
						else
							delete($scope.document.profileLink[_.findIndex($scope.document.profileLink,{'name':name})]);

				else
					 $scope.document.profileLink.push({name:name,url:value,type:'link'});
				$scope.document.profileLink=_.compact($scope.document.profileLink);
				if(!value) delete($scope.document.profileLink)
			};
			//============================================================
			//
			//============================================================
			$scope.logoUpload = function(name,value) {

				if(!$scope.document.relevantDocuments) $scope.document.relevantDocuments =[];
				var site = _.find($scope.document.relevantDocuments,{'name':name});
				if(site)
						if(value)
							site.url=value;
						else
							delete($scope.document.relevantDocuments[_.findIndex($scope.document.relevantDocuments,{'name':name})]);

				else
					 $scope.document.relevantDocuments.push({name:name,url:value,type:'link'});
				$scope.document.relevantDocuments=_.compact($scope.document.relevantDocuments);
			};

			$scope.placesSearch =function(){
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
			};

			//==============================
			//
			//
			//==============================
			$scope.upload = function(files) {

					if(!files[0])
							return;

					delete $scope.errors;
					$scope.saving = true;

					$q.when(files[0]).then(function(file) {

							if(!/^image\//.test(file.type)) throw { code : "invalidImageType" };
							if(file.size>1024*500)          throw { code : "fileSize" };

							var uid  = $scope.document.header.identifier;
							var url  = '/api/v2013/documents/'+uid+'/attachments/'+encodeURIComponent(file.name);

							return $http.put(url, file, { headers : { "Content-Type": file.type } }).then(res_Data);

					}).then(function(attachInfo) {

							$scope.logo  = '/api/v2013/documents/'+attachInfo.documentUID+'/attachments/'+encodeURIComponent(attachInfo.filename);
							$scope.logoUpload('logo',$scope.logo  );
					}).catch(res_Error).finally(function() {

							delete $scope.saving;

					});
			}

			//==============================
			//
			//
			//==============================
			function res_Data(res) {
					return res.data;
			}

			//==============================
			//
			//
			//==============================
			function res_Error(err) {

					err = err.data || err;
					$scope.$emit('showError', 'ERROR: Actor was not saved.');
					$scope.errors = err.errors || [err];

					console.error($scope.errors);
			}

			//==============================
			//
			//
			//==============================
			$scope.clearSlacesSearch =function(){
					 $scope.selectedPlace='';
					 $scope.placeSearch='';
					 $scope.noPredictions=false;
					 delete($scope.document.name);
					 delete($scope.document.address);
					 delete($scope.document.city);
					 delete($scope.document.state);
				   delete($scope.document.country);
				   delete($scope.document.phones);
				   delete($scope.document.websites);
				   delete($scope.document.phones);
				   delete($scope.document.postalCode);
			};
			$scope.newOrg =function(){
				   $scope.clearSlacesSearch();
					 $scope.isNewOrg=true;
			};

			//============================================================
			//
			//============================================================
			$scope.initMap = function() {


				$timeout(function(){
	         var input = document.getElementById('pac-input');
	         var searchBox = new google.maps.places.Autocomplete(input);

					 searchBox.setTypes([]);
//searchBox.setTypes(['address']);

					 searchBox.addListener('place_changed', function() {
						 $timeout(function(){

							 $scope.selectedPlace = searchBox.getPlace();

								loadGoogleData ();
								$timeout(function(){
									$scope.validate();
								});


						 });

	         });
				},100);

			};

			//==================================
			//
			//==================================
			function loadGoogleData (){

				$scope.document.name=	{};
				$scope.document.name[locale]=	$scope.selectedPlace.name;
				$scope.document.establishmentGooglePlaceId=$scope.selectedPlace.place_id;
				$scope.document.address				=	formatGoogleAddress($scope.selectedPlace.address_components);
				$scope.document.city					={};
		    $scope.document.city[locale]	=	getAddressCompnent($scope.selectedPlace.address_components,'locality'); // city
				$scope.document.state					={};
				$scope.document.state[locale]	=	getAddressCompnent($scope.selectedPlace.address_components,'administrative_area_level_1'); //state

				var country = getAddressCompnent($scope.selectedPlace.address_components,'country','short_name').toLowerCase();

			  $scope.document.country 			=	{identifier:country};
				$scope.document.postalCode		={};
				$scope.document.postalCode[locale] =	getAddressCompnent($scope.selectedPlace.address_components,'postal_code');
        $scope.document.phones				=[];
				$scope.document.phones.push($scope.selectedPlace.international_phone_number);
				$scope.mapsUrl=$scope.selectedPlace.url;
				$scope.updateWebsites('Google Maps',$scope.selectedPlace.url);

				if($scope.selectedPlace.website)
				$scope.updateWebsites('website',$scope.selectedPlace.website);
				$scope.document.coordinates={};
				$scope.document.coordinates.lat=$scope.selectedPlace.geometry.location.lat();
				$scope.document.coordinates.lng=$scope.selectedPlace.geometry.location.lng();
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
			//==================================
			//
			//==================================
			$scope.IsCapacityBuilding = function(document) {
				document = document || $scope.document;

				if (!document || !document.purpose)
					return false;

				var purposes = _.map(document.purpose, 'identifier');

				return _.includes(purposes, 'A5C5ADE8-2061-4AB8-8E2D-1E6CFF5DD793') || // Assessing capacity-building needs
					   _.includes(purposes, '3813BA1A-2DE7-4DD5-8415-3B2C6737E567') || // Designing capacity building initiatives
					   _.includes(purposes, '5054AC52-E738-4694-A403-6490FE7D4CF4') || // Monitoring and evaluation of capacity-building initiatives and products
					   _.includes(purposes, '05FA6F66-F942-4713-BB4C-DA032C111188') || // Providing technical guidance
					   _.includes(purposes, '9F48AEA0-EE28-4B6F-AB91-E0E088A8C6B7') || // Raising awareness
					   _.includes(purposes, '5831C357-95CA-4F09-963B-DF9E8AFD8C88');   // Training/learning
			};

			//==================================
			//
			//==================================
			$scope.isAbs = function(document) {

				document = document || $scope.document;

				if (!document || !document.aichiTargets && !document.thematicAreas)
					return false;

				var targets = _.map(document.aichiTargets, 'identifier');
				var subjects = _.map(document.thematicAreas, 'identifier');
				return _.includes(targets, 'AICHI-TARGET-16') || _.includes(subjects, 'CBD-SUBJECT-ABS') ;
			};
			//==================================
			//
			//==================================
			$scope.isBCH = function(document) {

				document = document || $scope.document;

				if (!document || !document.thematicAreas)
					return false;

				var subjects = _.map(document.thematicAreas, 'identifier');
				return _.includes(subjects, 'CBD-SUBJECT-CPB') ;
			};
			//==================================
			//
			//==================================
			$scope.IsBchRa = function(document) {
				document = document || $scope.document;

				if (!document || !document.bchSubjects)
					return false;

				var qLibraries = Enumerable.from(document.bchSubjects);

				return qLibraries.any(function(o) {
					return o.identifier == "FBAF958B-14BF-45DD-BC6D-D34A9953BCEF"  || //Risk assessment
					       o.identifier == "6F28D3FB-7CCE-4FD0-8C29-FB0306C52BD0";    //Risk assessment and risk management
				});
			};

			//==================================
			//
			//==================================
			$scope.isLoading = function() {
				return $scope.status=="loading";
			};

			//==================================
			//
			//==================================
			$scope.hasError = function() {
				return !!$scope.error;
			};

			//==================================
			//
			//==================================
			$scope.userGovernment = function() {
				return $scope.user.government;
			};

			//==================================
			//
			//==================================
			$scope.init = function() {
				$scope.initMap();
				if ($scope.document)
					return;

				$scope.status = "loading";

				var identifier = $route.current.params.id;
				var promise = null;

				if(identifier && identifier!=='new'){
					$scope.editExisting = true;
					promise = editFormUtility.load(identifier, "organization");
				}
				else
					promise = $q.when({
						header: {
							identifier: guid(),
							schema   : "organization",
							languages: ["en"]
						},
						libraries : [{"identifier":"cbdLibrary:chm"}]
					});


				promise.then(
					function(doc) {

						$scope.status = "ready";
						$scope.document = doc;
						if($scope.document && $scope.document.websites && _.find($scope.document.websites,{name:'Google Maps'}))
							$scope.mapsUrl=_.find($scope.document.websites,{name:'Google Maps'}).url;
						if($scope.document && $scope.document.relevantDocuments && _.find($scope.document.relevantDocuments,{name:'logo'}))
							$scope.logo=_.find($scope.document.relevantDocuments,{name:'logo'}).url;
					}).then(null,
					function(err) {
						$scope.onError(err.data, err.status);
						throw err;
					});
			};

			//==================================
			//
			//==================================
			$scope.onPreSaveDraft = function() {
				return $scope.cleanUp();
			};

			//==================================
			//
			//==================================
			$scope.onPrePublish = function() {
				return $scope.validate(false).then(function(hasError) {
					if (hasError)
						$scope.tab = "review";
					return hasError;
				});
			};
			//==================================
			//
			//==================================
			$scope.onPostWorkflow = function() {
				$rootScope.$broadcast("onPostWorkflow", "Publishing request sent successfully.");
				gotoManager();
				$location.search('index-view','workflow');
			};

			//==================================
			//
			//==================================
			$scope.onPostPublish = function() {
				$rootScope.$broadcast("onPostPublish", "Record is being published, please note the publishing process could take up to 1 minute before your record appears.");
				gotoManager();
				$location.search('index-view','public');
			};

			//==================================
			//
			//==================================
			$scope.onPostSaveDraft = function(pass) {

				$rootScope.$broadcast("onSaveDraft", "Draft record saved.");
			};

			//==================================
			//
			//==================================
			$scope.onPostClose = function() {
				$rootScope.$broadcast("onPostClose", "Record closed.");
				gotoManager();
			};
			//==================================
			//
			//==================================
			function gotoManager() {
				$scope.$emit('showInfo', 'Organization successfully updated.');
				$location.path("dashboard/submit/"+$scope.schema);
				$location.search('index-update',$scope.document.header.identifier);

			}
      function getCustomConfig(document){
        if(document && document.header && document.header.schema == 'organization'){
          return editFormUtility.getRealm(document.header.identifier)
                    .then(function(realm){
                      if(realm && realm.trim()!=''){
                        return {headers: {realm:realm}}
                      }
                    });
        }

        return $q.when(null);
      }
      $scope.getCustomConfig = getCustomConfig
			//==================================
			//
			//==================================
			$scope.cleanUp = function(document) {
				document = document || $scope.document;

				if (!document)
				return $q.when(true);

				_.each(document,function(property,name){
						if(_.isEmpty(document[name])) delete(document[name]);
				});
				if(!$scope.IsCapacityBuilding()){
					document.targetGroups    = undefined;
					document.expertiseLevels = undefined;
				}

				if(!$scope.IsCapacityBuilding() && !$scope.isAbs())
					document.absKeyAreas     = undefined;

				if (/^\s*$/g.test(document.notes))
					document.notes = undefined;

				// if (document.coordinates && document.coordinates.lat && document.coordinates.lng)
				// 	delete(document.coordinates);
				return $q.when(false);
			};

			//==================================
			//
			//==================================
			$scope.validate = function(clone) {
        var frontEndValidationReport = generateValidationReport();
				$scope.validationReport = null;

				var oDocument = $scope.document;
				if (clone !== false)
					oDocument = angular.fromJson(angular.toJson(oDocument));

				return $scope.cleanUp(oDocument).then(function(cleanUpError) {
					return storage.documents.validate(oDocument).then(
						function(success) {
							$scope.validationReport = success.data;

							if($scope.validationReport.errors && Array.isArray($scope.validationReport.errors) && $scope.validationReport.errors.length){

								_.each(frontEndValidationReport.errors,function(err){
											if(!_.find($scope.validationReport.errors,{property:err.property,code:err.code}))
												$scope.validationReport.errors.push(err);
								});
							}else{
								$scope.validationReport.errors=[];
								_.each(frontEndValidationReport.errors,function(err){
												$scope.validationReport.errors.push(err);
								});
							}

							return cleanUpError || !!(success.data && success.data.errors && success.data.errors.length);
						},
						function(error) {
							$scope.onError(error.data);
							return true;
						}
					);
				});
			};

			//=======================================================================
			//
			//=======================================================================
		function generateValidationReport () {
					$scope.editForm.$submitted = true;
					var report;
					if($scope.editForm.$error && $scope.editForm.$error.required && $scope.editForm.$error.required.length){
							report = {};
							report.errors=[];

							for(var i=0; i<$scope.editForm.$error.required.length;i++)
								if($scope.editForm.$error.required[i].$name!=='linkForm' && $scope.editForm.$error.required[i].$name)
										report.errors.push({code:'Error.Mandatory',property:$scope.editForm.$error.required[i].$name});

					}
				return report;

			};
			//==================================
			//
			//==================================
			$scope.isFieldValid = function(field) {
				if (field && $scope.validationReport && $scope.validationReport.errors)
					return !Enumerable.from($scope.validationReport.errors).any(function(x){return x.property==field;});

				return true;
			};

			//==================================
			//
			//==================================
			$scope.onError = function(error, status)
			{
				$scope.status = "error";

				if (status == "notAuthorized") {
					$scope.status = "hidden";
					$scope.error  = "You are not authorized to modify this record";
				}
				else if (status == 404) {
					$scope.status = "hidden";
					$scope.error  = "Record not found.";
				}
				else if (status == "badSchema") {
					$scope.status = "hidden";
					$scope.error  = "Record type is invalid.";
				}
				else if (error.Message)
					$scope.error = error.Message;
				else
					$scope.error = error;
			};


			$scope.init();
		}
	};
}]);
});
