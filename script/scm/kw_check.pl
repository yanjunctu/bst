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
our $kw_repo_home          = "";
our $kw_remote_repo_home    = "";
our $kw_repo_root           = "";

our $ir_branch     = "";
our $last_baseline = "";
our $new_baseline  = "";

Utilities::get_parameter();

if ( $kw_pro_name eq "" )
{
    print "[INFO] KW_PRO_NAME is empty, so it will not run KW\n";
    exit 0;
}

$ENV{LOGONSERVER} = "\\\\ZCH49DSDC801";

##################################################
# Clean repo
##################################################
chdir("$kw_repo_home\\..");
system("unjunction.bat");
chdir("$kw_repo_home");
my $cmd = "git reset --hard && git clean -d -fx";
my ( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");

    #Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
    exit 1;
}
chdir("$kw_repo_home\\..");
system("junction.bat");
chdir("$kw_repo_home");

##################################################
# checkout new baseline
##################################################
$cmd = "git fetch origin && git reset --hard $new_baseline";
( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");
    exit 1;
}

$cmd = "git submodule init && git submodule update";
( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");
    exit 1;
}

###################################################
## Start build ARM
###################################################
my $mount_cmd = "subst.exe $kw_repo_root $kw_remote_repo_home";
print "[INFO] $mount_cmd\n";
system("$mount_cmd");

my $status = 0;
my $cmd    = "";

# Copy make.exe to \pcr_srp\code
#my $cp_cmd = "copy /Y $win_script_home\\make.exe $kw_repo_root\\pcr_srp\\code\\make.exe";
#print "$cp_cmd\n";
#if ( system($cp_cmd) != 0 )
#{
#    print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
#    exit 1;
#}

#mkpath( "$kw_repo_root\\pcr_srp\\code\\annofile", 1 );

# for Bahama
if ( $status == 0 )
{
    system("echo ==== %date% %time% ====");
    chdir("$kw_repo_root\\bahama\\code");
    system("cd");
    $cmd = "path.bat && make matrix";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
        exit 1;
    }
}

if ( $status == 0 )
{
    system("echo ==== %date% %time% ====");
    chdir("$kw_repo_root\\bahama\\code");
    system("cd");
    $cmd = "path.bat && make arm_all";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
        exit 1;
    }
}

if ( $status == 0 )
{
    system("echo ==== %date% %time% ====");
    chdir("$kw_repo_root\\bahama\\code");
    system("cd");
    $cmd = "path.bat && make dsp_all";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
        exit 1;
    }
}

# for Cypher
if ( $status == 0 )
{
    system("echo ==== %date% %time% ====");
    chdir("$kw_repo_root\\pcr_srp\\code");
    system("cd");
    $cmd = "path.bat && make matrix_32mb";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
        exit 1;
    }
}

if ( $status == 0 )
{
    system("echo ==== %date% %time% ====");
    chdir("$kw_repo_root\\pcr_srp\\code");
    $cmd = "path.bat && make host_32mb";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
        exit 1;
    }
}

if ( $status == 0 )
{
    system("echo ==== %date% %time% ====");
    chdir("$kw_repo_root\\pcr_srp\\code");
    $cmd = "path.bat && make dsp_32mb";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
        exit 1;
    }
}

if ( $status == 0 )
{
    system("echo ==== %date% %time% ====");
    chdir("$kw_repo_root\\pcr_srp\\code");
    $cmd = "path.bat && make bandit";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
        exit 1;
    }
}

## copy the anno file from bahama to Cypher
my $cp_cmd = "xcopy /Y $kw_repo_root\\bahama\\code\\annofile\\*\.xml $kw_repo_root\\pcr_srp\\code\\annofile";
print "$cp_cmd\n";
if ( system($cp_cmd) != 0 )
{
    print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";

    #exit 1;
}

# Remove below file, it will cause KW failed
unlink("$kw_repo_root\\pcr_srp\\code\\annofile\\matrix_32mb_arm_legacy.xml");
unlink("$kw_repo_root\\pcr_srp\\code\\annofile\\default.xml");

##################################################
# Run KW
##################################################
my $result = Utilities::run_kw( "$kw_pro_name", "$new_baseline", "$kw_repo_root\\pcr_srp\\code\\annofile", "\\\\zch49kw01\\Klocwork\\Server_10_2_1", "zch49kw01", "8080", "D:\\KW_Tables", "no" );

exit 0;
