# -*- encoding: UTF-8 -*-
from datetime import datetime

from django.http import HttpResponse, Http404
from django.contrib.auth.decorators import login_required
from django.shortcuts import HttpResponse, HttpResponseRedirect, render_to_response
from django.template import RequestContext
from django.contrib.auth.models import User, Group
import json
from models import Room, Message, One_to_one_chat, Applicant
from django.contrib.sessions.models import Session
from django.utils import timezone

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
        roomObj = Room.objects.get(id=i['chat_id'])
        last_message_id = roomObj.last_message_id_list()
        lastMessageIdList.append({'last_message_id': last_message_id, 'chat_id': roomObj.id})
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
            offset = obj['last_message_id']
        except:
            offset = 0

        roomObj = Room.objects.get(id=room_id)
        msg = roomObj.messages(offset)
        for i in msg:
            try:
                applicant = Applicant.objects.get(applicant=i.author)
                profile_pic = '/Media/'+ str(applicant.thumbnail)
                print 'profile_pic', profile_pic
            except Exception, e:
                print e
                profile_pic = '/Media/appliant_profile_photo/default.jpg'
            obj = {'id': i.id, 'author': i.author.username, 'message': i.message, 'type': i.type, 'chat_id': i.room.id, 'profile_pic': profile_pic}
            msgList.append(obj)
    return HttpResponse(json.dumps({'msgList': msgList}), content_type = "application/json")

@login_required
def join(request):
    dataDictionary = json.loads(request.body)
    chatIdList = dataDictionary['chatIdList']
    for i in chatIdList:
        roomObj = Room.objects.get(id=int(i['chat_id']))
        roomObj.join(request.user)
    return HttpResponse('')

@login_required
def leave(request):
    dataDictionary = json.loads(request.body)
    chatIdList = dataDictionary['chatIdList']
    for i in chatIdList:
        roomObj = Room.objects.get(id=int(i))
        roomObj.leave(request.user)
        roomObj = Room.objects.get(id=i)
        oneToOneChatId = roomObj.object_id
        oneToOneChatObj = One_to_one_chat.objects.get(id=oneToOneChatId)
        oneToOneChatObj.status = 'f'
        oneToOneChatObj.save()
    return HttpResponse('')

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

def get_all_logged_in_users():
    # Query all non-expired sessions
    # use timezone.now() instead of datetime.now() in latest versions of Django
    sessions = Session.objects.filter(expire_date__gte=timezone.now())
    uid_list = []

    # Build a list of user ids from that query
    for session in sessions:
        data = session.get_decoded()
        uid_list.append(data.get('_auth_user_id', None))

    # Query all logged in users based on id list
    return User.objects.filter(id__in=uid_list, groups__name='EXPERT')

def send_applicant_chat_id(request):
    loggedInExpertsList = get_all_logged_in_users()
    print loggedInExpertsList
    userObj = User.objects.get(id=request.user.id)
    if len(loggedInExpertsList) == 0:
        return HttpResponse(json.dumps({"validation": 'No expert available at this time might be busy in another chats', "status":True}), content_type = "application/json")
    else:
        try:
            cid = One_to_one_chat.objects.get(author=userObj, status='o')
        except Exception, e:
            print e
            countList = []
            for expert in loggedInExpertsList:
                count = One_to_one_chat.objects.filter(expert=expert, status='o').count()
                countList.append({'count': count, 'expert': expert})
            # expert = min(s['count'] for s in countList)
            expert = min(countList, key=lambda k: k)
            print '--------->', expert
            cid = One_to_one_chat(expert=expert['expert'], author=userObj, status='o')
            cid.save()
        roomObj = Room.objects.get_or_create(cid)
        user_name = request.user.username.strip()
        try:
            applicant = Applicant.objects.get(applicant=request.user)
            profile_pic = '/Media/'+ str(applicant.thumbnail)
            print 'profile_pic', profile_pic
        except Exception, e:
            print e
            profile_pic = '/Media/appliant_profile_photo/default.jpg'
        return HttpResponse(json.dumps({"chatIdList": [{'chat_id': roomObj.id, 'username': user_name, 'profile_pic': profile_pic}], 
            "user_name": user_name, "status":True}), content_type = "application/json")


def send_expert_chat_id(request):
    expertObj = User.objects.get(id=request.user.id)
    cidobjList = One_to_one_chat.objects.filter(expert=expertObj, status='o')
    user_name = request.user.username.strip()
    if len(cidobjList) == 0:
        return HttpResponse(json.dumps({"chatIdList": '', "user_name": user_name,  "status":True}), content_type = "application/json")
    else:
        chatIdList = []
        for obj in cidobjList:
            try:
                applicant = Applicant.objects.get(applicant=obj.auther)
                profile_pic = '/Media/'+ str(applicant.thumbnail)
            except Exception, e:
                print e
                profile_pic = '/Media/appliant_profile_photo/default.jpg'
            roomObj = Room.objects.get_(obj)
            chatIdList.append({'chat_id': roomObj.id, 'username': obj.author.username, 'profile_pic': profile_pic})
        return HttpResponse(json.dumps({"chatIdList": chatIdList, "user_name": user_name, 'profile_pic': profile_pic, "status":True}), content_type = "application/json")


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

def loadEarlierMessages(request):
    dataDictionary = json.loads(request.body)
    chatRoomId = dataDictionary['chatRoomId']
    roomObj = Room.objects.get(id=chatRoomId)
    try:
        offset = int(dataDictionary['last_message_id']) 
    except Exception, e:
        print e
        offset = 0

    msg, last_message_id = roomObj.load_earlier_messages(offset)
    msgList = []
    for i in msg:
        try:
            applicant = Applicant.objects.get(applicant=i.author)
            profile_pic = '/Media/'+ str(applicant.thumbnail)
        except Exception, e:
            print e
            profile_pic = '/Media/appliant_profile_photo/default.jpg'

        obj = {'id': i.id, 'author': i.author.username, 'profile_pic': profile_pic, 'message': i.message, 'type': i.type, 'chat_id': i.room.id}
        msgList.append(obj)
    return HttpResponse(json.dumps({'msgList': msgList, 'last_message_id': last_message_id, 'chatRoomId': roomObj.id}), content_type = "application/json")

## view for display home page
def homePage(request):
	return render_to_response('homepage.html')
