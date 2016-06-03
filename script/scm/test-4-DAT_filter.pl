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

my $dat_pid = "$win_script_home\\${project_name}_${release_type}_dat.pid";
my $dat_already_runned_version_file = "$win_script_home\\${project_name}_${release_type}_dat.txt";

# Check DAT whether running
if ( -e "$dat_pid" )
{
    print "[INFO] DAT running, so will ignore current DAT request\n";
    exit 1;

}

##################################################
# List all files
##################################################
my @log_file_list = ();
find( \&PrintName, "$local_data_home\\$project_name" );

sub PrintName
{
    my $path = "";
    my $reg  = "";
    if (/$reg/)
    {
        $path = $File::Find::name;
        if ( -d $path && $path =~ /$prefix_baseline.\d{2}$/ )
        {
            $path =~ s/\//\\/g;

            print "[DEBUG] $path\n";
            $path =~ /(.*)\\(.*)/;
            print "[DEBUG] $2\n";
            push( @released_dir, $2 );
        }
    }
}

my @num_list = ();
foreach my $bl (@released_dir)
{
    chomp($bl);
    if ( $bl =~ /$prefix_baseline.\d{2}$/ )
    {
        $bl =~ /$prefix_baseline.(.*)/;
        push( @num_list, $1 );
    }
}

@num_list = sort { $a <=> $b } @num_list;

$latest_baseline     = "$prefix_baseline.$num_list[$#num_list]";
$latest_released_dir = "$local_data_home\\$project_name\\" . "$prefix_baseline.$num_list[$#num_list]";

print "$latest_released_dir\n";

# Get the latest already runned version
if ( -e "$dat_already_runned_version_file" )
{
    open( FILE, "$dat_already_runned_version_file" );
    my @log_content = <FILE>;
    close(FILE);

    $already_runned_version = Utilities::array_to_string(@log_content);
}

print "==$already_runned_version\n";
print "==$latest_baseline\n";

chomp($already_runned_version);

if ( "$latest_baseline" le "$already_runned_version" )
{
    print "[INFO] LATEST baseline not large already runned version, so it will not trigger DAT!\n";
    exit 1; # will not trigger DAT
}

open( OUTFILE, " > PARA.txt" );
print OUTFILE "NEW_BASELINE=$latest_baseline\n";
close(OUTFILE);

