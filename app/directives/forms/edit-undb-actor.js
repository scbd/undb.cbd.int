define(['text!./edit-undb-actor.html', 'text!./undb-records-dialog.html','app', 'angular', 'lodash', 'authentication',
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
'directives/views/view-undb-actor',
'directives/controls/select-contact',
'utilities/guid'
], function(template,bbiRecordsDialog, app, angular, _) { 'use strict';

app.directive('editUndbActor', ['$http',"$rootScope", "Enumerable", "$filter", "$q", "guid", "$location", "Thesaurus", 'authentication', 'editFormUtility',  'IStorage', '$route', function ($http, $rootScope, Enumerable, $filter, $q, guid, $location, thesaurus, authentication, editFormUtility, storage, $route) {
	return {
		restrict   : 'E',
		template   : template,
		replace    : true,
		transclude : false,
		scope: {user:'='},
		link : function($scope)
		{

			$scope.schema = 'undbActor';
			$scope.status   = "";
			$scope.error    = null;
			$scope.document = null;
			$scope.tab      = 'general';
			$scope.review   = { locale: "en" };

			$scope.options  = {
				countries					 : function() { return $http.get("/api/v2013/thesaurus/domains/countries/terms",            { cache: true }).then(function(o){ return $filter('orderBy')(o.data, 'name'); }); }
			};


			//============================================================
			//
			//============================================================
			$scope.nextTab = function() {
				var next = 'review';

				if($scope.tab=='general') 	{ next = 'detail';}
				if($scope.tab=='detail'	) 		{ next = 'review';$scope.validate();}
				$scope.tab = next;
			};

			//============================================================
			//
			//============================================================
			$scope.prevTab = function() {
				var prev;

				if($scope.tab=='review' ) { prev = 'detail'; 	 }
				if($scope.tab=='detail'	) { prev = 'general';}
				$scope.tab = prev;
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
			$scope.init = function() {

				if ($scope.document)
					return;

				$scope.status = "loading";

				var identifier = $route.current.params.id;
				var promise = null;

				if(identifier && identifier!=='new'){
					$scope.editExisting = true;
					promise = editFormUtility.load(identifier, "undbActor");
				}
				else
					promise = $q.when({
						header: {
							identifier: guid(),
							schema   : "undbActor",
							languages: ["en"]
						},

					});

				promise.then(
					function(doc) {
						$scope.status = "ready";
						$scope.document = doc;
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
						if(_.isEmpty(document[name])) delete(document[name]);
				});

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
