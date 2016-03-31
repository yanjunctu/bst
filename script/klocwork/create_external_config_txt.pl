#!/usr/local/bin/perl -w

################################################################################
#
#                  P E R L   S P E C I F I C A T I O N
#             COPYRIGHT 2013 MOTOROLA, INC. ALL RIGHTS RESERVED.
#                    MOTOROLA CONFIDENTIAL PROPRIETARY
#
################################################################################
#
# FILE NAME: update_buildspec_path.pl
#
# ----------------
# Description: 
# ----------------
# This script reads the additional include paths \ltd\tools\Klocwork\include_path.txt 
# and generates a external_config.txt file in the Klocwork Desktop Project .kwps directory
#
#	Usage  : 
# 	Options : 
# 		-builddrive <builddrive>
# 		-buildspec <buildspec>
#			-dest <Klocwork Desktop project .kwlp directory>
#  Example: $PERL create_external_config.pl -buildspec D:\KW\Tahiti\.kwlp\kw_Arch_Host_Tahiti_wrlinux_build_spec.out -dest D:\KW\Tahiti\.kwlp -builddrive V"
#	
# Output:
# ----------
# external_config.txt file create in the Klocwork Desktop Project .kwps directory
#
#			
#############################################################################
#----------------------------- MODULE INCLUDES ---------------------------------
BEGIN {

	push @INC,"\\ltd\\tools\\Perl\\bin\\lib";
	push @INC,"/vobs/ltd/tools/Perl/bin/lib";
}


##----------------------------------GLOBAL VARIABLES---------------------------------------

my $builddrive;
my $buildspec;
my $dest;
my $PERL=$ENV{PERL};

sub parseArguments
{
  my (@params) = @_;
  
 

  if (!@ARGV)
  {
     print "\nERROR[1]:\n\n";
     &printUsage();
  }
  
  if ($#ARGV != 5)
  {
  	 print "\nERROR[2]:\n\n";
     &printUsage();
  }
  
  for($i=0;$i<scalar(@params);$i++)
  {
    $argument_value = $params[$i];
		
    if( ($argument_value eq "-dest"))
    {
	  	$i++;
      $dest = $params[$i];
  	}
 		if( ($argument_value eq "-builddrive"))
    {
	  	$i++;
      $builddrive = $params[$i];
  	} 
  	if( ($argument_value eq "-buildspec"))
    {
	  	$i++;
      $buildspec = $params[$i];
  	} 	
  	
  	
  }
	if (-e $buildspec)
	{
  	if (-d $dest)
  	{
  		&runScript();
  	}
  	else
  	{
  			print "$dest not found\n\n";
 		}		
  }
  else
  {
  	print "$buildspec file is not found\n\n";
  }		
}

sub printUsage
{
#------------------------------ LOCAL VARIABLES --------------------------------

#----------------------------------- CODE --------------------------------------

  print "Usage: $PERL $0 -buildspec <buildspec file> -dest <KW Desktop project .kwlp directory> -builddrive <builddrive> \n\n";
  print "Example: $PERL $0 -buildspec D:\\KW\\Tahiti\\.kwlp\\kw_Arch_Host_Tahiti_wrlinux_build_spec.out -dest D:\\KW\\Tahiti\\.kwlp -builddrive V";
  exit -1;
}


sub runScript
{
	my $path;
	my $proj;
	my $regular_expression;
	my $kwps_dir;
	my $include_path="";
	
	$kwps_dir = $dest;
	$kwps_dir =~ s/\.kwlp$/\.kwps/;
	$ext_config_file = "$kwps_dir\\external_config.txt";
	
		if (($buildspec =~ /ARCH/i) || ($buildspec =~ /GEMSTONES/i))
		{
				if (not ($buildspec =~ /DSP/i))
				{	
					$include_path="additional_compiler_options=";
					$kw_include_file = "$builddrive:\\ltd\\tools\\Klocwork\\include_path.txt";
					open (KW, "<$kw_include_file") || die "$kw_include_file not found. \n$!\n";
					@lines = <KW>;
					close (KW);
					foreach (@lines)
					{
						chomp($_);
						($incld_option,$proj, $path) = split(/=/, $_);
						
						#NORMAL includes always have precedence over SYSTEM includes
						if ($incld_option =~ /NORMAL/i)
						{
							$incld_option="-I";
						}
						elsif ($incld_option =~ /SYSTEM/i)
						{
							$incld_option="-J";
					  }	
						if ($proj =~ /COMMON/i)
						{
								$include_path=$include_path."$incld_option $builddrive:$path ";
						}
						elsif ($buildspec =~ /$proj/i) # this is specific include path for certain project or targets
						{
								$include_path=$include_path."$incld_option $builddrive:$path ";
					  }			
					}
				}	
		}	

		open (CONFIG,">$ext_config_file") || die "Failed to create $ext_config_file. \n$!\n";
		print CONFIG "$include_path";
		close (CONFIG);
	
		print "\n\n $ext_config_file created\n";
}		



# ---------------------------------- Main function ----------------------------------- 
&parseArguments(@ARGV);

exit 0;


################################################################################
#
#                              HISTORY TEMPLATE
#
################################################################################
#
# 16 APRIL 2013  Ong Con Nie		Initial release
##################################################################################