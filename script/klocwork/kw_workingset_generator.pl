
################################################################################
#
#                  P E R L   S P E C I F I C A T I O N
#             COPYRIGHT 2013 MOTOROLA, INC. ALL RIGHTS RESERVED.
#                    MOTOROLA CONFIDENTIAL PROPRIETARY
#
################################################################################
#
# FILE NAME: kw_workingset_generator.pl
#
# -------------
# Description: 
# ------------
# This script reads the file change list and generates the workingset.xml file for KW Desktop
# 
# 
#	Usage  : perl kw_workingset_generator.pl
#	Options :
#		-fcl <filechangelist>
#		-drive <viewdrive>
#		-dest <project .kwlp directory>
# Output:
# -------
# Output file will be the workingset.xml file generated Klocwork project .kwlp directory
#
#			
#############################################################################
#!/usr/bin/perl
#use strict;

BEGIN {

	push @INC,"\\ltd\\tools\\Perl\\bin\\lib";
}

use XML::Writer;
use IO qw(Handle File);
#----- XML variable declaration -----# 
my $config_writer = "";
my $fcl;
my $dir;
my $viewdrive;
my $outputfile;
my $PERL=$ENV{PERL};

if ($#ARGV < 5)
{
	print "\nInsufficient arguments\n\n";
	&printUsage();
}	
else
{
	&GetArgument();
	&CheckArgument();
	&Change_FCL_content();
	&Write_to_XML();
}

sub printUsage
{
	print "Usage  : $PERL $0  \n";
	print "Options : \n";
	print "-fcl <filechangelist>\n";
	print "-dest <Klocwork project .kwlp directory>\n";
	print "-drive <viewdrive>\n";
	print "Example: $PERL $0 -fcl filechangelist.txt -destination D:\\KW\\Tahiti\\.kwlp -drive W \n\n";
	print "\nFAILED\n";
	print "\n\n";
	exit (1);

}

sub GetArgument
{
		my $checkarg = 0;
    foreach my $argnum (0 .. $#ARGV) 
		{
			if ( $ARGV[$argnum] =~  m/-fcl/i)
			{
				$fcl = $ARGV[$argnum+1];
				
			}
			elsif ( $ARGV[$argnum] =~  m/-dest/i)
			{
				$dir = "$ARGV[$argnum +1]";
			}
			elsif ( $ARGV[$argnum] =~  m/-drive/i)
			{
				$viewdrive = "\U$ARGV[$argnum +1]";
				$viewdrive =~ s/\://g;
				
			}
			
			elsif ($argnum == $#ARGV)
			{
				
				
				unless (defined($fcl)) 
				{
					print "\nCannot find -fcl.\n\n";
					$checkarg++;
				}
				unless (defined($dir)) 
				{
					print "\nCannot find -dest\n\n";
					$checkarg++;
				}
				unless (defined($viewdrive)) 
				{
					print "\nCannot find -drive\n\n";
					$checkarg++;
				}
			
			}
			
		}	
		
		if ($checkarg > 0)
		{
			&printUsage();
		}
				
}

sub CheckArgument
{
	my $checkarg = 0;
	if (not (-e $fcl))
	{
			print "\nCannot find $fcl\n";
			$checkarg++;
	}	
	if (not (-e $dir))
	{
			print "\nCannot find $dir\n";
			$checkarg++;
	}	
	elsif (not ($dir =~ /\.kwlp/))
	{
			print "\nDestination path must include the .kwlp directory\n";
			$checkarg++;
  }
  else
  {
  	 $outputfile = "$dir\\workingsets.xml";
	}	
  if ($checkarg > 0)
	{
			exit (1);
	}
	
}	

sub Change_FCL_content
{
	# This will change the Unix path to Windows path.
	$regular_expression='s/\//\\\/g';
	system("$PERL -p -i.bak -e \"$regular_expression\" $fcl");
	# This will replace \vobs to $viewdrive: for Unix format FCL
	$regular_expression='s/\\\vobs/' . "$viewdrive:" . '/g';
	system("$PERL -p -i.bak -e \"$regular_expression\" $fcl");
	# This will change the existing viewdrive (if any) on the Windows FCL to $viewdrive
	$regular_expression='s/^[A-Z]\:\\\/' . "$viewdrive:" . '\\\/g';
	system("$PERL -p -i.bak -e \"$regular_expression\" $fcl");
	# This will add the $viewdrive at the begining of each line for Windows format FCL
	$regular_expression='s/^\\\/' . "$viewdrive:" . '\\\/g';
	system("$PERL -p -i.bak -e \"$regular_expression\" $fcl");
}	

sub Write_to_XML
{
	
	# Open new XML output file
	my $xml_file = new IO::File(">$outputfile");
	my $workingset = $fcl;
	$workingset =~ s/^.*[\/\\]//; #remove the path
	$workingset =~ s/\.[^.]+$//;  #remove the file ext
	# Create the XML writer to write to <outputfile>.xml file	
	$config_writer = new XML::Writer(OUTPUT => $xml_file, DATA_MODE => 'true', DATA_INDENT => 2);	

	# Write the header & workingsets start tag of the XML file 
	$config_writer->xmlDecl('UTF-8');
	$config_writer->startTag('workingsets','version'=>'1.0');		
	$config_writer->startTag('selected','name'=>$workingset);
	$config_writer->endTag();
	$config_writer->startTag('workingset','name'=>$workingset);
			
	
	open(FILE_CHANGE_LIST,"<$fcl") or die "Error: cannot open $fcl\n$!\n";
  @infile = <FILE_CHANGE_LIST>;
  close(FILE_CHANGE_LIST);
  
  print "\n\nGenerating $outputfile file with $workingset\n"; 
  
  foreach (@infile)
  {
	  chomp($_);
		$lines = $_;
		#ignore lines which are commented
		if (not ($lines =~ /^\#/))
		{
			#filter only .c files and .cpp files
			if ($lines =~ /(\.c\@@|\.cpp\@@){1}/i) 		
			{
				$lines =~ s/(^.*)\@@.*$/$1/;
				$config_writer->startTag('file');
				$config_writer->characters($lines);
				$config_writer->endTag('file');
			}	
			
		}
	
	}	
	
	# Close the tags
	$config_writer->endTag('workingset');
	$config_writer->endTag('workingsets');
	$config_writer->end();
	
	# Close the xml file
	$xml_file->close();		
}	
################################################################################
#
#                              HISTORY TEMPLATE
#
################################################################################
# Date updated	     					Author	  		Description of change
# ------------------       -----------	  	------------------------------- 
# 13 May 2013   						Ong Con Nie     Initial release
#
################################################################################