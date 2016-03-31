
################################################################################
#
#                  P E R L   S P E C I F I C A T I O N
#             COPYRIGHT 2013 MOTOROLA, INC. ALL RIGHTS RESERVED.
#                    MOTOROLA CONFIDENTIAL PROPRIETARY
#
################################################################################
#
# FILE NAME: kwcheck.pl
#
# -------------
# Description: 
# ------------
# This script reads the file change list and generates the buildspec.out file for KW Desktop
# 
# 
#	Usage  : $PERL kwcheck.pl
#	Options :
#		buildspec.out
#		Klocwork project .kwlp directory 
#		view drive
# Output:
# -------
# Output file will be the buildspec.txt file generated Klocwork project .kwlp directory
#
#			
#############################################################################
#!/usr/bin/perl
#use strict;

use Cwd qw/abs_path/;
use File::Basename;
my $current_script_dir = abs_path(dirname(__FILE__));

my $num_of_args = scalar(@ARGV);
my $out_path;
my $dest;
my $view_drive;
my $fcl;
my $PERL=$ENV{PERL};

if ($num_of_args < 3)
{
	print "\nInsufficient arguments\n";
	print "\nPlease provide minimum 3 arguments and maximum 4 arguments\n\n";
	print_usage();
}
elsif ($num_of_args > 4)
{
	print "\nToo many arguments\n\n";
	print "\nPlease provide minimum 3 arguments and maximum 4 arguments\n\n";
	print_usage();
}	
else
{	
		GetArgument();
		CheckArgument();
		#kwcheck_import();
		change_bs_dir();
		rename_buildspec();
		if ($num_of_args == 4)
		{
			generate_workingsets();
		}	
}


#Subroutine
sub GetArgument
{
  $out_path = $ARGV[0];
	$dest = $ARGV[1];
	$view_drive = $ARGV[2];
	$view_drive =~ s/\://g;
	if ($num_of_args == 4)
	{
		$fcl = $ARGV[3];
  }	
  if (not ($out_path =~ /spec.out/i))
	{
		print "$out_path is not a valid buildspec.out file";
		print_usage();
  }	
	if (not ($dest =~ /\.kwlp/))
	{
		print "Destination path must include the .kwlp directory\n";
		print_usage();
  }
  if (not ((length($view_drive)==1) && ($view_drive =~ /^[A-Z]{1}/i)))
  {
  	print "\nView drive is invalid\n";
		print_usage();
  }	
}

sub CheckArgument
{
	my $checkarg = 0;
	if (not (-e $out_path))
	{
			print "\nCannot find $out_path\n";
			$checkarg++;
	}			
	if (not (-e $dest))
	{
			print "\nCannot find $dest\n";
			$checkarg++;
	}	
	if (defined($fcl))
	{
	  if (not (-e $fcl))
		{
				print "\nCannot find $fcl\n";
				$checkarg++;
		}
	}
  if ($checkarg > 0)
	{
			exit (1);
	}
	
}	

sub print_usage
{
	print "\nPlease enter build_spec.out path, destination and view drive\n";
	print "eg: T:\\kw_Gemstones_Host_Por_Belize_wrlinux_build_spec.out D:\\KW\\Tahiti\\.kwlp Z \n\n";
	print "		or \n\n";
	print "Please enter build_spec.out path, destination, view drive and file change list(optional)\n";
	print "eg: T:\\kw_Gemstones_Host_Por_Belize_wrlinux_build_spec.out D:\\KW\\Tahiti\\.kwlp Z D:\\File_change_list.txt \n";
	exit (1);
}	
sub kwcheck_import
{
	system ("kwcheck import $out_path -pn $dest");
}

sub change_bs_dir
{
	$build_spec = "buildspec\.txt";
	chdir($dest) or die "Can't chdir to $dest $!";
	if (-e $build_spec)
	{
		print "Buildspec.txt exists...continuing...\n";
		open FILE, "<buildspec\.txt" or die $!;
		open FILE2, ">buildspec_new\.txt" or die $!;
		while (<FILE>) {
				
			if (s/[A-Z]\:/$view_drive\:/g)
			{
				print FILE2;
			}else
			{
				print FILE2;
			}
						
		}
		close FILE;
		close FILE2;	
		create_external_config();
	}
	else 
	{
		print "File does not exist\n";
	}
}

sub create_external_config
{
	$perl_commandline = "$PERL $current_script_dir\\create_external_config_txt.pl -buildspec $out_path -dest $dest -builddrive $view_drive";
	system("$perl_commandline");
}	

sub rename_buildspec
{
	rename "$dest\\buildspec\.txt","$dest\\buildspec_org\.txt";
	rename "$dest\\buildspec_new\.txt","$dest\\buildspec\.txt";
}	

sub generate_workingsets
{
	$perl_commandline = "$PERL $current_script_dir\\kw_workingset_generator.pl -fcl $fcl -dest $dest -drive $view_drive";
	system("$perl_commandline");
}	

################################################################################
#
#                              HISTORY TEMPLATE
#
################################################################################
# Date updated	     					Author	  		Description of change
# ------------------       -----------	  	------------------------------- 
# 10 Sept 2012   						Sharon Ong     	Initial release
#	13 May  2013							Ong Con Nie			Changed to include
#																						- module to generate external_config.txt
#																						- module to generate workingsets.xml	
################################################################################


