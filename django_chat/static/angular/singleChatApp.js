(function(){
	var chatApp = angular.module('singleChatApp',[]);
	chatApp.controller('singleChatCtrl', ['$scope', '$log', '$http', '$timeout', function($scope, $log, $http, $timeout){

		$scope.messageToSend = "";
		$scope.chat_room_id = "";
		$scope.last_received = "";
		$scope.init = function () {
			$log.debug("Hello guest");
			// getChatIdFromServer();
			sync_messages();
		};
		$timeout($scope.init);

		var getChatIdFromServer = function() {
			$http.get('/chat/room/id/').then(function (response) {
				$log.debug(response.data);
				$scope.chat_room_id = response.data.chat_id;
			});
		};

		$scope.sendMessage = function(messageToSend) {
			// $log.debug(messageToSend);
			$scope.chat_room_id = parseInt($scope.chat_room_id);
			if(messageToSend.length != 0){
				$http.post('/chat/send/',{message:messageToSend,chat_room_id:$scope.chat_room_id}).then(function (response) {
					$log.debug(response.data);
				});
			}
		};

		$scope.get_messages = function() {
			$scope.last_received = parseInt($scope.last_received);
			$http.post('/chat/receive/',{id:$scope.chat_room_id, offset: $scope.last_received}).then(function (response) {
				$log.debug(response.data);

			});
			$timeout(function(){$scope.get_messages();}, 5000);
		}

		var sync_messages = function() {

			$scope.chat_room_id = parseInt($scope.chat_room_id);
			$http.post('/chat/sync/',{id:$scope.chat_room_id}).then(function (response) {
				$log.debug(response.data);
				// $scope.last_received =
			});

			$timeout(function(){$scope.get_messages();}, 5000);
		};

	}]); //controller ends

})();
