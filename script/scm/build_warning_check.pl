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
our $project_name              = "";
our $view_name_bahama          = "";
our $view_root_bahama          = "";
our $view_name_cypher_32m      = "";
our $view_root_cypher_32m      = "";
our $view_name_cypher_8m       = "";
our $view_root_cypher_8m       = "";
our $view_name_emerald_arm     = "";
our $view_root_emerald_arm     = "";
our $view_name_emerald_dsp     = "";
our $view_root_emerald_dsp     = "";
our $view_name_emerald_8m_arm  = "";
our $view_root_emerald_8m_arm  = "";
our $view_name_emerald_8m_dsp  = "";
our $view_root_emerald_8m_dsp  = "";
our $view_name_emerald_ngr_arm = "";
our $view_root_emerald_ngr_arm = "";
our $view_name_emerald_ngr_dsp = "";
our $view_root_emerald_ngr_dsp = "";
our $view_name_emerald_win32   = "";
our $view_root_emerald_win32   = "";
our $view_name_kw              = "";
our $view_root_kw              = "";
our $win_script_home           = "";
our $unix_script_home          = "";
our $local_data_home           = "";
our $remote_data_home          = "";
our $local_cs_file             = "";
our $remote_cs_file            = "";
our $archive_config_spec       = "";
our $archive_config_spec_win   = "";
our $vob_list                  = "";
our $main_vob                  = "";
our $full_file_int_branch      = "";
our $full_dir_int_branch       = "";
our $short_prefix_baseline     = "";
our $prefix_baseline           = "";
our $log_dir                   = "";
our $unix_log_dir              = "";
our $remote_log_dir            = "";
our $failed_mail_list          = "";
our $release_mail_list         = "";
our $tmpfile                   = "";
our $ver_files                 = "";
our $lock_file                 = "";
our $compass_directory         = "";
our $release_type              = "";
our $owned_list_file           = "";
our $matrix_core_list_file     = "";
our $loc_pro_name              = "";
our $kw_pro_name               = "";
our $fcl                       = "";
our $srp_fcl                   = "";
our $emerald_fcl               = "";
our $bahama_fcl                = "";
our $cypher_fcl                = "";
our $based_cs                  = "";
our $bahama_based_cs           = "";
our $cypher_based_cs           = "";
our $matrix_core_chang         = "";
our $comments                  = "";
our $last_baseline             = "";
our $new_baseline              = "";
our $delta_fcl                 = "";
our $last_I_version            = "";
our $new_I_version             = "";
our $srp_new_baseline          = "";
our $emerald_new_baseline      = "";
our $matrix_core_build         = "";

Utilities::get_parameter();

my $all_fcl_file      = "all_fcl.txt";
my @all_fcl_array     = ();
my @srp_fcl_array     = GetFileChangeList::get_file_list_array($srp_fcl);
my @emerald_fcl_array = GetFileChangeList::get_file_list_array($emerald_fcl);
my @bahama_fcl_array  = GetFileChangeList::get_file_list_array($bahama_fcl);
my @cypher_fcl_array  = GetFileChangeList::get_file_list_array($cypher_fcl);

if ( @srp_fcl_array > 0 )
{
    push( @all_fcl_array, @srp_fcl_array );
}

if ( @emerald_fcl_array > 0 )
{
    push( @all_fcl_array, @emerald_fcl_array );
}

if ( @bahama_fcl_array > 0 )
{
    push( @all_fcl_array, @bahama_fcl_array );
}

if ( @cypher_fcl_array > 0 )
{
    push( @all_fcl_array, @cypher_fcl_array );
}

if ( @all_fcl_array > 0 )
{
    open( INFO, "> $all_fcl_file" );
    foreach (@all_fcl_array)
    {
        print INFO "$_\n";
    }
    close(INFO);
}
else
{
    print "[ERROR] There have no any FCL\n";
}

my $cmd = "python $win_script_home\\Build_warning_check\\findNewWarnings.py -d $view_root_emerald_arm -f $all_fcl_file -l find_new_warning.log";
print "[DEBUG] $cmd\n";
my $ret = system("$cmd 2>&1");
if ( $ret != 0 )
{
    print "[ERROR] return $ret, there have new build warning\n";
}

exit 0;
