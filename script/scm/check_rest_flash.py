
import sys
import os
import time
import re
import glob
from argparse import ArgumentParser
import subprocess


def main():
    parser = ArgumentParser()

    parser.add_argument('map_file', help='map file to parse')

    parsed = parser.parse_args()

    map_file = parsed.map_file

    # if map file existing
    if not os.path.exists(map_file):
        print 'Map file not exists: [%s]' % map_file

    # parse map file.
    rest_flash = 0
    f = open(map_file)
    m = re.search('FLASH_HOST_ROM(.+)', f.read())
    if m:
        ret = m.group(1).split()
        # print ret

        rest_flash = (int(ret[1], 16) - int(ret[2], 16)) / 1024
        print 'Rest Flash: [%s] KB' % rest_flash

    f.close()

    # exit with rest flash size (KB)
    exit(rest_flash)

if __name__ == "__main__":
    main()
