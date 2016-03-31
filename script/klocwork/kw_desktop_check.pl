#perl

use Cwd qw/abs_path/;
use File::Path;
use File::Basename;
use File::Copy;
use lib abs_path(dirname(__FILE__))."\\lib";
use Log::Log4perl;
use Config::IniFiles;


my $PERL=$ENV{PERL};
#=================================================
# Use Log4perl
#=================================================
my $current_script = __FILE__;
my $current_script_dir = abs_path(dirname(__FILE__));
Log::Log4perl->init("$current_script_dir\\log.ini");
my $log = Log::Log4perl->get_logger("My::packagename");

#=================================================
# Get the parameter
#=================================================
my $viewdrive = "";
my $kw_project = "";
my $check_file = "";
my $FCL_file_dir = "";
#my $check_file ="Y:\\pcr_srp\\code\\phyrCe\\Code\\Neptune\\IP_Interface\\PH_NeptuneIPInterface.cpp";
if (scalar(@ARGV) == 3)
{
    $viewdrive = $ARGV[0];
    $kw_project = $ARGV[1];
	$FCL_file_dir = $ARGV[2];
    # Remove ':' from view driver
    $viewdrive =~ s/\://;
    $log->info("viewdrive: $viewdrive");
    $log->info("kw_project: $kw_project");
}
else
{
    $log->error("Usage: $PERL $current_script Driver_letter KW_project_name");
    $log->error("For example: $PERL $current_script S NGR_DSP");
    exit 1;
}

open (FILE,"<",$FCL_file_dir) or die $!;
{
    local $/=undef;
    $check_file= <FILE>;
    close FILE;
}

#$log->info("FCL: $check_file");
$log->debug("USERNAME: $ENV{USERNAME}");
$log->debug("COMPUTERNAME: $ENV{COMPUTERNAME}");
#$check_file ="R:\\pcr_srp\\code\\phyrCe\\Code\\Neptune\\IP_Interface\\PH_NeptuneIPInterface.cpp
#R:/pcr_srp/code/win32_stubs/Codeplug.cpp";
#$log->debug("$ENV{PERL}");
#my $viewdrive = "S";
#my $kw_project = "NGR_DSP";
 #"S:\\bahama\\code\\source_files\\RadioDebugger\\DspHandlers\\RdDspMemProfileCommandHandler\\RdDspMemProfileCommandHandler.cpp";

#=================================================
# Get patameters from configure file
#=================================================
my $cfg = new Config::IniFiles -file => "$current_script_dir\\config.ini";
my @kw_project_list = $cfg->val("Generate", "kw_project_list");
my $kw_host = $cfg->val("$kw_project", "kw_host");
my $kw_port = $cfg->val("$kw_project", "kw_port");
my $kw_user_home = $cfg->val("$kw_project", "kw_user_home");
my $kw_server_home = $cfg->val("$kw_project", "kw_server_home");

my $is_kw_out_exist_vob = $cfg->val("$kw_project", "is_kw_out_exist_vob");
my $latest_kw_out = $cfg->val("$kw_project", "latest_kw_out");
my $project_vob = $cfg->val("$kw_project", "project_vob");

#=================================================
# Global parameter
#=================================================
my $kw_prject_exist = 0;
#my $workspace = "$viewdrive:\\$project_vob\\KW_Desktop_Check\\$kw_project";
my $workspace = "D:\\KW_Desktop_Check\\$ENV{USERNAME}\\$kw_project";
my $pd_directory = "$workspace\\.kwlp";
my $sd_directory = "$workspace\\.kwps";
my $local_kw_home = "$ENV{HOMEDRIVE}$ENV{HOMEPATH}\\\.klocwork";

#=================================================
# # verify the KW project whether exist
#=================================================
map { if($kw_project eq $_) { $kw_prject_exist = 1} } @kw_project_list;
if (!$kw_prject_exist)
{
    $log->error("KW project $kw_project not exist");
    $log->error("Avaiable KW project is: @kw_project_list");
    exit 1;
}

#=================================================
# Clean and create workspace directory
#=================================================
if (-d $workspace)
{
    rmtree($workspace)||die "[ERROR] Could not rmdir $workspace:$!";;
}
mkpath($workspace)||die "[ERROR] Could not mkdir $workspace:$!";
$log->debug("$workspace create successful.");

#=================================================
# Copy ltoken file
# 
#=================================================
if (-d "$local_kw_home")
{
	$log->debug("$local_kw_home already exist!");
}
else
{
	mkpath($local_kw_home);
	copy("$current_script_dir\\ltoken","$local_kw_home\\ltoken")||die "[ERROR] Could not copy files from $current_script_dir\\ltoken to $local_kw_home\\ltoken:$!";
}


#=================================================
# Create project/setting directory
#=================================================
$ENV{PATH}="\"$kw_server_home\\_jvm\\bin\"\;$ENV{PATH}";
print "=============================\n";
#system("echo %PATH%");
system("java -version");
print "=============================\n";

#=================================================
# Create project/setting directory
#=================================================
my $kw_create_command = "";
if ($kw_user_home eq "local")
{
    $kw_create_command = "\"kwcheck.exe\" create --url http://$kw_host:$kw_port/$kw_project -pd $pd_directory -sd $sd_directory";    
}
else
{
    $kw_create_command = "\"$kw_user_home\\bin\\kwcheck.exe\" create --url http://$kw_host:$kw_port/$kw_project -pd $pd_directory -sd $sd_directory";
}

$log->debug("$kw_create_command");
my $ret = system($kw_create_command);
if($ret != 0)
{
    $log->error("meet error when run system::\n$kw_create_command");
    exit 1;
}

#=================================================
# Get/copy the latest spec out file to workspace
#=================================================
if($is_kw_out_exist_vob eq "yes")
{
	$latest_kw_out="$viewdrive".":"."$latest_kw_out";
}

if (-e $latest_kw_out)
{
    copy("$latest_kw_out","$workspace\\latest_spec.out")||die "[ERROR] Could not copy files from $latest_kw_out to $workspace:$!" ;
}
else
{
    $log->error("$latest_kw_out is not exist!");
    exit 1;
}

#=================================================
# KW import 
#=================================================
my $kw_import_command = "";
if ($kw_user_home eq "local")
{
    $kw_import_command = "\"kwcheck.exe\" import $workspace\\latest_spec.out -pn $pd_directory";
}
else
{
    $kw_import_command = "\"$kw_user_home\\bin\\kwcheck.exe\" import $workspace\\latest_spec.out -pn $pd_directory";   
}
$log->debug("$kw_import_command");
$ret = system($kw_import_command);
if($ret != 0)
{
    $log->error("meet error when run system::\n$kw_import_command");
    exit 1;
}

#=================================================
# invoke kwcheck.pl
#=================================================
my $kwcheck_command = "$PERL $current_script_dir\\kwcheck.pl $workspace\\latest_spec.out $pd_directory $viewdrive";
$log->debug("$kwcheck_command");
$ret = system($kwcheck_command);
if($ret != 0)
{
    $log->error("meet error when run system::\n$kwcheck_command");
    exit 1;
}

#my $kwgcheck_command = "";
#if ($kw_user_home eq "local")
#{
#    $kwgcheck_command = "\"kwgcheck.exe\" $workspace";
#}
#else
#{
#    $kwgcheck_command = "\"$kw_user_home\\bin\\kwgcheck.exe\" $workspace";    
#}

#$log->debug("$kwgcheck_command");
#$log->debug("$check_file");
#$ret = system($kwgcheck_command);
#if($ret != 0)
#{
#    $log->error("meet error when run system::\n$kwgcheck_command");
#    exit 1;
#}

#exit 0;

#=================================================
# Start run KW check
#=================================================
my $kwcheck_run_command = "";
if ($kw_user_home eq "local")
{
    $kwcheck_run_command = "\"kwcheck.exe\" run --verbose -F detailed -j auto -pd $pd_directory -sd $sd_directory $check_file -l -Y --report $viewdrive:\\temp_log\\kw_check.report";
}
else
{
    $kwcheck_run_command = "\"$kw_user_home\\bin\\kwcheck.exe\" run --verbose -F detailed -j auto -pd $pd_directory -sd $sd_directory $check_file -l -Y --report $viewdrive:\\temp_log\\kw_check.report";    
}

$log->debug("$kwcheck_run_command");
$ret = system($kwcheck_run_command);
if($ret != 0)
{
    $log->error("meet error when run system::\n$kwcheck_run_command");
    exit 1;
}

print "================================================================================\n";
#system("type $workspace\\kw_check.report");
system("type $viewdrive:\\temp_log\\kw_check.report");
print "================================================================================\n";
#system("\"$kw_user_home\\bin\\kwcheck.exe\" list -pd $pd_directory -sd $sd_directory");


