/**
 * Created by ciprian on 05.01.2017.
 */

'use strict';
app.controller('editUserController',['$scope','user', '$element','close', function($scope,user,$element, close) {
    $scope.user = {};

     /*
        'Deepcopy' the user object so that it will not be modified in the table when performing updates in the modal;
        On modal exit return the new user object and, if the update is accepted, modify the user in the table.
     */

    for(var prop in user){
        $scope.user[prop] = user[prop];
    }

    $scope.saveUser = function(){
        var handler = swarmHub.startSwarm("updateUser.js","start",$scope.user);
        swarmHub.on("updateUser.js","start",$scope.user);
        $element.modal('hide');
        close($scope.user,500);
    }
}]);