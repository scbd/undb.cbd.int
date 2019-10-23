define(['app',  'lodash', 'text!./view-organization.html',
	'filters/mark-down', 'utilities/organization-storage','filters/trust-as-resource-url'], function(app,  _, template){

app.directive('viewOrganization', ["OrganizationStorage","$location", function (storage,$location) {
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
			$scope.$watch("document.linkedOrganizations", function()
			{
				if($scope.document)
					$scope.linkedOrganizations = angular.fromJson(angular.toJson($scope.document.linkedOrganizations));

				if($scope.linkedOrganizations)
					$scope.loadReferences($scope.linkedOrganizations);

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
			//====================
			//
			//====================
			$scope.getLogo = function() {
				  if(!$scope.document || !$scope.document.relevantDocuments) return false;
					return _.find($scope.document.relevantDocuments,{name:'logo'});
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

				angular.forEach(targets, function(ref){

					storage.get(ref.identifier, { cache : true})
					.success(function(data){ return ref= data; })
					.error(function(error, code){
						ref.document  = undefined;
						ref.error     = error;
						ref.errorCode = code;
					});

				});
			};
		}
	};
}]);

});
