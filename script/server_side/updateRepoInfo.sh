#!/bin/bash

REPO_URL=git@gitmirror-cdc.mot-solutions.com:stash/mototrbo_infra_fw
REPOS="comm.git bahama.git cypher.git"

working_dir=$(pwd)
record="timestamp: $(date +%s),"

cd /tmp
for repo in $REPOS
do
    repo_name=$(basename $repo | sed 's/\.git//g')
    field_prefix=Gitlab_${repo_name}_
    repo_user_size=0
    repo_branch_cnt=0

    git clone $REPO_URL/$repo &>/dev/null
    git clone --mirror $REPO_URL/$repo &>/dev/null
    
    repo_origin_size=$(du -sm $repo | cut -f1) 
    repo_user_size=$(du -sm $repo_name | cut -f1)
    
    cd $repo_name
    repo_branch_cnt=$(git branch -a | grep "remotes/origin" | wc -l)
    record+="${field_prefix}OriginSize: $repo_origin_size,"
    record+="${field_prefix}UserSize: $repo_user_size,"
    record+="${field_prefix}BranchCnt: $repo_branch_cnt,"

    cd ..
    rm -rf $repo
    rm -rf $repo_name
done
mongo &>/dev/null << EOF
use booster
db.repoinfo.insert({$record})
exit
EOF
cd $working_dir

exit 0
