define(['text!./edit-event.html', 'text!./undb-records-dialog.html','app', 'angular', 'lodash', 'moment-timezone','authentication',
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
'directives/controls/km-yes-no',
'directives/controls/scbd-tab',
'directives/controls/km-terms-check',
'providers/locale',
'directives/views/view-event',
'directives/bootstrap-date-time-picker',
'filters/moment'

], function(template,bbiRecordsDialog, app, angular, _,moment) { 'use strict';

app.directive('editEvent', ['$http',"$rootScope", "Enumerable", "$filter", "$q", "guid", "$location", "Thesaurus", 'authentication', 'editFormUtility',  'IStorage', '$route','$timeout','locale','userSettings','ngDialog', function ($http, $rootScope, Enumerable, $filter, $q, guid, $location, thesaurus, authentication, editFormUtility, storage, $route,$timeout,locale,userSettings,ngDialog) {
	return {
		restrict   : 'E',
		template   : template,
		replace    : true,
		transclude : false,
		scope: {user:'='},
		link : function($scope)
		{

			$scope.schema = 'event';
			$scope.status   = "";
			$scope.error    = null;
			$scope.document = null;
			$scope.tab      = 'hosts';
			$scope.review   = { locale: "en" };
			$scope.patterns = {
					facebook : /^http[s]?:\/\/(www.)?facebook.com\/.+/i,
					twitter  : /^http[s]?:\/\/twitter.com\/.+/i,
					youtube  : /^http[s]?:\/\/(www.)?youtube.com\/\w+\/.+/i,
					phone    : /^\+\d+(\d|\s|ext|[\.,\-#*()]|)+$/i,
					date     : /^\d{4}-\d{1,2}-\d{1,2}$/,
					time     : /^([0-1][0-9]|2[0-3]|[0-9]):[0-5][0-9]$/
			};
			$scope.duration={};
			$scope.options  = {
				countries					: function() { return $http.get("/api/v2013/thesaurus/domains/countries/terms",            { cache: true }).then(function(o){ return $filter('orderBy')(o.data, 'name'); }); },
				aichiTargets  : function() { return $http.get("/api/v2013/thesaurus/domains/AICHI-TARGETS/terms",                        { cache: true }).then(function(o){ return o.data; }); },
        eventTypes: function(){ return $http.get("/api/v2013/thesaurus/domains/CBD-EVENT-TYPES/terms",{ cache: true }).then(function(o){ return o.data; }); },
			   cbdSubjects     : function() { return $http.get("/api/v2013/thesaurus/domains/CBD-SUBJECTS/terms",                         { cache: true }).then(function(o){

			   	var subjects = ['CBD-SUBJECT-BIOMES', 'CBD-SUBJECT-CROSS-CUTTING','CBD-SUBJECT-CPB','CBD-SUBJECT-OUT+CEPA'];
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
			   }
			};

			$scope.$watch("document.isIdb", function() {
				if($scope.document && $scope.document.isIdb)
				{

						$timeout(function(){

									if(!$scope.document || !$scope.document.thematicAreas)$scope.document.thematicAreas=[];
									var tempArr = _.clone($scope.document.thematicAreas);
									tempArr.push({"identifier": "CBD-SUBJECT-OUT+CEPA"});
									tempArr.push({"identifier": "CBD-SUBJECT-IBD"});
									tempArr.push({ "identifier": "CBD-SUBJECT-UNDB"});
									$scope.document.thematicAreas=tempArr;

									if(!$scope.document || !$scope.document.aichiTargets)$scope.document.aichiTargets=[];
									tempArr=_.clone($scope.document.aichiTargets);
									tempArr.push({"identifier": "AICHI-TARGET-01"});
									$scope.document.aichiTargets=tempArr;
						});
				}else if($scope.document && $scope.document.isIdb===false){
					if(!$scope.document || !$scope.document.thematicAreas && !$scope.document.aichiTargets) return;
					 var tempArr = _.clone($scope.document.thematicAreas);
					 var i =_.findIndex(tempArr,{"identifier": "CBD-SUBJECT-OUT+CEPA"});
					 if(i>=0)
					 		tempArr.splice(i,1);
					 i=-1;
					 i = _.findIndex(tempArr,{"identifier": "CBD-SUBJECT-IBD"});
					 if(i>=0)
							tempArr.splice(i,1);
					 i=-1;
					 i = _.findIndex(tempArr,{"identifier": "CBD-SUBJECT-UNDB"});
					 if(i>=0)
							tempArr.splice(i,1);
					 i=-1;
					 $scope.document.thematicAreas = tempArr;
					 if(!$scope.document || !$scope.document.aichiTargets) return;
					 tempArr = _.clone($scope.document.aichiTargets);
					 i = _.findIndex(tempArr,{"identifier": "AICHI-TARGET-01"});
					 if(i>=0)
							tempArr.splice(i,1);

						$scope.document.aichiTargets=tempArr;

				}

			});
			$scope.$watch("document.organizations", function() {
				if($scope.document && $scope.document.organizations)
					defaultGovernments();
			},true);
			$scope.$watch("document.contactOrganization", function() {
					if($scope.document && $scope.document.contactOrganization){
							if(!$scope.document.organizations)$scope.document.organizations=[];
							if(!_.find($scope.document.organizations,$scope.document.contactOrganization))
								$scope.document.organizations.push($scope.document.contactOrganization);
					}
			},true);

			$scope.$watch("document.everyCountry", function() {
				if($scope.document && $scope.document.onlineEvent)
					$timeout(updateGlobalEvent);
			});

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
			// //============================================================
			// //
			// //
			// //============================================================
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

			//============================================================
			//
			//
			//============================================================
			// function bbiRecordsNoticeChange(value) {
			// 		userSettings.setting('bbi.recordsNotice',value);
			// }//bbiRecordsNoticeChange
			// $scope.bbiRecordsNoticeChange=bbiRecordsNoticeChange;
			//============================================================
			//
			//============================================================
			$scope.isAdmin= function() {
					 return !!_.intersection($scope.user.roles, ["Administrator","UNDBPublishingAuthority","undb-administrator"]).length;
			};

			//============================================================
			//
			//============================================================
			$scope.showIdb = function() {
				var thisYear = moment().year();

				if(moment().isBefore(thisYear+'-05-17') && moment().isAfter(thisYear+'-03-16'))
					return true;
				else
					return false;
			};

			//============================================================
			//
			//============================================================
			$scope.nextTab = function() {
				var next = 'review';


				if($scope.tab=='hosts') 	{ next = 'detail';}
				if($scope.tab=='detail')	  { next = 'duration';   }
				if($scope.tab=='duration')    { next = 'location';   }
				if($scope.tab=='location')    { next = 'social';   }
				if($scope.tab=='social')    { next = 'chm';   }
				if($scope.tab=='chm' ) { next = 'review';$scope.validate(); }

				$scope.tab = next;
			};

			//============================================================
			//
			//============================================================
			$scope.prevTab = function() {
				var prev;

				if($scope.tab=='review' 	) { prev = 'chm';}
				if($scope.tab=='chm'		) { prev = 'social'; 	 }
				if($scope.tab=='social'		) { prev = 'location';}
				if($scope.tab=='location'	) { prev = 'duration';}
				if($scope.tab=='duration'	) { prev = 'detail';}
				if($scope.tab=='detail'		) { prev = 'hosts';}
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

				$scope.document.websites=_.compact($scope.document.websites);
			};

			//============================================================
			//
			//============================================================
			$scope.coverUpload = function(name,value) {

				if(!$scope.document.images) $scope.document.images =[];
				var site = _.find($scope.document.images,{'name':name});
				if(site)
						if(value)
							site.url=value;
						else
							delete($scope.document.images[_.findIndex($scope.document.images,{'name':name})]);

				else
					 $scope.document.images.push({name:name,url:value,type:'link'});
				$scope.document.images=_.compact($scope.document.images);
			};

			$scope.placesSearch =function(){
				   if(!$scope.placeSearch || $scope.placeSearch===' '){
						 $scope.clearSlacesSearch();
						  return;
						}
					 var service = new google.maps.places.AutocompleteService();
					 service.getQueryPredictions({input:$scope.placeSearch},function(predictions, status) {
				         if (status != google.maps.places.PlacesServiceStatus.OK)
				            $timeout(function(){$scope.noPredictions = true;});
				          else
										$timeout(function(){$scope.noPredictions = false;});
								}
					 );
			};

			//==============================
			//
			//
			//==============================
			$scope.upload = function(files,cover) {

					if(!files[0])
							return;

					delete $scope.errors;
					$scope.saving = true;

					$q.when(files[0]).then(function(file) {

							if(!/^image\//.test(file.type)) throw { code : "invalidImageType" };
							if(file.size>1024*800)          throw { code : "fileSize" };

							var uid  = $scope.document.header.identifier;
							var url  = '/api/v2013/documents/'+uid+'/attachments/'+encodeURIComponent(file.name);

							return $http.put(url, file, { headers : { "Content-Type": file.type } }).then(res_Data);

					}).then(function(attachInfo) {
						if(!cover)
							$scope.document.logo  = '/api/v2013/documents/'+attachInfo.documentUID+'/attachments/'+encodeURIComponent(attachInfo.filename);
						else{
							$scope.cover = '/api/v2013/documents/'+attachInfo.documentUID+'/attachments/'+encodeURIComponent(attachInfo.filename);
							$scope.coverUpload('cover',$scope.cover)
						}
					}).catch(res_Error).finally(function() {

							delete $scope.saving;

					});
			};

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
			$scope.init = function() {

				if ($scope.document)
					return;

				$scope.status = "loading";

				var identifier = $route.current.params.id;
				var promise = null;

				if(identifier && identifier!=='new'){
					$scope.editExisting = true;
					promise = editFormUtility.load(identifier, "event");
				}
				else
					promise = $q.when({
						header: {
							identifier: guid(),
							schema   : "event",
							languages: ["en"]
						},

					});

				promise.then(
					function(doc) {

						$scope.status = "ready";
						$scope.document = doc;
						if(doc.governments && doc.governments.length===198)
							$scope.document.everyCountry=true;

						if(!doc.type)doc.type=[{"identifier": "60C32FAE-649C-4D33-B0E6-DDE1F8B06C55"}];

						if($scope.document && $scope.document.images && _.find($scope.document.images,{name:'cover'}))
							$scope.cover=_.find($scope.document.images,{name:'cover'}).url;
						// if($scope.document && $scope.document.websites && _.find($scope.document.websites,{name:'Google Maps'}))
						// 	$scope.mapsUrl=_.find($scope.document.websites,{name:'Google Maps'}).url;
						// if($scope.document && $scope.document.relevantDocuments && _.find($scope.document.relevantDocuments,{name:'logo'}))
						// 	$scope.logo=_.find($scope.document.relevantDocuments,{name:'logo'}).url;
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
			$scope.onPostSaveDraft = function() {

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
				$scope.$emit('showInfo', 'Record successfully updated.');
				$location.path("dashboard/submit/"+$scope.schema);
				$location.search('index-update',$scope.document.header.identifier);

			}

			//==================================
			//
			//==================================
			$scope.cleanUp = function(document) {
				document = document || $scope.document;

				if (!document)
				return $q.when(true);

				_.each(document,function(property,name){
						if(_.isEmpty(document[name]) && name!=='onlineEvent') delete(document[name]);
				});

				if(document.everyCountry !=='undefined')
					delete(document.everyCountry);

				if(document.isIdb !=='undefined')
						delete(document.isIdb);

				if (/^\s*$/g.test(document.notes))
					document.notes = undefined;

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

			}
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
			function updateGlobalEvent () {
					if($scope.document && !$scope.document.everyCountry)
						defaultGovernments();
					else
						loadGovernments();
			}
			//==================================
			//
			//==================================
			function loadGovernments () {
					$scope.options.countries().then(function(data){
							$scope.document.governments=[];
							_.each(data,function(country){
								 $scope.document.governments.push({identifier:country.identifier});
							});
					});
			}

			//==================================
			//
			//==================================
			function defaultGovernments () {
					if(!$scope.document)return;

					if(!$scope.document.governments)$scope.document.governments=[];

					var tempGovs=[];
					var promiseArray=[];
					$scope.document.governments=[];

					if($scope.document.contactOrganization && $scope.document.contactOrganization.identifier){
							promiseArray.push($scope.loadRecords($scope.document.contactOrganization.identifier).then(function(data) {
								if(data.body && !_.find(tempGovs,data.body.country))
									tempGovs.push({identifier:data.body.country.identifier});
							}));

					}


					if($scope.document.organizations && $scope.document.organizations.length>0)
						_.each($scope.document.organizations, function(org){
							promiseArray.push($scope.loadRecords(org.identifier).then(function(data) {
								if(data.body && !_.find(tempGovs,data.body.country))
									tempGovs.push({identifier:data.body.country.identifier});
							}));
						});
					  $q.all(promiseArray).then(function(){
								$scope.document.governments=tempGovs;
						});

			}
			//==================================
			//
			//==================================
			$scope.deleteDuration= function(index) {

					$scope.document.durations.splice(index,1);

			};

			//==================================
			//
			//==================================
			$scope.addDuration= function(duration) {
					if(!$scope.document.durations)$scope.document.durations=[];
					$scope.document.durations.push(_.clone(duration));
					$scope.duration.startDate='';
					$scope.duration.endDate='';
					$scope.duration.title='';

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

			//==================================
			//
			//==================================
			$scope.loadRecords = function(identifier, schema) {

				if (identifier) { //lookup single record
					var deferred = $q.defer();

					storage.documents.get(identifier, { info: "" })
						.then(function(r) {
							deferred.resolve(r.data);
						}, function(e) {
							if (e.status == 404) {
								storage.drafts.get(identifier, { info: "" })
									.then(function(r) { deferred.resolve(r.data);},
										  function(e) { deferred.reject (e);});
							}
							else {
								deferred.reject (e);
							}
						});
					return deferred.promise;
				}

				//Load all record of specified schema;

				var sQuery = "type eq '" + encodeURI(schema) + "'";

				return $q.all([storage.documents.query(sQuery, null, { cache: true }),
							   storage.drafts   .query(sQuery, null, { cache: true })])
					.then(function(results) {
						var qResult = Enumerable.from (results[0].data.Items)
												.union(results[1].data.Items, "$.identifier");
						return qResult.ToArray();
					});
			};

			$scope.init();
		}
	};
}]);
});
