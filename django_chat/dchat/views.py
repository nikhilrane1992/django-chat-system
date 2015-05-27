from django.shortcuts import render
from django.shortcuts import HttpResponse, HttpResponseRedirect, render_to_response


# Create your views here.


## view for display home page
def homePage(request):
	return render_to_response('homepage.html')