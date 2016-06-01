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

print "#############################\n";
print "[CURRENT_BASELINE] $new_baseline \n";
print "#############################\n";

#if ( $loc_pro_name eq "" )
#{
#    print "[WARNING] Cannot find LOC_PRO_NAME parameter, it will not run LOC\n";
#    exit 0;
#}

##################################################
# Define parameter
##################################################
my $loc_home   = "$win_script_home\\loc";
my $based_repo = "D:\\Git_Repo\\LOC\\Based_Repo";
my $ir_repo    = "D:\\Git_Repo\\LOC\\IR_Repo";
my $fcl_file   = "$local_data_home\\$project_name\\$new_baseline\\loc\\fcl.txt";
my $author_list = "$loc_home\\author_coreid.txt";
my $out_put_dir = "$local_data_home\\$project_name\\$new_baseline\\loc";


##################################################
# Main
##################################################
print "[INFO] Create $out_put_dir\n";
mkpath( "$out_put_dir", 1 );

##################################################
# Git checkout to baseline
##################################################
chdir("$based_repo");
my $cmd = "git fetch origin && git reset --hard $last_baseline";
my ( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");
    exit 1;
}


chdir("$ir_repo");
$cmd = "git fetch origin && git reset --hard $new_baseline";
( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");
    exit 1;
}

# get change list
my @change_list_array = ();
$cmd = "git diff $last_baseline $new_baseline --name-only";
( $rs, @output_array ) = Utilities::my_system($cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $cmd");
    Utilities::record_log( "$log_dir\\$ENV{BUILD_TAG}.failed", "$cmd failed: $ENV{BUILD_URL}console" );
    exit 1;
}
my @fcl= @output_array;

# format the FCL and save to fcl file
open (OUTFILE," > $fcl_file");
foreach (@fcl)
{
    if ( -e "$_")
    {
        $cmd = "git log -n 1 --pretty=format:\"%cn\" $_";
        ( $rs, @output_array ) = Utilities::my_system($cmd);
        $author = Utilities::array_to_string(@output_array);
        $author=~s/\n+//g;
        if ( $author =~ /^(.*)-(.*)/ )
        {
            $author = $2;
        }
        $_ =~s/\//\\/g; # convert '/' to '\'
        print "\\$_\t$author\n";
        print OUTFILE  "\\$_\t$author\n";
    }
}
close(OUTFILE);

##################################################
# Main
##################################################
chdir("$loc_home");
my $loc_cmd = "perl LOC.pl $based_repo $ir_repo $fcl_file $author_list $out_put_dir";
( $rs, @output_array ) = Utilities::my_system($loc_cmd);
if ( $rs != 0 )
{
    Utilities::log_error("Meet error when $loc_cmd");
    exit 1;
}

exit 0;

