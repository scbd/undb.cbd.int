define(['app',  'lodash', 'text!./view-event.html',
	'filters/mark-down', 'utilities/organization-storage','filters/trust-as-resource-url','filters/moment'], function(app,  _, template){

app.directive('viewEvent', ["OrganizationStorage","$location","locale","$sce", function (storage,$location,locale,$sce) {
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

			// ====================
			//
			// ====================
			$scope.$watch("document.organizations", function()
			{
				if($scope.document){
					$scope.organizations = angular.fromJson(angular.toJson($scope.document.organizations));
					$scope.contactOrganization = angular.fromJson(angular.toJson($scope.document.contactOrganization));
				}

				if($scope.organizations){
					$scope.loadOrgReferences($scope.organizations);
					if($scope.contactOrganization)
						$scope.loadOrgReference($scope.contactOrganization).then(function(ref){
								$scope.contactOrganization.document=ref.data;
								$scope.contactOrganization.logo=_.find($scope.contactOrganization.document.relevantDocuments,{name:'logo'});
						});
				}

			});

			$scope.$watch("document.images", function()
			{
				if($scope.document){
					if($scope.document && $scope.document.images && _.find($scope.document.images,{name:'cover'}))
						$scope.cover=_.find($scope.document.images,{name:'cover'}).url;
				}
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
				  if(!$scope.document || !$scope.document.address ) return false;
					$scope.embedMapUrl='https://www.google.com/maps/embed/v1/place?key=AIzaSyCyD6f0w00dLyl1iU39Pd9MpVVMOtfEuNI&q=place_id:'+$scope.document.address.googlePlaceId;
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
			$scope.loadOrgReferences = function(targets) {

				return angular.forEach(targets, function(ref){
					if(!ref) return;
					return $scope.loadOrgReference(ref).then(function(r){
								ref.document=r.data;
								ref.logo=_.find(ref.document.relevantDocuments,{name:'logo'});
					});
				});
			};

			$scope.loadOrgReference = function(ref) {

				return storage.get(ref.identifier, { cache : true})
					.success(function(data){
						return ref= data;
					})
					.error(function(error, code){

						ref.document  = undefined;
						ref.error     = error;
						ref.errorCode = code;
					});

		};

		}
	};
}]);

});
