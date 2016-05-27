#!perl

use strict;
use Cwd qw/abs_path/;
use File::Basename;
use File::Copy;
use File::Find;
use File::Path;
use lib abs_path( dirname(__FILE__) ) . "/libs";
##################################################
# Include all PMs
##################################################
require Utilities;

##################################################
# Defaine and get global parameters from ENV
##################################################
our $project_name          = "";
our $repo_home             = "";
our $repo_root             = "";
our $win_script_home       = "";
our $unix_script_home      = "";
our $local_data_home       = "";
our $remote_data_home      = "";
our $int_branch            = "";
our $short_prefix_baseline = "";
our $prefix_baseline       = "";
our $log_dir               = "";
our $unix_log_dir          = "";
our $remote_log_dir        = "";
our $failed_mail_list      = "";
our $release_mail_list     = "";
our $tmpfile               = "";
our $ver_files             = "";
our $lock_file             = "";
our $release_type          = "";
our $loc_pro_name          = "";
our $kw_pro_name           = "";

our $ir_branch     = "";
our $last_baseline = "";
our $new_baseline  = "";

Utilities::get_parameter();

##################################################
# Start build Matrix and ARM
##################################################
my $status = 0;

my $mount_cmd = "subst.exe $repo_root $repo_home";
print "[INFO] $mount_cmd\n";
system("$mount_cmd");

$ENV{LOGONSERVER} = "\\\\ZCH49DSDC801";

chdir("$repo_root\\bahama");

if ( $status == 0 )
{
    my $cmd = "code\\path.bat && make tc_compiler";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        #system("\@echo TC_Compiler BUILD FAILED: %BUILD_URL%console> $log_dir\\%BUILD_TAG%.failed");
        Utilities::record_log("$log_dir\\$ENV{BUILD_TAG}.failed", "TC_Compiler BUILD FAILED: $ENV{BUILD_URL}console");
        print "[ERROR] Meet error when build tc_compiler.\n";
        $status = 1;
        exit 1;
    }
}

if ( $status == 0 )
{
    my $cmd = "code\\path.bat && make dsp_itf_all";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        #system("\@echo DSP_ITF BUILD FAILED: %BUILD_URL%console> $log_dir\\%BUILD_TAG%.failed");
        Utilities::record_log("$log_dir\\$ENV{BUILD_TAG}.failed", "DSP_ITF BUILD FAILED: $ENV{BUILD_URL}console");
        print "[ERROR] Meet error when build make dsp_itf_all.\n";
        $status = 1;
        exit 1;
    }
}

if ( $status == 0 )
{
    my $cmd = "code\\path.bat && make dsp_dvsi_all";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        #system("\@echo DSP_DVSI BUILD FAILED: %BUILD_URL%console> $log_dir\\%BUILD_TAG%.failed");
        Utilities::record_log("$log_dir\\$ENV{BUILD_TAG}.failed", "DSP_DVSI BUILD FAILED: $ENV{BUILD_URL}console");
        print "[ERROR] Meet error when build make dsp_dvsi_all.\n";
        $status = 1;
        exit 1;
    }
}

exit 0;
