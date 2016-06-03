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

our $ir_branch = "";

Utilities::get_parameter();
 

my $mail_from       = "amb4116\@motorolasolutions.com";

#my $mail_list       = "pnw748\@motorolasolutions.com";
#my $mail_list       = 'rept-ci@motorolasolutions.com';
my $mail_list       = 'rept-ci@googlegroups.com';
#my $mail_list       = 'CG567A@googlegroups.com';

my $mail_cc         = "13882261570\@q163.com";
my $google_username = "amb4116\@motorolasolutions.com";
my $google_password = "configQ2@";
my $mail_title      = "Email test, please ignore4!\n";
my $mail_string     = "mail body!";
my @attachment      = ();

Utilities::send_mail( $mail_list, $mail_title, $mail_string, @attachment );

exit 0;