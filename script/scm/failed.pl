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

my $mount_cmd = "subst.exe $repo_root $remote_repo_home";
print "[INFO] $mount_cmd\n";
system("$mount_cmd");

##################################################
# Define parameter
##################################################
my @total_log = ();

##################################################
# List all files
##################################################
my @log_file_list = ();
find( \&PrintName, "$log_dir" );
find( \&PrintName, "$remote_log_dir" );

sub PrintName
{
    my $path = "";
    my $reg  = "";
    if (/$reg/)
    {
        $path = $File::Find::name;
        if ( $path =~ /\.failed$/ )
        {
            $path =~ s/\//\\/g;

            #$path =~ s/\\+/\\/g;
            print "[DEBUG] $path\n";
            push( @log_file_list, $path );
        }
    }
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

    print "[WARNING] Cannot find any failed files!\n";
    exit 1;
}

my $mail_title = "";
if ( $release_type eq "DAILY" )
{
    $mail_title = "\[Daily Build $project_name\]\: $new_baseline daily failed!";
}
else
{
    $mail_title = "\[$project_name\]\: $new_baseline CI failed!";
}
my $mail_string = "";
my @attachment  = ();
$comments =~ s/\n/<br>/g;
if ( $author =~ /^(.*)-(.*)/ )
{
    $author = $2;
}
$failed_mail_list = "$failed_mail_list" . "\;$ENV{EMAIL}";

#my $total_log_email = Utilities::array_to_string(@total_log);
my $total_log_email = array_to_email_format(@total_log);

$mail_string = <<INFORM
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
                <td style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black">$comments</td>
            </tr>
        </table><br/>
        
        <table style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black" width="100%">
            <tr>
                <td colspan="2" style="font-family: Verdana, Helvetica, sans serif; font-size: 12px; color: black; color: white; background-color: #00BB00; font-size: 120%" class="bg1"><b>Failed Link</b></td>
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

# Attach Win32 IT test report if CI failed.
if ( -e "$repo_root\\pcr_srp\\code\\output_win32\\win32_runner_part1.cfy")
{
    push (@attachment, "$repo_root\\pcr_srp\\code\\output_win32\\win32_runner_part1.cfy");    
}
if ( -e "$repo_root\\pcr_srp\\code\\output_win32\\win32_runner_part2.cfy")
{
    push (@attachment, "$repo_root\\pcr_srp\\code\\output_win32\\win32_runner_part2.cfy");    
}

Utilities::send_mail( $failed_mail_list, $mail_title, $mail_string, @attachment );

# Remove all log file
foreach (@log_file_list)
{
    print "[DEBUG] Remove log file $_\n";
    unlink("$_");
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
