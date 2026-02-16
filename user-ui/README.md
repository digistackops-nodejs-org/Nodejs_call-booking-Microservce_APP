## Launch EC2 "t2.micro" Instance and In Sg, Open port "3000" for react Application and port "80" for Nginx
# Frontend-react Web server

### Install Node.js
```
sudo yum install git -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 16
```
### Install Nginx

```
sudo yum install nginx -y
```
Start the Service
```
sudo systemctl start nginx
sudo systemctl enable nginx
```
Create Frontend Directory
```
sudo mkdir -p /var/www/frontend/
sudo chmod -R 755 /var/www/frontend/
```
## Get the Code

```
sudo mkdir /apps
cd /apps
sudo git clone https://github.com/digistackops-nodejs-org/Nodejs_call-booking-Microservce_APP.git
cd Nodejs_call-booking-Microservce_APP
```
Switch branch

```
sudo git checkout 01-Local-setup-TestCase-V1
sudo chown -R ec2-user:ec2-user /apps/Nodejs_call-booking-Microservce_APP
```
Note => Nginx we we for 2 purpose 
        (1) For Frontend Load Balancing 
        (2) For Backend Reverse Proxy

when we hit our Application using frontend URL it connect to Backend using we mentioned URL in the same Browser
--> As of now we pass "Backend-Public-IP" => so Browser our App from frontend it will connect to our Backend using Public IP {because from Browser public-Ip is accessable}, but it is a security Breach or Not accesptable in Production
--> if we pass the Backend Private-IP {Private-IP not allowed to access from Browser, private -Ip are for internal communication}, But pasing Backend Private-IP is the good practice

For that we use "Reverse Proxy" concept in Frontend 
HERE we mention our Backend-Private-IP in reverse Proxy configuration => so that when request came to frontend then it will redirect to Backend Internally through reverse proxy using Private-IP only

Note ==> we already setup the Reverse Proxy using Nginx alredy setup "nginx.conf" no need to do anything

### Setup "nginx.conf" for reverse Proxy to backend, we already have "nginx.conf" file 

```
cd user-ui
sudo mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
sudo mv /apps/Nodejs_call-booking-Microservce_APP/user-ui/nginx.conf /etc/nginx/
```
Edit your the Backend IP Address in nginx.conf
```
sudo vim /etc/nginx/nginx.conf
```
restart your Nginx
```
sudo systemctl restart nginx
```
### Frontend Setup
 Add .env for DB Credentials 
```
sudo vim .env
```
```
REACT
```
Install Dependencies
```
npm install
```
Start the UI {for Dev, not recommend for PROD}
```
npm start
```
# If you want to Deploy into Nginx  {Recommend for PROD}
Build the Frontend 
```
npm run build
```
Copy build/ to /var/www/html or Nginx root
```
sudo rm -rf /var/www/frontend/*
sudo mv build/* /var/www/frontend/
sudo systemctl restart nginx
```

### To check micro service  health there is a endpoint 
``` 
http://machine-ip:port/health
```


# User front end page 

![image](https://user-images.githubusercontent.com/29688323/182036095-15d0b22f-754f-4f0f-b633-1d79dff9ab2f.png)

# Below is the mail format which will be sent to user who booked call 

![image](https://user-images.githubusercontent.com/29688323/182036272-d9d38ea8-9c5d-4d42-8bbf-0b63a6177d27.png)


# Below is the mail format which will be admin upon booking the call

![image](https://user-images.githubusercontent.com/29688323/182036174-11003487-1673-4243-97d6-e6309c641678.png)

