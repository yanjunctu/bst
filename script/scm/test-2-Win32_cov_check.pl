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
our $latest_cov_report     = "";

our $ir_branch     = "";
our $last_baseline = "";
our $new_baseline  = "";

Utilities::get_parameter();

if ( $release_type eq "D" )
{
    print "[INFO] Release type is $release_type, so this test will be ignore\n";
    exit 0;
}

##################################################
# Start run Win32 IT test
##################################################
$ENV{LOGONSERVER} = "\\\\ZCH49DSDC801";

my $mount_cmd = "subst.exe $repo_root $remote_repo_home";
print "[INFO] $mount_cmd\n";
system("$mount_cmd");

my $status = 0;
my $cmd    = "";

chdir("$repo_root") || die "[ERROR] Cannot chdir to $repo_root\n";

if ( $status == 0 )
{
    chdir("$repo_root\\pcr_srp\\test\\phyrCe_utest");

    system("cd");
    my $cmd = "python check_coverage.py $latest_cov_report";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when $cmd.\n";
        Utilities::record_log( "$remote_log_dir\\$ENV{BUILD_TAG}.failed", "Coverage check FAILED: $ENV{BUILD_URL}console" );
        exit 1;
    }
}

my $ut_output_folder = "$repo_root\\pcr_srp\\test\\phyrCe_utest\\output_utest";
if ( -e "$ut_output_folder\\merged_coverage_report.txt" )
{
    my $cp_cmd = "copy /Y $ut_output_folder\\merged_coverage_report.txt $latest_cov_report";
    print "$cp_cmd\n";
    if ( system($cp_cmd) != 0 )
    {
        print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
        exit 1;
    }
}
else
{
    print "[WARNING] $ut_output_folder\\merged_coverage_report.txt not exist\n";
}

exit 0;
