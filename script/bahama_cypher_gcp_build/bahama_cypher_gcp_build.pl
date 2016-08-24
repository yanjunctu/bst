use Cwd qw/abs_path/;
use File::Basename;
use lib abs_path( dirname(__FILE__) ) . "/lib";
use Config::IniFiles;

#================================================================
# variable
#================================================================
my $current_script = __FILE__;
my $current_script_dir = abs_path(dirname(__FILE__));

my @bahama_arm_GCP_libs = ("BaseInterfaces_arm9","DH_ARM9_lib","FE_BaseEntities_ARM9_lib","FE_TargetIndependent_ARM9_lib","LE_TargetIndependent_ARM9_lib","CL_TargetIndependent_ARM9_lib","MC_TargetIndependent_ARM9_lib","Encryption_arm9","EncryptionAdp_arm9","EncryptionCommon_arm9","losal_arm9","osal_nucleus_support_arm9","osali_DM814x_arm9_build","proxy_arm9","serialize_arm9","Interpreters_arm9","smFramework_arm9","collections_arm9","DataArray_arm9","xcmp_arm9_build","xnl_arm9_build","misc_arm9","io_arm9","SerialIO_arm9","timer_arm9");

my @bahama_dsp_GCP_libs =("BaseInterfaces_C674x","DH_TIC674x_CCS_lib","FE_BaseEntities_TIC674x_CCS_lib","FE_TIC674x_CCS_lib","LE_TIC674x_CCS_lib","osali_DM814x_c674_build","proxy_C674x","serialize_C674x","collections_C674x","DataArray_C674x");

my @cypher_gcp_libs = ("xnl_arm9_build","xcmp_arm9_build","networkingInterfaces_arm9","networkingRealizations_arm9");

my $flash_size = "32mb";
my $lib_cfg_file = "$current_script_dir/libs_config.ini";

#================================================================
# Get the parameter
#================================================================
my $view_name = "";
my $bahama_cs_file = "";
my $cypher_cs_file = "";
my $view_root = "";


if (scalar(@ARGV) == 4)
{
   $view_name = $ARGV[0];
   my @temp = split(":",$ARGV[1]);
   $view_root = join(":",$temp[0],"\\");
   $bahama_cs_file = $ARGV[2];
   $cypher_cs_file = $ARGV[3];
}
else
{
    print "Error: args are not correct \n";
    print"Usage: perl $current_script view_name view_root bahama_platform_cs cypher_gcp_cs";
    exit 1;
}

chdir("$view_root");

#=================================================================
# set envionment variables
#=================================================================
set_ev();
#=================================================================
# bahama
#=================================================================

#config bahama platform cs
my $ret =0;
$ret = config_cs($view_name, $bahama_cs_file);
if ( $ret != 0 )
{
    print "[ERROR] Meet error when config bahama platform cs\n";
    exit(1);
}
#arm
build_GCP_libs($lib_cfg_file,@bahama_arm_GCP_libs);
#dsp
build_GCP_libs($lib_cfg_file,@bahama_dsp_GCP_libs);
#RTP library
$ret = build_rtplib();
if ( $ret != 0 )
{
    print "Error: Meet error when build rtp libs.\n";
    exit(1);
}

#================================================================
# cypher
#================================================================
$ret = config_cs($view_name, $cypher_cs_file);
if ( $ret != 0 )
{
    print "[ERROR] Meet error when config cypher cs\n";
    exit(1);
}
#arm
build_GCP_libs($lib_cfg_file,@cypher_gcp_libs);
#treck
$ret = build_treckip_libs();
if ( $ret != 0 )
{
    print "Error: Meet error when build treckip libs.\n";
    exit(1);
}

#==============================================================
sub build_GCP_libs
{
    my ( $cfgfile,@build_libs_list) = @_;

    my $ret = 0;
    my $libcfg = new Config::IniFiles -file => $cfgfile;
    my @libs_list = $libcfg->val("Generate", "libs_list");
    my $libname = "";
    my $model_path="";
    my $component_name="";
    my $parent_path="";
    my $target_path=""; 
    my $need_clean =1;
    my $count=1;
    
    while($count<=@build_libs_list){
    
        my $lib_info_exist = 0;
        $libname =$build_libs_list[$count-1];
        #verify the libs build info whether exist
        map { if($libname eq $_) { $lib_info_exist = 1} } @libs_list;
        $lib_info_exist=1;
        if (!$lib_info_exist)
        {
            print "[ERROR] $libname is not exist in the $cfgfile ";
            exit (1);
        }
        
        $model_path=$libcfg->val("$libname", "model_path");
        $component_name=$libcfg->val("$libname", "component_name");
        $parent_path=$libcfg->val("$libname", "parent_path");
        $target_path=$libcfg->val("$libname", "target_path"); 
        $need_clean =$libcfg->val("$libname", "need_clean");

        $ret = build_rrt_model( "$view_root$model_path", "$component_name", "$parent_path", "$target_path", $need_clean );
        if ( $ret != 0 )
        {
            print "[ERROR] Meet error when build $component_name\n";
            exit(1);
        }
        $count++;
    }
}


sub build_rrt_model
{

    my ( $model_path, $component_name, $parent_path, $target_path, $need_clean ) = @_;

    print <<_EOF_


================================================================
    to build $component_name
    
    $model_path,    
    $component_name, 
    $parent_path, 
    $target_path
================================================================

_EOF_
      ;

    # clean folders
    chdir($parent_path);
    mkpath( "$target_path",1, 0777 );
    chdir("$target_path");
    system("cd");

    # build it
    print "\n";
    print "=======================================================\n";
    print "building $component_name ....\n";
    print "=======================================================\n";
    print "\n";

    #   my $rtbuild_bat = "D:\\build_".$view_name."_".$datetime_str.".bat";
    my $datetime_str=gmtime();
    my $rtbuild_bat = "$current_script_dir\\build_" .$view_name. ".bat";
    $clean_cmd = "nmake -nologo RTclean";
    $genmk_cmd = "nmake -nologo -f \"C:\\Program Files\\Rational\\Rose RealTime\\codegen\\bootstrap\\MS_nmake.mk\" RTS_HOME=\"$view_root\\cgiss_subscriber\\Tools\\realtime\\C++\\TargetRTS\" MODEL=\"$model_path\" COMPONENT=\"$component_name\" RTmakefiles";
    $cmp_cmd   = "nmake -nologo RTcompile";

    open( RTBAT, "> $rtbuild_bat" ) || die "Unable to create temp build bat file\n";

    if ( $need_clean == 1 )
    {
        print RTBAT "$genmk_cmd\n";
        print RTBAT "$clean_cmd\n";
        print RTBAT "$genmk_cmd\n";
        print RTBAT "$cmp_cmd\n";
    }
    else
    {
        print RTBAT "$genmk_cmd\n";
        print RTBAT "$cmp_cmd\n";
    }
    close RTBAT;

    $cmd = "clearaudit /c $rtbuild_bat && exit";
    my $ret = system("$cmd 2>&1");
    system("del /Q /F \"$rtbuild_bat\"");

    print "\n";
    print "=======================================================\n";
    print "building $component_name done\n";
    print "=======================================================\n";
    print "\n";

    return $ret;
}

sub build_rtplib
{
    #chdir("$view_root\\ltd\\code\\build");
    #system("dosrun.bat");
    chdir("$view_root\\ltd_model\\Cypher\\code\\rtp\\build");
    
    if ( -e "m_rls" )
    {
        system("del /q m_rls");
        rmdir("m_rls") || die "m_rls can't be removed. \n";
    }
    $ret = system("$view_root\\ltd\\code\\build\\dosrun.bat && clearmake -C gnu RADIO_TYPE=mobile CONFIG=release SCAN=bld_only MAKEDEP=none BLD_SIG=yes LAB_USE=yes VER=D01.07.05 -V");
    chdir("$view_root");
    return $ret;

}

sub set_ev
{
    $ENV{VIEW_DRIVE} = "$view_root";
    $ENV{VOBROOT}    = "$view_root";
    $ENV{VOB_ROOT}   = "$view_root";

    $ENV{COMPONENT_ROOT}       = "$view_root\\gcp_fl08_dll";
    $ENV{CONN_MODEL_PATH}      = "$view_root\\ltd\\code\\connectivity\\RTModel_dev\\LTD_Connectivity_main";
    $ENV{CONN_VIEW_DRIVE}      = "$view_root";
    $ENV{CONNECTIVITY_HOME}    = "$view_root\\ltd\\code\\connectivity\\RTModel_dev";
    $ENV{CORE_LIB}             = "$view_root\\ltd\\release\\core_libraries";
    $ENV{CYPHER}               = "$view_root\\ltd_model\\Cypher";
    $ENV{DEBUG}                = "0";
    $ENV{DRIVE_MAP}            = "$view_root";
    $ENV{DSPF_LINEUP_ENTITIES} = "$view_root\\gcp_dsp_lineup_entities";
    $ENV{EXTERNAL_RELEASE}     = "yes";
    $ENV{FRAMEWORK_ENTITIES}   = "$view_root\\gcp_dsp_framework_entities";
    $ENV{PLATFORM_ROOT}        = "$view_root\\cgiss_subscriber";
    $ENV{GCP_TOOLS_PATH}       = "$ENV{PLATFORM_ROOT}\\Tools";
    $ENV{LAB_USE}              = "no";
    $ENV{LINEUP_ENTITIES}      = "$view_root\\gcp_dsp_lineup_entities";
    $ENV{LTD_LIB}              = "$view_root\\ltd\\release\\ltd_libraries";
    $ENV{LTD_MODEL}            = "$view_root\\ltd_model";
    $ENV{LTD_ROOT}             = "$view_root\\ltd\\model";
    $ENV{MATRIX_CORE}          = "$view_root\\ltd\\model";
    $ENV{MATRIX_PLATFORM}      = "$view_root\\ltd_release\\MatrixCore";
    $ENV{MATRIX_PLATFORM_F}    = "$view_root\\ltd_model\\MatrixCore";
    $ENV{MATRIX_REORG_VOB}     = "$view_root\\ltd_model";
    $ENV{MATRIX_ROOT}          = "$ENV{PLATFORM_ROOT}";
    $ENV{MODEL_ROOT}           = "$ENV{PLATFORM_ROOT}";
    $ENV{OS_ROOT}              = "$view_root\\gcp_nucleus_releases";
    $ENV{ROSE_RTS_HOME}        = "$ENV{PLATFORM_ROOT}\\Tools\\realtime";
    $ENV{ROSERT_RTS_HOME}      = "$ENV{PLATFORM_ROOT}\\Tools\\realtime";
    $ENV{SIG_ATDEBUG}          = "no";
    $ENV{TI_ROOT}              = "$view_root\\cgiss_subscriber\\Tools\\Build\\ti\\tms470\\cgtools\\bin";
    $ENV{FRAMEWORK_ENTITES}    = "$view_root\\gcp_dsp_framework_entities";
    $ENV{KLOCWORK_ON}          = "no";

    #add by me
    $ENV{NU_SYSTEM_OUTPUT}="\\bahama_platform\\release\\nucleus\\output";
    $ENV{NU_TOOLSET}="csgnu_arm";
    $ENV{NU_PLATFORM}="dm814xevm";
    $ENV{NU_USER_CONFIG}="bahama_release";  

    if ( $flash_size eq "32mb" )
    {
        $ENV{MATRIX_PLATFORM_NAME} = "Trident_32MFlash";
    }
    else
    {
        $ENV{MATRIX_PLATFORM_NAME} = "Tomahawk_8MFlash";
    }
    $ENV{MATRIX_PLATFORM_RELEASE} = "$ENV{MATRIX_PLATFORM}\\release\\$ENV{MATRIX_PLATFORM_NAME}";

    system("cmd /c set");
    print "<<<< set_ev finished. \n";
}

sub config_cs
{
    my ( $view_name, $cs_file) = @_;
    
    $cmd = "cleartool setcs -tag $view_name $cs_file";
    print "[INFO] $cmd\n";
    my $ret = system("$cmd 2>&1");
    return $ret
}

sub build_rtplib
{
    chdir("$view_root\\ltd_model\\Cypher\\code\\rtp\\build");
    if ( -e "m_rls" )
    {
        system("del /q m_rls");
        rmdir("m_rls") || die "m_rls can't be removed. \n";
    }
    $gen_cmd = system("$view_root\\ltd\\code\\build\\dosrun.bat && clearmake -C gnu RADIO_TYPE=mobile CONFIG=release SCAN=bld_only MAKEDEP=none BLD_SIG=yes LAB_USE=yes VER=D01.07.05 -V");
    chdir("$view_root");

    $ret = $gen_cmd;
    return $ret;

}

sub build_treckip_libs
{
    my $ret                 = 0;
    my $treckip_output_file = "treck_arm9.lib";
    my $treckip_build_cmd   = "buildStack.bat arm9 $view_root";

    chdir("$view_root\\gcp_networking\\IPStack\\TreckStack\\build\\");

    #if exist the out_putfile, check it out.
    if ( -e $treckip_output_file )
    {
        my $co_cmd = "cleartool checkout -unr -nmaster -nc $treckip_output_file";
        system($co_cmd);
    }

    print "\n";
    print "=======================================================\n";
    print "building $treckip_output_file ....\n";
    print "=======================================================\n";
    print "\n";

    #build the lib
    system($treckip_build_cmd);

    print "\n";
    print "=======================================================\n";
    print "building $treckip_output_file done\n";
    print "=======================================================\n";
    print "\n";

    if ( -e $treckip_output_file )
    {

        #push it into queue
        push( @check_out, $treckip_output_file );
        $ret = 0;
    }
    else
    {
        $ret = 1;
    }

    return $ret;
}