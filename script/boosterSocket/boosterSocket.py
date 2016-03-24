"""
This module tries to setup a common method used to exchange msg between booster server and multi-client.

The exchange is based on socket, UDP protocol is used. And multi-threading is also used in server.

Besides server side, this module will also contain client side code.

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

21 Mar 2016 -- initial version by yanjun


"""

import sys,socket,random,json,datetime
from SocketServer import ThreadingUDPServer,DatagramRequestHandler

SREVER_HOST_NAME = "ubuntu-14"
SREVER_PORT = 8061

SERVER_CAN_NOT_HANDLE = "SERVER_CAN_NOT_HANDLE"

#OPCODE
KLOCWORK_WARNING_CHECK = "KLOCWORK_WARNING_CHECK"

#RESULT
SUCCESS_CODE     = "SUCCESS"
FAIL_CODE = "FAIL"


#######define all your opcode handlers functions here##########
def handleWarnKlocCheckResult(data):
  print "hello I am in handler"
  return SUCCESS_CODE;





#### mapping table for opcode and its callback function
registeredHandlers = {
  KLOCWORK_WARNING_CHECK:handleWarnKlocCheckResult
}


  
class BoosterMsg():
  """
  Base class for the msg instance exchanged between booster server and client
  """
  OPCODE = None
  def getSendMsg(self):
    msg = {"opcode":self.OPCODE}
    return msg;
  
class WarnKlocCheckResult(BoosterMsg):
  """
  Like CI will check warning and klocwork, if have unclear items, CI will create one such message
  to send to server
  """  
  OPCODE = KLOCWORK_WARNING_CHECK;
  
  def __init__(self,engineerName,engineerMail,buildWarningCnt=0,klocworkCnt=0):
    self.engineerName = engineerName;
    self.engineerMail = engineerMail;
    self.buildWarningCnt = buildWarningCnt;
    self.klocworkCnt = klocworkCnt;
    
    i = datetime.datetime.now();
    self.date = "{year}/{month}/{day}".format(year=i.year,month=i.month,day=i.day);

  def getSendMsg(self):
    msg = BoosterMsg.getSendMsg(self);
    payload = {"engineerName":self.engineerName,"engineerMail":self.engineerMail,"date":self.date,"buildWarningCnt":self.buildWarningCnt,"klocworkCnt":self.klocworkCnt};
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
    
    #self.wfile.write(SERVER_CAN_NOT_HANDLE);# content of wfile will be send back to client in baseclass, so set it value to not handle firstly
    
    try:
      recvMsg = json.loads(self.packet);# convert string to json object
      opcode = recvMsg["opcode"];
      data = recvMsg["data"];
      if opcode in registeredHandlers.keys():
        ret = registeredHandlers[opcode](data);
        recvMsg["result"] = ret;
      else:
        recvMsg["result"] = FAIL_CODE;   
        
      resultStr = json.dumps(recvMsg);

    except:
      print "in exception"
      resultStr = json.dumps({"result":FAIL_CODE})
        
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
    
  def __init__(self):
    self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM);
    
  def send(self,boosterMsg):
    ret = False;

    try:
      msg = boosterMsg.getSendMsg();
      msgStr = json.dumps(boosterMsg.getSendMsg());
      self.sock.sendto(msgStr,(SREVER_HOST_NAME,SREVER_PORT));
      ret = True;
    except:
      ret = False;

    return ret;

  def recv(self):
    return self.sock.recv(1024);
        
if __name__ == "__main__":
  
  if len(sys.argv)<2 or sys.argv[1] not in ["start","sanitytest"]:
    print('''
    python boosterSocket.py start:               start server...
    python boosterSocket.py sanitytest:          A basic test
    ''');
    sys.exit()
  
  
  if sys.argv[1] == "start":
    #start server
    pBoosterServer = BoosterServer((SREVER_HOST_NAME,SREVER_PORT),BoosterRequestHandler);
    pBoosterServer.serve_forever();
  
  if sys.argv[1] == "sanitytest":
    #simulate client
    wkresult = WarnKlocCheckResult(engineerName="engineerName",engineerMail="engineerMail",buildWarningCnt=12,klocworkCnt=13);
    interface = BoosterClient();
    ret = interface.send(wkresult);
    if ret:
      print "[send from client]: "+json.dumps(wkresult.getSendMsg());
      #print "[recv from server]: "+interface.recv();
    else:
      print "send failed!"
  
  