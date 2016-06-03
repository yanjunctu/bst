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
# Start build ARM
##################################################
$ENV{LOGONSERVER} = "\\\\ZCH49DSDC801";

my $mount_cmd = "subst.exe $repo_root $repo_home";
print "[INFO] $mount_cmd\n";
system("$mount_cmd");

my $status = 0;
my $cmd    = "";

# build 32m MatrixCore
my $matrix_core_build = "true";
if ( $matrix_core_build eq "true" && $status == 0 )
{
    chdir("$repo_root\\pcr_srp\\code");

    if ( $release_type eq "R" )
    {
        $cmd = "path.bat && make matrix_8mb_host_release";
    }
    else
    {
        $cmd = "path.bat && make matrix_8mb_host";
    }
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";

    if ( $ret != 0 )
    {
        # re-try once
        print "[INFO] $cmd\n";
        $ret = system("$cmd 2>&1");
        if ( $ret != 0 )
        {
            $status = 1;
            Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "8M MATRIX ARM BUILD FAILED: $ENV{BUILD_URL}console" );
            print "[ERROR] Meet error when build 8M ARM MATRIX.\n";
            exit 1;
        }
    }

}

if ( $status == 0 )
{
    chdir("$repo_root\\pcr_srp\\code");
    if ( $release_type eq "R" )
    {
        $cmd = "path.bat && make host_8mb_release";
    }
    else
    {
        $cmd = "path.bat && make host_8mb";   
    }

    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "host_8mb BUILD FAILED: $ENV{BUILD_URL}console" );
        exit 1;
    }
}

exit 0;
