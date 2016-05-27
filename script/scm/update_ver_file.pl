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

my $view_name_update_ver = $ENV{VIEW_NAME_UPDATE_VER};
my @ver_files_array      = StepCommon::get_file_list_array($ver_files);

print "[DEBUG] update version view: $view_name_update_ver\n";

##################################################
# Craete related branch for version files
##################################################

my ( $result, $created_list, $create_failed_list ) = StepCommon::create_branch_if_not_exist( $view_name_update_ver, $full_file_int_branch, @ver_files_array );
if (@$create_failed_list)
{
    print "[ERROR] Create related branch for below file failed!\n";
    print "====================================================================================================================\n";
    StepCommon::print_hudson_line(@$create_failed_list);
    print "====================================================================================================================\n";
    Utilities::record_log( "$unix_log_dir/$ENV{BUILD_TAG}.failed", "Update version FAILED: $ENV{BUILD_URL}console" );
    exit 1;
}

##################################################
# Main function
##################################################
foreach my $ver_file (@ver_files_array)
{
    replace_version_file($ver_file);
}

sub replace_version_file
{
    my ($ver_file) = @_;

    CCHelper::check_out( $view_name_update_ver, "$ver_file" . "\@\@" . "$full_file_int_branch" );

    my $new_version;
    my $last_version;

    if ( $new_baseline =~ /^(.*)_(.*)/ )
    {
        $new_version = $2;
    }

    if ( $last_baseline =~ /^(.*)_(.*)/ )
    {
        $last_version = $2;
    }

    #update the version
    my $ret = replace_version( $view_name_update_ver, $ver_file, $last_version, $new_version );
    if ( $ret != 0 )
    {
        StepCommon::print_error_message("Update the version file $ver_file error!");
        Utilities::record_log( "$unix_log_dir/$ENV{BUILD_TAG}.failed", "Update version FAILED: $ENV{BUILD_URL}console" );
        exit 1;
    }

    StepCommon::print_info_message("Tag label and checkin the version number files");
    my ( $Operation_Result, @step_output ) = CCHelper::tag_label_on_one_file_replace( $view_name_update_ver, $ver_file, $new_baseline );
    ( $Operation_Result, @step_output ) = CCHelper::check_in( $view_name_update_ver, $ver_file, 1 );
    if ($Operation_Result)
    {
        StepCommon::print_error_message("check in version file $ver_file fault!");
        StepCommon::print_hudson_line(@step_output);
        Utilities::record_log( "$unix_log_dir/$ENV{BUILD_TAG}.failed", "Update version FAILED: $ENV{BUILD_URL}console" );
        exit 1;
    }
}

sub replace_version
{
    my ( $view_name, $file_path, $last, $new ) = @_;
    
    $new=~s/(^\s+|\s+$)//g;
    if ( $new =~ /^(\D)(\d{2})\.(\d{2})\.(\d{2})$/ )
    {
        print "[DEBUG] xx.xx.xx\n";
        my $cmd = "#!/bin/bash\n";
        $cmd .= "sed -i -r s/[A-Z][0-9]{2}\\.[0-9]{2}\\.[0-9]{2}/$new/g $file_path";

        print "$cmd\n";
        open TMP, ">$tmpfile";
        print TMP $cmd;
        close TMP;

        $cmd = "chmod 755 \"$tmpfile\"";
        print "$cmd\n";
        system($cmd);

        my $ret = CCHelper::list_cmd( $view_name, "$tmpfile" );
        if ( $ret != 0 )
        {
            StepCommon::print_error_message("meet error when $tmpfile!");
            return $ret;
        }

        $new =~ /^(\D)(\d{2})\.(\d{2})\.(\d{2})/;
        my $baseline_type = $1;
        my $ver_1         = $2;
        my $ver_2         = $3;
        my $ver_3         = $4;

        $cmd = "#!/bin/bash\n";
        $cmd .= "sed -i -r s/\\'[A-Z]\\',0x[0-9]{2},0x[0-9]{2},0x[0-9]{2}/\\'$baseline_type\\',0x$ver_1,0x$ver_2,0x$ver_3/g $file_path";

        print "$cmd\n";
        open TMP, ">$tmpfile";
        print TMP $cmd;
        close TMP;

        $cmd = "chmod 755 \"$tmpfile\"";
        print "$cmd\n";
        system($cmd);

        $ret = CCHelper::list_cmd( $view_name, "$tmpfile" );
        if ( $ret != 0 )
        {
            StepCommon::print_error_message("meet error when $cmd!");
        }
        return $ret;
    }
    elsif ( $new =~ /^(\D)(\d{2})\.(\d{2})\.(\d{2})\.(\d{2})$/ )
    {
        print "[DEBUG] xx.xx.xx.xx\n";
        my $cmd = "#!/bin/bash\n";
        $cmd .= "sed -i -r s/[A-Z][0-9]{2}\\.[0-9]{2}\\.[0-9]{2}\\.[0-9]{2}/$new/g $file_path";

        print "$cmd\n";
        open TMP, ">$tmpfile";
        print TMP $cmd;
        close TMP;

        $cmd = "chmod 755 \"$tmpfile\"";
        print "$cmd\n";
        system($cmd);

        my $ret = CCHelper::list_cmd( $view_name, "$tmpfile" );
        if ( $ret != 0 )
        {
            StepCommon::print_error_message("meet error when $tmpfile!");
            return $ret;
        }

        $new =~ /^(\D)(\d{2})\.(\d{2})\.(\d{2})\.(\d{2})/;
        my $baseline_type = $1;
        my $ver_1         = $2;
        my $ver_2         = $3;
        my $ver_3         = $4;
        my $ver_4         = $5;

        $cmd = "#!/bin/bash\n";
        $cmd .= "sed -i -r s/\\'[A-Z]\\',0x[0-9]{2},0x[0-9]{2},0x[0-9]{2},0x[0-9]{2}/\\'$baseline_type\\',0x$ver_1,0x$ver_2,0x$ver_3,0x$ver_4/g $file_path";

        print "$cmd\n";
        open TMP, ">$tmpfile";
        print TMP $cmd;
        close TMP;

        $cmd = "chmod 755 \"$tmpfile\"";
        print "$cmd\n";
        system($cmd);

        $ret = CCHelper::list_cmd( $view_name, "$tmpfile" );
        if ( $ret != 0 )
        {
            StepCommon::print_error_message("meet error when $cmd!");
        }
        return $ret;
    }
    else
    {
        print "[ERROR] Invide version format\n";
    }

}

while ( -e "$ENV{UNIX_SCRIPT_HOME}/sleep.pid" )
{
    print "[INFO] $ENV{UNIX_SCRIPT_HOME}/sleep.pid exist, will re-try it after 1 minute\n";
    sleep(60);
}

exit 0;
