#!/usr/bin/env bash

set -eu

# Set deploy key
SSH_PATH="$HOME/.ssh"
mkdir -p "$SSH_PATH"
echo "$SSH_PRIVATE_KEY" > "$SSH_PATH/deploy_key"
chmod 600 "$SSH_PATH/deploy_key"

sshpos="$SSH_USERNAME@$SSH_HOSTNAME:$SSH_RSYNC_DIR"

rsync_e_args="ssh -i ${SSH_PATH}/deploy_key -o StrictHostKeyChecking=no"

# Do deployment
cmd="rsync  -avzr --delete --exclude node_modules --exclude '.git*' -e '$rsync_e_args' '$GITHUB_WORKSPACE/*' $sshpos"
echo "exec $cmd"
`$cmd`
