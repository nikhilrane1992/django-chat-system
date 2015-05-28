(function(){
	var chatApp = angular.module('singleChatApp',[]);
	chatApp.controller('singleChatCtrl', ['$scope', '$log', '$http', '$timeout', function($scope, $log, $http, $timeout){

		$scope.messageToSend = "";
		$scope.chat_room_id = "";
		$scope.last_received = "";
		$scope.loginUser = "";
		$scope.init = function () {
			$log.debug("Hello guest");
			getChatIdFromServer();
		};
		$timeout($scope.init);

		var getChatIdFromServer = function() {
			$http.get('/chat/room/id/').then(function (response) {
				$log.debug(response.data);
				$scope.chat_room_id = response.data.chat_id;
				$scope.loginUser = response.data.user_name;
				$log.debug($scope.chat_room_id);
				$log.debug(parseInt($scope.chat_room_id));
				sync_messages();
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

				angular.forEach(response.data, function(obj) {
					if (obj.type == 's')
						$('.msg_container_base').append('<div class="row msg_container base_sent"><div class="col-md-10 col-xs-10 chat-window-body"><div class="messages msg_sent"><p>'+ replace_emoticons(obj.message) +'</p><time datetime="2009-11-13T20:00">Timothy • 51 min</time></div></div><div class="col-md-2 col-xs-2 avatar"><img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive "></div></div>');
					else if (obj.type == 'm'){
						if(obj.author == $scope.loginUser){
							$('.msg_container_base').append('<div class="row msg_container base_sent"><div class="col-md-10 col-xs-10 chat-window-body"><div class="messages msg_sent"><p>'+ replace_emoticons(obj.message) +'</p><time datetime="2009-11-13T20:00">'+obj.author+' • 51 min</time></div></div><div class="col-md-2 col-xs-2 avatar"><img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive "></div></div>');
						}else{
							$('.msg_container_base').append('<div class="row msg_container base_receive"><div class="col-md-2 col-xs-2 avatar"><img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive "></div><div class="col-md-10 col-xs-10 chat-window-body"><div class="messages msg_receive"><p>'+ replace_emoticons(obj.message) +'</p><time datetime="2009-11-13T20:00">'+obj.author+' • 51 min</time></div></div></div>');
						}
					}
					else if (obj.type == 'j')
						$('#chat-messages').append('<div class="join">'+obj.author+' has joined</div>');
					else if (obj.type == 'l')
						$('#chat-messages').append('<div class="leave">'+obj.author+' has left</div>');

					$scope.last_received = obj.id;
					$log.debug("Last received: " + $scope.last_received);
				});
			});
			$timeout(function(){$scope.get_messages();}, 5000);
		}

		var sync_messages = function() {

			$scope.chat_room_id = parseInt($scope.chat_room_id);
			$http.post('/chat/sync/',{id:$scope.chat_room_id}).then(function (response) {
				$log.debug(response.data);
				$scope.last_received = response.data.last_message_id;

			});

			$timeout(function(){$scope.get_messages();}, 5000);
		};


		// emoticons
		var emoticons = {
			'>:D' : 'emoticon_evilgrin.png',
			':D' : 'emoticon_grin.png',
			'=D' : 'emoticon_happy.png',
			':\\)' : 'emoticon_smile.png',
			':O' : 'emoticon_surprised.png',
			':P' : 'emoticon_tongue.png',
			':\\(' : 'emoticon_unhappy.png',
			':3' : 'emoticon_waii.png',
			';\\)' : 'emoticon_wink.png',
			'\\(ball\\)' : 'sport_soccer.png'
		}

		/**
		 * Regular expression maddness!!!
		 * Replace the above strings for their img counterpart
		 */
		function replace_emoticons(text) {
			$.each(emoticons, function(char, img) {
				re = new RegExp(char,'g');
				// replace the following at will
				text = text.replace(re, '<img src="/media/img/silk/'+img+'" />');
			});
			return text;
		}

	}]); //controller ends



})();
