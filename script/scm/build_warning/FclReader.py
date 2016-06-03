

import os
import re
import subprocess
import datetime



g_baseline_version = '0'


class FclReader(object):
    def __init__(self, drive = '', fcl = '', files_to_check = set()):
        self.drive = drive
        self.fcl = fcl
        self.files_to_check = [f.replace('/', os.sep) for f in files_to_check]


    def validate_fcl(self):
        if not os.path.isfile(self.fcl):
            return False
        return True


    def file_need_to_check(self, path):
        file_name = path.split('@@')[0]
        # skip libs, folders, txts...
        if '.' not in file_name:
            return False

        if not self.is_cpp_file(file_name):
            return False

        if (self.files_to_check is not None):
            for file_to_check in self.files_to_check:
                # file in FCL may be a substring of file in build log
                if file_name in file_to_check:
                    return True
        return False


    def is_cpp_file(self, file_name):
        cpp_exts = ['c', 'cpp', 'h', 'cxx', 'hpp']
        file_ext = file_name.rsplit('.', 1)[1].lower()
        if file_ext in cpp_exts:
            return True
        return False


    def pre_process(self, lines):
        processed_lines = []
        for line in lines:
            # remove leading and trailing spaces
            line = line.strip()
            line = line.split('#', 1)[0]

            # skip empty line and comment line
            if ('' == line) or line.startswith('load'):
                continue

            line = line.replace('/', os.sep)

            # remove duplicate lines
            if line not in processed_lines:
                processed_lines.append(line)
        return processed_lines


    def generate_diff(self):
        fl_pattern_str = r'(\S+@@\S+\\)(\d+)'
        fl_pattern = re.compile(fl_pattern_str)

        cs_pattern_str = r'element\s+\S+\s+\S+\\\d+'
        cs_pattern = re.compile(cs_pattern_str)

        with open(self.fcl, 'r') as f:
            lines = f.readlines()
        lines = self.pre_process(lines)

        diff_result = []
        for line in lines:
            # config spec format to fcl format, skip lines with labels or with clearcase commands...
            if line.startswith('element'):
                m = cs_pattern.match(line)
                if m is None:
                    continue
                else:
                    line = line.replace('element ', '', 1).strip()
                    line = ' '.join(line.split())       # replace multiple '    ' to ' '
                    line = line.replace(' ', '@@', 1)
                    if ' ' in line:
                        continue

            # remove leading '\vobs'
            if line.startswith("\\vobs"):
                line = line.replace('\\vobs', '', 1)

            m = fl_pattern.match(line)
            if m is None:
                continue
            vob_path = m.group(1)
            vob_version = m.group(2)

            if not self.file_need_to_check(vob_path):
                continue

            latest_path = self.drive + line
            baseline_path = self.drive + vob_path + g_baseline_version

            # latest version is used as baseline in diff command, 
            diff_command = 'cleartool diff -serial_format ' + latest_path + " "+ baseline_path

            #subprocess.call(diff_command, stdout=output)
            p = subprocess.Popen(diff_command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            output, out_err = p.communicate()

            if 0 != len(out_err):
                print out_err
            diff_result.extend(output.splitlines())

        return diff_result


    def get_changed_lines(self, diff_result):
        changed_lines = []

        for line in diff_result:
            # remove leading and trailing spaces
            line = line.strip()

            # skip empty line and comment line
            if ('' == line) or line.startswith('*'):
                continue

            '''
            <<< file 1: z:\ltd\code\matrix\common\source\low_level\startup\nucleusProfilerConfig.c@@\main\srp_main\srp_dev_main\SRP_COMMON_INT11\3
            >>> file 2: z:\ltd\code\matrix\common\source\low_level\startup\nucleusProfilerConfig.c@@\main\srp_main\srp_dev_main\SRP_COMMON_INT11\0
            '''
            # read current file name
            if line.startswith('<<< file 1: '):
                m = re.match(r'^<<< file 1: \w+:(.*)@@', line)
                if m is not None:
                    file_name = m.group(1).replace('\\', '/')
                continue

            # read modifications
            if not line.startswith('-----['):
                continue
            line = line.lstrip('-----[')

            # skip deleted lines
            if line.startswith('after'):
                '''
                -----[after 617 inserted 596-598]-----  # del
                '''
                continue

            if line.startswith('deleted'):
                '''
                -----[deleted 717-718 after 702]-----   # add
                -----[deleted/moved ??????              # add
                '''
                m = re.match(r'.* ((?:\d+-\d+)|\d+) after', line)
                if m is not None:
                    line_str = m.group(1)
                else:
                    continue
            elif ('changed to' in line):
                '''
                -----[482-483 changed to 476]-----      # modify & add
                -----[848-849 changed to 822-838]-----  # modify
                -----[769 changed to 736-749]-----      # modify # del
                '''
                line_str, sep, tail = line.partition('changed to')
            else:
                continue

            m = re.match(r'(\d+)-(\d+)', line_str)
            if m is not None:
                try:
                    line_start = int(m.group(1))
                    line_end = int(m.group(2))
                except Exception, e:
                    continue

                for line_num in range(line_start, line_end+1):
                    changed_lines.append((file_name, line_num))
            else:
                try:
                    line_num = int(line_str)
                except Exception, e:
                    continue
                changed_lines.append((file_name, line_num))

        return changed_lines


    def get_changes(self):
        if not self.validate_fcl():
            return None

        diff_result = self.generate_diff()

        changed_lines = self.get_changed_lines(diff_result)

        return changed_lines

