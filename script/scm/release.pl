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
our $latest_cov_report     = "";

our $ir_branch       = "";
our $last_baseline   = "";
our $new_baseline    = "";
our $author          = "";
our $comments        = "";
our $based_i_version = "";

my @attachment = ();

Utilities::get_parameter();

if ( $author =~ /^(.*)-(.*)/ )
{   
    # get the coreid
    $author = $2;
}

print "#############################\n";
print "[CURRENT_BASELINE] $new_baseline \n";
print "#############################\n";

my $mount_cmd = "subst.exe $repo_root $repo_home";
print "[INFO] $mount_cmd\n";
system("$mount_cmd");

##################################################
# Define global parameters
##################################################
my $cmd                = "";
my $commit_id          = "";
my $rs                 = "";
my @output_array       = ();
my $upload_home        = "";
my $rest_8m_flash_size = "";
my $change_list_email  = "";
my $UNIX_GREP          = "$win_script_home\\tools\\grep.exe";

my $remote_upload_home = "$remote_data_home\\$project_name\\$new_baseline";
if ( $release_type eq "DAILY" )
{
    $upload_home = "$local_data_home\\$project_name\\${new_baseline}_DAILY";
}
else
{
    $upload_home = "$local_data_home\\$project_name\\$new_baseline";
}

# for Bahama
my $ngr_arm_output_folder  = "$repo_root\\bahama\\code\\output\\host\\bin";
my $ngr_dsp_output_folder  = "$repo_root\\bahama\\code\\output\\dsp\\bin";
my $ngr_dvsi_output_folder = "$repo_root\\bahama\\code\\output\\dvsi\\bin";

# for Cypher
my $Dissectors_output_folder = "$repo_root\\pcr_csa\\code\\ASN1\\EmeraldDissectors";
my $arm9_output_folder       = "$repo_root\\pcr_srp\\code\\output_host32mb\\bin";
my $arm9_8m_output_folder    = "$repo_root\\pcr_srp\\code\\output_host8mb\\bin";
my $dsp_output_folder        = "$repo_root\\pcr_srp\\code\\output_dsp32mb\\bin";
my $dsp_8m_output_folder     = "$repo_root\\pcr_srp\\code\\output_dsp8mb\\bin";
my $bandit_output_folder     = "$repo_root\\pcr_srp\\code\\output_bandit\\bin";
my $p2p_output_folder        = "$repo_root\\pcr_srp\\code\\dller\\bin";
my $win32_output_folder      = "$repo_root\\pcr_srp\\code\\output_win32\\bin";
my $ut_output_folder         = "$repo_root\\pcr_srp\\test\\phyrCe_utest\\output_utest";
my $win32_it_output_folder   = "$repo_root\\pcr_srp\\test\\phyrCe_win32\\Emerald_Test_Suites\\CCM_TCM_Test_Suite";

# for test
my $ut_report_file        = "$upload_home\\ut_report_$new_baseline.txt";
my $win32_it_report_file  = "$upload_home\\win32_it_report_$new_baseline.txt";
my $latest_ut_report_file = "$remote_log_dir\\latest_ut_report.txt";

##################################################
# Main
##################################################
copy_output();
check_8m_size();
compare_output();
git_release();
checkWarning();
email_release();

##################################################
# Function
##################################################
sub copy_output
{
    print "[INFO] Create $upload_home\n";
    mkpath( "$upload_home",         1 );
    mkpath( "$upload_home\\bundle", 1 );

    # for Bahama
    copy_ngr_arm_output();
    copy_ngr_dsp_output();
    copy_ngr_dvsi_output();

    # Disable for 2.7
    make_bundle();
    copy_bundle_file();

    # for Cypher
    copy_arm9_output();
    copy_arm9_8m_output();
    copy_dsp_output();
    copy_dsp_8m_output();
    copy_bandit_output();
    copy_win32_output();
    copy_EmeraldDissectors();

    # for test
    copy_ut_report();
    copy_win32_it_report();
    copy_win32_cov_report();
}

sub check_8m_size
{
    print "[INFO] Start check 8M flash size\n";
    $rest_8m_flash_size = `python $win_script_home\\check_rest_flash.py $upload_home\\arm9_flash.map`;
    print "[DEBUG] $rest_8m_flash_size\n";
}

sub compare_output
{
    my $compare_result = 0;
    my $fw_home_1      = "";
    if ( $release_type eq "DAILY" )
    {
        $fw_home_1 = "$local_data_home\\$project_name\\$new_baseline";
    }
    elsif ( $release_type eq "D" )
    {
        $fw_home_1 = "$local_data_home\\$project_name\\$based_i_version";
    }

    if ( $release_type eq "DAILY" || $release_type eq "D" )
    {

        # Compare bahama_arm_app.xml
        my $compare_cmd = "perl $win_script_home\\diff_fw.pl $fw_home_1\\bahama_arm_app.xml  $upload_home\\bahama_arm_app.xml $repo_root";
        print "[INFO] $compare_cmd\n";
        my $ret = system("$compare_cmd");
        print "[DEBUG] $ret\n";
        if ( $ret != 0 )
        {
            $compare_result = 1;
            print "[ERROR] Meet error when run $compare_cmd\n";
        }

        #compare BahamaDspExecutable.out
        $compare_cmd = "perl $win_script_home\\diff_fw.pl $fw_home_1\\BahamaDspExecutable.out  $upload_home\\BahamaDspExecutable.out $repo_root";
        print "[INFO] $compare_cmd\n";
        $ret = system("$compare_cmd");
        print "[DEBUG] $ret\n";
        if ( $ret != 0 )
        {
            $compare_result = 1;
            print "[ERROR] Meet error when run $compare_cmd\n";
        }

        #compare arm9_flash_32m.srec
        $compare_cmd = "perl $win_script_home\\diff_fw.pl $fw_home_1\\arm9_flash.srec  $upload_home\\arm9_flash.srec $repo_root";
        print "[INFO] $compare_cmd\n";
        $ret = system("$compare_cmd");
        print "[DEBUG] $ret\n";
        if ( $ret != 0 )
        {
            $compare_result = 1;
            print "[ERROR] Meet error when run $compare_cmd\n";
        }

        $compare_cmd = "perl $win_script_home\\diff_fw.pl $fw_home_1\\arm9_flash_32mb.srec  $upload_home\\arm9_flash_32mb.srec $repo_root";
        print "[INFO] $compare_cmd\n";
        $ret = system("$compare_cmd");
        print "[DEBUG] $ret\n";
        if ( $ret != 0 )
        {
            $compare_result = 1;
            print "[ERROR] Meet error when run $compare_cmd\n";
        }

        $compare_cmd = "perl $win_script_home\\diff_fw.pl $fw_home_1\\c55_flash.srec  $upload_home\\c55_flash.srec $repo_root";
        print "[INFO] $compare_cmd\n";
        $ret = system("$compare_cmd");
        print "[DEBUG] $ret\n";
        if ( $ret != 0 )
        {
            $compare_result = 1;
            print "[ERROR] Meet error when run $compare_cmd\n";
        }

        $compare_cmd = "perl $win_script_home\\diff_fw.pl $fw_home_1\\c55_flash_32mb.srec  $upload_home\\c55_flash_32mb.srec $repo_root";
        print "[INFO] $compare_cmd\n";
        $ret = system("$compare_cmd");
        print "[DEBUG] $ret\n";
        if ( $ret != 0 )
        {
            $compare_result = 1;
            print "[ERROR] Meet error when run $compare_cmd\n";
        }

        $compare_cmd = "perl $win_script_home\\diff_fw.pl $fw_home_1\\c55_flash_Bandit.srec  $upload_home\\c55_flash_Bandit.srec $repo_root";
        print "[INFO] $compare_cmd\n";
        $ret = system("$compare_cmd");
        print "[DEBUG] $ret\n";
        if ( $ret != 0 )
        {
            $compare_result = 1;
            print "[ERROR] Meet error when run $compare_cmd\n";
        }

        if ( $compare_result != 0 )
        {
            print "[ERROR] FWs are difference\n";
            Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.info", "FWs are difference: $ENV{BUILD_URL}console" );
        }
        else
        {
            print "[INFO] FWs are same\n";
            Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.info", "FWs are same: $ENV{BUILD_URL}console" );
        }
    }
}

sub git_release
{
    chdir("$repo_home");
    ##################################################
    # sync the repo
    ##################################################
    $cmd = "git fetch origin";
    ( $rs, @output_array ) = Utilities::my_system($cmd);
    if ( $rs != 0 )
    {
        Utilities::log_error("Meet error when $cmd");
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
        exit 1;
    }

    #    ##################################################
    #    # Git add
    #    ##################################################
    #    $cmd = "git add .";
    #    ( $rs, @output_array ) = Utilities::my_system($cmd);
    #    if ( $rs != 0 )
    #    {
    #        Utilities::log_error("Meet error when $cmd");
    #        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
    #        exit 1;
    #    }
    #
    #    ##################################################
    #    # Git commit
    #    ##################################################
    #    $cmd = "git status";
    #    my $need_commit = "";
    #    ( $rs, @output_array ) = Utilities::my_system($cmd);
    #    foreach (@output_array)
    #    {
    #        if ( $_ =~ /nothing added to commit/ || $_ =~ /nothing to commit/ )
    #        {
    #            $need_commit = "false";
    #        }
    #        else
    #        {
    #            $need_commit = "true";
    #        }
    #
    #    }
    #    if ( $need_commit eq "false" )
    #    {
    #        # include 'nothing to commit', so will not commit
    #        Utilities::log_info("There have nothing to commit");
    #    }
    #
    #    if ( $need_commit eq "true" )
    #    {
    #        $cmd = "git commit -m \"SCM commit $new_baseline\"";
    #        ( $rs, @output_array ) = Utilities::my_system($cmd);
    #        if ( $rs != 0 )
    #        {
    #            Utilities::log_error("Meet error when $cmd");
    #            Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
    #            exit 1;
    #        }
    #    }

    ##################################################
    # Git push
    ##################################################
    $cmd = "git push origin $int_branch:$int_branch";
    ( $rs, @output_array ) = Utilities::my_system($cmd);
    if ( $rs != 0 )
    {
        Utilities::log_error("Meet error when $cmd");
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
        exit 1;
    }

    ##################################################
    # Git tag baseline
    ##################################################
    $cmd = "git tag -a $new_baseline -m \"$new_baseline\"";
    ( $rs, @output_array ) = Utilities::my_system($cmd);
    if ( $rs != 0 )
    {
        Utilities::log_error("Meet error when $cmd");
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
        exit 1;
    }

    ##################################################
    # Git push tag
    ##################################################
    $cmd = "git push --tags";
    ( $rs, @output_array ) = Utilities::my_system($cmd);
    if ( $rs != 0 )
    {
        Utilities::log_error("Meet error when $cmd");
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
        exit 1;
    }

    # get commit ID
    $cmd = "git show $new_baseline|$UNIX_GREP \"^commit\"";
    ( $rs, @output_array ) = Utilities::my_system($cmd);
    $commit_id = Utilities::array_to_string(@output_array);
    $commit_id =~ s/commit\ //g;

    # get change list
    $cmd = "git diff $last_baseline $new_baseline --name-only";
    ( $rs, @output_array ) = Utilities::my_system($cmd);
    if ( $rs != 0 )
    {
        Utilities::log_error("Meet error when $cmd");
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
        exit 1;
    }
    my @change_list_array = @output_array;
    $change_list_email = Utilities::array_to_string(@change_list_array);
    $change_list_email =~ s/\n/<br>/g;
}

sub array_to_email_format
{
    my (@array) = @_;
    my $string = "";
    foreach (@array)
    {
        chomp($_);
        print "[DEBUG] $_\n";
        $string = $string . $_ . "\<br\>";
    }
    return $string;
}

sub copy_ngr_arm_output
{
    my %NGR_ARM_FW = (
        "$ngr_arm_output_folder\\bahama_arm_app.xml"       => "$upload_home\\bahama_arm_app.xml",
        "$ngr_arm_output_folder\\BahamaHostExecutable.map" => "$upload_home\\BahamaHostExecutable.map",
        "$ngr_arm_output_folder\\BahamaHostExecutable.out" => "$upload_home\\BahamaHostExecutable.out",
    );
    &Utilities::copy_with_bash( \%NGR_ARM_FW );
}

sub copy_ngr_dsp_output
{
    my %NGR_DSP_FW = (
        "$ngr_dsp_output_folder\\bahama_dsp_app.xml"      => "$upload_home\\bahama_dsp_app.xml",
        "$ngr_dsp_output_folder\\BahamaDspExecutable.map" => "$upload_home\\BahamaDspExecutable.map",
        "$ngr_dsp_output_folder\\BahamaDspExecutable.out" => "$upload_home\\BahamaDspExecutable.out",
    );
    &Utilities::copy_with_bash( \%NGR_DSP_FW );
}

sub copy_ngr_dvsi_output
{
    my %NGR_DVSI_FW = (
        "$ngr_dvsi_output_folder\\bahama_dsp_vocoder_dvsi.xml" => "$upload_home\\bahama_dsp_vocoder_dvsi.xml",
        "$ngr_dvsi_output_folder\\BahamaDspDvsiExecutable.out" => "$upload_home\\BahamaDspDvsiExecutable.out",
        "$ngr_dvsi_output_folder\\BahamaDspDvsiExecutable.map" => "$upload_home\\BahamaDspDvsiExecutable.map",
    );
    &Utilities::copy_with_bash( \%NGR_DVSI_FW );
}

sub make_bundle
{

    # Make Bundle
    $ENV{LOGONSERVER} = "\\\\ZCH49DSDC801";

    chdir("$repo_root\\bahama");
    my $cmd = "code\\path.bat && make bundle";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    print "[DEBUG] $ret\n";

    if ( $ret != 0 )
    {
        print "[WARNING] Meet error when make bundle.\n";
    }
}

sub copy_bundle_file
{
    my $cp_cmd = "xcopy /Y $repo_root\\bahama\\code\\*\.xml $upload_home\\bundle";
    print "$cp_cmd\n";
    if ( system($cp_cmd) != 0 )
    {
        print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";

        #exit 1;
    }

}

sub copy_arm9_output
{
    print "[INFO] Copying arm9_phyrCeflash_32mb.srec\n";
    copy( "$arm9_output_folder\\arm9_phyrCeflash_32mb.srec", "$upload_home\\arm9_flash_32mb.srec" ) || die "[ERROR] Could not copy files :$!";
    print "[INFO] Copying arm9_phyrCeflash_32mb.map\n";
    copy( "$arm9_output_folder\\arm9_phyrCeflash_32mb.map", "$upload_home\\arm9_flash_32mb.map" ) || die "[ERROR] Could not copy files :$!";
    print "[INFO] Copying arm9_phyrCeflash_32mb.out\n";
    copy( "$arm9_output_folder\\arm9_phyrCeflash_32mb.out", "$upload_home\\arm9_flash_32mb.out" ) || die "[ERROR] Could not copy files :$!";
    print "[INFO] Copying arm9_phyrCeflash_32mb_map.txt\n";
    copy( "$arm9_output_folder\\arm9_phyrCeflash_32mb_map.txt", "$upload_home\\arm9_flash_32mb_map.txt" ) || die "[ERROR] Could not copy files :$!";

    #    print "[INFO] Copying cr_arm9_phyrCeflash_32mb.txt\n";
    #    copy( "$arm9_output_folder\\cr_arm9_phyrCeflash_32mb.txt",  "$upload_home\\cr_arm9_flash_32mb.txt" )  || die "[ERROR] Could not copy files :$!";
}

sub copy_arm9_8m_output
{
    print "[INFO] Copying arm9_phyrCeflash_8mb.map\n";
    copy( "$arm9_8m_output_folder\\arm9_phyrCeflash_8mb.map", "$upload_home\\arm9_flash.map" ) || die "[ERROR] Could not copy files :$!";
    print "[INFO] Copying arm9_phyrCeflash_8mb.out\n";
    copy( "$arm9_8m_output_folder\\arm9_phyrCeflash_8mb.out", "$upload_home\\arm9_flash.out" ) || die "[ERROR] Could not copy files :$!";
    print "[INFO] Copying arm9_phyrCeflash_8mb.srec\n";
    copy( "$arm9_8m_output_folder\\arm9_phyrCeflash_8mb.srec", "$upload_home\\arm9_flash.srec" ) || die "[ERROR] Could not copy files :$!";
    print "[INFO] Copying arm9_phyrCeflash_8mb_map.txt\n";
    copy( "$arm9_8m_output_folder\\arm9_phyrCeflash_8mb_map.txt", "$upload_home\\arm9_flash_map.txt" ) || die "[ERROR] Could not copy files :$!";
}

sub copy_dsp_output
{
    my $cp_cmd = "xcopy /Y /S /E $dsp_output_folder $upload_home";
    print "[INFO] $cp_cmd\n";
    if ( system($cp_cmd) != 0 )
    {
        print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
        exit 1;
    }
}

sub copy_dsp_8m_output
{
    my $cp_cmd = "xcopy /Y /S /E $dsp_8m_output_folder $upload_home";
    print "[INFO] $cp_cmd\n";
    if ( system($cp_cmd) != 0 )
    {
        print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
        exit 1;
    }
}

sub copy_bandit_output
{
    my $cp_cmd = "xcopy /Y /S /E $bandit_output_folder $upload_home";
    print "[INFO] $cp_cmd\n";
    if ( system($cp_cmd) != 0 )
    {
        print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
        exit 1;
    }
}

sub copy_win32_output
{
    my $cp_cmd = "xcopy /Y /S /E $win32_output_folder $upload_home";
    print "[INFO] $cp_cmd\n";
    if ( system($cp_cmd) != 0 )
    {
        print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
        exit 1;
    }
}

sub copy_p2p_output
{
    my $cp_cmd = "xcopy /Y /S /E $p2p_output_folder $upload_home";
    print "[INFO] $cp_cmd\n";
    if ( system($cp_cmd) != 0 )
    {
        print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
        exit 1;
    }
}

sub copy_ut_report
{
    if ( -e "$ut_output_folder\\ut_report.txt" )
    {
        my $cp_cmd = "copy /Y $ut_output_folder\\ut_report.txt $ut_report_file";
        print "$cp_cmd\n";
        if ( system($cp_cmd) != 0 )
        {
            print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
            exit 1;
        }

        push( @attachment, $ut_report_file );

        $cp_cmd = "copy /Y $ut_output_folder\\ut_report.txt $latest_ut_report_file";
        print "$cp_cmd\n";
        if ( system($cp_cmd) != 0 )
        {
            print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
            exit 1;
        }
    }
    else
    {
        print "[WARNING] $ut_output_folder\\ut_report.txt not exist\n";

    }
}

sub copy_win32_it_report
{
    if ( -e "$win32_it_output_folder\\win32ITResult.txt" )
    {
        my $cp_cmd = "copy /Y $win32_it_output_folder\\win32ITResult.txt $upload_home\\win32ITResult.txt";
        print "$cp_cmd\n";
        if ( system($cp_cmd) != 0 )
        {
            print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
            exit 1;
        }
    }
    else
    {
        print "[WARNING] $win32_it_output_folder\\win32ITResult.txt\n";
    }

    if ( -e "$win32_it_output_folder\\win32_report.txt" )
    {
        my $cp_cmd = "copy /Y $win32_it_output_folder\\win32_report.txt $win32_it_report_file";
        print "$cp_cmd\n";
        if ( system($cp_cmd) != 0 )
        {
            print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
            exit 1;
        }
        push( @attachment, $win32_it_report_file );
    }
    else
    {
        print "[WARNING] $win32_it_output_folder\\win32_report.txt not exist\n";
    }
}

sub copy_win32_cov_report
{
    if ( -e "$ut_output_folder\\merged_coverage_report.txt" )
    {
        my $cp_cmd = "copy /Y $ut_output_folder\\merged_coverage_report.txt $upload_home\\merged_coverage_report.txt";
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
}

sub copy_EmeraldDissectors
{
    my $cp_cmd = "xcopy /Y /S /E $Dissectors_output_folder $upload_home";
    print "[INFO] $cp_cmd\n";
    if ( system($cp_cmd) != 0 )
    {
        print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
        exit 1;
    }
}

sub checkWarning
{
    $ENV{LOGONSERVER} = "\\\\ZCH49DSDC801";

    chdir("$repo_root\\pcr_srp\\code");
    my $cmd = "path.bat && JenkinsCheckWarning.bat $author $author\@motorolasolutions.com $last_baseline $new_baseline";
    print "[INFO] $cmd\n";
    if ( system($cmd) != 0 )
    {
        print "[ERROR] meet error when run s$cmd\n$cmd\n::$!\n";
    }
    
    $cmd = "path.bat && JenkinsCheckKlocwork.bat $author $author\@motorolasolutions.com $last_baseline $new_baseline";
    print "[INFO] $cmd\n";
    if ( system($cmd) != 0 )
    {
        print "[ERROR] meet error when run s$cmd\n$cmd\n::$!\n";
    }
    
}

sub email_release
{
    my $mail_list       = "";
    my $mail_title      = "";
    my $mail_string     = "";
    my $total_log_email = "";
    if ( $release_type eq "DAILY" )
    {

        # Check test result
        print "[INFO] Start collect test results\n";
        my @total_log     = ();
        my @log_file_list = ();

        find( \&PrintName, "$log_dir" );

        sub PrintName
        {
            my $path = "";

            #my $reg  = "";
            #if (/$reg/)
            #{
            $path = $File::Find::name;
            if ( $path =~ /\.info/ )
            {
                $path =~ s/\//\\/g;

                #$path =~ s/\\+/\\/g;
                print "[DEBUG] $path\n";
                push( @log_file_list, $path );
            }

            #}
        }

        if ( @log_file_list > 0 )
        {
            foreach my $log_file (@log_file_list)
            {
                open( FILE, "$log_file" );
                my @log_content = <FILE>;
                close(FILE);
                push( @total_log, @log_content );
            }
        }
        else
        {
            print "[WARNING] Cannot find any log files!\n";
        }

        # Remove all log file
        foreach (@log_file_list)
        {
            print "[DEBUG] Remove log file $_\n";
            unlink("$_");
        }

        $mail_list       = "$release_mail_list";
        $mail_title      = "\[Daily Build $project_name\]\: $new_baseline daily build and test report";
        $total_log_email = array_to_email_format(@total_log);
        $mail_string     = <<INFORM
    <body style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">
        <table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" align="right">LATEST BASELINE:</td>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$new_baseline</td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" align="right">COMMIT ID:</td>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$commit_id</td>
            </tr>

        </table><br/>
        
		<table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" width="100%">
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black; color: white; background-color: #00BB00; font-size: 120%" class="bg1"><b>STATUS</b></td>
            </tr>
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$total_log_email</td>
            </tr>
        </table><br/>
        
        <table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">Best regards</td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black"><a href="Mailto:pnw748\@motorolasolutions.com">Fu Shanghai</a></td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">Note: This is auto-generated mail, please do not reply it directly</td>
            </tr>
        </table><br/>
    </body>
INFORM
          ;
    }
    else
    {
        my $comments_email = $comments;
        $comments_email =~ s/\n/<br>/g;

        $mail_list  = "$release_mail_list";
        $mail_title = "\[$project_name\]\: $new_baseline is Released";
        my $unit_test_result     = "All test cases passed";
        my $warning_delta_result = "";

        # replace the '.' to '_' for KW project
        if ($kw_pro_name eq "REPT2.7")
        {
            # KW project name changed, so need this special change.
            $kw_pro_name = "REPT2_7_nonEmerald";
        }
        $kw_pro_name =~ s/\./\_/g;
        my $klockwork_analyze_result = "http://zch49kw01:8080/review/insight-review.html#builds_goto:project=$kw_pro_name";

        $mail_string = <<INFORM
    <body style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">
        <table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" align="right">Submitter:</td>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black"><b>$author</b></td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" align="right">New BaseLine:</td>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$new_baseline</td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" align="right">COMMIT ID:</td>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$commit_id</td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" align="right">Purpose:</td>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$comments_email</td>
            </tr>
        </table><br/>
        
        <table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" width="100%">
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black; color: white; background-color: #00BB00; font-size: 120%" class="bg1"><b>FILE CHANGE LIST</b></td>
            </tr>
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$change_list_email</td>
            </tr>
        </table><br/>
        
		<table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" width="100%">
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black; color: white; background-color: #00BB00; font-size: 120%" class="bg1"><b>Release output folder</b></td>
            </tr>
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$remote_upload_home</td>
            </tr>
        </table><br/>
		
		<table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" width="100%">
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black; color: white; background-color: #00BB00; font-size: 120%" class="bg1"><b>Unit result</b></td>
            </tr>
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$unit_test_result</td>
            </tr>
        </table><br/>
		
		<table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" width="100%">
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black; color: white; background-color: #00BB00; font-size: 120%" class="bg1"><b>Warning delta result</b></td>
            </tr>
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$warning_delta_result</td>
            </tr>
        </table><br/>
		
		<table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" width="100%">
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black; color: white; background-color: #00BB00; font-size: 120%" class="bg1"><b>Klockwork analyze result</b></td>
            </tr>
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$klockwork_analyze_result</td>
            </tr>
        </table><br/>
        
        <table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" width="100%">
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black; color: white; background-color: #00BB00; font-size: 120%" class="bg1"><b>LOC Report</b></td>
            </tr>
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$remote_data_home\\$project_name\\$new_baseline\\loc</td>
            </tr>
        </table><br/>
        
        <table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" width="100%">
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black; color: white; background-color: #00BB00; font-size: 120%" class="bg1"><b>Purpose</b></td>
            </tr>
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$comments_email</td>
            </tr>
            
        </table><br/>
        
        <table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">Best regards</td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black"><a href="Mailto:pnw748\@motorolasolutions.com">Fu Shanghai</a></td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">Note: This is auto-generated mail, please do not reply it directly</td>
            </tr>
        </table><br/>
    </body>
INFORM
          ;

    }
    if ( -e "$latest_cov_report" )
    {
        push( @attachment, $latest_cov_report );
    }

    Utilities::send_mail( $mail_list, $mail_title, $mail_string, @attachment );
}

exit 0;
