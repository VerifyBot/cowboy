## digitalocean ubuntu

<p>
we will be opening ports later, so lets first add ssh to the firewall to avoid being locked out
</p>

```
ufw enable
ufw allow 22
```

<p>
create a certificate for the domain with certbot (lets encrypt)
https://certbot.eff.org/instructions
</p>

```bash
snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot
certbot certonly --standalone
certbot renew --dry-run
```

> [!NOTE]  
> If you want a certificate for a subdomain, create it normall (ask a certificate for the subdomain, _ie: muzee.nirush.me_)
> And after that run: `certbot --expand -d SUBDOMAIN.YOURDOMAIN,YOURDOMAIN` (_ie: ... -d muzee.nirush.me,nirush.me_) [source](https://eff-certbot.readthedocs.io/en/latest/using.html#re-creating-and-updating-existing-certificates:~:text=certbot%20%2D%2Dexpand%20%2Dd%20existing.com%2Cexample.com%2Cnewdomain.com)

<p>
alias python
</p>

```bash
vim ~/.bashrc, and add :

- alias python='python3'
- alias pip='python3 -m pip'
  source ~/.bashrc
```

<p>
get pip and venv
</p>

```bash
apt install python3-pip -y
apt install python3-venv -y
```

<p>
setup server dir and app dir
</p>

```bash
mkdir /home/server
mkdir /home/app
```

<p>
setup venv
</p>

```bash
cd /home/server
python -m venv .venv
source .venv/bin/activate
```

<p>
install websockets (and other things if needed)
</p>

```bash
pip install websockets
```

<p>
when running serve() in websockets, this needs to be the ssl parameter:
</p>

```py
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain("/etc/letsencrypt/live/<DOMAIN>/fullchain.pem",
                            "/etc/letsencrypt/live/<DOMAIN>/privkey.pem")
```

<p>
also a good time to open the websocket server port (whatever you chose it to be)
</p>

```bash
ufw allow <PORT>
```

<p>
set up the nginx website
</p>

```bash
apt install nginx
apt install nginx-extras
vim /etc/nginx/sites-available/<DOMAIN>
```

<p>
put this in the file
</p>

```
server {
  listen 80;
  server_name donate-idf.com www.donate-idf.com;

  location / {
  return 301 https://$host$request_uri;
    }
}

server {
  listen 443 ssl;
  server_name donate-idf.com www.donate-idf.com;
  
  ssl_certificate /etc/letsencrypt/live/<DOMAIN>/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/<DOMAIN>/privkey.pem;
  
  # Add any additional SSL configuration options here, e.g., SSL protocols and ciphers.
  
  location / {
    root /home/app;  # Set the root directory to /home/app
    index index.html;  # Specify the default file (e.g., index.html)
  }
}
```

```bash
ln -s /etc/nginx/sites-available/<DOMAIN> /etc/nginx/sites-enabled/
nginx -t
service nginx restart
```

<p>
open ports (80, 443)
</p>

```bash
ufw status
ufw allow 80/tcp
ufw allow 443/tcp
```
