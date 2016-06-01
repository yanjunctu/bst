# LOC.pl	Base_dir	IR_dir	File_Author_list.txt	author_coreid.txt	output_folder
# UCC.exe -d -i1 fcl_base.txt -i2 fcl_IR.txt -outdir output_folder

#use strict;
use Spreadsheet::WriteExcel; 

print "argv=".$#ARGV."\n";
if ( $#ARGV != 0 and $#ARGV != 4)
{
    print "[ERROR] Usage: perl LOC.pl	Base_dir	IR_dir	File_Author_list.txt	author_coreid.txt	output_folder \n\n";
    exit 1;
}

my $base_dir = $ARGV[0];
my $IR_dir = $ARGV[1];
my $file_author_list_file = $ARGV[2];
my $author_name_file = $ARGV[3];
my $output_folder = $ARGV[4];
my $total_file_num = 0;

if(-e $base_dir and -e $IR_dir and -e $author_name_file and -e $file_author_list_file )
{
	print "Calculate code size based on FCL on $file_author_list_file ...\n";
}
else
{
	print "Please make sure below folder and files exist!\n".
	"	$base_dir\n". 
	"	$IR_dir\n". 
	"	$author_name_file\n".
	"	$file_author_list_file\n";
	exit 1;
}

my $base_file = $output_folder."\\base_file.txt";
my $IR_file = $output_folder."\\IR_file.txt";

my $file_author_list_line = undef;
my $fcl_line = undef;
my $base_full_fcl_line = undef;
my $IR_full_fcl_line = undef;
my $outfile_diff_results = $output_folder."\\outfile_diff_results.csv";

if(-e $output_folder)
{
	# Do nothing
}
else
{
	print "Create $output_folder folder!\n";
	system("mkdir $output_folder");
}

#### Create base/IR file list file (based on fcl.txt which contain relative path ) which contain full repoitory path for those changed files ####
open (BASEFILE, ">".$base_file) || die "0 Cannot open $base_file\n";
print BASEFILE "";
close BASEFILE;
open (BASEFILE, ">>".$base_file) || die "1 Cannot open $base_file\n";

open (IRFILE, ">".$IR_file) || die "0 Cannot open $IR_file\n";
print IRFILE "";
close IRFILE;
open (IRFILE, ">>".$IR_file) || die "1 Cannot open $IR_file\n";

my @file_author_array = ();
my %match_file_author = ();

open (FILE_AUTHOR_LIST_FH, $file_author_list_file) || die ("Open $file_author_list_file fail\n");
while ( $file_author_list_line = <FILE_AUTHOR_LIST_FH> ) 
{
	
	$total_file_num++;	# get file number
	@file_author_array = split(/\t/, $file_author_list_line);

	$base_full_fcl_line = $base_dir.@file_author_array[0]."\n";
	print BASEFILE $base_full_fcl_line;
	
	$IR_full_fcl_line = $IR_dir.@file_author_array[0]."\n";
	print IRFILE $IR_full_fcl_line;	
	
	chomp($IR_full_fcl_line);		# full file name
	chomp(@file_author_array[1]);	# author core ID
	#print "$IR_full_fcl_line -- @file_author_array[1]\n";
	$match_file_author{$IR_full_fcl_line} = @file_author_array[1];
}

close BASEFILE;
close IRFILE;
close FILE_AUTHOR_LIST_FH;

#### Calculate code size ####
my $ucc = "UCC.exe -d -i1 $base_file -i2 $IR_file -outdir $output_folder";
system($ucc);

#### Create codesize.txt (if not exist) based on Author_coreID file ####
my $codesize_file = "codesize.txt";
my $author_line = undef;

if(-e $codesize_file)
{
}
else
{
	# construct empty codesize file based on author file
	my $codesize_header_line = "Author	CoreID	Dept	Total	New	Delete	Modify\n";
	open (CODESIZE, ">>".$codesize_file) || die "Cannot open $codesize_file\n";
	print CODESIZE $codesize_header_line;
	
	open (AUTHOR_FH, $author_name_file) || die ("Open $author_name_file fail\n");

	while ($author_line = <AUTHOR_FH>) 
	{
		chomp($author_line);
		$author_line = $author_line."\t"."0"."\t"."0"."\t"."0"."\t"."0"."\n";
		print  CODESIZE $author_line;
	}
	close CODESIZE;
}

#### Get Add/Del/Modify code size ####
my $ucc_diff_output_file = $output_folder."\\outfile_diff_results.csv";
open (UCC_DIFF, $ucc_diff_output_file) || die ("Open $ucc_diff_output_file fail\n");
my $ucc_diff_line = undef;
my @ucc_diff_array = ();
my $ucc_diff_new = 0;
my $ucc_diff_del = 0;
my $ucc_diff_modify = 0;
my $file_cnt = 0;
my $file_full = undef;
my $file_author = undef;

while ($ucc_diff_line = <UCC_DIFF>) 
{
	if (0 == $file_cnt and $ucc_diff_line =~ "New Lines")
	{
		$file_cnt = 1;
	}
	elsif ($file_cnt > 0 and $file_cnt <= $total_file_num )
	{
		@ucc_diff_array = split(/,/, $ucc_diff_line);
		$file_full = @ucc_diff_array[7];	# Module B
		chomp($file_full);
		$file_full =~ s/\"//g;
		$ucc_diff_new = @ucc_diff_array[0];
		$ucc_diff_del = @ucc_diff_array[1];
		$ucc_diff_modify = @ucc_diff_array[2];
		$file_cnt++;
		
		$file_author = $match_file_author{$file_full};
		#print "$file_full -- $file_author\n";
		
		## match file to right author and update his/her code size ##
		update_codesize_file( $file_author, $ucc_diff_new, $ucc_diff_del, $ucc_diff_modify);
	}
	elsif ( $file_cnt > $total_file_num )
	{
		last;
	}	
}

#### Create spread sheet file ####
my $excel_file = $output_folder."\\LOC_Report.xls";
my $report_workbook = Spreadsheet::WriteExcel->new($excel_file); 
print "create $excel_file\n\n";

# format 1
my $normal_format1 = $report_workbook->add_format(); # Add a format
# format 2
my $normal_format2 = $report_workbook->add_format(); # Add a format
$normal_format2->set_bg_color('26'); 
# format 3
my $title_format = $report_workbook->add_format(); # Add a format  
$title_format->set_bg_color('blue'); 
$title_format->set_bold();
$title_format->set_color('white');
$title_format->set_align('center');

open (CODESIZE, $codesize_file) || die "Cannot modify $codesize_file\n";
write_excel_val (*CODESIZE, $report_workbook, 'LOC_Report', $title_format, $normal_format1, $normal_format2);
close CODESIZE;
#############################################################################################################
	
#### Update codesize.txt for new code size changes ####
sub update_codesize_file
{
	my $author_id = shift;
	my $size_new = shift;
	my $size_del = shift;
	my $size_modify = shift;
	
	my $codesize_tmp_file = $codesize_file."_tmp";
	open (CODESIZE, $codesize_file) || die "Cannot modify $codesize_file\n";
	open (CODESIZETMP, ">".$codesize_tmp_file) || die "1 Cannot open $codesize_tmp_file\n";
	print CODESIZETMP "";
	close CODESIZETMP;
	open (CODESIZETMP, ">>".$codesize_tmp_file) || die "2 Cannot modify $codesize_tmp_file\n";
	my $codeszie_line = undef;

	my $found_flag = 0;
	my @codesize_array = ();

	while ($codeszie_line = <CODESIZE> ) 
	{
		if ($codeszie_line =~ /$author_id/i)
		{
			chomp($codeszie_line);
			
			$found_flag = 1;
			
			@codesize_array = split(/\t/, $codeszie_line);
			@codesize_array[4] += $size_new;
			@codesize_array[5] += $size_del;
			@codesize_array[6] += $size_modify;
			@codesize_array[3] += $size_new + $size_modify;
			
			my $new_line = @codesize_array[0]."\t".@codesize_array[1]."\t".@codesize_array[2]."\t".@codesize_array[3]."\t".@codesize_array[4]."\t".@codesize_array[5]."\t".@codesize_array[6]."\n";
			
			print CODESIZETMP $new_line;
			next;
		}
		else
		{
			print CODESIZETMP $codeszie_line;
		}
	}

	close CODESIZETMP;
	close CODESIZE;
	
	if ($found_flag == 0)
	{
		print "!!! Did NOT find author ID: $author_id !!!\n";
	}
	else
	{
		system ("copy \/y $codesize_tmp_file $codesize_file");
	}
}
	
sub write_excel_val 
{
	local *FILE_FH = shift;
	my $workbook = shift;
	my $sheet_name = shift;
	my $title_format = shift;
	my $normal_format1 = shift;
	my $normal_format2 = shift;
	my $line = undef;

	# add a worksheet 
	my $new_sheet = $workbook->add_worksheet($sheet_name);
	
	my $row = 0;
	my $col = 0;
	
	while($line = <FILE_FH>)
	{
		my @src_array = split(/\t/,$line);
		#print "$line\n";
		my $array_len = @src_array;
		
		for my $val (@src_array) {
			if ($row == 0)
			{
				$new_sheet->write($row, $col, $val, $title_format); 
			}
			elsif ($row%2 == 1)
			{
				#print "odd:$row ";
				$new_sheet->write($row, $col, $val, $normal_format1); 
			}
			else
			{
				#print "even:$row ";
				$new_sheet->write($row, $col, $val, $normal_format2); 
			}
			#print "$val	";
			$col++;
		}
		#print "\n";
		$row++;	
		$col = 0;
	}
}