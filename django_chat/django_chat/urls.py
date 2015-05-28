from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    # url(r'^request/$', 'forum.views.forum'),

    url(r'^$', 'django_chat.views.test'),
    url(r'^chat_with_us/', 'django_chat.views.chatWithUs'),
    url(r'^chat/', include('dchat.urls')),
)+ static(settings.MEDIA_URL, document_root = settings.MEDIA_ROOT)
