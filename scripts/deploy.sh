#!/usr/bin/env bash

set -eu

# Set deploy key
SSH_PATH="$HOME/.ssh"
mkdir -p "$SSH_PATH"
echo "$SSH_PRIVATE_KEY" > "$SSH_PATH/deploy_key"
chmod 600 "$SSH_PATH/deploy_key"
ls -al $SSH_PATH

sshpos="$SSH_USERNAME@$SSH_HOSTNAME:$SSH_RSYNC_DIR"

rsync_e_args="ssh -i $SSH_PATH/deploy_key -o StrictHostKeyChecking=no"

# Do deployment
cmd="rsync  -avzr --delete --exclude node_modules --exclude '.git*' -e '$rsync_e_args' '$GITHUB_WORKSPACE/' '$sshpos'"
echo "exec $cmd"
result=$(eval "$cmd")
echo "$result"

pm2cmd="pm2 restart app.yml --BOT_TOKEN=$BOT_TOKEN --BOT_HOST=$BOT_HOST --AZURE_GPT_ENDPOINT=$AZURE_GPT_ENDPOINT --AZURE_GPT_KEY=$AZURE_GPT_KEY --AZURE_GPT_DEPLOYMENT_NAME=$AZURE_GPT_DEPLOYMENT_NAME"

 ssh -i $SSH_PATH/deploy_key $SSH_USERNAME@$SSH_HOSTNAME "cd $SSH_RSYNC_DIR;yarn;$pm2cmd"