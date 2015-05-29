from django.shortcuts import HttpResponse, HttpResponseRedirect, render_to_response
from django.template import RequestContext
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from dchat.models import Room, Message

@login_required
def test(request):
    '''Test the chat application'''

    u = User.objects.get(id=1) # always attach to first user id
    r = Room.objects.get_or_create(u)

    return render_to_response('homepage.html', {'js': ['/static/js/chat.js'], 'chat_id':r.pk}, context_instance=RequestContext(request))

@login_required
def chatWithUs(request):
    return render_to_response('singleChatIndex.html')


@login_required
def expertChat(request):
    return render_to_response('expertView/expertIndex.html')



