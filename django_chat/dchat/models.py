from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class messages(models.Model):
    '''Representation of a generic chat room'''
    # belongs_to_type = models.CharField(max_length=100, blank=True, null=True)
    # belongs_to_id = models.IntegerField(blank=True, null=True)
    created = models.DateTimeField()
    comment = models.TextField(blank=True, null=True)
    user = models.ForeignKey('User')
    # objects = RoomManager() # custom manager

    def return_user(self):
    	return self.user



