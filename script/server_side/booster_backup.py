import argparse
import sys
import os
import subprocess
import shutil
from pymongo import MongoClient
from pydrive.auth import GoogleAuth, InvalidCredentialsError, RefreshError, AuthenticationError
from pydrive.drive import GoogleDrive
from pydrive.settings import InvalidConfigError
from googleapiclient.errors import HttpError
from datetime import datetime


RET_OK = 0
RET_ERR = 1
BOOSTER_DB_NAME = 'booster'
# Append collections need to exported into this list, empty means all collections
BACKUP_COLLECTIONS = []
# Maximum number of files to return by Google Drive API per page
GDRIVE_MAX_RESULTS = 1000


def process_argument():
    err_msg = None
    parser = argparse.ArgumentParser(description='Export booster DB to Google Drive')
 
    parser.add_argument('-f', metavar='settings_file', dest='settings_file', required=True, help='setting files used to connect Google Drive')
    parser.add_argument('-m', metavar='max_files', dest='max_files', default=30, choices=range(1, 500), type=int, help='maxinum number of files included in the dest directory on Google Drive, the excess files will be removed in chronological order. Default is 30')
    parser.add_argument('backup_dir', metavar='BACKUP_DIR', help='absolute backup directory on Google Drive')
 
    args = parser.parse_args()
    if not os.path.isfile(args.settings_file):
        err_msg = 'no such settings file \'{}\''.format(args.settings_file)
    elif not os.path.isabs(args.backup_dir):
        err_msg = 'not an absolute pathname \'{}\''.format(args.backup_dir)
    elif args.max_files < 0:
        err_msg = 'invalid argument \'{}\''.format(args.max_files) 
 
    if err_msg:
        parser.print_help()
        print '\n{}: error: {}'.format(parser.prog, err_msg)
        sys.exit(RET_ERR)
 
    return args


def export_db(db_name, collections=None):
    output_dir = '/tmp/db_backup_{}'.format(datetime.now().strftime('%Y%m%d%H%M%S'))

    if not collections:
        collections = (MongoClient())[db_name].collection_names()
    
    os.mkdir(output_dir)
    try:
        for coll in collections:
            print 'Dumping collection {} in DB {}'.format(coll, db_name)
            cmd = 'mongodump -d {} -c {} -o {}'.format(db_name, coll, output_dir)
            subprocess.check_call(cmd.split())
        
        # Archive directory output_dir and save it as output_dir.zip at the same level of output_dir
        archive_file = shutil.make_archive(output_dir, format='zip', root_dir=output_dir)
    except (OSError, subprocess.CalledProcessError) as err:
        print 'Failed to dump db collection: {}'.format(err)
        archive_file = None

    shutil.rmtree(output_dir, ignore_errors=True)

    return archive_file


def connect_gdrive(settings_file):
    drive = None
    cwd = os.getcwd()
    settings_dir = os.path.dirname(settings_file)

    # Change current working directory firstly if necessary
    # to make sure that credentials specified in settings file 
    # can be saved in the correct path
    if settings_dir:
        os.chdir(settings_dir)

    gauth = GoogleAuth(os.path.basename(settings_file))
    try:
        gauth.LoadCredentialsFile()

        if not gauth.credentials:
            gauth.LocalWebserverAuth()
        elif gauth.access_token_expired:
            gauth.Refresh()
        else:
            gauth.Authorize()
    except (InvalidConfigError, InvalidCredentialsError, RefreshError, AuthenticationError) as err:
        print 'Faile to load credentials {}: {}'.format(settings_file, err)
    else:
        drive = GoogleDrive(gauth)
    
    os.chdir(cwd)

    return drive


def upload_gdrive(drive, src, dest, max_files):
    # All folders included in the dest path
    folder_names = [folder for folder in dest.split('/') if folder]
    # Use 'root' as the keyword of root folder
    parent_folder = 'root'

    try:
        # Find id of the last-level folder
        for folder in folder_names:
            query_clauses = "'{}' in parents and mimeType='application/vnd.google-apps.folder' and title='{}'".format(parent_folder, folder)

            # Should find 0 or one folder
            file_list = drive.ListFile({'q': query_clauses}).GetList()
            if not file_list:
                print 'Not found {} in {}'.format(folder, dest)
                return False
            parent_folder = (file_list[0]).get('id')
        
        # Remove extra backup files if necessary
        params = {
                    # Only search in the specific folder
                    'q': "'{}' in parents and trashed=false".format(parent_folder),
                    # Ordered by ascending modified time 
                    'orderBy': "modifiedDate",
                    # Maximum number of files to return per page
                    'maxResults': GDRIVE_MAX_RESULTS
                 }

        file_list = drive.ListFile(params).GetList()
        if len(file_list) >= max_files:
            for f in file_list[0:len(file_list)-max_files+1]:
                print 'Removing extra file {}...'.format(f['title'])
                f.Delete()
        
        # Upload the new backup file to the specific folder
        f = drive.CreateFile({'title': os.path.basename(src), 'parents': [{'id': parent_folder}]})
        f.SetContentFile(src)
        f.Upload()

    except HttpError as err:
        print 'Failed to upload {} to {}: {}'.format(src, dest, err)
        return False

    return True


def main():
    args = process_argument() 

    print 'Exporting Booster DB...'
    backup_file = export_db(BOOSTER_DB_NAME, BACKUP_COLLECTIONS)
    if not backup_file:
        print 'Failed to export db: {}, {}'.format(BOOSTER_DB_NAME, BACKUP_COLLECTIONS)
        sys.exit(RET_ERR)

    print 'Connecting to Google Drive...'
    drive = connect_gdrive(args.settings_file)
    if not drive:
        print 'Failed to connect to google drive with settings file: {}'.format(args.settings_file)
        os.remove(backup_file)
        sys.exit(RET_ERR)

    print 'Uploading backup file {} to {} on Google Drive...'.format(backup_file, args.backup_dir)
    if not upload_gdrive(drive, backup_file, args.backup_dir, args.max_files):
        print 'Failed to upload backup file {} to Google Drive'.format(backup_file)
        os.remove(backup_file)
        sys.exit(RET_ERR)

    print 'Done successfully.'
    os.remove(backup_file)
    sys.exit(RET_OK)


if __name__ == '__main__':
    main()

