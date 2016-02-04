#!/bin/bash

if [[ -f /etc/redhat-release ]]; then
	DISTRO="Enterprise Linux"
elif [[ -f /etc/issue ]]; then
	ISSUE=`cat /etc/issue`;
	
	if [[ $ISSUE == *"Debian"* ]]; then 
		DISTRO="Debian"
	elif [[ $ISSUE == *"Ubuntu"* ]]; then 
		DISTRO="Ubuntu"
	elif [[ $ISSUE == *"Fedora"* ]]; then 
		DISTRO="Fedora"
	else
		DISTRO="Unknown"
	fi
else
	DISTRO="Unknown"
fi

if [[ $DISTRO != "Enterprise Linux" ]]; then
	echo "Distributions other than Enterprise Linux are not supported at this time. Feel free to submit a pull request with additional distros to add more support!";
	exit;
fi

echo "Beginning Game Manager Installation";

echo "Updating Operating System Packages to Latest Versions"
yum install -y epel-release
yum update -y

echo "Installing Node.js and Node Package Manager..."
yum install -y node npm

echo "Installing PM2 to manage the Game Manager node application..."
npm install pm2 -g

echo "Installing Node package dependencies"
npm install

echo "Starting the Game Manager"
pm2 start Game-Manager.js

echo "Game Manager started. Log in at http://localhost:8080"
