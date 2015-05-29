from django.conf.urls import patterns, include, url
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^homepage/$', 'dchat.views.homePage'),
    url(r'^send/$', 'dchat.views.send'),
    url(r'^receive/$', 'dchat.views.receive'),
    url(r'^sync/$', 'dchat.views.sync'),
    url(r'^join/$', 'dchat.views.join'),
    url(r'^leave/$', 'dchat.views.leave'),
    url(r'^room/id/expert/$', 'dchat.views.send_expert_chat_id'),
    url(r'^room/id/applicant/$', 'dchat.views.send_applicant_chat_id'),
    url(r'^room/close/$', 'dchat.views.closeChatRoom'),
)
