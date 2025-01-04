#!/bin/sh

# Install chrome
sudo apt-get update
sudo apt install -y gdebi
curl -O https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo gdebi -n google-chrome-stable_current_amd64.deb
sudo rm -f google-chrome-stable_current_amd64.deb

npm ci