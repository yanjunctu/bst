
#from boosterSocket import sendEmail
import argparse
import sys
import smtplib
import email.utils
from email.mime.text import MIMEText

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

def process_argument():
    parser = argparse.ArgumentParser(description="description:email send", epilog=" %(prog)s description end")
    parser.add_argument('-n',dest="name")
    parser.add_argument('-e',dest="email")
    parser.add_argument('-m',dest="msg",nargs='*')
    parser.add_argument('-s',dest="subject",nargs='*')
    
    args = parser.parse_args()
    args.msg = " ".join(args.msg)
    args.subject = " ".join(args.subject)
    return args

if __name__ == "__main__":
  
    args = process_argument()
    sendEmail(args.name,args.email,args.msg,args.subject)
  

