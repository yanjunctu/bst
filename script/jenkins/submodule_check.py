import sys
import os
import subprocess
import re

RET_OK = 0          # valid submodule commit
RET_CHECK_FAIL = 1  # invalid submodule commit
RET_ERR = 2         # error when executing this python script
VALID_SUBMODULE_REFS = {'bahama_codeplug': r'BAHAMA_CODEPLUG_FW_R[0-9.]+$',
                        'bahama_platform': r'.*', # don't check this submodule for now
                        'cgiss_subscriber': r'CGISS_SUBSCRIBER_R[0-9.]+$',
                        'gcp_networking': r'GCP_NETWORKING_R[0-9.]+$',
                        'gcp_nucleus_releases': r'GCP_NUCLEUS_R[0-9.]+$',
                        'samurai': r'SAMURAI_R[0-9.]+$',
                        'ssp_bios': r'SSP_BIOS_R[0-9.]+$',
                        'ssp_datalight': r'SSP_DATALIGHT_R[0-9.]+$',
                        'ssp_dsp_core': r'SSP_DSP_CORE_R[0-9.]+$',
                        'ssp_error_logging': r'SSP_ERROR_LOGGING_R[0-9.]+$',
                        'ssp_framer': r'SSP_FRAMER_R[0-9.]+$',
                        'ssp_hal': r'SSP_HAL_R[0-9.]+$',
                        'ssp_l1_timer': r'SSP_L1_TIMER_R[0-9.]+$',
                        'ssp_nucleus': r'SSP_NUCLEUS_R[0-9.]+$',
                        'ssp_rfim': r'SSP_RFIM_R[0-9.]+$',
                        'ssp_tools': r'SSP_TOOLS_R[0-9.]+$',
                        'ASN1': r'ASN1F(2.7_([DI]|MASTER_I)|_R)[0-9.]+$|develop',
                        'HTTPServer': r'HTTP(2.7_(I|MASTER_I)|_R)[0-9.]+$|develop',
                        'NCM': r'NCM(2.7_([DI]|MASTER_I)|_R)[0-9.]+$|develop',
                        'ServicePlatformAbstraction': r'SPA(2.7_([DI]|MASTER_I)|_R)[0-9.]+$|develop',
                        'tc': r'TC2.7_([DI]|MASTER_I)[0-9.]+$|develop'
                       }

def validateCommit(commitInfo):
    ret = False
    commitID = commitInfo[0]
    submodulePath = commitInfo[1]
    ref = commitInfo[2]

    key = os.path.basename(submodulePath) 
    if key in VALID_SUBMODULE_REFS.keys() and re.search(VALID_SUBMODULE_REFS[key], ref):
        return True

    cmd = 'git log -1 ' + commitID
    pwd = os.getcwd()
    pattern = r'Merge pull request #\d+ in .* from .* to (' + VALID_SUBMODULE_REFS[key] + r')'
    try:
        os.chdir(submodulePath)
        logInfo = subprocess.check_output(cmd, stderr=subprocess.STDOUT).split('\n')
        '''
        The following is an example output of a valid submodule commit, and the sixth line must be of the
        format 'Merge pull request #... in ... from ... to your-branch-name':
        commit d841b4f33e24c8bd08871a68e7f995b5c7c97984
        Merge: 7f57beb b5664ff
        Author: Garcia Daniel-C00265 <dan.garcia@motorolasolutions.com>
        Date:   Mon Jun 13 16:58:01 2016 -0400

            Merge pull request #2 in MOTOTRBO_INFRA/serviceplatformabstraction from cdcChange_pnw867_wintrbo_makefile to develop

            * commit 'b5664ff70c1bb077e5bba0daea2e1d9244edcd21':
            Wintrbo Makefile Change
            Change makefile to the new include path for pcr_srp headers
      '''
        if len(logInfo) >= 6 and re.search(pattern, logInfo[5]):
            ret = True
    except (IOError, subprocess.CalledProcessError) as err:
        print err

    os.chdir(pwd)
    return ret


if __name__ == '__main__':
    ret = RET_OK

    if len(sys.argv) != 2:
        print 'Usage: {} submodule-status-file'.format(sys.argv[0])
        sys.exit(RET_ERR)

    try:
        with open(sys.argv[1], 'r') as f:
            for line in f:
                match = re.search(r'([0-9a-fA-F]+)\s+(.*)\s+\((.*)\)', line)
                if not match:
                    print 'Invalid submodule status: {}'.format(line)
                    ret = RET_ERR
                    continue

                if not validateCommit(match.groups()):
                    print 'Invalid submodule commit {}'.format(line)
                    ret = RET_CHECK_FAIL
                    break
            f.close()

    except IOError as err:
        print '{}: {}'.format(sys.argv[0], err)
        ret = RET_ERR

    sys.exit(ret)

