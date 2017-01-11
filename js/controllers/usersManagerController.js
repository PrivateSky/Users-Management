'use strict';
app.controller('userManagerController', ['$scope','ModalService', function ($scope,ModalService) {

    $scope.allUsers = [
        {
        firstName:"Cipriadfgsdfn",
        lastName:"Talmacel",
        email:"tac@rms.ro",
        userName:"lupulalbastru",
        status:'Banned'
    },{
        firstName:"Sansdfhgdsfica",
        lastName:"Alboaie",
        email:"als@rms.ro",
        userName:"lupulrosu",
        status:'Active'
    },{
        firstName:"Cipradsfgadian",
        lastName:"Talmacel",
        email:"tac@rms.ro",
        userName:"lupulalbastru",
        status:'Banned'
    },{
        firstName:"Sanica",
        lastName:"Albosdfgsdaie",
        email:"als@rms.ro",
        userName:"lupulrosu",
        status:'Active'
    },{
        firstName:"Ciprian",
        lastName:"Talmacel",
        email:"tac@rms.ro",
        userName:"lupulalbastru",
        status:'Banned'
    },{
        firstName:"Sanica",
        lastName:"Alboaie",
        email:"als@rms.ro",
        userName:"lupulrosu",
        status:'Active'
    },{
        firstName:"Ciprian",
        lastName:"Talmacel",
        email:"tac@rms.ro",
        userName:"lupulalbastru",
        status:'Banned'
    },{
        firstName:"Sanica",
        lastName:"Alboaie",
        email:"als@rms.ro",
        userName:"lupulrosu",
        status:'Active'
    },{
        firstName:"Ciprian",
        lastName:"Talmacel",
        email:"tac@rms.ro",
        userName:"lupulalbastru",
        status:'Banned'
    },{
        firstName:"Sanica",
        lastName:"Alboaie",
        email:"als@rms.ro",
        userName:"lupuldfgsdrosu",
        status:'Active'
    }];

    $scope.performSearch = function(){
        alert("Searching");
    }

    $scope.performAdvancedSearch = function() {
        ModalService.showModal({
            templateUrl: "tpl/modals/advancedSearch.html",
            controller: "advancedSearchController"
        }).then(function(modal) {
            console.log(modal);
            modal.element.modal();
            modal.close.then(function(result) {
                $scope.yesNoResult = result ? "You said Yes" : "You said No";
            });
        });
    };

    $scope.createUser = function(){
        ModalService.showModal({
            templateUrl: "tpl/modals/createUser.html",
            controller: "createUserController"
        }).then(function(modal) {
            console.log(modal);
            modal.element.modal();
            modal.close.then(function(userData) {
                $scope.userDate = userData;
                console.log(userData);
                alert(userData);
            });
        });
    }

    $scope.editUser = function(user){
        ModalService.showModal({
            templateUrl: "tpl/modals/editUser.html",
            controller: "editUserController",
            inputs:{
                "user":user
            }
        }).then(function(modal) {
            console.log(modal);
            modal.element.modal();
            modal.close.then(function(userData) {
            });
        });
    }

    $scope.totalItems = $scope.allUsers.length;
    $scope.currentPage = 1;
    $scope.itemsPerPage = 5;
    $scope.maxPages = 5;
    $scope.advancedSearching = false;

}]);