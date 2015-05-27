
(function(){
	var chatApp = angular.module('ChatApp',[]);
	chatApp.controller('ChatCtrl', ['$scope', '$log', '$http', '$timeout', function($scope, $log, $http, $timeout){
		$log.debug("Hello guest");

		$scope.messageToSend = "";
		$scope.msg = "Hello";

		$scope.sendMessage = function(sendMessage) {
			$log.debug(sendMessage);
			$http.post('/dont know yet/',{message:sendMessage}).then(function (response) {
				$log.debug(response.data);
			});
		};

	}]); //controller ends

})();
