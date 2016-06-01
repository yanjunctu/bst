#!perl

use strict;
use Cwd qw/abs_path/;
use File::Basename;
use File::Copy;
use File::Find;
use File::Path;
use lib abs_path( dirname(__FILE__) ) . "/PM";
use lib abs_path( dirname(__FILE__) );
use Config::IniFiles;

##################################################
# Include all PMs
##################################################
require CCHelper;
require StepCommon;
require GetFileChangeList;
require CheckFileChangeList;
require Merge;
require CreateBaseline;
require Utilities;

##################################################
# Defaine and get global parameters from ENV
##################################################
our $project_name                  = "";
our $view_name_bahama              = "";
our $view_root_bahama              = "";
our $view_name_cypher_32m          = "";
our $view_root_cypher_32m          = "";
our $view_name_cypher_8m           = "";
our $view_root_cypher_8m           = "";
our $view_name_emerald_arm         = "";
our $view_root_emerald_arm         = "";
our $view_name_emerald_dsp         = "";
our $view_root_emerald_dsp         = "";
our $view_name_emerald_8m_arm      = "";
our $view_root_emerald_8m_arm      = "";
our $view_name_emerald_8m_dsp      = "";
our $view_root_emerald_8m_dsp      = "";
our $view_name_emerald_ngr_arm     = "";
our $view_root_emerald_ngr_arm     = "";
our $view_name_emerald_ngr_dsp     = "";
our $view_root_emerald_ngr_dsp     = "";
our $view_name_emerald_win32       = "";
our $view_root_emerald_win32       = "";
our $view_name_kw                  = "";
our $view_root_kw                  = "";
our $win_script_home               = "";
our $unix_script_home              = "";
our $local_data_home               = "";
our $remote_data_home              = "";
our $local_cs_file                 = "";
our $remote_cs_file                = "";
our $archive_config_spec           = "";
our $archive_config_spec_win       = "";
our $vob_list                      = "";
our $main_vob                      = "";
our $full_file_int_branch          = "";
our $full_dir_int_branch           = "";
our $short_prefix_baseline         = "";
our $prefix_baseline               = "";
our $log_dir                       = "";
our $unix_log_dir                  = "";
our $remote_log_dir                = "";
our $failed_mail_list              = "";
our $release_mail_list             = "";
our $tmpfile                       = "";
our $ver_files                     = "";
our $lock_file                     = "";
our $compass_directory             = "";
our $release_type                  = "";
our $owned_list_file               = "";
our $matrix_core_list_file         = "";
our $loc_pro_name                  = "";
our $kw_pro_name                   = "";
our $fcl                           = "";
our $srp_fcl                       = "";
our $emerald_fcl                   = "";
our $bahama_fcl                    = "";
our $cypher_fcl                    = "";
our $based_cs                      = "";
our $bahama_based_cs               = "";
our $cypher_based_cs               = "";
our $matrix_core_chang             = "";
our $comments                      = "";
our $last_baseline                 = "";
our $new_baseline                  = "";
our $delta_fcl                     = "";
our $last_I_version                = "";
our $new_I_version                 = "";
our $srp_new_baseline              = "";
our $emerald_new_baseline          = "";
our $matrix_core_build             = "";

Utilities::get_parameter();

if ($kw_pro_name eq "")
{
    print "[INFO] KW_PRO_NAME is empty, so it will not run KW\n";
	exit 0;
}

# Clean view
my @vob_list = StepCommon::get_file_list_array("$vob_list");
StepCommon::clean_view_env_unix( "$view_name_kw", @vob_list );

$ENV{LOGONSERVER} = "\\\\ZCH49DSDC801";

##################################################
# Start build ARM
##################################################
my $mount_cmd = "net use $view_root_kw \\\\view\\$view_name_kw /Y";
print "[INFO] $mount_cmd\n";
system("$mount_cmd");

my $status = 0;
my $cmd    = "";

# Copy make.exe to \pcr_srp\code
my $cp_cmd = "copy /Y $win_script_home\\make.exe $view_root_kw\\pcr_srp\\code\\make.exe";
print "$cp_cmd\n";
if ( system($cp_cmd) != 0 )
{
    print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
    exit 1;
}

#mkpath("$view_root_kw\\pcr_srp\\code\\annofile", 1);

if ( $status == 0 )
{
    system("echo ==== %date% %time% ====");
    chdir("$view_root_kw\\pcr_srp\\code");
    system("cd");
    $cmd = "make matrix_32mb SCM_BUILD=Y";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
    }
}

if ( $status == 0 )
{
    system("echo ==== %date% %time% ====");
    chdir("$view_root_kw\\pcr_srp\\code");
    $cmd = "make host_32mb SCM_BUILD=Y";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
    }
}

if ( $status == 0 )
{
    system("echo ==== %date% %time% ====");
    chdir("$view_root_kw\\pcr_srp\\code");
    $cmd = "make dsp_32mb SCM_BUILD=Y";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
    }
}

if ( $status == 0 )
{
    system("echo ==== %date% %time% ====");
    chdir("$view_root_kw\\pcr_srp\\code");
    $cmd = "make bandit SCM_BUILD=Y";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";
    if ( $ret != 0 )
    {
        $status = 1;
        print "[ERROR] Meet error when build $cmd.\n";
    }
}


##################################################
# Run KW
##################################################
my $result = StepCommon::run_kw( "$kw_pro_name", "$new_baseline", "$view_root_kw\\pcr_srp\\code\\annofile", "\\\\zch49kw01\\Klocwork\\Server_10_2_1", "zch49kw01", "8080", "D:\\KW_Tables", "no" );

exit 0;
