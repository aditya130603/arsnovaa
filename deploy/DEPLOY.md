# Deploy Arsnovaa to the existing VPS

Canonical website: **https://www.arsnovaa.com**  
Contact: **design@arsnovaa.com**

The site is static HTML/CSS/JS: **no Node, Docker, database or persistent worker required**. Do not stop or modify existing production apps.

## 1. DNS

At your domain registrar, set:

| Type | Host | Value |
| --- | --- | --- |
| A | @ | your actual VPS public IPv4 |
| CNAME | www | arsnovaa.com |

If existing AAAA records point elsewhere, remove/fix them only after verifying your IPv6 routing. **Do not change MX, SPF, DKIM or DMARC records** — these are for design@arsnovaa.com mail and unrelated to website hosting.

Check propagation:
```bash
dig +short A arsnovaa.com
dig +short A www.arsnovaa.com
dig +short MX arsnovaa.com
```

## 2. Inspect current Nginx configuration first

Run on VPS as a privileged admin:

```bash
sudo nginx -t
sudo nginx -T 2>/dev/null | grep -nE 'server_name|arsnovaa.com'
```

If arsnovaa.com already has a server block, update that one safely; do not add a conflicting duplicate. Make backups of configs before editing.

## 3. Deploy static files

These commands install only the website files and do not change other projects:

```bash
sudo mkdir -p /var/www/arsnovaa
sudo chown "$USER":"$USER" /var/www/arsnovaa
git clone https://github.com/aditya130603/arsnovaa.git /var/www/arsnovaa/site
```

To update later:
```bash
cd /var/www/arsnovaa/site && git pull --ff-only origin main
```

If already cloned, do not clone again.

## 4. Install the Nginx virtual host

Only if no existing arsnovaa.com server block was found:

```bash
sudo cp /var/www/arsnovaa/site/deploy/nginx-arsnovaa.conf /etc/nginx/sites-available/arsnovaa.conf
sudo ln -s /etc/nginx/sites-available/arsnovaa.conf /etc/nginx/sites-enabled/arsnovaa.conf
sudo nginx -t && sudo systemctl reload nginx
```

Review the resulting config, especially existing default sites, before enabling if there is a conflicting catch-all vhost.

## 5. HTTPS and canonical redirects

After BOTH www and apex DNS records resolve to this VPS:

```bash
sudo certbot --nginx -d www.arsnovaa.com -d arsnovaa.com
```

Choose redirect-to-HTTPS when offered. Then ensure HTTP and HTTPS requests for `arsnovaa.com` redirect with HTTP 301 to `https://www.arsnovaa.com$request_uri`. Carefully edit Nginx server blocks after Certbot; avoid breaking ACME challenges. Test with `sudo nginx -t` before reload.

The current site uses www canonical tags and sitemap URLs.

## 6. Verify

```bash
curl -I https://www.arsnovaa.com/
curl -I https://www.arsnovaa.com/services/ai-development/
curl -I https://www.arsnovaa.com/sitemap.xml
curl -I https://arsnovaa.com/
sudo nginx -t
```

Expect HTTP 200 for site routes, and a 301/308 for apex redirect. Test navigation, mailto:design@arsnovaa.com, mobile responsiveness, and robots/sitemap before submitting to Search Console.

## Safety

- No changes to MX records (email), existing apps, reverse proxy vhosts or database services.
- Keep production services running. Static hosting has no new background worker.
- If port 80/443 is already served by another proxy/CDN rather than system Nginx, adapt these commands to the existing routing architecture.
- Check installed firewall rules, and never expose unnecessary service ports.
- The website does not become live just by pushing code: the DNS, VPS and certificate steps must be completed.
