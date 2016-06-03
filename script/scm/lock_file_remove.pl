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

Utilities::get_parameter();

print "#############################\n";
print "[CURRENT_BASELINE] $new_baseline \n";
print "#############################\n";

if(-e "$lock_file")
{
    print "[INFO] Start remove $lock_file ... \n";
    unlink "$lock_file";
    if(-e "$lock_file")
    {
        print "[ERROR] Remove $lock_file failed! \n";
        exit 1;
    }
    else
    {
        print "[INFO] Remove $lock_file success. \n";
    }
}
else
{
    print "[WARNING] $lock_file is not exist\n";
}
