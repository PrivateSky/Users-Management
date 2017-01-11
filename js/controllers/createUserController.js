/**
 * Created by ciprian on 05.01.2017.
 */

'use strict';
app.controller('createUserController', ['$scope', "$element",'close', function($scope,$element, close) {
    $scope.user = {"status":"Active"};
    $scope.createUser = function(){
        $element.modal('hide');
        close($scope.user,500);
    }
}]);