## Launch EC2 "t2.micro" Instance and In Sg, Open port "1004" for NodeJS  Application 
# Backend-Node.js Application server

## Install Node and NPM
```
sudo yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 16
```
### Check Node Version
```
node -v
npm -v
```
### Install Git
```
sudo yum install git -y
```
## Get the Code
```
sudo mkdir /apps
cd /apps
sudo git clone https://github.com/digistackops-nodejs-org/Nodejs_call-booking-Microservce_APP.git
cd Nodejs_call-booking-Microservce_APP
sudo git checkout 01-Local-setup-TestCase-V1
sudo chown -R ec2-user:ec2-user /apps/Nodejs_call-booking-Microservce_APP
```
```
cd user-api
```

## Add .env for DB Credentials 
```
sudo vim .env
```
```
PORT=1004
NODE_ENV=production
MONGO_URI=mongodb://appuser:Pa55Word@<DB-Ip-Address>:27017/user-account
# Email Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<your_access_key>
AWS_SECRET_ACCESS_KEY=<your_secret_key>

SES_FROM_EMAIL=admin@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# JWT_SECRET=StrongProductionSecretKey
```

## Install Dependencies
```
npm install
```

## Start the App
```
npm start
```
HERE it is not recommend in Production, so we follow the HA in Production

Start Backend Application
```
npm install -g pm2
```
To run these Backend Application up and Running we use Pm2 service
```
pm2 start app.js --name backend
```
<img width="1089" height="110" alt="image" src="https://github.com/user-attachments/assets/4acd9488-9434-4dc3-86a1-c598bd6658c0" />

To list all pm2 Services
```
pm2 list
```
To stop these pm2 service
```
pm2 stop backend
```
<img width="1105" height="127" alt="image" src="https://github.com/user-attachments/assets/a584378a-fb91-4911-8112-51cf7e49ab0e" />

To delete these pm2 service
```
pm2 delete backend
```
### To check the application health we can use endpoint 
```
http://machine_ip:port/api/health
```
