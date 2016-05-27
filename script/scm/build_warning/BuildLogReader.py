

import os
import re



class BuildLogReader(object):
    def __init__(self, buildLog=''):
        self.buildLog = buildLog

    def validate_log(self):
        if not os.path.isfile(self.buildLog):
            return False
        return True

    def get_warnings(self):
        if not self.validate_log():
            return None

        #warning_pattern_str = '''(^\"(?P<file_name>[^\"]{1,})\",\sline\s(?P<line_num>\d{1,})\:\swarning\s\#(?P<warning_ID>\d{1,})\-.*\n(\s{1,}[^\^]{1,}\n){1,}(\s{1,}\^\s{0,}\^{0,}){1,})'''
        warning_pattern_str = r'''^"(?P<file_name>[^"]+)", line (?P<line_num>\d+): warning #(?P<warning_ID>\d+)-.*\n(\s*[^^]+\n)+(\s*\^.*)+'''
        warning_pattern = re.compile(warning_pattern_str, re.IGNORECASE|re.MULTILINE)

        warnings = {}
        with open(self.buildLog, 'r') as f:
            content = f.read()

        matches = [m for m in warning_pattern.finditer(content)]
        for match in matches:
            try:
                file_name = match.groupdict()['file_name'].replace('\\', '/')
                line_num = int(match.groupdict()['line_num'])
                pos = (file_name, line_num)
                warnings[pos] = match.group(0).replace('\\', '/')
            except Exception, e:
                continue
        #print len(matches)

        return warnings




