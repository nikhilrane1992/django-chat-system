# -*- encoding: UTF-8 -*-
from datetime import datetime

from django.http import HttpResponse, Http404
from django.contrib.auth.decorators import login_required
from django.shortcuts import HttpResponse, HttpResponseRedirect, render_to_response
from django.template import RequestContext
from django.contrib.auth.models import User, Group
import json
from models import Room, Message, One_to_one_chat

@login_required
def send(request):
    dataDictionary = json.loads(request.body)
    roomObj = Room.objects.get(id=int(dataDictionary['chat_room_id']))
    roomObj.say(request.user, dataDictionary['message'])
    return HttpResponse('')

@login_required
def sync(request):
    dataDictionary = json.loads(request.body)

    if not dataDictionary['idList']:
        raise Http404
    lastMessageIdList = []
    for i in dataDictionary['idList']:
        roomObj = Room.objects.get(id=i)
        lastMsgId = roomObj.last_message_id()    
        lastMessageIdList.append({'last_message_id':lastMsgId, 'chat_id': roomObj.id})
    return HttpResponse(json.dumps({'lastMessageIdList': lastMessageIdList, 'status':True}), content_type = "application/json")

@login_required
def receive(request):
    if not request.body:
        raise Http404
    dataDictionary = json.loads(request.body)

    if not dataDictionary['idOffsetList']:
        raise Http404
    msgList = []
    for obj in dataDictionary['idOffsetList']:
        try:
            room_id = int(obj['chat_id'])
        except:
            raise Http404

        try:
            offset = int(obj['last_message_id'])
        except:
            offset = 0

        roomObj = Room.objects.get(id=room_id)

        msg = roomObj.messages(offset)
        for i in msg:
            obj = {'id': i.id, 'author': i.author.username, 'message': i.message, 'type': i.type, 'chat_id': i.room.id}
            msgList.append(obj)
    return HttpResponse(json.dumps({'msgList': msgList}), content_type = "application/json")

@login_required
def join(request):
    dataDictionary = json.loads(request.body)
    chatIdList = dataDictionary['chatIdList']
    for i in chatIdList:
        roomObj = Room.objects.get(id=int(i))
        roomObj.join(request.user)
    return HttpResponse('')

@login_required 
def leave(request):
    dataDictionary = json.loads(request.body)
    chatIdList = dataDictionary['chatIdList']
    for i in chatIdList:
        roomObj = Room.objects.get(id=int(i))
        roomObj.leave(request.user)
    return HttpResponse('')

def jsonify(object, fields=None, to_dict=False):
    try:
        import json
    except ImportError:
        import django.utils.simplejson as json

    out = []

    if type(object) not in [dict,list,tuple] :
        for i in object:
            tmp = {}
            if fields:
                for field in fields:
                    tmp[field] = unicode(i.__getattribute__(field))
            else:
                for attr, value in i.__dict__.iteritems():
                    tmp[attr] = value
            out.append(tmp)
    else:
        out = object

    if to_dict:
        return out
    else:
        return json.dumps(out)



def usergroup_index(request, group_id):
    group = UserGroup.models.get(id=group_id)
    room = Room.objects.get_or_create(group)
    return render_to_response("homepage.html", {'group':group, 'chat_id':room.id})

def get_create_chat_room_id(expert, author):
    try:
        cid = One_to_one_chat.objects.filter(author=author)
        cid = cid[len(cid)-1]
        return cid
    except Exception, e:
        print e
        cid = One_to_one_chat.objects.filter(author=None)
        if len(cid) == 0:
            return None
        else:
            cid = cid[len(cid)-1]
            cid.author = author
            cid.save()
            return cid
def available_expert(expert, author): 
    try:
        cid = One_to_one_chat.objects.filter(expert=expert)
        cid = cid[len(cid)-1]
    except Exception, e:
        print e
        cid = One_to_one_chat(expert=expert)
        cid.save()
    return cid

def send_applicant_chat_id(request):
    group = Group.objects.get(name="EXPERT")
    expertList = group.user_set.all()
    loggedInExpertsList = []
    for expert in expertList:
        if expert.is_authenticated():
            loggedInExpertsList.append(expert)
    userObj = User.objects.get(id=request.user.id)
    if len(loggedInExpertsList) == 0:
        return HttpResponse(json.dumps({"chat_id": '', "user_name": user_name,  "status":True}), content_type = "application/json")
    else:
        try:
            cid = One_to_one_chat.objects.get(author=userObj, status='o')
        except Exception, e:
            print e
            for expert in loggedInExpertsList:
                count = One_to_one_chat.objects.filter(expert=expert, status='o').count()
                if count < 4:
                    cid = One_to_one_chat(expert=loggedInExpertsList[0], author=userObj, status='o')
                    cid.save()
        roomObj = Room.objects.get_or_create(cid)
        user_name = request.user.username.strip()
        return HttpResponse(json.dumps({"chatIdList": [roomObj.id], "user_name": user_name,  "status":True}), content_type = "application/json")


def send_expert_chat_id(request):
    expertObj = User.objects.get(id=request.user.id)
    cidobjList = One_to_one_chat.objects.filter(expert=expertObj)
    user_name = request.user.username.strip()
    if len(cidobjList) == 0:
        return HttpResponse(json.dumps({"chatIdList": '', "user_name": user_name,  "status":True}), content_type = "application/json")
    else:
        chatIdList = []
        for obj in cidobjList:
            roomObj = Room.objects.get_(obj)
            chatIdList.append(roomObj.id)
        return HttpResponse(json.dumps({"chatIdList": chatIdList, "user_name": user_name,  "status":True}), content_type = "application/json")
   

## Close chat room
def closeChatRoom(request):
    dataDictionary = json.loads(request.body)
    chatRoomId = dataDictionary['chatRoomId']
    roomObj = Room.objects.get(id=chatRoomId)
    oneToOneChatId = roomObj.object_id
    oneToOneChatObj = One_to_one_chat.objects.get(id=oneToOneChatId)
    oneToOneChatObj.status = 'f'
    oneToOneChatObj.save()
    return HttpResponse('')



## view for display home page
def homePage(request):
	return render_to_response('homepage.html')
