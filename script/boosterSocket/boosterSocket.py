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

import sys,socket
from SocketServer import ThreadingUDPServer,DatagramRequestHandler

SERVER_CAN_NOT_HANDLE = "SERVER_CAN_NOT_HANDLE"

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
    self.wfile.write(SERVER_CAN_NOT_HANDLE);# content of wfile will be send back to client in baseclass, so set it value to not handle firstly

    
class BoosterServer(ThreadingUDPServer):
  """
  In baseclass, including below import attr or method:
    - __init__(server_address, RequestHandlerClass):constructor
    - serve_forever(poll_interval=0.5): start loop running
  """
  
  def __init__(self, server_address,RequestHandlerClass):
    
    ThreadingUDPServer.__init__(self, server_address, RequestHandlerClass);
    print("booster socket start listening on port {}...".format(server_address));
    
  

class BoosterClientInterface:
  
  def __init__(self,ip,port):
    self.server_address = (ip,port)
    # SOCK_DGRAM is the socket type to use for UDP sockets
    self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM);
    
  def send(self,data):
    self.sock.sendto(data,self.server_address);
    
  def recv(self):
    return self.sock.recv(1024);
  
    
  


        
if __name__ == "__main__":
  HOST,PORT = "localhost",8061;
  
  if len(sys.argv)<2:
    print('''
    python boosterSocket.py start:   start server...
    python boosterSocket.py client:  a base test
    ''');
    sys.exit()
  
  if sys.argv[1] == "start":
    #start server
    
    pBoosterServer = BoosterServer((HOST,PORT),BoosterRequestHandler);
    pBoosterServer.serve_forever();
  
  if sys.argv[1] == "client":
    #simulate client
    PSendInterface = BoosterClientInterface(HOST,PORT);
    PSendInterface.send("client sanity test")
    print "[recv from server]: "+PSendInterface.recv();
  
  