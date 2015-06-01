(function(){
	var chatApp = angular.module('expertChatApp',[]);
	chatApp.controller('expertChatCtrl', ['$scope', '$log', '$http', '$timeout', '$compile', function($scope, $log, $http, $timeout, $compile){

		$(window).unload(function(){chat_leave()});

		$scope.messageToSend = "";
		$scope.chat_room_id = [];
		$scope.last_received = [];
		$scope.loginUser = "";
		$scope.init = function () {
			$log.debug("Hello guest");
			getChatIdFromServer();
		};
		$timeout($scope.init);

		var getChatIdFromServer = function() {
			$http.get('/chat/room/id/expert/').then(function (response) {
				$log.debug(response.data);
				$scope.chat_room_id = response.data.chatIdList;
				$scope.loginUser = response.data.user_name;

				chat_join(response.data.chatIdList);

			});
		};

		var sendMessage = function(messageToSend,id) {
			// $log.debug(messageToSend);
			id = parseInt(id);
			if(messageToSend.length != 0){
				$http.post('/chat/send/',{message:messageToSend,chat_room_id:id}).then(function (response) {
					$log.debug(response.data);
					$('input.message').val("");
				});
			}
		};

		$scope.get_messages = function() {
			$log.debug("before sent: ");
			$log.debug($scope.last_received);
			$http.post('/chat/receive/',{idOffsetList:$scope.last_received}).then(function (response) {
				$log.debug(response.data);


				// first check if we are at the bottom of the div, if we are, we shall scroll once the content is added


				angular.forEach(response.data.msgList, function(obj) {


					$('.msg_container_base_'+obj.chat_id).css("overflo")
					if (obj.type == 's')
						$('.msg_container_base_'+obj.chat_id).append('<div class="row msg_container base_sent"><div class="col-md-10 col-xs-10 chat-window-body"><div class="messages msg_sent"><p>'+ replace_emoticons(obj.message) +'</p><time datetime="2009-11-13T20:00">Timothy • 51 min</time></div></div><div class="col-md-2 col-xs-2 avatar"><img src="'+obj.profile_pic+'" class=" img-responsive "></div></div>');
					else if (obj.type == 'm'){
						if(obj.author == $scope.loginUser){
							$('.msg_container_base_'+obj.chat_id).append('<div class="row msg_container base_sent"><div class="col-md-10 col-xs-10 chat-window-body"><div class="messages msg_sent"><p>'+ replace_emoticons(obj.message) +'</p><time datetime="2009-11-13T20:00">'+obj.author+' • 51 min</time></div></div><div class="col-md-2 col-xs-2 avatar"><img src="'+obj.profile_pic+'" class=" img-responsive "></div></div>');
						}else{
							$('.msg_container_base_'+obj.chat_id).append('<div class="row msg_container base_receive"><div class="col-md-2 col-xs-2 avatar"><img src="'+obj.profile_pic+'" class=" img-responsive "></div><div class="col-md-10 col-xs-10 chat-window-body"><div class="messages msg_receive"><p>'+ replace_emoticons(obj.message) +'</p><time datetime="2009-11-13T20:00">'+obj.author+' • 51 min</time></div></div></div>');
						}
					}
					else if (obj.type == 'j')
						$('.msg_container_base_'+obj.chat_id).append('<div class="join">'+obj.author+' has joined</div>');
					else if (obj.type == 'l')
						$('.msg_container_base_'+obj.chat_id).append('<div class="leave">'+obj.author+' has left</div>');


					for(var i = 0; i < $scope.last_received.length; i++){
						if($scope.last_received[i].chat_id == obj.chat_id){
							$scope.last_received[i].last_message_id = obj.id;
						}
					}


					$('.msg_container_base_'+obj.chat_id).animate({ scrollTop: $('.msg_container_base_'+obj.chat_id).height() }, "slow");
					return false;

					// $scope.last_received.push(lastReceivedObject);
					// $log.debug($scope.last_received);
				});
			});


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
			':\\)' : 'smile.png',
			'=\\)':'smile3.png',
			':]':'smile2.png',
			':-\\)':'smile1.png',
			';-\\);\\)':'wink.png',
			':-D=D':'grin.png',
			'O:\\)O:-\\)':'angel.png',
			':O:-o:o':'gasp.png',
			':-O':'gasp1.png',
			':D':'grin1.png',
			'^_^':'kiki.png',
			'._.':'squint.png',
			'B':'sunglass.png',
			'3\\)':'devilsmile.png',
			// '\\>:(\\>:-(':'grumpy.png',
			':3':'curlylips.png',
			// ':-(:(:[':'frown.png'
			}

		/**
		 * Regular expression maddness!!!
		 * Replace the above strings for their img counterpart
		 */
		 function replace_emoticons(text) {
		 	$.each(emoticons, function(char, img) {
		 		re = new RegExp(char,'g');
				// replace the following at will
				text = text.replace(re, '<img src="/static/images/emoticons/'+img+'" style="width:15px;" />');
			});
		 	return text;
		 }

		function chat_join(idList) {
			$http.post('/chat/join/',{chatIdList:$scope.chat_room_id}).then(function (response) {
				sync_messages(idList);
			});
		}

		function chat_leave() {
			$http.post('/chat/leave/',{chatIdList:$scope.chat_room_id}).then(function (response) {

			});
		}

		var loadEarlierMessages = function(lastMsgId,chatId) {
			lastMsgId = parseInt(lastMsgId);
			chatId = parseInt(chatId);

			$http.post('/chat/load/earlier/message/',{chatRoomId:chatId,last_message_id:lastMsgId}).then(function (response) {
				$log.debug(response.data);
				angular.forEach(response.data.msgList, function(obj) {

					$('.load_earlier_message').remove();

					$('.msg_container_base_'+obj.chat_id).css("overflo");
					if (obj.type == 's')
						$('.msg_container_base_'+obj.chat_id).prepend('<div class="row msg_container base_sent"><div class="col-md-10 col-xs-10 chat-window-body"><div class="messages msg_sent"><p>'+ replace_emoticons(obj.message) +'</p><time datetime="2009-11-13T20:00">Timothy • 51 min</time></div></div><div class="col-md-2 col-xs-2 avatar"><img src="'+obj.profile_pic+'" class=" img-responsive "></div></div>');
					else if (obj.type == 'm'){
						if(obj.author == $scope.loginUser){
							$('.msg_container_base_'+obj.chat_id).prepend('<div class="row msg_container base_sent"><div class="col-md-10 col-xs-10 chat-window-body"><div class="messages msg_sent"><p>'+ replace_emoticons(obj.message) +'</p><time datetime="2009-11-13T20:00">'+obj.author+' • 51 min</time></div></div><div class="col-md-2 col-xs-2 avatar"><img src="'+obj.profile_pic+'" class=" img-responsive "></div></div>');
						}else{
							$('.msg_container_base_'+obj.chat_id).prepend('<div class="row msg_container base_receive"><div class="col-md-2 col-xs-2 avatar"><img src="'+obj.profile_pic+'" class=" img-responsive "></div><div class="col-md-10 col-xs-10 chat-window-body"><div class="messages msg_receive"><p>'+ replace_emoticons(obj.message) +'</p><time datetime="2009-11-13T20:00">'+obj.author+' • 51 min</time></div></div></div>');
						}
					}
					else if (obj.type == 'j')
						$('.msg_container_base_'+obj.chat_id).prepend('<div class="join" style:"color:#960;padding-left:20px;margin:4px 0;">'+obj.author+' has joined</div>');
					else if (obj.type == 'l')
						$('.msg_container_base_'+obj.chat_id).prepend('<div class="leave" style:"color:#966;padding-left:20px;margin:4px 0;">'+obj.author+' has left</div>');

						$('.msg_container_base_'+obj.chat_id).prepend('<div class="load_earlier_message"><p>LOAD EARLIER MESSAGES</p></div>');

		 		});

				$('.load_earlier_message').val(response.data.last_message_id+"_"+response.data.chatRoomId);

		 	});
		};

		$scope.createChatBox = function(id,userName) {

			$log.debug("box id: " + id);

			var size = $(".chat-window:last-child" ).css("margin-left");
			$log.debug("size: "+ size);

			if(angular.isUndefined(size)){
				$log.debug("if undefined");
				var chatBox = '<div class="row chat-window col-xs-12 col-sm-5 col-md-3" id="chat_window_'+id+'"><div class="col-xs-12 col-md-12"><div class="panel panel-default"><div class="panel-heading top-bar"><div class="col-md-9 col-xs-9"><h3 class="panel-title"><span class="glyphicon glyphicon-comment"></span> Chat - Miguel</h3></div><div class="col-md-3 col-xs-3 chat-button-container"><a href="#"><span id="minim_chat_window" class="glyphicon glyphicon-minus icon_minim pull-left"></span></a><a href="#"><span class="glyphicon glyphicon-remove icon_close pull-right" value="'+id +'"data-id="chat_window_1"></span></a></div></div><div class="panel-body msg_container_base msg_container_base_'+id+'"><div class="load_earlier_message"><p>LOAD EARLIER MESSAGES</p></div></div><div class="panel-footer"><div class="input-group"><input id="btn-input" type="text" class="form-control input-sm chat_input message" ng-model="messageToSend"placeholder="Write your message here..." /><span class="input-group-btn"><button class="btn btn-primary btn-sm btn_chat" id="btn_chat" value="'+id+'">Send</button></span></div></div></div></div></div>';
				// $compile(chatBox)($scope);
			}else{
				$log.debug("Not undefined");
				var size_total = parseInt(size) + 400;
				$log.debug("Margin Size : " + size_total);
				var chatBox = '<div class="row chat-window col-xs-12 col-sm-5 col-md-3" style="margin-left:'+size_total+'px;" id="chat_window_'+id+'"><div class="col-xs-12 col-md-12"><div class="panel panel-default"><div class="panel-heading top-bar"><div class="col-md-9 col-xs-9"><h3 class="panel-title"><span class="glyphicon glyphicon-comment"></span> Chat - Miguel</h3></div><div class="col-md-3 col-xs-3 chat-button-container"><a href="#"><span id="minim_chat_window" class="glyphicon glyphicon-minus icon_minim pull-left"></span></a><a href="#"><span class="glyphicon glyphicon-remove icon_close pull-right" value="'+id +'"data-id="chat_window_1"></span></a></div></div><div class="panel-body msg_container_base msg_container_base_'+id+'"><div class="load_earlier_message"><p>LOAD EARLIER MESSAGES</p></div></div><div class="panel-footer"><div class="input-group"><input id="btn-input" type="text" class="form-control input-sm chat_input message" ng-model="messageToSend"placeholder="Write your message here..." /><span class="input-group-btn"><button class="btn btn-primary btn-sm btn_chat" id="btn_chat" value="'+id+'">Send</button></span></div></div></div></div></div>';
				// $compile(chatBox)($scope);
			}
			$(".chat_container").append(chatBox);

		};

		$(document).on('click', '.icon_close', function (e) {
			var id = $(this).attr('value');
			id = parseInt(id);
			// alert(id);
			$http.post('/chat/room/close/',{chatRoomId:id}).then(function (response) {
			});
			$("#chat_window_"+id).remove();

		});


		$(document).on('click', '.btn_chat', function (e) {

			var id = $(this).val();
			var msg = $(this).closest('span').prev('input.message').val();

			sendMessage(msg,id);

		});


		$(document).on('keypress', '.message', function (e) {
		  if (e.which == 13) {
		    var msg = $(this).val();
			var id = $(this).next('span').find('button.btn_chat').val();
			sendMessage(msg,id);
		  }
		  // e.preventDefault();
		});


		$(document).on('click', '.load_earlier_message', function (e) {

			var id = $(this).val();
			alert(id);
			lastMsgId = id.split("_");
			// lastMsgId = id.split("_")[1];
			last_msg_id = lastMsgId[0];
			chatId = lastMsgId[1];
			loadEarlierMessages(last_msg_id,chatId);
		});


	}]); //controller ends

	$(document).ready(function () {
		$('[data-toggle="offcanvas"]').click(function () {
			$('.row-offcanvas').toggleClass('active');
		});
	});

	$(document).on('focus', '.panel-footer input.chat_input', function (e) {
		var $this = $(this);
		if ($('#minim_chat_window').hasClass('panel-collapsed')) {
			$this.parents('.panel').find('.panel-body').slideDown();
			$('#minim_chat_window').removeClass('panel-collapsed');
			$('#minim_chat_window').removeClass('glyphicon-plus').addClass('glyphicon-minus');
		}
	});

	$(document).on('click', '.panel-heading span.icon_minim', function (e) {
		var $this = $(this);
		if (!$this.hasClass('panel-collapsed')) {
			$this.parents('.panel').find('.panel-body').slideUp();
			$this.addClass('panel-collapsed');
			$this.removeClass('glyphicon-minus').addClass('glyphicon-plus');
		} else {
			$this.parents('.panel').find('.panel-body').slideDown();
			$this.removeClass('panel-collapsed');
			$this.removeClass('glyphicon-plus').addClass('glyphicon-minus');
		}
	});




})();
