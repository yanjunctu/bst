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

our $ir_branch       = "";
our $last_baseline   = "";
our $new_baseline    = "";
our $author          = "";
our $comments        = "";
our $based_i_version = "";
our $config_file     = "";

Utilities::get_parameter();

##################################################
# Defaine tmp parameters
##################################################
my $cmd               = "";
my $rs                = "";
my @output_array      = ();
my @change_list_array = ();
my @comments_array    = ();
my $UNIX_GREP = "$win_script_home\\tools\\grep.exe";

chdir("$repo_home\\..");
system("unjunction.bat");
chdir("$repo_home");

##################################################
# Clean repo
##################################################
#while ( -e "$repo_home\\.git\\index.lock" )
#{
#    print "[INFO] $repo_home\\.git\\index.lock exist, please wait 1 minutes\n";
#    sleep(60);
#}
if (-e "$repo_home\\.git\\index.lock")
{
    unlink("$repo_home\\.git\\index.lock");
}

$cmd = "git reset --hard && git submodule foreach git reset --hard";
( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");
    Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
    exit 1;
}

$cmd = "git clean -d -fx";
( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");
    Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
    exit 1;
}

chdir("$repo_home\\..");
system("junction.bat");
system("cd");
chdir("$repo_home");
system("cd");

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

$cmd = "git submodule init && git submodule update";
( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");
    Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
    exit 1;
}

##################################################
# Get latest baseline and new baseline
##################################################
$last_baseline = Utilities::get_latest_baseline("$prefix_baseline");
if ( $last_baseline eq "" )
{

    # setup the initial baseline
    $last_baseline = $prefix_baseline . "\.00";
}
$new_baseline = Utilities::get_newbaseline($last_baseline);

##################################################
# Create INT branch based on remote repo
##################################################
# Check branch whethre exist
my $isExit = Utilities::check_branch_exist("$int_branch");
if ( $isExit eq "true" )
{

    # branch exist, need remove fitst
    $cmd = "git checkout -f master & git branch -D $int_branch";
    ( $rs, @output_array ) = Utilities::my_system($cmd);
    if ( $rs != 0 )
    {
        Utilities::log_error("Meet error when $cmd");
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
        exit 1;
    }
}

# re-create branch force
$cmd = "git checkout -f master & git branch -D $int_branch";
( $rs, @output_array ) = Utilities::my_system($cmd);

$cmd = "git checkout -f -b $int_branch origin/$int_branch";
( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");
    Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
    exit 1;
}

##################################################
# Get the author and change list
##################################################
# get the author
$cmd = "git show -s --format=%an origin/$ir_branch";
( $rs, @output_array ) = Utilities::my_system($cmd);
$author = Utilities::array_to_string(@output_array);

# get comments
$cmd = "git show -s origin/$ir_branch";
( $rs, @output_array ) = Utilities::my_system($cmd);
shift @output_array;    # remove 3 lines at the begin
shift @output_array;
shift @output_array;
@comments_array = @output_array;

# get change list
$cmd = "git diff origin/$ir_branch $int_branch --name-only";
( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");
    Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
    exit 1;
}
@change_list_array = @output_array;

##################################################
# record into config file to transfer to downlowd job
##################################################
$comments     = Utilities::array_to_string(@comments_array);
# combine mulit-lines to one line for comments
#foreach (@comments_array)
#{
#    chomp($_);
#    $comments = $comments . $_ . ", ";
#}
record_baseline();

##################################################
# Catch code from INT branch
##################################################
$cmd = "git merge origin/$ir_branch -m \"merge from $ir_branch\"";
( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Merge failed: $cmd");
    Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "Merge failed: $ENV{BUILD_URL}console" );
    exit 1;
}

$cmd = "git submodule init && git submodule update";
( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");
    Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
    exit 1;
}

##################################################
# Update version file
##################################################
my @ver_files_array      = Utilities::get_file_list_array($ver_files);
foreach my $ver_file (@ver_files_array)
{
    $rs = Utilities::replace_version_file($ver_file, $new_baseline);
    if ( $rs != 0 )
    {
        Utilities::log_error("Meet error when update version");
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
        exit 1;
    }
}

##################################################
# Git add
##################################################
$cmd = "git add .";
( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");
    Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
    exit 1;
}

##################################################
# Git commit
##################################################
$cmd = "git status | $UNIX_GREP \"nothing to commit\"";
( $rs, @output_array ) = Utilities::my_system($cmd);
if (@output_array)
{

    # include 'nothing to commit', so will not commit
    Utilities::log_info("There have nothing to commit");
}
else
{
    $cmd = "git commit -m \"Update the version file\"";
    ( $rs, @output_array ) = Utilities::my_system($cmd);
    if ( $rs != 0 )
    {
        Utilities::log_error("Meet error when $cmd");
        Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
        exit 1;
    }
}

##################################################
# Send submission email
##################################################
my @attachment        = ();
my $mail_title        = "\[$project_name\]\: $new_baseline Submitted";
my $change_list_email = Utilities::array_to_string(@change_list_array);
my $comments_email    = Utilities::array_to_string(@comments_array);
$change_list_email =~ s/\n/<br>/g;
$comments_email    =~ s/\n/<br>/g;

my $mail_string = <<INFORM
    <body style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">
        <table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" align="right">Submitter:</td>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black"><b>$author</b></td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" align="right">Last BaseLine:</td>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$last_baseline</td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" align="right">New BaseLine:</td>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$new_baseline</td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" align="right">INT Branch:</td>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$int_branch</td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" align="right">Comments:</td>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$comments_email</td>
            </tr>
            <tr>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" align="right">Integration URL:</td>
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black"><a href="$ENV{BUILD_URL}console">$ENV{BUILD_URL}console</a></td>
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

Utilities::send_mail( $release_mail_list, $mail_title, $mail_string, @attachment );

sub record_baseline
{
    open( INFO, ">> $config_file" );
    print INFO "AUTHOR=$author\n";
    print INFO "COMMENTS=$comments\n";
    print INFO "LAST_BASELINE=$last_baseline\n";
    print INFO "NEW_BASELINE=$new_baseline\n";
    close(INFO);
}

print "#############################\n";
print "[CURRENT_BASELINE] $new_baseline \n";
print "#############################\n";

exit 0;
