define(['app','authentication', '../directives/map/undb-map'], function() { 'use strict';

	return ['$scope', function ($scope) {

		$scope.carouselData=  {
					items :[
						{
											title: "Living in harmony with nature",
											    description: " The goal of the United Nations Decade on Biodiversity is to support the implementation of the Strategic Plan for Biodiversity and to promote its overall vision of living in harmony with nature.",
											    imageUrl: "app/images/carousel/undb-slider-welcome.png",
											    targetUrl: "https://www.cbd.int/undb-new/about/undb"
											}, {
											    title: "Strategic Plan for Biodiversity 2011–2020 and the Aichi Biodiversity Targets",
											    description: "The vision: By 2050, biodiversity is valued, conserved, restored and wisely used, maintaining ecosystem services, sustaining a healthy planet and delivering benefits essential for all people.",
											    imageUrl: "app/images/carousel/undb-slider-sp.png",
											    targetUrl: "https://www.cbd.int/sp"
											}, {
											    title: "Aichi Biodiversity Targets Task Force",
											    description: "The ABTTF was established to provide a platform for agencies and organizations to coordinate their activities at global and national levels during the United Nations Decade on Biodiversity.",
											    imageUrl: "app/images/carousel/undb-slider-abttf.png",
											    targetUrl: "https://www.cbd.int/undb-new/actors/abttf"
											}, {
											    title: "UN Biodiversity Conference, Sharm El-Sheikh, Egypt, 2018",
											    description: "The highest governing bodies of the CBD and its Protocols bring together government representatives to review and promote the implementation of the Convention.",
											    imageUrl: "app/images/carousel/undb-slider-cop14.png",
											    targetUrl: "https://www.cbd.int/conferences/2018"
											}, {
											    title: "Cancun Commitments and Coalitions for Enhanced Implementation",
											    description: "Actions underway or commitments by Parties or group of Parties to achieve the Aichi Biodiversity Targets.",
											    imageUrl: "app/images/carousel/undb-slider-ccc.png",
											    targetUrl: "https://www.cbd.int/undb-new/actions/ccc"
											}, {
											    title: "Business and Biodiversity Pledge",
											    description: "Businesses committing to take positive action for biodiversity",
											    imageUrl: "app/images/carousel/undb-slider-business.png",
											    targetUrl: "https://www.cbd.int/business/pledges.shtml"
											}, {
											    title: "High-level Political Forum on Sustainable Development",
											    description: '',
											    imageUrl: "app/images/carousel/slider-1.jpg",
											    targetUrl: "https://sustainabledevelopment.un.org/hlpf/2018"
											}, {
											    title: "Sustainable Development Goals",
											    description: "Transforming our world: the 2030 Agenda for Sustainable Development.",
											    imageUrl: "app/images/carousel/undb-slider-sdg.png",
											    targetUrl: "https://sustainabledevelopment.un.org/sdgs"
											}, {
											    title: "Participate!",
											    description: "Follow the United Nations Decade on Biodiversity on social media, or get involved in other ways.",
											    imageUrl: "app/images/carousel/undb-slider-socialmedia.png",
											    targetUrl: "https://www.cbd.int/undb-new/actions/participate"
											},

]
				};

				$(document).ready(function(){
					 $('.carousel').carousel({
						 interval: 5000
					 });
				 });

    }];
});
