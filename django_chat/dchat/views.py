# -*- encoding: UTF-8 -*-
'''
Chat application views, some are tests... some are not
'''
from datetime import datetime

from django.http import HttpResponse, Http404
from django.contrib.auth.decorators import login_required
from django.shortcuts import HttpResponse, HttpResponseRedirect, render_to_response
from django.template import RequestContext
from django.contrib.auth.models import User 
import json
from models import Room, Message
# from models import UserGroup

@login_required
def send(request):
    '''
    Expects the following body parameters:
    chat_room_id
    message
    '''
    dataDictionary = json.loads(request.body)
    roomObj = Room.objects.get(id=int(dataDictionary['chat_room_id']))
    roomObj.say(request.user, dataDictionary['message'])
    return HttpResponse('')

@login_required
def sync(request):
    '''Return last message id

    EXPECTS the following POST parameters:
    id
    '''
    # if request.method != 'POST':
    #     raise Http404
    dataDictionary = json.loads(request.body)

    if not dataDictionary['id']:
        raise Http404

    roomObj = Room.objects.get(id=dataDictionary['id'])

    lastMsgId = roomObj.last_message_id()    

    return HttpResponse(jsonify({'last_message_id':lastMsgId}))

@login_required
def receive(request):
    print request.body
    '''
    Returned serialized data

    EXPECTS the following POST parameters:
    id
    offset

    This could be useful:
    @see: http://www.djangosnippets.org/snippets/622/
    '''
    if not request.body:
        raise Http404
    dataDictionary = json.loads(request.body)

    if not dataDictionary['id'] or not dataDictionary['offset']:
        raise Http404

    try:
        room_id = int(dataDictionary['id'])
    except:
        raise Http404

    try:
        offset = int(dataDictionary['offset'])
    except:
        offset = 0

    roomObj = Room.objects.get(id=room_id)

    msg = roomObj.messages(offset)

    return HttpResponse(jsonify(msg, ['id','author','message','type']))

@login_required
def join(request):
    '''
    Expects the following body parameters:
    chat_room_id
    message
    '''
    dataDictionary = json.loads(request.body)
    roomObj = Room.objects.get(id=int(dataDictionary['chat_room_id']))
    roomObj.join(request.user)
    return HttpResponse('')

@login_required
def leave(request):
    '''
    Expects the following POST parameters:
    chat_room_id
    message
    '''
    dataDictionary = json.loads(request.body)
    roomObj = Room.objects.get(id=int(dataDictionary['chat_room_id']))
    roomObj.leave(request.user)
    return HttpResponse('')

def jsonify(object, fields=None, to_dict=False):
    '''Funcion utilitaria para convertir un query set a formato JSON'''
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

def send_chat_id(request):
    userObj = User.objects.get(id=request.user.id)
    roomObj = Room.objects.get_or_create(userObj)
    user_name = request.user.username.strip()
    return HttpResponse(json.dumps({"chat_id": roomObj.id, "user_name": user_name,  "status":True}), content_type = "application/json")

## view for display home page
def homePage(request):
	return render_to_response('homepage.html')
