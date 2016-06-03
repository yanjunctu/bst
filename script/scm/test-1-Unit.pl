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
our $remote_repo_home      = "";
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

if ($release_type eq "D")
{
    print "[INFO] Release type is $release_type, so this test will be ignore\n";
    exit 0;
}

my $latest_ut_report_file = "$remote_log_dir\\latest_ut_report.txt";

##################################################
# Start run Unit test
##################################################
$ENV{LOGONSERVER} = "\\\\ZCH49DSDC801";

my $mount_cmd = "subst.exe $repo_root $remote_repo_home";
print "[INFO] $mount_cmd\n";
system("$mount_cmd");

my $status = 0;
my $cmd = "python $repo_root\\pcr_srp\\test\\phyrCe_utest\\phyrCe_utest.py rebuild -bl run -ct";


chdir("$repo_root") || die "[ERROR] Cannot chdir to $repo_root\n";

if ( $status == 0 )
{
    chdir("$repo_root\\pcr_srp\\test\\phyrCe_utest\\");
    system ("cd");
    #$cmd = "python $repo_root\\pcr_srp\\test\\phyrCe_utest\\phyrCe_utest.py rebuild -bl run -cov -ecloud";

    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when $cmd.\n";
        Utilities::record_log("$remote_log_dir\\$ENV{BUILD_TAG}.failed", "Unit Test FAILED: $ENV{BUILD_URL}console");
        exit 1;
    }
}

exit 0;