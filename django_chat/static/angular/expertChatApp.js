(function(){
	var chatApp = angular.module('expertChatApp',[]);
	chatApp.controller('expertChatCtrl', ['$scope', '$log', '$http', '$timeout', '$compile', function($scope, $log, $http, $timeout, $compile){

		$(window).unload(function(){chat_leave()});

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
			$http.get('/chat/room/id/expert/').then(function (response) {
				$log.debug(response.data);
				$scope.chat_room_id = response.data.chatIdList[0];
				$scope.loginUser = response.data.user_name;

				angular.forEach(response.data.chatIdList,function(id){
					createChatBox(id);
				});

				chat_join(response.data.chatIdList);

			});
		};

		var sendMessage = function(messageToSend,id) {
			// $log.debug(messageToSend);
			id = parseInt(id);
			if(messageToSend.length != 0){
				$http.post('/chat/send/',{message:messageToSend,chat_room_id:id}).then(function (response) {
					$log.debug(response.data);
				});
			}
		};

		$scope.get_messages = function() {
			// $scope.last_received = parseInt($scope.last_received);
			$http.post('/chat/receive/',{idOffsetList:$scope.last_received}).then(function (response) {
				$log.debug(response.data);

				angular.forEach(response.data.msgList, function(obj) {
					if (obj.type == 's')
						$('.msg_container_base_'+obj.chat_id).append('<div class="row msg_container base_sent"><div class="col-md-10 col-xs-10 chat-window-body"><div class="messages msg_sent"><p>'+ replace_emoticons(obj.message) +'</p><time datetime="2009-11-13T20:00">Timothy • 51 min</time></div></div><div class="col-md-2 col-xs-2 avatar"><img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive "></div></div>');
					else if (obj.type == 'm'){
						if(obj.author == $scope.loginUser){
							$('.msg_container_base_'+obj.chat_id).append('<div class="row msg_container base_sent"><div class="col-md-10 col-xs-10 chat-window-body"><div class="messages msg_sent"><p>'+ replace_emoticons(obj.message) +'</p><time datetime="2009-11-13T20:00">'+obj.author+' • 51 min</time></div></div><div class="col-md-2 col-xs-2 avatar"><img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive "></div></div>');
						}else{
							$('.msg_container_base_'+obj.chat_id).append('<div class="row msg_container base_receive"><div class="col-md-2 col-xs-2 avatar"><img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive "></div><div class="col-md-10 col-xs-10 chat-window-body"><div class="messages msg_receive"><p>'+ replace_emoticons(obj.message) +'</p><time datetime="2009-11-13T20:00">'+obj.author+' • 51 min</time></div></div></div>');
						}
					}
					else if (obj.type == 'j')
						$('.msg_container_base_'+obj.chat_id).append('<div class="join">'+obj.author+' has joined</div>');
					else if (obj.type == 'l')
						$('.msg_container_base_'+obj.chat_id).append('<div class="leave">'+obj.author+' has left</div>');

					$scope.last_received = obj.id;
					$log.debug("Last received: " + $scope.last_received);
				});
			});

			$('input.message').val("");

			$timeout(function(){$scope.get_messages();}, 5000);
		}

		var sync_messages = function(idList) {

			// $scope.chat_room_id = parseInt($scope.chat_room_id);

			$http.post('/chat/sync/',{idList:idList}).then(function (response) {
				$log.debug(response.data);
				$scope.last_received = response.data.lastMessageIdList;

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

		function chat_join(idList) {
			$http.post('/chat/join/',{chat_room_id:$scope.chat_room_id}).then(function (response) {
				sync_messages(idList);
			});
		}

		function chat_leave() {
			$http.post('/chat/leave/',{chat_room_id:$scope.chat_room_id}).then(function (response) {

			});
		}

		// for(var i = 0; i < 2; i++ ){
		// 	var size = $( ".chat-window:last-child" ).css("margin-left");
		// 	size_total = parseInt(size) + 400;
		// 	// alert(size_total);
		// 	var clone = $( ".chat-window" ).clone().appendTo( ".container" );
		// 	clone.css("margin-left", size_total);
		// 	clone.addClass("new_"+i);
		// 	clone.removeAttr('id');
		// }

		var createChatBox = function(id) {
			$log.debug("box id: " + id);
			var size = $(".chat-window:last-child" ).css("margin-left");
			$log.debug("size: "+ size);

			if(angular.isUndefined(size)){
				var chatBox = '<div class="row chat-window col-xs-12 col-sm-5 col-md-3" id="chat_window_'+id+'"><div class="col-xs-12 col-md-12"><div class="panel panel-default"><div class="panel-heading top-bar"><div class="col-md-9 col-xs-9"><h3 class="panel-title"><span class="glyphicon glyphicon-comment"></span> Chat - Miguel</h3></div><div class="col-md-3 col-xs-3 chat-button-container"><a href="#"><span id="minim_chat_window" class="glyphicon glyphicon-minus icon_minim pull-left"></span></a><a href="#"><span class="glyphicon glyphicon-remove icon_close pull-right" data-id="chat_window_1"></span></a></div></div><div class="panel-body msg_container_base msg_container_base_'+id+'"></div><div class="panel-footer"><div class="input-group"><input id="btn-input" type="text" class="form-control input-sm chat_input message" ng-model="messageToSend"placeholder="Write your message here..." /><span class="input-group-btn"><button class="btn btn-primary btn-sm btn_chat" id="btn_chat" value="'+id+'">Send</button></span></div></div></div></div></div>';
				$compile(chatBox)($scope);
			}else{
				var size_total = parseInt(size) + 400;
				$log.debug("Margin Size : " + size_total);
				var chatBox = '<div class="row chat-window col-xs-12 col-sm-5 col-md-3" style="margin-left:'+size_total+'px;" id="chat_window_'+id+'"><div class="col-xs-12 col-md-12"><div class="panel panel-default"><div class="panel-heading top-bar"><div class="col-md-9 col-xs-9"><h3 class="panel-title"><span class="glyphicon glyphicon-comment"></span> Chat - Miguel</h3></div><div class="col-md-3 col-xs-3 chat-button-container"><a href="#"><span id="minim_chat_window" class="glyphicon glyphicon-minus icon_minim pull-left"></span></a><a href="#"><span class="glyphicon glyphicon-remove icon_close pull-right" data-id="chat_window_1"></span></a></div></div><div class="panel-body msg_container_base msg_container_base_'+id+'"></div><div class="panel-footer"><div class="input-group"><input id="btn-input" type="text" class="form-control input-sm chat_input message" value="" placeholder="Write your message here..." /><span class="input-group-btn"><button class="btn btn-primary btn-sm btn_chat" value="'+id+'">Send</button></span></div></div></div></div></div>';
				$compile(chatBox)($scope);
			}
			$(".container").append(chatBox);

		};

		$(document).on('click', '.icon_close', function (e) {
			$(this).parent().parent().parent().parent().remove();
		});

		$(document).on('click', '.btn_chat', function (e) {

			var id = $(this).val();
			var msg = $(this).closest('span').prev('input.message').val();

			sendMessage(msg,id);

		});

	}]); //controller ends



})();
