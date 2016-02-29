#!/bin/bash

REPO_INFO_FILE=/var/opt/booster/boosterServerInfo
REPO_DIR=$(grep "git_data_dir" /etc/gitlab/gitlab.rb | cut -d'"' -f2)/repositories
REPOS="REPT/Comm.git REPT/Bahama.git REPT/Cypher.git"

working_dir=$(pwd)
tmp_info_file=/tmp/boosterInfo.tmp
repo_info_dir=$(dirname $REPO_INFO_FILE)

[[ ! -e "$repo_info_dir" ]] && mkdir -p $repo_info_dir
cd /tmp
rm -rf $tmp_info_file
for repo in $REPOS
do
    repo_name=$(basename $repo | sed 's/\.git//g')
    repo_origin_size=$(du -sm $REPO_DIR/$repo | cut -f1)
    field_prefix=Gitlab_${repo_name}_
    repo_user_size=0
    repo_branch_cnt=0

    git clone $REPO_DIR/$repo &>/dev/null
    repo_user_size=$(du -sm $repo_name | cut -f1)
    cd $repo_name
    repo_branch_cnt=$(git branch -a | grep "remotes/origin" | wc -l)
    echo "${field_prefix}OriginSize=$repo_origin_size" >> $tmp_info_file
    echo "${field_prefix}UserSize=$repo_user_size" >> $tmp_info_file
    echo "${field_prefix}BranchCnt=$repo_branch_cnt" >> $tmp_info_file
    cd ..
    rm -rf $repo_name
done
mv -f $tmp_info_file $REPO_INFO_FILE
cd $working_dir

exit 0
