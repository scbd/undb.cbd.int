define(['app', 'angular', 'lodash', 'text!./view-undb-actor.html',
	'filters/mark-down', 'utilities/km-storage','filters/trust-as-resource-url'], function(app, angular, _, template){

app.directive('viewUndbActor', ["IStorage","$location","locale","$sce", function (storage,$location,locale,$sce) {
	return {
		restrict   : 'E',
		template   : template,
		replace    : true,
		transclude : false,
		scope: {
			document: "=ngModel",
			locale  : "=",
			target  : "@linkTarget",
			allowDrafts : "@",
			user:"=?",
			loading:"=?",
			header:"=?"
		},
		link : function ($scope)
		{

			$scope.contacts      = undefined;
			$scope.organizations = undefined;
  		if(typeof $scope.header==='undefined') $scope.header=true;

			$scope.$watch("document.organization", function()
			{
					if($scope.document)
							$scope.organization = angular.fromJson(angular.toJson($scope.document.organization));
					if($scope.organization)
							$scope.loadReference($scope.organization).then(function(data){
									$scope.organization = data.data;

									$scope.organization.logo=$scope.getLogo($scope.organization);
							});
			});

			//====================
			//
			//====================
			$scope.getLogo = function(org) {

					if(!org.relevantDocuments) return false;
					return _.find(org.relevantDocuments,{name:'logo'});
			};

			//====================
			//
			//====================
			$scope.isAdmin = function() {
				if($scope.user)
					 return !!_.intersection($scope.user.roles, ["Administrator","UNDBPublishingAuthority","undb-administrator"]).length;
			};

			//====================
			//
			//====================
			$scope.getAichiNumber= function(term) {
					 return term.identifier.slice(-2);
			};

			//====================
			//
			//====================
			$scope.isReview = function() {
					 return !!($location.url().indexOf('/view')>-1);
			};

			//====================
			//
			//====================
			$scope.canEdit = function() {

					if(!$scope.user || ($location.path().indexOf('/view')<0)) return false;

					$scope.isAdmin = !!_.intersection($scope.user.roles, ["Administrator","UNDBPublishingAuthority","undb-administrator"]).length;
					return  $scope.isAdmin ;
			};

			//====================
			//
			//====================
			$scope.isLinkType = function(type) {
					if(!$scope.document) return false;
					return _.find($scope.document.websites,{name:type});
			};

			//====================
			//
			//====================
			$scope.getEmbedMapUrl = function() {
				  if(!$scope.document || !$scope.document.establishmentGooglePlaceId ) return false;
					$scope.embedMapUrl='https://www.google.com/maps/embed/v1/place?key=AIzaSyCyD6f0w00dLyl1iU39Pd9MpVVMOtfEuNI&q=place_id:'+$scope.document.establishmentGooglePlaceId;
					return true;
			};



			var links;
			//====================
			//
			//====================
			$scope.hasOtherLinks = function() {
					if(!$scope.document) return false;
					if(!links && $scope.document.websites)
					 links = _.cloneDeep($scope.document.websites);

					if(!links) return false;

					_.each(links,function(l,i){
						if(!l)return;

						if(l.name==='website' || l.name==='Google Maps' || l.name==='facebook' || l.name==='youtube' || l.name==='twitter')
							links.splice(i,1);
					});

					return links.length;
			};

			//====================
			//
			//====================
			$scope.goTo= function() {

					$location.path('/submit/organization/'+$scope.document.header.identifier);
			};

			//====================
			//
			//====================
			$scope.loadReferences = function(targets) {

				return angular.forEach(targets, function(ref){

					if(!ref) return;
					return $scope.loadReference(ref);

				});
			};

			$scope.loadReference = function(ref) {

					return storage.documents.get(ref.identifier, null, { cache : true, headers: {realm:undefined}})
						.success(function(data){
							return ref= data;
						})
						.error(function(error, code){
							if (code == 404 && $scope.allowDrafts == "true") {

								return storage.drafts.get(ref.identifier, null, { cache : true, headers: {realm:undefined}})
									.success(function(data){
										return ref= data;
									})
									.error(function(draftError, draftCode){
										ref.document  = undefined;
										ref.error     = draftError;
										ref.errorCode = draftCode;
									});
							}

							ref.document  = undefined;
							ref.error     = error;
							ref.errorCode = code;

						});

			};

		}
	};
}]);

});
