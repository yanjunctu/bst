package Utilities;

#use strict;
use Cwd qw/abs_path/;
use Net::SMTP;
use MIME::Lite;
use File::Basename;
use File::Copy;
use File::Find;
use File::Path;
use Log::Log4perl;
use Tie::File;
use File::Copy::Recursive qw(dircopy fcopy );
my $current_location = abs_path( dirname(__FILE__) );
Log::Log4perl->init("$current_location/Log4perl.ini");
my $log = Log::Log4perl->get_logger("My::packagename");

my $UNIX_GREP = "$ENV{WIN_SCRIPT_HOME}\\tools\\grep.exe";

sub get_parameter
{

    # get from configure file
    $main::project_name          = $ENV{PROJECT_NAME};
    $main::repo_home             = $ENV{REPO_HOME};
    $main::remote_repo_home      = $ENV{REMOTE_REPO_HOME};
    $main::repo_root             = $ENV{REPO_ROOT};
    $main::win_script_home       = $ENV{WIN_SCRIPT_HOME};
    $main::unix_script_home      = $ENV{UNIX_SCRIPT_HOME};
    $main::local_data_home       = $ENV{LOCAL_DATA_HOME};
    $main::remote_data_home      = $ENV{REMOTE_DATA_HOME};
    $main::int_branch            = $ENV{INT_BRANCH};
    $main::short_prefix_baseline = $ENV{SHORT_PREFIX_BASELINE};
    $main::prefix_baseline       = $ENV{PREFIX_BASELINE};
    $main::log_dir               = $ENV{LOG_DIR};
    $main::unix_log_dir          = $ENV{UNIX_LOG_DIR};
    $main::remote_log_dir        = $ENV{REMOTE_LOG_DIR};
    $main::failed_mail_list      = $ENV{FAILED_MAIL_LIST};
    $main::release_mail_list     = $ENV{RELEASE_MAIL_LIST};
    $main::tmpfile               = $ENV{TMPFILE};
    $main::ver_files             = $ENV{VER_FILES};
    $main::lock_file             = $ENV{LOCK_FILE};
    $main::release_type          = $ENV{RELEASE_TYPE};
    $main::loc_pro_name          = $ENV{LOC_PRO_NAME};
    $main::kw_pro_name           = $ENV{KW_PRO_NAME};
    $main::latest_cov_report     = $ENV{LATEST_COV_REPORT};
    $main::kw_repo_home          = $ENV{KW_REPO_HOME};
    $main::kw_remote_repo_home   = $ENV{KW_REMOTE_REPO_HOME};
    $main::kw_repo_root          = $ENV{KW_REPO_ROOT};

    # get from Jenkins parameter
    $main::ir_branch       = $ENV{IR_BRANCH};
    $main::last_baseline   = $ENV{LAST_BASELINE};
    $main::new_baseline    = $ENV{NEW_BASELINE};
    $main::author          = $ENV{AUTHOR};
    $main::comments        = $ENV{COMMENTS};
    $main::based_i_version = $ENV{BASED_I_VERSION};
    $main::config_file     = $ENV{CONFIG_FILE};
}

sub record_log
{
    my ( $log_file, $content ) = @_;
    open( FILE, " > $log_file" );
    print FILE "$content\n";
    close(FILE);
}

sub update_version_info_file
{
    my ( $ver_file, $output_version_value ) = @_;

    #Remove whitespace which at begin/end of string
    $output_version_value =~ s/(^\s+|\s+$)//g;

    print "Update version information file with: HOSTVER=$output_version_value into $ver_file\n";
    print "Update version information file with: DSPVER=$output_version_value into $ver_file\n";
    open( OUT, ">$ver_file" );
    print OUT "HOSTVER=$output_version_value\n";
    print OUT "DSPVER=$output_version_value\n";
    close(OUT);

}

sub replace_version_file
{
    my ( $ver_file, $new_baseline ) = @_;
    my $version = "";
    my $cmd     = "";

    if ( $new_baseline =~ /^(.*)_(.*)/ )
    {
        $version = $2;
    }

    # remove the white space
    $version =~ s/(^\s+|\s+$)//g;

    tie my @array, 'Tie::File', $ver_file or die "Cannot open file\n";
    if ( $version =~ /^(\D)(\d{2})\.(\d{2})\.(\d{2})$/ )
    {
        print "[DEBUG] xx.xx.xx\n";
        $version =~ /^(\D)(\d{2})\.(\d{2})\.(\d{2})/;
        my $baseline_type = $1;
        my $ver_1         = $2;
        my $ver_2         = $3;
        my $ver_3         = $4;

        for (@array)
        {
            s/[A-Z][0-9]{2}\.[0-9]{2}\.[0-9]{2}/$version/g;
            s/\'[A-Z]\',0x[0-9]{2},0x[0-9]{2},0x[0-9]{2}/\'$baseline_type\',0x$ver_1,0x$ver_2,0x$ver_3/g;
        }
    }
    elsif ( $version =~ /^(\D)(\d{2})\.(\d{2})\.(\d{2})\.(\d{2})$/ )
    {
        print "[DEBUG] xx.xx.xx.xx\n";
        $version =~ /^(\D)(\d{2})\.(\d{2})\.(\d{2})\.(\d{2})/;
        my $baseline_type = $1;
        my $ver_1         = $2;
        my $ver_2         = $3;
        my $ver_3         = $4;
        my $ver_4         = $5;

        for (@array)
        {
            s/[A-Z][0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{2}/$version/g;
            s/\'[A-Z]\',0x[0-9]{2},0x[0-9]{2},0x[0-9]{2},0x[0-9]{2}/\'$baseline_type\',0x$ver_1,0x$ver_2,0x$ver_3,0x$ver_4/g;
        }
    }
    untie @array;
    return 0;
}

# Check branch whethre exist
sub check_branch_exist
{
    my ($br_name) = @_;
    my $isExit    = "false";
    my $cmd       = "git branch";
    my ( $rs, @output_array ) = Utilities::my_system($cmd);
    if (@output_array)
    {
        foreach (@output_array)
        {
            $_ =~ s/\*\ //g;    # remove '* ' which is begin of branch
            if ( "$_" eq "$br_name" )
            {
                $isExit = "true";
            }
        }
    }

    return $isExit;
}

sub get_file_list_array
{
    my ($file_list_str) = @_;
    my @ret_file_list = ();

    #Support separe with ';' and ','
    $file_list_str =~ s/\;/\n/g;
    $file_list_str =~ s/\,/\n/g;
    if ( $file_list_str ne "" )
    {

        #@file_list=split(/\s*,\s*/,$file_list_str);
        my @file_list = split( /\n/, $file_list_str );
        foreach (@file_list)
        {
            my @re_split_file_list = split( /\r/, $_ );
            foreach (@re_split_file_list)
            {
                if ( $_ ne "" )
                {
                    $_ =~ s/(^\s+|\s+$)//g;
                    push( @ret_file_list, $_ );
                }
            }
        }
    }
    return @ret_file_list;
}

sub log_info
{
    my ($info) = @_;
    $log->info("$info");
}

sub log_warn
{
    my ($warning) = @_;
    $log->warn("$warning");
}

sub log_debug
{
    my ($debug) = @_;
    $log->debug("$debug");
}

sub log_error
{
    my ($error) = @_;
    $log->error("$error");
}

sub array_to_string
{
    my (@array) = @_;
    my $string = "";
    foreach (@array)
    {
        chomp($_);
        $string = $string . $_ . "\n";
    }
    return $string;
}

sub get_latest_baseline
{
    my ($prefix_baseline) = @_;
    my $latest_baseline   = "";
    my $temp              = 0;
    my @num_list          = ();

    my $cmd = "git tag | $UNIX_GREP \"^$prefix_baseline\"";
    my ( $rs, @output_array ) = my_system("$cmd");
    if ( $rs != 0 )
    {
        $latest_baseline = "";
    }
    else
    {
        foreach my $bl (@output_array)
        {
            chomp($bl);
            if ( $bl =~ /^$prefix_baseline.\d{2}$/ )
            {
                $bl =~ /$prefix_baseline.(.*)/;
                push( @num_list, $1 );
            }
        }

        @num_list = sort { $a <=> $b } @num_list;
        $latest_baseline = "$prefix_baseline.$num_list[$#num_list]";
    }
    return $latest_baseline;
}

sub get_newbaseline
{
    my $last_bl = shift;
    my $new_bl;
    chomp($last_bl);

    if ( $last_bl =~ /(.*)\.(\d+)$/ )
    {
        my $lastdotpos = rindex( $last_bl, "." );
        my $tempstr = substr( $last_bl, $lastdotpos + 1 );    #store the substring from the last dot to the end
        $new_bl = substr( $last_bl, 0, $lastdotpos + 1 ) . ( ( $tempstr + 1 < 10 ) ? "0" . ( $tempstr + 1 ) : ( $tempstr + 1 ) );
        chomp($new_bl);
        return ($new_bl);
    }
    else { return 1; }
}

sub copy_with_bash
{
    my ($COPY_HASH) = @_;

    my $copy_result      = 0;
    my @not_exist_file   = ();
    my @copy_failed_file = ();

    foreach my $source ( sort keys %$COPY_HASH )
    {
        my $target = $$COPY_HASH{$source};

        if ( -e "$source" )
        {
            if ( -f "$source" )
            {

                #                $target =~ /(.*)(\/|\\)(.*)/;
                #                my $parent_dir = $1;
                #
                #                if ( !-d "$parent_dir" )
                #                {
                #                    mkpath("$parent_dir");
                #                }
                #                my $cp_cmd = "copy /Y $source $target";
                #                print "$cp_cmd\n";
                #                if ( system($cp_cmd) != 0 )
                #                {
                #                    print "[ERROR] meet error when run system::\n$cp_cmd\n::$!\n";
                #                    $copy_result = 1;
                #
                #                }
                print "[INFO] Copy $source to $target\n";
                my $fcopy_ret = fcopy( $source, $target );
                if ( $fcopy_ret == 1 )
                {
                    print "Copied!\n";
                }
                else
                {
                    print "[ERROR] Copy $source failed!\n";
                    push( @copy_failed_file, "$source" );
                    $copy_result = 1;
                }
            }
            elsif ( -d "$source" )
            {
                print "[INFO] Copy $source to $target\n";
                my $copy_ret = dircopy( $source, $target );
                if ( $copy_ret > 0 )
                {
                    print "Copied!\n";
                }
                else
                {
                    $copy_result = 1;
                    push( @copy_failed_file, "$source" );
                }
            }
            else
            {
                print "[ERROR] only support copy file or directory\n";
                push( @copy_failed_file, "$source" );
                $copy_result = 1;

            }
        }
        else
        {
            print "[ERROR] $source not exist\n";
            $copy_result = 1;
            push( @not_exist_file, "$source" );
        }
    }

    if ( $copy_result == 0 )
    {
        print "[INFO] all file copy successfule!\n";
    }
    else
    {
        print "[ERROR] some file copy not exist or copy failed\n";
    }

    return $copy_result, \@not_exist_file, \@copy_failed_file;
}

sub send_mail
{
    my ( $mail_list, $mail_title, $mail_string, @attachment ) = @_;
    my @full_mail_list     = ();
    my $notify_information = $mail_string;
    my $mail_from          = 'Integration_Tool@cd.sc.mcel.mot.com';
    my $smtp               = Net::SMTP->new('remotesmtp.mot-solutions.com');
    my $msg                = MIME::Lite->new(
        From    => $mail_from,
        To      => $mail_list,
        Subject => $mail_title,
        Type    => 'multipart/mixed',
    ) or print "Error creating MIME body: $!\n";

    # Add parts:
    $msg->attach(
        Type => 'text/html',
        Data => $notify_information,
    );
    foreach my $attachment (@attachment)
    {
        $msg->attach(
            Type => 'AUTO',         # the attachment mime type
            Path => $attachment,    # local address of the attachment
        ) or print "Error attaching test file: $!\n";
    }

    my $str = $msg->as_string() or print "Convert the message as a string: $!\n";

    # Send the From and Recipient for the mail servers that require it
    if ( $mail_list =~ /;/ )
    {
        @full_mail_list = split( /;/, $mail_list );
    }
    elsif ( $mail_list =~ /,/ )
    {
        @full_mail_list = split( /,/, $mail_list );
    }
    else
    {
        @full_mail_list = $mail_list;
    }
    my $mail_to;
    foreach $mail_to (@full_mail_list)
    {
        $log->debug("send to $mail_to ...");
        $smtp->mail($mail_from);
        $smtp->to($mail_to);
        $smtp->data();
        $smtp->datasend("$str");    # Send the message
        $smtp->dataend();           # Send the termination string
    }
    $smtp->quit;
    return 0;
}

sub run_kw
{
    my ( $kw_project_name, $kw_build_name, $annofile_directory, $KW_HOME, $KW_HOST, $KW_PORT, $KW_DATA_DIR, $RT_build ) = @_;

    #=================================================
    # Convert KW build name
    #=================================================
    $kw_build_name =~ s/\./\_/g;

    #=================================================
    # Print all parameters
    #=================================================
    print "=====================================\n";
    print "[KW_Project_Name] $kw_project_name \n";
    print "[KW_Build_Name] $kw_build_name \n";
    print "[Annofile_Directory] $annofile_directory \n";
    print "[KW_HOME] $KW_HOME \n";
    print "[KW_HOST] $KW_HOST \n";
    print "[KW_PORT] $KW_PORT \n";
    print "[KW_DATA_DIR] $KW_DATA_DIR \n";
    print "[RT_build] $RT_build \n";
    print "=====================================\n";

    #=================================================
    # Create directory to save trace file and other
    #=================================================
    my $build_directory             = "$KW_DATA_DIR\\$kw_project_name\\$kw_build_name";
    my $latest_build_spec_directory = "$KW_DATA_DIR\\$kw_project_name\\LATEST";
    my $all_trace_file              = "$KW_DATA_DIR\\$kw_project_name\\$kw_build_name\\all_trace_file.trace";
    my $build_spec_file             = "$KW_DATA_DIR\\$kw_project_name\\$kw_build_name\\all_build_spec.out";
    my $latest_build_spec_file      = "$KW_DATA_DIR\\$kw_project_name\\LATEST\\all_build_spec.out";
    my $build_kw_table_directory    = "$KW_DATA_DIR\\$kw_project_name\\$kw_build_name\\KW_tables";

    # Remove build_directory if it exist.
    if ( -d "$build_directory" )
    {
        rmtree("$build_directory");
    }
    print "[INFO] Create $build_directory ... \n";
    mkpath("$build_directory");
    mkpath("$latest_build_spec_directory");
    if ( -d "$build_directory" )
    {
        print "[INFO] Create build_directory $build_directory success!\n";
    }
    else
    {
        print "[ERROR] Create build_directory $build_directory failed!\n";
        exit 1;
    }

    #=================================================
    # List all xml files
    #=================================================
    my @anno_file_list = ();
    find( \&PrintName, "$annofile_directory" );

    sub PrintName
    {
        my $path;
        if (/$reg/)
        {
            $path = $File::Find::name;
            if ( $path =~ /\.xml$/ )
            {
                $path =~ s/\//\\/g;
                $path =~ s/\\+/\\/g;
                print "$path\n";
                push( @anno_file_list, $path );
            }
        }
    }

    if ( !@anno_file_list > 0 )
    {
        print "[ERROR] there have no annofile, please check\n";
        exit 1;
    }

    #=================================================
    # Generate trace files and combine to one file
    #=================================================
    my @trace_output = ();
    foreach $anno_file_path (@anno_file_list)
    {
        my @trace_arry = ();
        $anno_file_path =~ /(.*)\\(.*)/;
        my $anno_file_name = $2;
        if ( -e $anno_file_path )
        {

            #system("ping zch49klock01");
            print "[INFO] \"$KW_HOME\\bin\\kwlogparser\" --output $build_directory\\$anno_file_name.trace --verbose emake-annotation $anno_file_path \n";
            my $res = system("\"$KW_HOME\\bin\\kwlogparser\" --output $build_directory\\$anno_file_name.trace --verbose emake-annotation $anno_file_path ");
            if ( $res == 0 )
            {
                open( FILE, "$build_directory\\$anno_file_name.trace" );
                @trace_arry = <FILE>;
                close(FILE);
                @trace_output = ( @trace_output, @trace_arry );
            }
            else
            {
                print "[ERROR] Generate trace from $anno_file_path failed\n";
                exit 1;
            }
        }
        else
        {
            print "[INFO] $anno_file_path is not exist";
            exit 1;
        }
    }

    #=================================================
    # Sort and unique the trace, and then save to file
    #=================================================
    undef %saw;
    @saw{@trace_output} = ();
    my @sorted_trace_output = sort keys %saw;

    print "[INFO] Save all trace to $all_trace_file ... \n";
    open( FILE, ">$all_trace_file" );
    foreach $line (@sorted_trace_output)
    {
        print FILE "$line";
    }
    close(FILE);

    #=================================================
    # Convert build trace to build specification
    #=================================================
    my $kwinject_option = "";
    if ( $RT_build eq "yes" )
    {
        $kwinject_option = "-P rtperl=gnu";
    }
    print "[INFO] \"$KW_HOME\\bin\\kwinject\" --trace-in $all_trace_file $kwinject_option --output $build_spec_file  ...\n";
    my $res = system("\"$KW_HOME\\bin\\kwinject\" --trace-in $all_trace_file $kwinject_option --output $build_spec_file ");
    if ( $res == 0 )
    {
        print "[INFO] Convert build specification succes!\n";
    }
    else
    {
        print "[ERROR] Convert build specification failed!\n";
        exit 1;
    }

    #	chdir("$annofile_directory");
    #	system("cd");
    #    my $kwecbuild_command = "\"$KW_HOME\\bin\\kwecbuild\" --license-host klocwork-lic.mot.com --license-port 27771 --color --force --ec-make \"$KW_HOME\\bin\\emake\" --output-dir KW_EC_tables $build_spec_file";
    #    print "$kwecbuild_command\n";
    #    $res = system("$kwecbuild_command");
    #    if($res == 0)
    #    {
    #        print "[INFO] kwecbuild succes!\n";
    #    }
    #    else
    #    {
    #        print "[ERROR] kwecbuild failed!\n";
    #        exit 1;
    #    }
    #
    #	exit 0;

    #=================================================
    # kwbuildproject build specification and then
    # generate the KW table
    #=================================================
    print "[INFO] \"$KW_HOME\\bin\\kwbuildproject\" --license-host klocwork-lic.mot.com --license-port 27771 --force --verbose --add-compiler-options \"--print-errors -DKLOCKWORK_CHECK \" --tables-directory $build_kw_table_directory $build_spec_file ...\n";
    $res = system("\"$KW_HOME\\bin\\kwbuildproject\" --license-host klocwork-lic.mot.com --license-port 27771 --force --verbose --add-compiler-options \"--print-errors -DKLOCKWORK_CHECK \" --tables-directory $build_kw_table_directory $build_spec_file");
    if ( $res == 0 )
    {
        print "[INFO] kwbuildproject succes!\n";
    }
    else
    {
        print "[ERROR] kwbuildproject failed!\n";
        exit 1;
    }

    #=================================================
    # Upload to KW server
    #=================================================
    print "[INFO] \"$KW_HOME\\bin\\kwadmin\" --url http://$KW_HOST:$KW_PORT/ load $kw_project_name $build_kw_table_directory --name $kw_build_name ...\n";
    $res = system("\"$KW_HOME\\bin\\kwadmin\" --url http://$KW_HOST:$KW_PORT/ load $kw_project_name $build_kw_table_directory --name $kw_build_name");
    if ( $res == 0 )
    {
        print "[INFO] KW upload succes!\n";
    }
    else
    {
        print "[ERROR] KW upload failed!\n";
        exit 1;
    }

    #=================================================
    # Copy build_spec_file to last folder for
    # engineer run KW desktop check
    #=================================================
    print "[INFO] Copy $build_spec_file to $latest_build_spec_file\n";
    copy( "$build_spec_file", "$latest_build_spec_file" ) || die "Copy failed:$!";
}

sub my_system
{
    my ($cmd)     = @_;
    my $res       = "";
    my @output    = ();
    my @res_array = ();

    $log->info("$cmd");

    @output = `$cmd 2>&1`;
    $res    = $?;
    $log->trace("$res");
    print "==$res\n";
    foreach (@output)
    {
        if ( $_ =~ /^\s*$/ )
        {
            next;    # ingore bank line
        }
        $_ =~ s/\n//g;             # remove '\n'
        $_ =~ s/(^\s+|\s+$)//g;    # remove whitespace which at begin or end
        $log->debug("$_");
        push( @res_array, "$_" );
    }

    return ( $res, @res_array );
}

return 1;

