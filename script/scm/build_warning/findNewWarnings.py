# -*- coding: utf-8 -*-
__author__ = 'phkc36, cpn873'


import argparse
import os
import datetime
from collections import OrderedDict

from BuildLogReader import BuildLogReader
from FclReader import FclReader



def get_new_warnings(buildLog, fcl, drive):
    tStart = datetime.datetime.now()

    build_log_reader = BuildLogReader(buildLog)
    warnings = build_log_reader.get_warnings()

    warning_files = set([file_name for (file_name, line_num) in warnings])

    fcl_reader = FclReader(drive, fcl, warning_files)
    changes = fcl_reader.get_changes()

    changed_files = set([file_name for (file_name, line_num) in changes])

    new_warnings = OrderedDict()
    for change  in changes:
        file_name, line = change
        for warning in warnings:
            w_file_name, w_line = warning
            warning_content = warnings[warning]

            if (file_name in w_file_name) and (line == w_line):
                new_warnings[(file_name, line)] = warning_content

    tEnd = datetime.datetime.now()
    print '\nChecked {w_cnt} warning(s), {f_cnt} file(s) ({l_cnt} lines) changed, takes {time}\n'.format(
        w_cnt=len(warnings), f_cnt=len(changed_files), l_cnt=len(changes), time=(tEnd-tStart))

    return new_warnings


def file_existed(filename):
    if not os.path.isfile(filename):
        raise argparse.ArgumentTypeError('fcl %r not found'%filename)
    return filename


def file_new(filename):
    try:
        f = open(filename, 'w')
    except Exception, e:
        raise argparse.ArgumentTypeError('could not write to file %r'%filename)
    f.close()
    return filename


def process_argument():
    parser = argparse.ArgumentParser(description="description:gennerate new warnings", epilog=" %(prog)s description end")
    parser.add_argument('-d',dest="drive", required = True)
    parser.add_argument('-f',dest="fcl", required = True, type=file_existed)
    parser.add_argument('-l',dest="build_log", required = True, type=file_existed)
    parser.add_argument('-o',dest="output", type=file_new)
    args = parser.parse_args()

    args.drive = args.drive.strip().rstrip(':')[0] + ':'

    return args


class Output(object):
    def __init__(self, dst):
        if dst is None:
            self.dst = None
        else:
            try:
                self.dst = open(dst, 'w')
            except Exception, e:
                self.dst = None
        return

    def out(self, string):
        if self.dst is not None:
            self.dst.write(string+'\n')
        else:
            print string
        return

    def close(self):
        if self.dst is not None:
            self.dst.close()


if __name__ == "__main__":
    args = process_argument()

    output = Output(args.output)

    new_warnings = get_new_warnings(args.build_log, args.fcl, args.drive)

    if (0 == len(new_warnings)):
        return_code = 0
        output.out('No new warning.')
    else:
        return_code = 1
        output.out('Introduced {cnt} new warning(s):\n'.format(cnt=len(new_warnings)))

        for (file_name, line) in new_warnings:
            output.out(file_name + ' ' + str(line))
            output.out(new_warnings[(file_name, line)])

    output.close()

    exit(return_code)

