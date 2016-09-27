#!/usr/bin/env python

# sample usage: checksites.py eriwen.com nixtutor.com yoursite.org

import pickle, os, sys,urllib2,time, re
import argparse
from sys import path

#script_from_dir = '/vagrant/booster_project/script/boosterSocket'
script_from_dir = '/opt/booster_project/script/boosterSocket'
path.append(script_from_dir)
from sendEmail import sendEmail


def is_status_changed(prev_results,url):

    status, urlfile = get_site_status(url)

    emailHeader = '%s is %s' % (url, status)
    emailMsg = "please notice :  {} ".format(emailHeader)
    print emailMsg

    if url in prev_results and prev_results[url]['status'] != status:
        # Email status messages
        sendEmail('','boosterTeam@motorolasolutions.com',emailMsg,emailHeader);
        
    # Create dictionary for url if one doesn't exist (first time url was checked)
    if url not in prev_results:
        prev_results[url] = {}
            
    # Save results for later pickling and utility use
    prev_results[url]['status'] = status
    
def get_site_status(url):
    try:
        urlfile = urllib2.urlopen(url);
        status_code = urlfile.code
        if status_code in (200,302):
            return 'up', urlfile
    except:
        pass
    return 'down', None

def is_internet_reachable():
    #Checks Google then baidu just in case one is down
    statusGoogle, urlfileGoogle = get_site_status('http://www.google.com')
    statusBaidu, urlfileYahoo = get_site_status('http://www.baidu.com')
    if statusGoogle == 'down' and statusBaidu == 'down':
        return False
    return True

def load_old_results(file_path):
    #Attempts to load most recent results
    pickledata = {}
    if os.path.isfile(file_path):
        picklefile = open(file_path, 'rb')
        pickledata = pickle.load(picklefile)
        picklefile.close()
    return pickledata

def store_results(file_path, data):
    #Pickles results to compare on next run
    output = open(file_path, 'wb')
    pickle.dump(data, output)
    output.close()


def normalize_url(url):
    #If a url doesn't have a http/https prefix, add http://
    if not re.match('^http[s]?://', url):
        url = 'http://' + url
    return url


def process_argument():
    parser = argparse.ArgumentParser(description="description:site monitor", epilog=" %(prog)s description end")
    parser.add_argument('-u',dest="urls", nargs='*',required = True)
    
    args = parser.parse_args()
    
    args.urls = map(normalize_url,args.urls)

    return args

if __name__ == '__main__':
    # Get argument flags
    args = process_argument()
    
    # Load previous data
    pickle_file = '/var/log/data.pkl' 
    pickledata = load_old_results(pickle_file)
        
    # update the last check time
    pickledata['lastcheck'] = time.strftime('%Y-%m-%d %H:%M:%S')

    # Check sites only if Internet is_available
    if is_internet_reachable():
        for url in args.urls:
            is_status_changed(pickledata,url)
    else:
        logging.error('Either the world ended or we are not connected to the net.')
    
    # Store results in pickle file
    store_results(pickle_file, pickledata)
    
    
    
    