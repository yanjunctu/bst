
from boosterSocket import sendEmail
import argparse
import sys

def process_argument():
    parser = argparse.ArgumentParser(description="description:email send", epilog=" %(prog)s description end")
    parser.add_argument('-n',dest="name")
    parser.add_argument('-e',dest="email")
    parser.add_argument('-m',dest="msg",nargs='*')
    parser.add_argument('-t',dest="title",nargs='*')
    
    args = parser.parse_args()
    args.msg = " ".join(args.msg)
    args.title = " ".join(args.title)
    return args

if __name__ == "__main__":
  
    args = process_argument()
    sendEmail(args.name,args.email,args.msg,args.title)
  
  