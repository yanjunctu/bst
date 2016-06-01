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

my @fcl_array      = GetFileChangeList::get_file_list_array($fcl);
my @comments_array = GetFileChangeList::get_file_list_array($comments);

my $upload_home              = "$local_data_home\\$project_name\\$new_baseline";

##################################################
# Upload to Compass
##################################################
my $tmp_dir = "$local_data_home\\$project_name\\tmp_upload_$new_baseline";
mkpath("$tmp_dir\\$new_baseline");
my $cp_cmd = "xcopy /Y /S /E  $upload_home $tmp_dir\\$new_baseline";
if ( system($cp_cmd) != 0 )
{
    print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
    exit 1;
}
my $upload_cmd = "perl $win_script_home\\Compass_FTP_upload\\Compass_ftp_upload.pl $tmp_dir $compass_directory";
print "[INFO] $upload_cmd\n";
my $ret = system("$upload_cmd");
print "[DEBUG] $ret\n";
if ( $ret != 0 )
{
    
    print "[ERROR] Meet error when run $upload_cmd\n";
    exit 1;
}

print "[DEBUG] Remove $tmp_dir ...\n";
rmtree("$tmp_dir");

exit 0;
