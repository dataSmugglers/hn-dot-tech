#/bin/bash

# Get Ubuntu machine ready for hn-dot-tech
# update and grab required software
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/testing multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.0.list
sudo apt update -y
sudo apt upgrade -y

# install softwarez
sudo apt install -y build-essential gcc g++ make git tmux wget libcurl3 mongodb-org-server nodejs mongodb-org
npm install -g grunt jshint pm2
sudo systemctl start mongod
sudo systemctl enable mongod

# clone our repo and install all the node modules
git clone https://github.com/dataSmugglers/hn-dot-tech
cd ./hn-dot-tech
git checkout dev
npm install

# start up node
pm2 start ./server/hn_api_requests/apiRequests.js
pm2 start ./bin/www

# need to start up nginx
# Nginx Install
sudo apt-get install nginx

# Lets Encrypt Install
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get install python-certbot-nginx


echo "SYS ADMIN NOTE: You need to set up ufw or any other filewall"
echo "SYS ADMIN NOTE: You need to set up LETS ENCRYPT yourself: https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04"
echo "SYS ADMIN NOTE: You need to set up NGINX config file yourself: https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04
