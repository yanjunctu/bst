#!perl

use strict;
use Cwd qw/abs_path/;
use File::Basename;
use File::Find;
use File::Copy;

usage() if ($#ARGV != 2);
sub usage
{
	print "perl DIFF_FM.pl firmware_1 firmware_2 view_drive\n";
	print "      Return 0 if different line # less than expected different line threshold, otherwise return 1\n";
	print "  ex: perl DIFF_FM.PL BAHAMA_I00.09.57\bahama_arm_app.xml D:\project\CI\BAHAMA_D43_FM_based_on_I57\bahama_arm_app.xml x:\n";
	print "      perl DIFF_FM.PL BAHAMA_I00.09.57\BahamaDspExecutable.out BAHAMA_D43_FM_based_on_I57\BahamaDspExecutable.out x:\n";
	print "      perl DIFF_FM.PL D:\project\CI\CYPHER2.4A_I24.01.69\arm9_flash.srec CYPHER2.4A_D02.41.07_based_on_I69\arm9_flash.srec x:\n\n";
	exit 1;
}

############################################configuration##########################################
my $bahama_arm_xml_name = "bahama_arm_app.xml";
my $bahama_arm_xml_diff_lines = 2;		# expected total diff lines is 2 due to time stamp
my $bahama_dsp_out_name = "BahamaDspExecutable.out";
my $bahama_dsp_srec_name = "BahamaDspExecutable.srec";
my $bahama_dsp_srec_diff_lines = 2;
my $bahama_dvsi_out_name = "BahamaDspDvsiExecutable.out";
my $bahama_dvsi_srec_name = "BahamaDspDvsiExecutable.srec";
my $bahama_dvsi_srec_diff_lines = 0;

my $cypher_arm_srec_name = "arm9_flash.srec";
my $cypher_arm_srec_diff_lines = 3;
my $cypher_arm_32m_srec_name = "arm9_flash_32mb.srec";
my $cypher_arm_32m_srec_diff_lines = 3;
my $cypher_dsp_srec_name = "c55_flash.srec";
my $cypher_dsp_srec_diff_lines = 3;
my $cypher_dsp_32m_srec_name = "c55_flash_32mb.srec";
my $cypher_dsp_32m_srec_diff_lines = 3;
my $bandit_dsp_srec_name = "c55_flash_Bandit.srec";
my $bandit_dsp_srec_diff_lines = 3;

my $hex6x_cmd = "$ARGV[2]\\cgiss_subscriber\\Tools\\Build\\ti\\c6000\\cgtools\\bin\\hex6x.exe";
####################################################################################################

my $ret = 0;
my $fm_1 = $ARGV[0];
my $fm_2 = $ARGV[1];
my $view_drive = $ARGV[2];

my $fm_file_1 = substr( $fm_1,(rindex($fm_1,"\\") + 1));
my $fm_file_2 = substr( $fm_2,(rindex($fm_2,"\\") + 1));
my $fm_path_1 = substr( $fm_1, 0, (rindex($fm_1,"\\"))+1);
my $fm_path_2 = substr( $fm_2, 0, (rindex($fm_2,"\\"))+1);

my $bahama_dsp_srec_full_name_1 = $fm_path_1.$bahama_dsp_srec_name;
my $bahama_dsp_srec_full_name_2 = $fm_path_2.$bahama_dsp_srec_name;
my $bahama_dvsi_srec_full_name_1 = $fm_path_1.$bahama_dvsi_srec_name;
my $bahama_dvsi_srec_full_name_2 = $fm_path_2.$bahama_dvsi_srec_name;

if (-e $fm_1 and -e $fm_2)
{
	#print "Compare $fm_1 with $fm_2 ...\n";
}
else
{
	print "Error: $fm_1 or $fm_2 not exist\n";
	exit 1;
}

if ($fm_file_1 ne $fm_file_2)
{
	print "Please make sure the file has same name: $fm_file_1  $fm_file_2\n";
	exit 3;
}

sub check_hex6x_cmd
{
	if (! -e $hex6x_cmd)
	{
		print "$hex6x_cmd NOT exist, exit \n\n";
		exit 1;
	}
}

# argument1: file1
# argument2: file2
# argument3: expected diffent line threshold
# return 0 if diffent line # < expected diffent line threshold, otherwise return 1
sub diff_files
{
	my $file1 = shift;
	my $file2 = shift;
	my $diff_threshold = shift;
	my $file1_line = undef;
	my $file2_line = undef;
	my $diff_total = 0;
	my $line_idx = 0;
	
	open (FILE_1, $file1) || die ("Open $file1 fail\n");
	open (FILE_2, $file2) || die ("Open $file2 fail\n");
	
	my $file1_line_number = grep { !/^\s*$/ } <FILE_1>;
	my $file2_line_number = grep { !/^\s*$/ } <FILE_2>;
	
	print "Compare $file1 with $file2 ...\n";	
	
	if ($file1_line_number != $file2_line_number)
	{
		print "Line number of $file1 is $file1_line_number\n";
		print "Line number of $file2 is $file2_line_number\n\n";
		close FILE_1;
		close FILE_2;
		# line number is differnt, the files are differnt
		return 1;
	}
	
	seek (FILE_1, 0, 0);
	seek (FILE_2, 0, 0);

	while ($file1_line = <FILE_1>) {
		$line_idx++;
		chomp($file1_line);
		$file2_line = <FILE_2>;
		chomp($file2_line);
		
		if ($file1_line ne $file2_line)
		{
			$diff_total++;
			print "Diff at line $line_idx:\n";
			print "$file1_line\n";
			print "$file2_line\n\n";
		}
		
		if ($diff_total > $diff_threshold)
		{
			print "Total $diff_total diffent lines bigger than threshold $diff_threshold\n";
			close FILE_1;
			close FILE_2;
			return 1;
		}
	}
	
	print "Total $diff_total diffent line, less than threshold $diff_threshold, they are identical except time stamp\n";
	close FILE_1;
	close FILE_2;	
	return 0;
}

if ($fm_file_1 eq $bahama_arm_xml_name)
{
	$ret = diff_files($fm_1, $fm_2, $bahama_arm_xml_diff_lines);
	exit $ret;
}
elsif ($fm_file_1 eq $bahama_dsp_out_name)
{
	check_hex6x_cmd();
	$ret = system("$hex6x_cmd -m --fill=0 --romwidth=32 --memwidth=32 --outfile=$bahama_dsp_srec_full_name_1 $fm_1");
	print "Convert $fm_1 to srec file $bahama_dsp_srec_full_name_1 return $ret\n\n";
	$ret = system("$hex6x_cmd -m --fill=0 --romwidth=32 --memwidth=32 --outfile=$bahama_dsp_srec_full_name_2 $fm_2");
	print "Convert $fm_2 to srec file $bahama_dsp_srec_full_name_2 return $ret\n";
	$ret = diff_files($bahama_dsp_srec_full_name_1, $bahama_dsp_srec_full_name_2, $bahama_dsp_srec_diff_lines);
	exit $ret;
}
elsif ($fm_file_1 eq $bahama_dvsi_out_name)
{
	check_hex6x_cmd();
	$ret = system("$hex6x_cmd -m --fill=0 --romwidth=32 --memwidth=32 --outfile=$bahama_dvsi_srec_full_name_1 $fm_1");
	print "Convert $fm_1 to srec file $bahama_dvsi_srec_full_name_1 return $ret\n\n";
	$ret = system("$hex6x_cmd -m --fill=0 --romwidth=32 --memwidth=32 --outfile=$bahama_dvsi_srec_full_name_2 $fm_2");
	print "Convert $fm_2 to srec file $bahama_dvsi_srec_full_name_2 return $ret\n";

	$ret = diff_files($bahama_dvsi_srec_full_name_1, $bahama_dvsi_srec_full_name_2, $bahama_dvsi_srec_diff_lines);
	exit $ret;
}
elsif ($fm_file_1 eq $cypher_arm_srec_name)
{
	$ret = diff_files($fm_1, $fm_2, $cypher_arm_srec_diff_lines);
	exit $ret;
}
elsif ($fm_file_1 eq $cypher_arm_32m_srec_name)
{
	$ret = diff_files($fm_1, $fm_2, $cypher_arm_32m_srec_diff_lines);
	exit $ret;
}
elsif ($fm_file_1 eq $cypher_dsp_srec_name)
{
	$ret = diff_files($fm_1, $fm_2, $cypher_dsp_srec_diff_lines);
	exit $ret;
}
elsif ($fm_file_1 eq $cypher_dsp_32m_srec_name)
{
	$ret = diff_files($fm_1, $fm_2, $cypher_dsp_32m_srec_diff_lines);
	exit $ret;
}
elsif ($fm_file_1 eq $bandit_dsp_srec_name)
{
	$ret = diff_files($fm_1, $fm_2, $bandit_dsp_srec_diff_lines);
	exit $ret;
}
else
{
	print "The file name must be:\n";
	print "\t$bahama_arm_xml_name\n";
	print "\t$bahama_dsp_out_name\n";
	print "\t$bahama_dvsi_out_name\n";
	print "\t$cypher_arm_srec_name\n";
	print "\t$cypher_arm_32m_srec_name\n";
	print "\t$cypher_dsp_srec_name\n";
	print "\t$cypher_dsp_32m_srec_name\n";
	print "\t$bandit_dsp_srec_name\n";
	exit 5;
}
