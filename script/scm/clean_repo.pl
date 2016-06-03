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
my $UNIX_GREP         = "$win_script_home\\tools\\grep.exe";

##################################################
# Clean repo
##################################################
chdir("$repo_home\\..");
system("unjunction.bat");
chdir("$repo_home");

#while ( -e "$repo_home\\.git\\index.lock" )
#{
#    print "[INFO] $repo_home\\.git\\index.lock exist, please wait 1 minutes\n";
#    sleep(60);
#}
if ( -e "$repo_home\\.git\\index.lock" )
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

if ( $release_type eq "DAILY" )
{
    chdir("$repo_home");
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
}
