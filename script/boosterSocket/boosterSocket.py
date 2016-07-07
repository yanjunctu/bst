"""
This module tries to setup a common method used to exchange msg between booster server and multi-client.

The exchange is based on socket, UDP protocol is used. And multi-threading is also used in server.

Besides server side, this module will also contain client side code.

what you should do to add new type of msg handler:
   a. defined a new opcode like KLOCWORK_WARNING_CHECK_OPCODE
   b. defined a new handler, like handleWarnKlocCheckResult()
   c. create a new msg type for client to call, like class WarnKlocCheckResult(BoosterMsg):


Precondition:

    python -m pip install pymongo
    
    
# Booster server Archtecture Diagram:

        +------------+
        | BaseServer |
        +------------+
              |
              v
        +-----------+ 
        | TCPServer |
        +-----------+ 
              |
              v
        +-----------+  +----------------+                  +--------------------+
        | UDPServer |  | ThreadingMixIn |                  | BaseRequestHandler |
        +-----------+  +----------------+                  +--------------------+
              |                |                                     |
              v                v                                     v
        +-------------------------------+                +--------------------------+       
        |       ThreadingUDPServer      |                | DatagramRequestHandler   |
        +-------------------------------+                +--------------------------+
                        |                                            |
                        v                                            v
        +-------------------------------+               +-------------------------------+
        |       BoosterServer           | ------>       |  BoosterRequestHandler        |
        +-------------------------------+               +-------------------------------+                 



###change log####

24 Mar 2016 -- initial version by yanjun


"""

import sys,socket,random,json,datetime
import smtplib
import email.utils
from email.mime.text import MIMEText
from pymongo import MongoClient
from SocketServer import ThreadingUDPServer,DatagramRequestHandler

SREVER_HOST_NAME = "booster"
SREVER_PORT = 16979


#OPCODE
KLOCWORK_WARNING_CHECK_OPCODE = "KLOCWORK_WARNING_CHECK"
KLOCWORK_WARNING_FIND_OPCODE = "KLOCWORK_WARNING_FIND"

#RESULT
SUCCESS_CODE     = "SUCCESS"
FAIL_CODE = "FAIL"

SOCKET_MAX_LEN = 65500
MSG_MAX_LEN = SOCKET_MAX_LEN-42
##########utility functions###################################

def sendEmail(name,mail,text,title):
  # Create the message
  msg = MIMEText(text)

  msg['To'] = email.utils.formataddr((name, mail))
  msg['From'] = email.utils.formataddr(('booster', 'booster@motorolasolutions.com'))
  msg['Subject'] = title

  server = smtplib.SMTP('remotesmtp.mot-solutions.com')
  #server.set_debuglevel(True) # show communication with the server
  try:
      server.sendmail('booster@motorolasolutions.com', [mail,'qpcb36@motorolasolutions.com','jhv384@motorolasolutions.com'], msg.as_string())
  finally:
      server.quit()

#######define all your opcode handlers functions here##########
def handleWarnKlocCheckResult(data):
  """
  This handler will response to write received klock and warning check result into database
  """
  
  print "I am in Handler"
  
  #get Mongo DB client Instance, connect to default port
  client = MongoClient();

  #get db
  db = client.booster

  #get collections
  collection = db.warningKlocwork.insert_one(data)


  return SUCCESS_CODE;

def handleWarnKlocFindResult(data):
  """
  This handler will response to write received klock and warning check result into database
  """
  
  print "I am in handleWarnKlocFindResult"
  
  
  #get Mongo DB client Instance, connect to default port
  client = MongoClient();

  #get db
  db = client.booster

  #typestr=json.dumps(releaseTag)

  #get collections
  records = db.warningKlocwork.find(data)
  #items ={}
  items=[]
  # if the return info will be truncated if it too big,so only return some useful msg 
  for record in records:
      item ={}
      item["buildNumber"] = record["buildNumber"]
      item["engineerName"] = record["engineerName"]
      item["issueIDs"] = record["issueIDs"]
      items.append(item)
  #check items len
  if len(str(items)) > MSG_MAX_LEN:
      return FAIL_CODE;
  return items;

#### mapping table for opcode and its callback function
registeredHandlers = {
  KLOCWORK_WARNING_CHECK_OPCODE:handleWarnKlocCheckResult,
  KLOCWORK_WARNING_FIND_OPCODE:handleWarnKlocFindResult
}


  
class BoosterMsg():
  """
  Base class for the msg instance exchanged between booster server and client
  """
  OPCODE = None
  def getSendMsg(self):
    # every msg should have opcode key, so put it assign value in base class
    msg = {"opcode":self.OPCODE}
    return msg;
  
class WarnKlocFindResult(BoosterMsg):
  """
  Like CI will check warning and klocwork, if have unclear items, CI will create one such message
  to send to server
  """  
  OPCODE = KLOCWORK_WARNING_FIND_OPCODE;
  
  def __init__(self,qury):
    self.qury = qury;

  def getSendMsg(self):
    msg = BoosterMsg.getSendMsg(self);
    msg["data"]= self.qury;
    return msg;

class WarnKlocCheckResult(BoosterMsg):
  """
  Like CI will check warning and klocwork, if have unclear items, CI will create one such message
  to send to server
  """  
  OPCODE = KLOCWORK_WARNING_CHECK_OPCODE;
  
  def __init__(self,releaseTag,engineerName,engineerMail,buildWarningCnt=0,klocworkCnt=0):
    self.releaseTag = releaseTag;
    self.engineerName = engineerName;
    self.engineerMail = engineerMail;
    self.buildWarningCnt = buildWarningCnt;
    self.klocworkCnt = klocworkCnt;
    
    i = datetime.datetime.now();
    self.date = "{year}/{month}/{day}".format(year=i.year,month=i.month,day=i.day);

  def getSendMsg(self):
    msg = BoosterMsg.getSendMsg(self);
    payload = {"releaseTag":self.releaseTag,"engineerName":self.engineerName,"engineerMail":self.engineerMail,"date":self.date,"buildWarningCnt":self.buildWarningCnt,"klocworkCnt":self.klocworkCnt};
    msg["data"]= payload;
    return msg;
    
    
  
class BoosterRequestHandler(DatagramRequestHandler):
  """
  In baseclass, have below import attr:
     rfile: a StringIO instance to store string received from client
     wfile: a StringIO instance used to stroe the string you want to send to client
     packet: received packet
     socket: client socket handler
     finish(): send the value of wfile to client
     server: server socket handler
     client_address: client's address
  """
  
    
  def handle(self):
    print "[recv from client]: "+ self.packet;
    
    #try:
    recvMsg = json.loads(self.packet);# convert string to json object
    
    """
    Below three lines is a little tricky, it is because recvMsg["opcode"] is already a object.
    If send this object to registeredHandlers[opcode]() as a argv, this argv will be changed in
    the functions, becuase the function internal is to store the object into db, before that, will
    append a new attr named "_id" for mongo db, but after this, json.dumps() can't handle to such
    data type, so we need to make a deep copy here before pass the object to the function, then original
    object not be influenced.
    """
    opcode = recvMsg["opcode"];
    dataObject = recvMsg["data"];
    dbData = dataObject.copy();#dataObject is a dictionary type, it own a copy() to do deep copy
    
    if opcode in registeredHandlers.keys():
        
      ret = registeredHandlers[opcode](dbData);
      recvMsg["result"] = ret;
    else:
      recvMsg["result"] = FAIL_CODE; 
    
    resultStr = json.dumps(recvMsg);
    #except:
    #  resultStr = json.dumps({"result":FAIL_CODE})
        
    self.wfile.write(resultStr);
    
    
    

    
class BoosterServer(ThreadingUDPServer):
  """
  In baseclass, including below import attr or method:
    - __init__(server_address, RequestHandlerClass):constructor
    - serve_forever(poll_interval=0.5): start loop running
  """
  
  def __init__(self, server_address,RequestHandlerClass):
    
    ThreadingUDPServer.__init__(self, server_address, RequestHandlerClass);
    print("booster socket start listening on port {}...".format(server_address));
    
  

class BoosterClient():
  """
  Client use this class to send udp packet to server socket
  """  
  def __init__(self):
    #create a udp socket
    self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM);
    
  def send(self,boosterMsg):
    """
    The argv is boosterMsg class, not string. We will convert to 
    string internal then send to server
    """
    ret = False;

    #use try here because, if aninvalid object, exception will happen when call json.dumps
    try:
      #get json object from boosterMsg
      msg = boosterMsg.getSendMsg();
      #convert object to string 
      msgStr = json.dumps(boosterMsg.getSendMsg());
      #send the json string to server, the server 's ip and port is predefined
      self.sock.sendto(msgStr,(SREVER_HOST_NAME,SREVER_PORT));
      ret = True;
    except:
      ret = False;

    return ret;

  def recv(self):
    """
    If you need to wait server's response, call this interface
    """
    return self.sock.recv(SOCKET_MAX_LEN)

        
if __name__ == "__main__":
  
  if len(sys.argv)<2 or sys.argv[1] not in ["start","sanitytest","sanitytest_get"]:
    print('''
    python boosterSocket.py start:               start server...
    python boosterSocket.py sanitytest:          A basic test
    ''');
    sys.exit()
  
  
  if sys.argv[1] == "start":
    #start server
    #can't bind server socket's name, pass a empty '' to it,otherwise, client can not send packet to it
    pBoosterServer = BoosterServer(('',SREVER_PORT),BoosterRequestHandler);
    pBoosterServer.serve_forever();
  
  
  #This is just a example for client to send msg to server
  if sys.argv[1] == "sanitytest":
    #simulate client
    wkresult = WarnKlocCheckResult(engineerName="engineerName",engineerMail="engineerMail",buildWarningCnt=12,klocworkCnt=13);
    interface = BoosterClient();
    ret = interface.send(wkresult);
    if ret:
      print "[send from client]: "+json.dumps(wkresult.getSendMsg());
      print "[recv from server]: "+interface.recv();
      #sendEmail('',"hello! booster","checked new warnings");
      
    else:
      print "send failed!"

    
  #This is just a example for client get msg from server
  if sys.argv[1] == "sanitytest_get":
    #simulate client
    #findresult = WarnKlocFindResult("REPT_I02.07.01.96");
    #qury = {"buildNumber":{"$gte":219-50,"$lte":219-34}}
    qury = {"releaseTag":"REPT_I02.07.01.96"}
    findresult = WarnKlocFindResult(qury)
    interface = BoosterClient();
    ret = interface.send(findresult);
    if ret:
      print "[send from client]: "+json.dumps(findresult.getSendMsg());
      #print "[recv from server]: "+interface.recv();
      receive = interface.recv();
      receive = json.loads(receive)
      print receive["result"]
      print  ret
      #records = interface.recv()
      #for record in records:
          #print record
      #sendEmail('',"hello! booster","checked new warnings");
    else:
      print "send failed!"
     
  
  