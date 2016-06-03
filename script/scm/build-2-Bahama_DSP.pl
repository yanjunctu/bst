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
# Start Bahama DSP
##################################################
$ENV{LOGONSERVER} = "\\\\ZCH49DSDC801";

my $mount_cmd = "subst.exe $repo_root $repo_home";
print "[INFO] $mount_cmd\n";
system("$mount_cmd");

my $status = 0;
my $cmd    = "";

# cut the version after '_'
$new_baseline =~ /(.*)_(.*)/;
my $current_dev_version = $2;

#Update the version information file
Utilities::update_version_info_file( "$repo_root\\bahama_platform\\tools\\Build\\ver.txt", $current_dev_version );

if ( $status == 0 )
{
    chdir("$repo_root\\bahama");
    if ($release_type eq "R")
    {
        print "[INFO] Bahama R release there have only one builder all_release\n";
        $cmd = "cd";
    }
    else
    {
        $cmd = "code\\path.bat && make dsp_all";        
    }
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "NGR DSP BUILD FAILED: $ENV{BUILD_URL}console" );
        exit 1;
    }
}

if ( $status == 0 )
{
    chdir("$repo_root\\bahama");
    $cmd = "code\\path.bat && make dsp_dvsi_all";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "NGR dsp_dvsi_all BUILD FAILED: $ENV{BUILD_URL}console" );
        exit 1;
    }
}

exit 0;
