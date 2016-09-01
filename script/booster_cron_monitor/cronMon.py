import httplib, urllib
import time

timestamp = time.time()
print timestamp

headers = {'Content-type': 'application/json'}
payload = '{"pcid":"boosterlinux","timestamp":"%s"}' % timestamp
print payload

conn = httplib.HTTPConnection("JFRC74-02.ds.mot.com", 3000)
conn.request("POST", "/linuxkeepalive", payload, headers)
response = conn.getresponse()

print response.status, response.reason
print response.read()



conn.close()
