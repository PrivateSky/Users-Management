'use strict';
app.controller('userManagerController', ['$scope','ModalService','swarmService',"authenticationService", 
    function ($scope,ModalService,swarmService,authenticationService) {
        $scope.searchFilter = {};
        $scope.usersToDisplay = [];
        $scope.availableUsers = [];
        $scope.totalItems = $scope.usersToDisplay.length;
        $scope.currentPage = 1;
        $scope.itemsPerPage = 5;
        $scope.maxPages = 5;
        $scope.advancedSearching = false;
        $scope.searchFilter = {};
        $scope.maxNrOfPages = 0;


        authenticationService.authenticateUser("admin@plusprivacy.com", "swarm", function(){}, function(){},function(){});
        swarmHub.startSwarm("UserManagement.js","filterUsers",{});


        swarmHub.on("UserManagement.js","failed",function(swarm){
            console.log("Error "+swarm.err+" occured");
        });

        swarmHub.on("UserManagement.js","userCreated",function(swarm){
            $scope.availableUsers.unshift(swarm.result);
            $scope.performSearch();
            $scope.$apply();
        });

        swarmHub.on("UserManagement.js","gotFilteredUsers",function(swarm){
            $scope.availableUsers = swarm.result;
            $scope.performSearch();
            $scope.$apply();
        });

        swarmHub.on("UserManagement.js","userEdited",function(swarm){
            $scope.availableUsers = $scope.availableUsers.map(function(user){
                if(user.userId===swarm.result.userId){
                    return swarm.result;
                }
                return user;
            });
            $scope.performSearch();
            $scope.$apply();
        });

        $scope.performSearch = function() {
            $scope.usersToDisplay = [];
            $scope.availableUsers.forEach(function(user){
                if(matchesFilter($scope.searchFilter,user)){
                    $scope.usersToDisplay.push(user);
                }
            });

            console.log("USERS TO DISPLAY",$scope.usersToDisplay,$scope.availableUsers,$scope.searchFilter);
            $scope.maxNrOfPages = Math.floor($scope.usersToDisplay.length/$scope.itemsPerPage);
            $scope.maxNrOfPages += $scope.usersToDisplay.length%$scope.itemsPerPage!==0?1:0;
        }

        $scope.changeSearchModality = function(){
            $scope.searchFilter = {};
            $scope.advancedSearching = !$scope.advancedSearching;
        }

        $scope.changePage = function(currentPage){
            $scope.currentPage = currentPage;
        }
        
        $scope.createUser = function(){
            ModalService.showModal({
                templateUrl: "tpl/modals/createUser.html",
                controller: "createUserController"
            }).then(function(modal) {
                modal.element.modal();
                modal.close.then(function(userData) {
                    swarmHub.startSwarm("UserManagement.js","createUser",userData);
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
            }).then(function(modal){
                console.log(modal);
                modal.element.modal();
                modal.close.then(function(userData) {
                    swarmHub.startSwarm("UserManagement.js","editUser",userData);
                });
            });
        };

        function matchesFilter(filter,obj){
            var matches = true;
            for(var field in filter){
                if(obj[field] !== filter[field] && filter[field]!==""){
                    matches = false;
                    break;
                }
            }
            return matches;
        }
}]);


app.controller('createUserController', ['$scope', "$element",'close', function($scope,$element, close) {
    $scope.user = {"status":"Active"};
    $scope.createUser = function(){
        $element.modal('hide');
        close($scope.user,500);
    }
}]);

app.controller('editUserController',['$scope','user', '$element','close', function($scope,user,$element, close) {
    $scope.user = {};
    for(var prop in user){
        $scope.user[prop] = user[prop];
    }
    $scope.saveUser = function(){
        $element.modal('hide');
        console.log($scope.user);
        close($scope.user,500);
    }
}]);


