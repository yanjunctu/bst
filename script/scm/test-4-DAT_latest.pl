#!perl

use strict;
use Cwd qw/abs_path/;
use File::Basename;
use File::Copy;
use File::Find;
use File::Path;
use threads;
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

our $ir_branch       = "";
our $last_baseline   = "";
our $new_baseline    = "";
our $author          = "";
our $comments        = "";
our $based_i_version = "";

Utilities::get_parameter();

##################################################
# Define parameter
##################################################
my @released_dir           = ();
my $latest_baseline        = "";
my $latest_released_dir    = "";
my $already_runned_version = "";
my $upload_home            = "";

my $dat_pid                         = "$win_script_home\\${project_name}_${release_type}_dat.pid";
my $dat_already_runned_version_file = "$win_script_home\\${project_name}_${release_type}_dat.txt";

# Check DAT whether running
open( OUTFILE, " > $dat_pid" );
print OUTFILE "$project_name $ENV{BUILD_URL}\n";
close(OUTFILE);

$ENV{LOGONSERVER} = "\\\\ZCH49DSDC801";

if ( $release_type eq "DAILY" )
{
    $upload_home = "$local_data_home\\$project_name\\${new_baseline}_DAILY";
}
else
{
    $upload_home = "$local_data_home\\$project_name\\$new_baseline";
}

my $mount_cmd = "subst.exe $repo_root $repo_home";
print "[INFO] $mount_cmd\n";
system("$mount_cmd");

my $dat_test_home = "$local_data_home\\$project_name\\DAT_TEST";

print "#############################\n";
print "[CURRENT_BASELINE] $new_baseline \n";
print "#############################\n";

#=================================================
# Copy SendUDPMessage_NGR file
#=================================================
mkpath("$dat_test_home");
my $cp_cmd = "xcopy /Y /S /E $win_script_home\\IDATAutoTestTrigger $dat_test_home";
if ( system($cp_cmd) != 0 )
{
    print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
    remove_dat_pid();
    exit 0;
}

#=================================================
# Start test
#=================================================

if ( $release_type eq "DAILY" )
{
    ##################################################
    # Get latest baseline and new baseline
    ##################################################
    chdir("$repo_root");
    $last_baseline = Utilities::get_latest_baseline("$prefix_baseline");
    if ( $last_baseline eq "" )
    {

        # setup the initial baseline
        $last_baseline = $prefix_baseline . "\.00";
    }
    $new_baseline = $last_baseline;

    my $dat_cmd = "IDATAutoTestTrigger.exe \/s \"IDAT APP Server 1\" \/c \"Sys4_Sanity_Legacy\"  \/cs LegacySanityTestEx  \/f $dat_test_home\\$new_baseline  \/fv $new_baseline  \/r remarks  \/e  rqt768;SCOUT \/wait";
    print "$dat_cmd\n";
    chdir("$dat_test_home");
    my $err = system("$dat_cmd 2>&1");
    print "[INFO] DAT test result: $err \n";
    if ( $err != 0 )
    {
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.info", "DAT TEST FAILED: $ENV{BUILD_URL}console" );
        print "[WARNING] meet error when run system: $dat_cmd\n";
    }
    else
    {
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.info", "DAT DAILY TEST SUCCESSFUL: $ENV{BUILD_URL}console" );
        print "[INFO] DAT test successfull\n";
    }

}
else
{
    if ( -d "$dat_test_home\\$new_baseline" )
    {
        rmtree("$dat_test_home\\$new_baseline");
    }

    mkpath("$dat_test_home\\$new_baseline");

    my %NEED_COPY_HASH = (
        "$upload_home\\arm9_flash_32mb.srec"  => "$dat_test_home\\$new_baseline\\arm9_flash_32mb.srec",
        "$upload_home\\c55_flash_32mb.srec"   => "$dat_test_home\\$new_baseline\\c55_flash_32mb.srec",
        "$upload_home\\c55_flash_Bandit.srec" => "$dat_test_home\\$new_baseline\\c55_flash_Bandit.srec",
        "$upload_home\\bahama_arm_app.xml"    => "$dat_test_home\\$new_baseline\\bahama_arm_app.xml",
        "$upload_home\\bahama_dsp_app.xml"    => "$dat_test_home\\$new_baseline\\bahama_dsp_app.xml",
    );

    my ( $res, $not_exist_file, $copy_failed_file ) = Utilities::copy_with_bash( \%NEED_COPY_HASH );
    if ( $res != 0 )
    {
        print "[ERROR] Some file copy failed!\n";
        remove_dat_pid();
        exit 0;
    }

    my $t1_res = "";
    my $t2_res = "";

    chdir("$dat_test_home");
    my $dat_cmd_1 = "IDATAutoTestTrigger.exe \/s \"IDAT APP Server 1\" \/c \"Sys4_Sanity_Legacy\"  \/cs LegacySanityTest           \/f $dat_test_home\\$new_baseline \/fv $new_baseline \/r \"CI Trigger the legacy sanity test for Emerald\" \/e \"cg567a;cg569a;lg549a\" \/wait";
    my $dat_cmd_2 = "IDATAutoTestTrigger.exe \/s \"IDAT APP Server 1\" \/c \"Sys5_Sanity_Emerald\"  \/cs System5\\EmeraldSanityTest \/f $dat_test_home\\$new_baseline \/fv $new_baseline \/r \"CI Trigger the EmeraldSanity test for Emerald\" \/e \"cg567a;cg569a;lg549a\" \/wait";

    print "$dat_cmd_1\n";
    my $exit_code = system("$dat_cmd_1");
    print "[INFO] Command failed with an exit code of $exit_code.\n";
    $t1_res = ( $exit_code >> 8 );

    print "$dat_cmd_2\n";
    $exit_code = system("$dat_cmd_2");
    print "[INFO] Command failed with an exit code of $exit_code.\n";
    $t2_res = ( $exit_code >> 8 );
    
    #    sub func
    #    {
    #        my ($cmd) = @_;
    #        print "$cmd\n";
    #        my $err = system("$cmd 2>&1");
    #        print "[INFO] DAT test result: $err \n";
    #        if ( $err != 0 )
    #        {
    #            return 1;
    #        }
    #        else
    #        {
    #            return 0;
    #        }
    #    }
    #
    #    my $t1 = threads->create( \&func, "$dat_cmd_1" );
    #
    #    # sleep 120 second to wait thread 1 upload FW, they cannot upload FW at the same time.
    #    sleep 120;
    #    my $t2 = threads->create( \&func, "$dat_cmd_2" );
    #
    #    my $t1_res = $t1->join();
    #    my $t2_res = $t2->join();

    printf("t1_res = $t1_res\nt2_res = $t2_res\n");
    if ( $t1_res == 5 || $t2_res == 5 )
    {

        # dat failed will block CI
        print "[INFO] Check PID file $lock_file ...\n";
        while ( -e "$lock_file" )
        {
            print "[INFO] $project_name CI is running, will re-try it after 10 second\n";
            sleep(10);
        }

        open( OUTFILE, " > $lock_file" );
        print OUTFILE "$project_name $ENV{BUILD_URL}\n";
        close(OUTFILE);

        record_already_runned_version();
        remove_dat_pid();
        exit 1;
    }
}

record_already_runned_version();
remove_dat_pid();

sub remove_dat_pid
{
    unlink("$dat_pid");
}

sub record_already_runned_version
{
    open( OUTFILE, " > $dat_already_runned_version_file" );
    print OUTFILE "$new_baseline";
    close(OUTFILE);
}
