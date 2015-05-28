
(function(){
	var chatApp = angular.module('ChatApp',[]);
	chatApp.controller('ChatCtrl', ['$scope', '$log', '$http', '$timeout', function($scope, $log, $http, $timeout){

		$scope.chat_room_id = 1;
		$scope.chatId = undefined;

		$scope.last_received = 0;


		$scope.messageToSend = "";

		$scope.init = function () {
			$log.debug("Hello guest");
			// getChatIdFromServer();
			sync_messages();
		};
		$timeout($scope.init);

		var getChatIdFromServer = function() {
			$http.get('/dont know yet/',{message:sendMessage}).then(function (response) {
				$log.debug(response.data);

			});
		};

		function init_chat(chat_id, html_el_id) {
			chat_room_id = chat_id;
			layout_and_bind(html_el_id);
			$scope.sendMessage("");
			sync_messages();
		}
		/**
		 * Gets the list of messages from the server and appends the messages to the chatbox
		 */
		$scope.get_messages = function() {

			$http.post('/chat/receive/',{id:$scope.chat_room_id, offset: $scope.last_received}).then(function (response) {
				$log.debug(response.data);

			});

			// wait for next
			$timeout(function(){$scope.get_messages();}, 5000);
		}

		var sync_messages = function() {

			$http.post('/chat/sync/',{id:$scope.chat_room_id}).then(function (response) {
				$log.debug(response.data);
				// last_received =
			});

			$timeout(function(){$scope.get_messages();}, 5000);

		};


		$scope.sendMessage = function(messageToSend) {
			// $log.debug(messageToSend);

			var values = {};
			values.message = messageToSend;
			values.chat_room_id = $scope.chat_room_id;

			if(messageToSend.length != 0){
				$http.post('/chat/send/',{message:messageToSend,chat_room_id:$scope.chat_room_id}).then(function (response) {
					$log.debug(response.data);
				});
			}
		};



	}]); //controller ends

})();
