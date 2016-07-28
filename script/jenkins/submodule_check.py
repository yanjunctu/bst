import sys
import os
import re
import subprocess
import argparse

RET_OK = 0
RET_ERR = 1
# Patterns for D/R build
VALID_SUBMODULE_REFS_D = {'bahama_codeplug': r'BAHAMA_CODEPLUG_FW_R[0-9.]+$',
                          'bahama_platform': r'master',
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
                          'ASN1': r'ASN1F2.7_(D|MASTER_I)[0-9.]+$',
                          'HTTPServer': r'HTTP2.7_(D|MASTER_I)[0-9.]+$',
                          'NCM': r'NCM2.7_(D|MASTER_I)[0-9.]+$',
                          'ServicePlatformAbstraction': r'SPA2.7_(D|MASTER_I)[0-9.]+$',
                          'tc': r'TC2.7_(D|MASTER_I)[0-9.]+$'
                         }
# Patterns for I build
VALID_SUBMODULE_REFS_I = {'bahama_codeplug': r'BAHAMA_CODEPLUG_FW_R[0-9.]+$',
                          'bahama_platform': r'master',
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
ALL_VALID_SUBMODULE_REFS = {'d': VALID_SUBMODULE_REFS_D, 'i': VALID_SUBMODULE_REFS_I, 'r': VALID_SUBMODULE_REFS_D}

def validateCommit(buildType, submoduleName, commitID, ref):
    ret = False
    buildPatterns = ALL_VALID_SUBMODULE_REFS[buildType]

    if submoduleName not in buildPatterns.keys():
        print '[ERROR]Submodule without any filter rule: {} {} {}'.format(submoduleName, commitID, ref)
        return False

    rule = buildPatterns[submoduleName]
    if re.search(rule, ref):
        return True

    cmd = 'git log -1 ' + commitID
    pattern = r'Merge pull request #\d+ in .* from .* to \b(' + rule + r')\b'
    try:
        logInfo = subprocess.check_output(cmd.split(), stderr=subprocess.STDOUT).split('\n')
        '''
        The following is an example output of a valid submodule commit, and the sixth line must be of the
        format 'Merge pull request #... in ... from ... to a-valid-branch':
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
    except subprocess.CalledProcessError as err:
        print '[ERROR]{}'.format(err)

    return ret

# Sync the submodule config if it is changed
def updateConfig(oldCommit):
    try:
        # No need to update submodule config if .gitmodules is not changed
        cmd = 'git diff-tree {} HEAD -- .gitmodules'.format(oldCommit)
        if not subprocess.check_output(cmd.split()):
            return RET_OK

        # TODO: 1. Only init and sync the changed submodules, not all
        #       2. Update submodule directories if submodules are remmoved or path-changed
        print 'Init submodule config'
        subprocess.check_call(['git', 'submodule', 'init'])
        print 'Sync submodule config'
        subprocess.check_call(['git', 'submodule', 'sync', '--recursive'])
    except subprocess.CalledProcessError as err:
        print '[ERROR]{}'.format(err)
        return RET_ERR

    return RET_OK


# Update submodule directories and check whether the new submodule commits are valid if there are any
def updateCommit(buildType, oldCommit):
    ret = RET_OK
    pwd = os.getcwd()

    try:
        # Submodules newly added, the diff-format looks like this:
        # +[submodule "booster"]
        # +       path = booster
        # +       url = ssh://git@bitbucket.mot-solutions.com:7999/mototrbo_infra_fw/booster.git
        output = subprocess.check_output('git diff {} HEAD -- .gitmodules'.format(oldCommit).split())
        matches = re.findall(r'^\+\[submodule .*\]\n^\+\s+path = (.*)\n^\+\s+url = .*', output, re.MULTILINE)
        # Submodules already added but changed
        output = subprocess.check_output(['git', 'status'])
        matches += re.findall(r'^\s+modified:\s+(.*)\s+\(.*\)', output, re.MULTILINE)
        # Now the list 'matches' should include all changed/added submodules, check them one by one
        for submodulePath in matches:
            objInfo = subprocess.check_output('git ls-tree HEAD {}'.format(submodulePath).split()).split()
            if objInfo[1] != 'commit':
                print '[INFO]Not a submodule object: {}'.format(objInfo)
                continue

            os.chdir(submodulePath)
            submoduleName = os.path.basename(submodulePath)
            commitID = objInfo[2]

            ref = subprocess.check_output('git describe --all {}'.format(commitID).split())
            print 'Check new submodule commit: {} {} {}'.format(submodulePath, submoduleName, commitID)
            if not ref or not validateCommit(buildType, submoduleName, commitID, ref):
                print '[ERROR]Invalid submodule commit: {} {} {}'.format(submodulePath, commitID, ref)
                os.chdir(pwd)
                return RET_ERR

            os.chdir(pwd)

        print 'Update new submodule commits'
        for submodulePath in matches:
            subprocess.check_call('git submodule update -f --recursive {}'.format(submodulePath).split())
    except (OSError, subprocess.CalledProcessError) as err:
        print '[ERROR]{}'.format(err)
        os.chdir(pwd)
        ret = RET_ERR

    return ret


if __name__ == '__main__':
    ret = RET_OK
    pwd = os.getcwd()
    parser = argparse.ArgumentParser('Check whether all submodule commits are valid')

    print ' '.join(sys.argv)

    parser.add_argument('-t', dest='type', choices=['d', 'D', 'i', 'I', 'r', 'R'], required=True,
                        help='build types, i/I for I build, d/D for D build, r/R for R build'
                       )
    parser.add_argument('oldCommit', metavar='old-commit',
                        help='old commit id used to get the differences from HEAD commit'
                       )

    args = parser.parse_args()
    oldCommit = args.oldCommit
    buildType = args.type.lower()
    try:
        rootDir = subprocess.check_output(['git', 'rev-parse', '--show-toplevel']).rstrip()
    except (OSError, subprocess.CalledProcessError) as err:
        print '[ERROR]Failed to get root directory of the repo: {}'.format(err)
        sys.exit(RET_ERR)
    
    os.chdir(rootDir)
    if not os.path.isfile('.gitmodules'):
        print '[ERROR]No such file .gitmodules in current directory: {}'.format(rootDir)
        sys.exit(RET_ERR)

    print 'Process submodule config...'
    if RET_OK != updateConfig(oldCommit):
        print '[ERROR]Failed to update submodule config'
        sys.exit(RET_ERR)
    print 'Done'
    
    print 'Process submodule commit...'
    if RET_OK != updateCommit(buildType, oldCommit):
        print '[ERROR]Failed to update submodule commit'
        sys.exit(RET_ERR)
    print 'Done'
    os.chdir(pwd)

    sys.exit(RET_OK)

