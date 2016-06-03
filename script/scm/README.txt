
/--------------------|--------------------|--------------------|--------------------\
|  Product\Component |       Bahama       |         SRP        |       Cypher       |
|--------------------|--------------------|--------------------|--------------------|
|                    |      View: 1       |                    |     View: 2/3      |
|     CYPHER2.4A     |  View driver: X    |         I          |  View driver: U/V  |
|                    |      I/D/Daily     |                    |      I/D/Daily     |
|--------------------|--------------------|--------------------|--------------------|
|                    |      View: 4       |                    |     View: 5/6      |
|     BAHAMA1.1      |  View driver: Y    |         I          |  View driver: W/X  |
|                    |      I/D/Daily     |                    |      I/D/Daily     |
|--------------------|--------------------|--------------------|--------------------|
|                    |      View: 7       |                    |     View: 8/9      |
|     EMERALD1.0     |  View driver: Z    |          I         |  View driver: Y/Z  |
|                    |      I/D/Daily     |                    |      I/D/Daily     |
\--------------------|--------------------|--------------------|--------------------/

View 1: amb4116_webcia20_1_bahama_build
View 2: amb4116_webcia20_1_cypher_32m_build
View 3: amb4116_webcia20_1_cypher_8m_build

View 4: amb4116_webcia20_2_bahama_build
View 5: amb4116_webcia20_2_cypher_32m_build
View 6: amb4116_webcia20_2_cypher_8m_build

View 7: amb4116_webcia20_3_bahama_build
View 8: amb4116_webcia20_3_cypher_32m_build
View 9: amb4116_webcia20_3_cypher_8m_build

KW view:
view 10: amb4116_webcia20_1_kw_bahama_build U
view 11: amb4116_webcia20_2_kw_bahama_build V
view 12: amb4116_webcia20_3_kw_bahama_build W

view 13: amb4116_webcia20_1_kw_cypher_build R
view 14: amb4116_webcia20_2_kw_cypher_build S
view 15: amb4116_webcia20_3_kw_cypher_build T


#====================================================================================
# Add new configure file and log directory
#====================================================================================
	- Configure files: WebCIA20/conf
		<Project_name>_<Component>_<Release_type>_automation_config.ini
		ie. BAHAMA1.1_BAHAMA_D_automation_config.ini
		
	- Log directory: WebCIA20/logs
		<Project_name>_<Component>_<Release_type>
		ie. BAHAMA1.1_BAHAMA_D
	
#====================================================================================
# Update parameter in configure file
#====================================================================================
	-  LOCAL_CS_FILE
		LOCAL_CS_FILE=/users/SCM/cgi-bin/int/amb4116/CG566/WebCIA20/config_spec/<Project_name>_<Component>_<Release_type>_LATEST_CS
		ie. LOCAL_CS_FILE=/users/SCM/cgi-bin/int/amb4116/CG566/WebCIA20/config_spec/BAHAMA1.1_BAHAMA_D_LATEST_CS
	
	- LOG_DIR
		LOG_DIR=D:\\WebCIA20\\logs\\<Project_name>_<Component>_<Release_type>
		ie. LOG_DIR=D:\\WebCIA20\\logs\\BAHAMA1.1_BAHAMA_D
	
	- TMPFILE
		TMPFILE=/users/SCM/cgi-bin/int/amb4116/CG566/WebCIA20/<Project_name>_<Component>_<Release_type>.sh
		ie. TMPFILE=/users/SCM/cgi-bin/int/amb4116/CG566/WebCIA20/BAHAMA1.1_BAHAMA_D.sh
	
	- LOCK_FILE
		LOCK_FILE=/users/SCM/cgi-bin/int/amb4116/CG566/WebCIA20/<Project_name>_<Component>.pid
		ie. LOCK_FILE=/users/SCM/cgi-bin/int/amb4116/CG566/WebCIA20/BAHAMA1.1_BAHAMA.pid

#====================================================================================
# SRP LIB (Matrix LIB) special note
#====================================================================================
1. Create related branch strategy with JenSEE tool
	eg. /main/srp_main/srp_dev_main/SRP_2.5A_INT1
2. 
element \pcr_srp\release\MatrixCore\... ...\SRP_2.4A_INT\LATEST
element \pcr_srp\release\MatrixCore\... ...\SRP_2.4A_INT\LATEST -mkbranch 

/main/srp_main/srp_dev_main/SRP_2.4A_INT1

#====================================================================================
# New interation switch
#====================================================================================
1. update configure file
	- 
2. submit new CI based latest I version
	- Based CS must filled, or it will get from previous release but the previous it 00


==============================================

BAHAMA_CONFIG_FILE=${UNIX_SCRIPT_HOME}/conf/${PRODUCT_NAME}_BAHAMA_I_automation_config.ini
SRP_CONFIG_FILE=${UNIX_SCRIPT_HOME}/conf/${PRODUCT_NAME}_SRP_I_automation_config.ini
CYPHER_CONFIG_FILE=${UNIX_SCRIPT_HOME}/conf/${PRODUCT_NAME}_CYPHER_I_automation_config.ini

${BAHAMA_CONFIG_FILE}
${CYPHER_CONFIG_FILE}
LAST_BASELINE=${SRP_LAST_BASELINE}
NEW_BASELINE=${SRP_NEW_BASELINE}


Bahama1.1 Submission

\pcr_srp\release@@\main\10
\pcr_srp\release\srp_config_spec.txt@@\main\REM_PNW748\1


\bahama\release\bahama_config_spec.txt@@\main\bahama_main\bahama_1.1_main\2