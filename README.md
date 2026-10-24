# Kabuchi Spa & Beauty: Website

This folder holds the full website. It works on GitHub Pages, which hosts it for free.

## What's inside

| File / folder | What it is |
|---|---|
| `index.html` | Home page |
| `about.html` | About us: story, vision, mission, values, team |
| `services.html` | All 8 services, plus the nail services menu |
| `gallery.html` | Photo gallery with filters, and before & after photos |
| `training.html` | Nail Technician Training course (K1,800, 2 weeks) |
| `booking.html` | **Online booking in 4 steps:** Service → Date & Time → Your Details → Done |
| `contact.html` | Address, phones, opening hours and map |
| `404.html` | Shown when a page isn't found |
| `css/style.css` | All colours, fonts and layout |
| `js/main.js` | Menu, animations and gallery |
| `js/booking.js` | How the booking steps work |
| `js/booking-config.js` | **Booking settings: the only file you need to edit** |
| `booking-setup/Code.gs` | Google Sheet script that saves bookings and sends emails |
| `images/` | Photos, logo and icons |

---

## Part 1: Put the website online with GitHub (free)

1. Create a free account at **github.com**. Choose a short username, such as `kabuchispa`.
2. Click **+** (top right), then **New repository**.
   - **Name:** `kabuchi-website`. If you name it `kabuchispa.github.io` (your username + `.github.io`), the site will sit at the shorter address `https://kabuchispa.github.io`.
   - Choose **Public**, then click **Create repository**.
3. On the new repository page, click **uploading an existing file**.
4. Open this folder on your computer and drag in **everything inside it**: all the `.html` files plus the `css`, `js`, `images` and `booking-setup` folders. Then click **Commit changes**.
5. Go to **Settings → Pages**. Under **Build and deployment**, set **Source** to *Deploy from a branch*, **Branch** to `main`, and the folder to `/ (root)`. Click **Save**.
6. Wait 1–2 minutes and refresh the page. GitHub shows your link, for example:
   `https://kabuchispa.github.io/kabuchi-website/`

**To change something later:** open the file on GitHub, click the ✏️ pencil, make your edit and click **Commit changes**. The site updates within a minute or two.

---

## Part 2: Set up online bookings (free, about 10 minutes)

When this is set up, the booking page will:

- ✅ Save every booking in a Google Sheet
- ✅ Hide times that are already full, so nobody double-books
- ✅ Email the customer a branded confirmation
- ✅ Email Kabuchi about each new booking, with a green **"Send WhatsApp confirmation"** button

### Steps

1. Go to **sheets.google.com**, signed in with the Gmail account the spa will use. Create a blank sheet and call it **Kabuchi Bookings**.
2. In the sheet, click **Extensions → Apps Script**.
3. Delete the code that's already there. Paste in **everything** from `booking-setup/Code.gs`.
4. At the top of the code, under `SETTINGS`, check these values:
   - `NOTIFY_EMAIL`: the email that should receive new-booking alerts
   - `CLIENTS_PER_SLOT`: how many clients you can serve at the same time (it starts at **2**)
   - `WEBSITE` and `LOGO_URL`: replace `YOUR-USERNAME` with your GitHub username, so the logo shows in emails
5. Click 💾 **Save**. In the function menu at the top, choose **setup** and click **Run**.
   Google will ask for permission. Click **Review permissions**, choose your account, then **Advanced → Go to project (unsafe) → Allow**. This is normal for your own scripts. A **Bookings** tab will appear in your sheet.
6. Click **Deploy → New deployment**. Click the ⚙️ icon and choose **Web app**, then set:
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*
   Click **Deploy** and **copy the Web app URL**. It ends in `/exec`.
7. On GitHub, open `js/booking-config.js`, click ✏️ and paste the URL between the quotes:
   ```js
   SCRIPT_URL: 'https://script.google.com/macros/s/AKfy...../exec',
   ```
   Click **Commit changes**.
8. Make a test booking on the website with your own email. You should receive the confirmation email, and the booking should appear in the sheet. 🎉

### Managing bookings

- Every booking is a row in the **Bookings** tab.
- **To cancel a booking:** change its **Status** to `Cancelled`. That time becomes free again on the website.
- You can also mark bookings as `Completed` or `No-show`.
- **WhatsApp confirmation:** on your phone, open the "New booking" email and tap the green button. WhatsApp opens a chat to the customer with the confirmation already written, so you just press send. The same link is also in the last column of the sheet. If WhatsApp says the number isn't on WhatsApp, call or SMS the customer instead.

### Good to know

- A free Gmail account can send about **100 emails a day**. That's plenty for a spa.
- If you change `Code.gs` later, click **Deploy → Manage deployments → ✏️ Edit**, set **Version** to *New version*, and click **Deploy**. The URL stays the same.
- Until `SCRIPT_URL` is filled in, the booking page still works: it sends each booking to Kabuchi on WhatsApp instead.
- **Fully automatic WhatsApp messages** (sent without anyone pressing send) need the paid WhatsApp Business API, through Meta or a provider such as Twilio. This can be added later if bookings grow.

---

## Part 3: A domain name (web address)

**Free option:** GitHub gives you a free address like `kabuchispa.github.io`. It's secure (https) and costs nothing. This is the best place to start.

**Completely free custom domains:** there aren't any reliable ones for a business.

- Freenom (.tk, .ml and others), which used to offer them, has shut down.
- eu.org is free but can take weeks or months to approve.
- Services like is-a.dev are only for developers' personal sites.

**Recommended:** buy your own name. It usually costs around **US$10–15 a year** for a `.com`, or you can get a Zambian `.co.zm` from a local registrar. Examples:

- `kabuchispa.com` or `kabuchibeauty.com`: buy from Namecheap, Cloudflare, Porkbun or GoDaddy
- `kabuchi.co.zm`: buy from a ZICTA-accredited Zambian registrar

**Connecting your domain to GitHub Pages:**

1. On GitHub, go to **Settings → Pages → Custom domain**. Type your domain (for example `www.kabuchispa.com`) and click **Save**.
2. At the company where you bought the domain, add these DNS records:
   - `CNAME` record: name `www`, value `YOUR-USERNAME.github.io`
   - Four `A` records for the main domain (`@`): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. Wait up to 24 hours, then tick **Enforce HTTPS** in GitHub Pages.
4. In `booking-setup/Code.gs`, update `WEBSITE` and `LOGO_URL` to the new address, and redeploy as described above.

---

## Still to add

- Facebook, Instagram and TikTok links: in each `.html` file, look for the comment `Add your social pages here` in the footer.
- Prices: the services page currently shows "Ask for prices" buttons that open WhatsApp.
- Staff photos: the team section uses initials (B, D, J) for now.
- Photos: check you have permission for every photo you upload.
  - Most are free stock photos from Unsplash and Pexels.
  - `images/svc-nails.jpg`, `nails-green.jpg`, `nail-pedicure.jpg`, `nail-art.jpg`, `before.jpg`, `after.jpg` and `pedicure-work.jpg` are your own or client photos.

*Care • Beauty • A Brighter You*
